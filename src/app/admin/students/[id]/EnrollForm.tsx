"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "../../admin.module.css";

type Course = { id: string; code: string; title: string };

export default function EnrollForm({
  studentId,
  courses,
}: {
  studentId: string;
  courses: Course[];
}) {
  const [courseId, setCourseId] = useState(courses[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!courseId) return;
    setLoading(true);

    const supabase = createClient();
    await supabase.from("enrollments").insert({
      user_id: studentId,
      course_id: courseId,
      status: "in_progress",
    });

    router.refresh();
    setLoading(false);
  }

  if (courses.length === 0) {
    return <p className={styles.actionDesc}>Student is already enrolled in all courses.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <select
        value={courseId}
        onChange={(e) => setCourseId(e.target.value)}
        className={styles.select}
      >
        {courses.map((c) => (
          <option key={c.id} value={c.id}>
            {c.code} — {c.title}
          </option>
        ))}
      </select>
      <button type="submit" className={styles.primaryBtn} disabled={loading}>
        {loading ? "Enrolling..." : "Enroll Student"}
      </button>
    </form>
  );
}