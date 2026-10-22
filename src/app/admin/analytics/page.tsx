import Card from "@/components/Card";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import styles from "../admin.module.css";
import DeanAnalyticsChart from "./DeanAnalyticsChart";
import { Enrollment } from "@/types";

export default async function AdminAnalytics() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Check if user is admin
  const { data: me } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "admin") redirect("/");

  // Fetch ALL enrollments from ALL students
  const { data: enrollmentsData } = await supabase
    .from("enrollments")
    .select("*, course:courses(*)");

  const enrollments = (enrollmentsData || []) as Enrollment[];

  // Calculate total students
  const uniqueStudents = new Set(enrollments.map(e => e.user_id)).size;

  return (
    <div className={styles.container}>
      <div>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Program Analytics</h1>
            <p className={styles.subtitle}>
              Aggregate knowledge map for all {uniqueStudents} enrolled BSIT students
            </p>
          </div>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <p className={styles.statLabel}>Total Students Analyzed</p>
          <p className={styles.statValue}>{uniqueStudents}</p>
        </Card>
        <Card className={styles.statCard}>
          <p className={styles.statLabel}>Total Course Records</p>
          <p className={styles.statValue}>{enrollments.length}</p>
        </Card>
      </div>

      <Card title="📉 Program-Wide Knowledge Gaps" description="Average proficiency across the 7 BSIT domains for the entire department">
        <DeanAnalyticsChart enrollments={enrollments} />
      </Card>
    </div>
  );
}