import Link from "next/link";
import Card from "@/components/Card";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import styles from "../admin.module.css";

export default async function AdminStudents() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "admin") redirect("/");

  const { data: students } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "student");

  return (
    <div className={styles.container}>
      <div>
        <Link href="/admin" className={styles.backLink}>
          <span className={styles.backArrow}>←</span> Back to Admin
        </Link>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Students</h1>
            <p className={styles.subtitle}>View and manage all students</p>
          </div>
        </div>
      </div>

      <div className={styles.studentGrid}>
        {(students ?? []).map((student) => (
          <Link
            key={student.id}
            href={`/admin/students/${student.id}`}
            className={styles.actionLink}
          >
            <Card className={styles.actionCard}>
              <div className={styles.avatarCircle}>
                {student.avatar_initials}
              </div>
              <h3 className={styles.actionTitle}>{student.full_name}</h3>
              <p className={styles.actionDesc}>{student.role}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}