import Link from "next/link";
import Card from "@/components/Card";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import styles from "../admin.module.css";

export default async function AdminCourses() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "admin") redirect("/");

  const { data: courses } = await supabase
    .from("courses").select("*").order("code");

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Subjects</h1>
          <p className={styles.subtitle}>{courses?.length ?? 0} subjects in catalog</p>
        </div>
        <Link href="/admin/courses/new" className={styles.primaryBtn}>
          + Add Subject
        </Link>
      </div>

      <Card>
        <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Subject Code</th>
              <th>Title</th>
              <th>Credits</th>
              <th>Year / Sem</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(courses ?? []).map((c) => (
              <tr key={c.id}>
                <td>{c.code}</td>
                <td>{c.title}</td>
                <td>{c.credits}</td>
                <td>{c.year_level ? `Year ${c.year_level} · Sem ${c.semester}` : "—"}</td>
                <td>
                  <Link href={`/admin/courses/${c.id}/roadmap`} className={styles.editLink} style={{ marginRight: 16 }}>
                    Build Roadmap
                  </Link>
                  <Link href={`/admin/sections?course=${c.id}`} className={styles.editLink} style={{ marginRight: 16 }}>
                    Classes
                  </Link>
                  <Link href={`/admin/courses/${c.id}/edit`} className={styles.editLink}>
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </Card>
    </div>
  );
}