"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "../../admin.module.css";
import sectionStyles from "../../sections/sections.module.css";

type Course = { id: string; code: string; title: string };
type Section = {
  id: string;
  course_id: string;
  section_code: string;
  academic_year: string;
  term: string;
};

export default function EnrollForm({
  studentId,
  courses,
  sections,
}: {
  studentId: string;
  courses: Course[];
  sections: Section[];
}) {
  const sectionsByCourse = useMemo(() => {
    const map = new Map<string, Section[]>();
    for (const section of sections) {
      const list = map.get(section.course_id) ?? [];
      list.push(section);
      map.set(section.course_id, list);
    }
    return map;
  }, [sections]);

  const [courseId, setCourseId] = useState(courses[0]?.id ?? "");
  const [sectionId, setSectionId] = useState(
    courses[0] ? sectionsByCourse.get(courses[0].id)?.[0]?.id ?? "" : ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const availableSections = sectionsByCourse.get(courseId) ?? [];

  function handleCourseChange(nextCourseId: string) {
    setCourseId(nextCourseId);
    setSectionId(sectionsByCourse.get(nextCourseId)?.[0]?.id ?? "");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!courseId || !sectionId) {
      setError("Choose a course section before enrolling this student.");
      return;
    }
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: insertError } = await supabase.from("enrollments").insert({
      user_id: studentId,
      course_id: courseId,
      section_id: sectionId,
      status: "in_progress",
    });

    setLoading(false);

    if (insertError) {
      setError(
        insertError.message.includes("duplicate")
          ? "This student is already enrolled in that course."
          : insertError.message
      );
      return;
    }

    router.refresh();
  }

  if (courses.length === 0) {
    return <p className={styles.actionDesc}>Student is already enrolled in all courses.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <select
        value={courseId}
        onChange={(e) => handleCourseChange(e.target.value)}
        className={styles.select}
      >
        {courses.map((c) => (
          <option key={c.id} value={c.id}>
            {c.code} — {c.title}
          </option>
        ))}
      </select>
      <select
        value={sectionId}
        onChange={(e) => setSectionId(e.target.value)}
        className={styles.select}
        disabled={availableSections.length === 0}
      >
        {availableSections.length === 0 ? (
          <option value="">No sections for this course</option>
        ) : (
          availableSections.map((section) => (
            <option key={section.id} value={section.id}>
              {section.section_code} — {section.academic_year} · {section.term}
            </option>
          ))
        )}
      </select>
      <button
        type="submit"
        className={styles.primaryBtn}
        disabled={loading || availableSections.length === 0}
      >
        {loading ? "Enrolling..." : "Enroll Student"}
      </button>
      {error && <div className={styles.formError}>{error}</div>}
      {availableSections.length === 0 && (
        <p className={sectionStyles.cardHint}>
          Create a section for this course before enrolling the student.
        </p>
      )}
    </form>
  );
}
