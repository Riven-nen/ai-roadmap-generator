import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BackButton from "@/components/BackButton";
import CourseForm from "../CourseForm";
import styles from "../../admin.module.css";

export default async function NewCourse() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "admin") redirect("/");

  return (
    <div className={styles.container}>
      <div>
        <BackButton fallbackHref="/admin/courses" className={styles.backLink} />
        <div className={styles.header}>
          <h1 className={styles.title}>Add Subject</h1>
          <p className={styles.subtitle}>Create a new subject for the catalog.</p>
        </div>
      </div>
      <CourseForm />
    </div>
  );
}
