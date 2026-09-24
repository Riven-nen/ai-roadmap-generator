"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "../admin.module.css";

type Course = {
  id?: string;
  code?: string;
  title?: string;
  description?: string;
  credits?: number;
  category?: string;
  level?: string;
  duration_weeks?: number;
  icon?: string;
  icon_bg?: string;
};

export default function CourseForm({ initial }: { initial?: Course }) {
  const isEdit = Boolean(initial?.id);
  const [form, setForm] = useState<Course>({
    code: "",
    title: "",
    description: "",
    credits: 3,
    category: "General",
    level: "Beginner",
    duration_weeks: 16,
    icon: "📘",
    icon_bg: "#8b5cf6",
    ...initial,
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function update<K extends keyof Course>(key: K, value: Course[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    if (isEdit) {
      await supabase.from("courses").update(form).eq("id", initial!.id);
    } else {
      await supabase.from("courses").insert(form);
    }

    router.push("/admin/courses");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className={styles.formGrid}>
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