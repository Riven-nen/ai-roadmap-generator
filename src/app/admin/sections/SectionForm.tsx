"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  DEPARTMENTS,
  STUDENT_SECTIONS,
  type Department,
  type StudentSection,
  getAcademicYearOptions,
  getCurrentAcademicYear,
  isValidAcademicYear,
  makeJoinCode,
  termFromSemester,
} from "@/lib/academic";
import styles from "./sections.module.css";

type SubjectOption = {
  id: string;
  code: string;
  title: string;
  year_level: number | null;
  semester: number | null;
};

export default function SectionForm({
  courses,
  defaultCourseId,
}: {
  courses: SubjectOption[];
  defaultCourseId?: string;
}) {
  const router = useRouter();
  const initialSubject =
    courses.find((course) => course.id === defaultCourseId) ?? courses[0];

  const [subjectId, setSubjectId] = useState(initialSubject?.id ?? "");
  const [program, setProgram] = useState<Department>("BSIT");
  const [sectionLetter, setSectionLetter] = useState<StudentSection>("A");
  const [academicYear, setAcademicYear] = useState(getCurrentAcademicYear());
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedSubject = courses.find((course) => course.id === subjectId);
  const subjectYear = selectedSubject?.year_level ?? 1;
  const subjectTerm = termFromSemester(selectedSubject?.semester);
  const sectionCode = `${program} ${subjectYear}${sectionLetter}`;
  const academicYearOptions = getAcademicYearOptions();
  const joinCodePreview = makeJoinCode(
    selectedSubject?.code ?? "",
    sectionCode,
    academicYear
  );

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!subjectId || !selectedSubject) {
      setError("Choose a subject.");
      return;
    }
    if (
      !selectedSubject.year_level ||
      selectedSubject.year_level < 1 ||
      selectedSubject.year_level > 6 ||
      !selectedSubject.semester
    ) {
      setError(
        "Set this subject's year level and semester in Subjects before creating a class."
      );
      return;
    }
    if (!isValidAcademicYear(academicYear.trim())) {
      setError("Use an academic year with two consecutive years, such as 2026-2027.");
      return;
    }

    setCreating(true);
    const supabase = createClient();

    const { data: existing } = await supabase
      .from("sections")
      .select("id")
      .eq("course_id", subjectId)
      .eq("academic_year", academicYear.trim())
      .eq("term", subjectTerm)
      .eq("section_code", sectionCode)
      .maybeSingle();

    if (existing) {
      setCreating(false);
      setError(
        `${sectionCode} already has a ${selectedSubject.code} class for ${academicYear.trim()} ${subjectTerm}.`
      );
      return;
    }

    let joinCode = joinCodePreview;
    let insertResult = await supabase
      .from("sections")
      .insert({
        course_id: subjectId,
        program,
        year_level: subjectYear,
        section_letter: sectionLetter,
        academic_year: academicYear.trim(),
        term: subjectTerm,
        join_code: joinCode,
      })
      .select("id")
      .single();

    // A stale join code from a renamed section must not block a different class.
    if (insertResult.error?.message.includes("sections_join_code_key")) {
      joinCode = `${joinCodePreview}-${crypto
        .randomUUID()
        .replace(/-/g, "")
        .slice(0, 4)
        .toUpperCase()}`;

      insertResult = await supabase
        .from("sections")
        .insert({
          course_id: subjectId,
          program,
          year_level: subjectYear,
          section_letter: sectionLetter,
          academic_year: academicYear.trim(),
          term: subjectTerm,
          join_code: joinCode,
        })
        .select("id")
        .single();
    }

    setCreating(false);

    if (insertResult.error) {
      if (
        insertResult.error.message.includes("sections_course_year_term_section_key") ||
        insertResult.error.message.includes("section_code")
      ) {
        setError(
          `A ${selectedSubject.code} class for ${sectionCode} already exists in ${academicYear.trim()} ${subjectTerm}.`
        );
      } else if (insertResult.error.message.includes("sections_join_code_key")) {
        setError("That join code is already in use. Try a different section or year.");
      } else {
        setError(insertResult.error.message);
      }
      return;
    }

    router.push(`/admin/sections/${insertResult.data.id}`);
    router.refresh();
  }

  if (courses.length === 0) {
    return <p className={styles.cardHint}>Create a subject before adding a class.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className={styles.stack}>
      <div className={styles.formGrid}>
        <label className={`${styles.field} ${styles.fieldFull}`}>
          <span className={styles.label}>Subject</span>
          <select
            className={styles.select}
            value={subjectId}
            onChange={(event) => {
              setSubjectId(event.target.value);
              setError(null);
            }}
          >
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.code} — {course.title}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Course</span>
          <select
            className={styles.select}
            value={program}
            onChange={(event) => {
              setProgram(event.target.value as Department);
              setError(null);
            }}
          >
            {DEPARTMENTS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.value}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Section</span>
          <select
            className={styles.select}
            value={sectionLetter}
            onChange={(event) => {
              setSectionLetter(event.target.value as StudentSection);
              setError(null);
            }}
          >
            {STUDENT_SECTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className={`${styles.field} ${styles.fieldFull}`}>
          <span className={styles.label}>Academic year</span>
          <input
            className={styles.input}
            list="academic-year-options"
            value={academicYear}
            onChange={(event) => {
              setAcademicYear(event.target.value);
              setError(null);
            }}
            placeholder="e.g. 2026-2027"
            required
          />
          <datalist id="academic-year-options">
            {academicYearOptions.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
        </label>
      </div>

      <div className={styles.joinCodePreview}>
        <div>
          <span className={styles.label}>Section</span>
          <p className={styles.sectionLabel}>{sectionCode}</p>
        </div>
        <div>
          <span className={styles.label}>Year / Term</span>
          <p className={styles.sectionLabel}>
            {selectedSubject?.year_level && selectedSubject?.semester
              ? `Year ${subjectYear} · ${subjectTerm}`
              : "Not set on subject"}
          </p>
        </div>
        <div>
          <span className={styles.label}>Join code</span>
          <code className={styles.code}>{joinCodePreview}</code>
        </div>
      </div>

      <p className={styles.cardHint}>
        Year level and term come from the subject record. To change them, edit the subject in
        Subjects. A section is the course, year level, and letter, such as BSIT 1A.
      </p>

      {error && <div className={styles.noticeError}>{error}</div>}

      <div className={styles.rowActions}>
        <button type="submit" className={styles.primaryBtn} disabled={creating}>
          {creating ? "Creating..." : "Create class"}
        </button>
      </div>
    </form>
  );
}
