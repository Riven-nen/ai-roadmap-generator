import Link from "next/link";
import Card from "@/components/Card";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import styles from "./admin.module.css";

export default async function AdminHome() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/");

  const [studentsRes, coursesRes, enrollmentsRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("role", "student"),
    supabase.from("courses").select("*"),
    supabase.from("enrollments").select("*"),
  ]);

  const students = studentsRes.data ?? [];
  const courses = coursesRes.data ?? [];
  const enrollments = enrollmentsRes.data ?? [];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            Admin <span className={styles.highlight}>Panel</span>
          </h1>
          <p className={styles.subtitle}>Manage students, courses, and enrollments</p>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <p className={styles.statLabel}>Total Students</p>
          <p className={styles.statValue}>{students.length}</p>
        </Card>
        <Card className={styles.statCard}>
          <p className={styles.statLabel}>Total Courses</p>
          <p className={styles.statValue}>{courses.length}</p>
        </Card>
        <Card className={styles.statCard}>
          <p className={styles.statLabel}>Total Enrollments</p>
          <p className={styles.statValue}>{enrollments.length}</p>
        </Card>
      </div>

      <div className={styles.actionsGrid}>
        <Link href="/admin/students" className={styles.actionLink}>
          <Card className={styles.actionCard}>
            <div className={styles.actionIcon}>👥</div>
            <h3 className={styles.actionTitle}>Manage Students</h3>
            <p className={styles.actionDesc}>
              View students and enroll them in courses
            </p>
          </Card>
        </Link>

        <Link href="/admin/courses" className={styles.actionLink}>
          <Card className={styles.actionCard}>
            <div className={styles.actionIcon}>📚</div>
            <h3 className={styles.actionTitle}>Manage Courses</h3>
            <p className={styles.actionDesc}>
              Add, edit, and remove courses from the catalog
            </p>
          </Card>
        </Link>
      </div>
    </div>
  );
}