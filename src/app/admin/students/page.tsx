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
    .eq("role", "student")
    .order("full_name");

  return (
    <div className={styles.container}>
      <div>
        <Link href="/admin" className={styles.backLink}>
          <span className={styles.backArrow}>←</span> Back to Admin
        </Link>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Students</h1>
            <p className={styles.subtitle}>
              {students?.length ?? 0} student{(students?.length ?? 0) === 1 ? "" : "s"} in the program
            </p>
          </div>
          <Link href="/admin/students/new" className={styles.primaryBtn}>
            + Add Students
          </Link>
        </div>
      </div>

      {students && students.length > 0 ? (
        <div className={styles.studentGrid}>
          {students.map((student) => (
            <Link
              key={student.id}
              href={`/admin/students/${student.id}`}
              className={styles.actionLink}
            >
              <Card className={styles.actionCard}>
                <div className={styles.avatarCircle}>
                  {student.avatar_initials || "ST"}
                </div>
                <h3 className={styles.actionTitle}>{student.full_name}</h3>
                <p className={styles.actionDesc}>{student.email || "No email on file"}</p>
                <p className={styles.actionDesc}>
                  {student.department ?? "BSIT"} · Year {student.level ?? 1} -{" "}
                  {student.section ?? "A"}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <p className={styles.actionDesc}>
            No students yet. Use <strong>Add Students</strong> to create one or import a CSV.
          </p>
        </Card>
      )}
    </div>
  );
}
