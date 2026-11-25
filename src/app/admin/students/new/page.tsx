import BackButton from "@/components/BackButton";
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
        <BackButton fallbackHref="/admin/students" className={styles.backLink} />
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Add Users</h1>
            <p className={styles.subtitle}>
              Create student or professor accounts, one at a time or by CSV. Temporary passwords
              are shown only once.
            </p>
          </div>
        </div>
      </div>

      <AddStudents />
    </div>
  );
}
