import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
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
      <div className={styles.header}>
        <h1 className={styles.title}>Add Course</h1>
      </div>
      <CourseForm />
    </div>
  );
}