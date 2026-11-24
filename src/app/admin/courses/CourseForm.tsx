"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "../admin.module.css";

type CourseOption = { code: string; title: string };

type CourseFormValues = {
  code: string;
  title: string;
  description: string;
  credits: number;
  category: string;
  level: string;
  duration_weeks: number;
  icon: string;
  icon_bg: string;
  year_level: number;
  semester: number;
  prerequisite_code: string;
};

export default function CourseForm({
  initial,
  courseOptions = [],
}: {
  initial?: Partial<CourseFormValues> & { id?: string };
  courseOptions?: CourseOption[];
}) {
  const isEdit = Boolean(initial?.id);
  const [form, setForm] = useState<CourseFormValues>({
    code: initial?.code ?? "",
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    credits: initial?.credits ?? 3,
    category: initial?.category ?? "General",
    level: initial?.level ?? "Beginner",
    duration_weeks: initial?.duration_weeks ?? 16,
    icon: initial?.icon ?? "📘",
    icon_bg: initial?.icon_bg ?? "#8b5cf6",
    year_level: initial?.year_level ?? 1,
    semester: initial?.semester ?? 1,
    prerequisite_code: initial?.prerequisite_code ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function update<K extends keyof CourseFormValues>(key: K, value: CourseFormValues[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      ...form,
      year_level: Number(form.year_level) || 1,
      semester: Number(form.semester) || 1,
      prerequisite_code: form.prerequisite_code || null,
    };

    const supabase = createClient();
    const { error: saveError } = isEdit
      ? await supabase.from("courses").update(payload).eq("id", initial!.id)
      : await supabase.from("courses").insert(payload);

    if (saveError) {
      setError(saveError.message);
      setLoading(false);
      return;
    }

    router.push("/admin/courses");
    router.refresh();
  }

  const prerequisiteOptions = courseOptions.filter(
    (option) => option.code !== initial?.code
  );

  return (
    <form onSubmit={handleSubmit} className={styles.formGrid}>
      {error && <div className={`${styles.formError} ${styles.fieldFull}`}>{error}</div>}

      <label className={styles.field}>
        <span className={styles.fieldLabel}>Code</span>
        <input className={styles.input} value={form.code}
          onChange={(e) => update("code", e.target.value)} required />
      </label>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>Title</span>
        <input className={styles.input} value={form.title}
          onChange={(e) => update("title", e.target.value)} required />
      </label>

      <label className={`${styles.field} ${styles.fieldFull}`}>
        <span className={styles.fieldLabel}>Description</span>
        <textarea className={styles.input} value={form.description}
          onChange={(e) => update("description", e.target.value)} rows={3} />
      </label>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>Credits</span>
        <input type="number" className={styles.input} value={form.credits}
          onChange={(e) => update("credits", Number(e.target.value))} />
      </label>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>Level</span>
        <select className={styles.input} value={form.level}
          onChange={(e) => update("level", e.target.value)}>
          <option>Beginner</option>
          <option>Intermediate</option>
          <option>Advanced</option>
        </select>
      </label>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>Category</span>
        <input className={styles.input} value={form.category}
          onChange={(e) => update("category", e.target.value)} />
      </label>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>Duration (weeks)</span>
        <input type="number" className={styles.input} value={form.duration_weeks}
          onChange={(e) => update("duration_weeks", Number(e.target.value))} />
      </label>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>Year Level</span>
        <input type="number" min={1} max={6} className={styles.input} value={form.year_level}
          onChange={(e) => update("year_level", Number(e.target.value))} />
      </label>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>Semester</span>
        <select className={styles.input} value={form.semester}
          onChange={(e) => update("semester", Number(e.target.value))}>
          <option value={1}>1st Semester</option>
          <option value={2}>2nd Semester</option>
          <option value={3}>Summer</option>
        </select>
      </label>

      <label className={`${styles.field} ${styles.fieldFull}`}>
        <span className={styles.fieldLabel}>Prerequisite Course</span>
        <select className={styles.input} value={form.prerequisite_code}
          onChange={(e) => update("prerequisite_code", e.target.value)}>
          <option value="">None (unlocks immediately)</option>
          {prerequisiteOptions.map((option) => (
            <option key={option.code} value={option.code}>
              {option.code} — {option.title}
            </option>
          ))}
        </select>
        <span className={styles.fieldHint}>
          Students must pass this course before the new course unlocks on the roadmap.
        </span>
      </label>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>Icon (emoji)</span>
        <input className={styles.input} value={form.icon}
          onChange={(e) => update("icon", e.target.value)} />
      </label>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>Icon Color (hex)</span>
        <input className={styles.input} value={form.icon_bg}
          onChange={(e) => update("icon_bg", e.target.value)} />
      </label>

      <div className={styles.formActions}>
        <button type="submit" className={styles.primaryBtn} disabled={loading}>
          {loading ? "Saving..." : isEdit ? "Update Course" : "Create Course"}
        </button>
      </div>
    </form>
  );
}
