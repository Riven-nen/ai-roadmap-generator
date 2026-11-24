import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import CourseForm from "../CourseForm";
import styles from "../../admin.module.css";

export default async function NewCourse() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "admin") redirect("/");

  const { data: courseOptions } = await supabase
    .from("courses").select("code,title,category").order("code");

  return (
    <div className={styles.container}>
      <div>
        <Link href="/admin/courses" className={styles.backLink}>
          <span className={styles.backArrow}>←</span> Back to Subjects
        </Link>
        <div className={styles.header}>
          <h1 className={styles.title}>Add Subject</h1>
          <p className={styles.subtitle}>Create a new subject and set its roadmap prerequisite.</p>
        </div>
      </div>
      <CourseForm
        courseOptions={(courseOptions ?? []).filter(
          (course) => course.category !== "General Education"
        )}
      />
    </div>
  );
}
