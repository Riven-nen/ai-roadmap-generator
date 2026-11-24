"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  DEPARTMENTS,
  STUDENT_SECTIONS,
  type Department,
  type StudentSection,
} from "@/lib/academic";
import styles from "../../admin.module.css";

export default function StudentDetailsForm({
  studentId,
  initialYear,
  initialDepartment,
  initialSection,
}: {
  studentId: string;
  initialYear: number;
  initialDepartment: string | null;
  initialSection: string | null;
}) {
  const router = useRouter();
  const [yearLevel, setYearLevel] = useState(initialYear);
  const [department, setDepartment] = useState<Department>(
    DEPARTMENTS.some((option) => option.value === initialDepartment)
      ? (initialDepartment as Department)
      : "BSIT"
  );
  const [section, setSection] = useState<StudentSection>(
    STUDENT_SECTIONS.includes(initialSection as StudentSection)
      ? (initialSection as StudentSection)
      : "A"
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        level: yearLevel,
        department,
        section,
      })
      .eq("id", studentId);

    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setNotice("Program details updated.");
    router.refresh();
  }

  return (
    <form onSubmit={save} className={styles.form}>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>Year level</span>
        <select
          className={styles.select}
          value={yearLevel}
          onChange={(event) => setYearLevel(Number(event.target.value))}
        >
          {[1, 2, 3, 4, 5, 6].map((level) => (
            <option key={level} value={level}>
              Year {level}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>Course</span>
        <select
          className={styles.select}
          value={department}
          onChange={(event) => setDepartment(event.target.value as Department)}
        >
          {DEPARTMENTS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>Section</span>
        <select
          className={styles.select}
          value={section}
          onChange={(event) => setSection(event.target.value as StudentSection)}
        >
          {STUDENT_SECTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>

      <button type="submit" className={styles.primaryBtn} disabled={saving}>
        {saving ? "Saving..." : "Save"}
      </button>

      {error && <div className={styles.formError}>{error}</div>}
      {notice && <div className={styles.formSuccess}>{notice}</div>}
    </form>
  );
}
