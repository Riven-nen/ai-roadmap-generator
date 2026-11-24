"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "../sections.module.css";

type Exam = {
  id: string;
  title: string;
  description: string | null;
  passing_score: number;
  section_id: string | null;
  topic_id: string | null;
};

function ExamEditor({
  exam,
  sectionId,
}: {
  exam: Exam;
  sectionId: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(exam.title);
  const [passingScore, setPassingScore] = useState(exam.passing_score);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("The exam needs a title.");
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("quizzes")
      .update({ title: title.trim(), passing_score: passingScore })
      .eq("id", exam.id)
      .eq("section_id", sectionId);

    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.refresh();
  }

  async function remove() {
    if (
      !window.confirm(
        `Delete "${exam.title}"? Its questions will be removed and this section will fall back to the course-wide final exam.`
      )
    ) {
      return;
    }

    setDeleting(true);
    setError(null);

    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("quizzes")
      .delete()
      .eq("id", exam.id)
      .eq("section_id", sectionId);

    setDeleting(false);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    router.refresh();
  }

  return (
    <form onSubmit={save} className={styles.stack}>
      <div className={styles.noticeSuccess}>
        This section has its own final exam. Students in this section see it instead of the
        course-wide exam.
      </div>
      <label className={styles.field}>
        <span className={styles.label}>Exam title</span>
        <input
          className={styles.input}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </label>
      <label className={styles.field}>
        <span className={styles.label}>Passing score (%)</span>
        <input
          className={styles.input}
          type="number"
          min={0}
          max={100}
          value={passingScore}
          onChange={(event) => setPassingScore(Number(event.target.value))}
        />
      </label>

      {error && <div className={styles.noticeError}>{error}</div>}

      <div className={styles.rowActions}>
        <button
          type="button"
          className={styles.dangerBtn}
          onClick={() => void remove()}
          disabled={deleting || saving}
        >
          {deleting ? "Deleting..." : "Delete section exam"}
        </button>
        <button type="submit" className={styles.primaryBtn} disabled={saving || deleting}>
          {saving ? "Saving..." : "Save exam"}
        </button>
      </div>
    </form>
  );
}

function ExamCreator({
  sectionId,
  sectionLabel,
  courseId,
  courseExams,
}: {
  sectionId: string;
  sectionLabel: string;
  courseId: string;
  courseExams: Exam[];
}) {
  const router = useRouter();
  const firstTemplate = courseExams[0];
  const [templateId, setTemplateId] = useState(firstTemplate?.id ?? "");
  const [title, setTitle] = useState(
    firstTemplate ? `${firstTemplate.title} — ${sectionLabel}` : `Final Exam — ${sectionLabel}`
  );
  const [passingScore, setPassingScore] = useState(firstTemplate?.passing_score ?? 70);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleTemplateChange(nextId: string) {
    setTemplateId(nextId);
    const template = courseExams.find((exam) => exam.id === nextId);
    if (template) {
      setTitle(`${template.title} — ${sectionLabel}`);
      setPassingScore(template.passing_score);
    }
  }

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("The exam needs a title.");
      return;
    }

    setCreating(true);
    const supabase = createClient();
    const template = courseExams.find((exam) => exam.id === templateId);

    const { data: created, error: insertError } = await supabase
      .from("quizzes")
      .insert({
        course_id: courseId,
        section_id: sectionId,
        topic_id: null,
        title: title.trim(),
        description: template?.description ?? "Section final exam",
        passing_score: passingScore,
      })
      .select("id")
      .single();

    if (insertError) {
      setCreating(false);
      setError(insertError.message);
      return;
    }

    if (template) {
      const { data: questions } = await supabase
        .from("quiz_questions")
        .select("question_text, options, correct_option")
        .eq("quiz_id", template.id);

      if (questions && questions.length > 0) {
        const { error: questionError } = await supabase.from("quiz_questions").insert(
          questions.map((question) => ({
            id: crypto.randomUUID(),
            quiz_id: created.id,
            question_text: question.question_text,
            options: question.options,
            correct_option: question.correct_option,
          }))
        );

        if (questionError) {
          setError(
            `The exam was created, but its questions could not be copied: ${questionError.message}`
          );
          setCreating(false);
          router.refresh();
          return;
        }
      }
    }

    setCreating(false);
    router.refresh();
  }

  return (
    <form onSubmit={create} className={styles.stack}>
      {courseExams.length > 0 ? (
        <label className={styles.field}>
          <span className={styles.label}>Start from</span>
          <select
            className={styles.select}
            value={templateId}
            onChange={(event) => handleTemplateChange(event.target.value)}
          >
            <option value="">Blank exam</option>
            {courseExams.map((exam) => (
              <option key={exam.id} value={exam.id}>
                {exam.title} ({exam.passing_score}% to pass)
              </option>
            ))}
          </select>
        </label>
      ) : (
        <div className={styles.noticeInfo}>
          This course has no course-wide final exam yet. You can still create a blank section exam.
        </div>
      )}

      <label className={styles.field}>
        <span className={styles.label}>Exam title</span>
        <input
          className={styles.input}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Passing score (%)</span>
        <input
          className={styles.input}
          type="number"
          min={0}
          max={100}
          value={passingScore}
          onChange={(event) => setPassingScore(Number(event.target.value))}
        />
      </label>

      <p className={styles.cardHint}>
        If you start from an existing course-wide exam, its questions are copied into the new
        section exam. Editing the copy does not change the original.
      </p>

      {error && <div className={styles.noticeError}>{error}</div>}

      <div className={styles.rowActions}>
        <button type="submit" className={styles.primaryBtn} disabled={creating}>
          {creating ? "Creating..." : "Create section exam"}
        </button>
      </div>
    </form>
  );
}

export default function SectionFinalExam({
  sectionId,
  sectionLabel,
  courseId,
  exams,
}: {
  sectionId: string;
  sectionLabel: string;
  courseId: string;
  exams: Exam[];
}) {
  const sectionExams = exams.filter((exam) => exam.section_id === sectionId);
  const courseExams = exams.filter((exam) => !exam.section_id);

  return (
    <div className={styles.stack}>
      {sectionExams.length > 0 ? (
        sectionExams.map((exam) => (
          <ExamEditor key={exam.id} exam={exam} sectionId={sectionId} />
        ))
      ) : (
        <ExamCreator
          sectionId={sectionId}
          sectionLabel={sectionLabel}
          courseId={courseId}
          courseExams={courseExams}
        />
      )}

      {sectionExams.length > 1 && (
        <div className={styles.noticeInfo}>
          This section has {sectionExams.length} section exams. Remove the extras so students
          always see the intended final exam.
        </div>
      )}

      <div className={styles.stack}>
        <h3 className={styles.personName}>Course-wide final exams</h3>
        {courseExams.length === 0 ? (
          <p className={styles.cardHint}>No course-wide final exam is configured.</p>
        ) : (
          courseExams.map((exam) => (
            <div key={exam.id} className={styles.personRow}>
              <div className={styles.personMain}>
                <span className={styles.personName}>{exam.title}</span>
                <span className={styles.personEmail}>
                  {exam.passing_score}% to pass · used by sections without their own exam
                </span>
              </div>
              <Link
                href={`/roadmap/course/${courseId}`}
                target="_blank"
                className={styles.smallBtn}
              >
                Preview
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
