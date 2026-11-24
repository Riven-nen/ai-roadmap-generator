import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AddStudents from "./AddStudents";
import styles from "../../admin.module.css";

export default async function AddStudentsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "admin") redirect("/");

  return (
    <div className={styles.container}>
      <div>
        <Link href="/admin/students" className={styles.backLink}>
          <span className={styles.backArrow}>←</span> Back to Students
        </Link>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Add Students</h1>
            <p className={styles.subtitle}>
              Create one student or import a CSV. Temporary passwords are shown only once.
            </p>
          </div>
        </div>
      </div>

      <AddStudents />
    </div>
  );
}
