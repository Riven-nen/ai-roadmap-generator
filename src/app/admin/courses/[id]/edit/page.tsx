import Card from "@/components/Card";
import BackButton from "@/components/BackButton";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import CourseForm from "../../CourseForm";
import styles from "../../../admin.module.css";

export default async function EditCourse({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "admin") redirect("/");

  const [courseRes, courseOptionsRes] = await Promise.all([
    supabase.from("courses").select("*").eq("id", id).single(),
    supabase.from("courses").select("code,title,category").order("code"),
  ]);

  if (!courseRes.data) notFound();

  return (
    <div className={styles.container}>
      <div>
        <BackButton fallbackHref="/admin/courses" className={styles.backLink} />
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Edit {courseRes.data.code}</h1>
            <p className={styles.subtitle}>{courseRes.data.title}</p>
          </div>
        </div>
      </div>

      <Card>
        <CourseForm
          initial={courseRes.data}
          courseOptions={(courseOptionsRes.data ?? []).filter(
            (course) => course.category !== "General Education"
          )}
        />
      </Card>
    </div>
  );
}
