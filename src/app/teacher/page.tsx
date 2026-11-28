import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import styles from "@/app/admin/admin.module.css";
import sectionStyles from "@/app/admin/sections/sections.module.css";
import activityStyles from "./activity/activity.module.css";

type Course = { id: string; code: string; title: string };
type ActivityLog = {
  id: string;
  action: string;
  detail: string;
  created_at: string;
};

const activityLabels: Record<string, string> = {
  roadmap_published: "Roadmap published",
  roadmap_draft_saved: "Draft saved",
  roadmap_draft_created: "Draft opened",
  roadmap_draft_deleted: "Draft deleted",
};

function formatActivityTime(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
type Section = {
  id: string;
  section_code: string;
  academic_year: string;
  term: string;
  join_code: string;
  course: Course;
};

export default async function TeacherHome() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (profile?.role === "admin") redirect("/admin");
  if (profile?.role !== "professor") redirect("/");

  const { data: assignments } = await supabase
    .from("section_professors")
    .select("section_id")
    .eq("professor_id", user.id);

  const sectionIds = (assignments ?? []).map((assignment) => assignment.section_id);

  const [sectionsRes, enrollmentsRes, activityRes] = await Promise.all([
    supabase
      .from("sections")
      .select("id, section_code, academic_year, term, join_code, course:courses(id, code, title)")
      .in("id", sectionIds)
      .order("created_at"),
    supabase.from("enrollments").select("section_id").in("section_id", sectionIds),
    supabase
      .from("activity_logs")
      .select("id, action, detail, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const sections = (sectionsRes.data ?? []) as unknown as Section[];
  const enrollments = enrollmentsRes.data ?? [];
  const recentActivity = (activityRes.data ?? []) as ActivityLog[];

  const studentCounts = new Map<string, number>();
  for (const enrollment of enrollments) {
    if (!enrollment.section_id) continue;
    studentCounts.set(
      enrollment.section_id,
      (studentCounts.get(enrollment.section_id) ?? 0) + 1
    );
  }

  const courseIds = new Set(sections.map((section) => section.course?.id).filter(Boolean));
  const totalStudents = enrollments.length;
  const firstName = profile?.full_name?.split(" ")[0] || "Professor";

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            Welcome, <span className={styles.highlight}>{firstName}</span>
          </h1>
          <p className={styles.subtitle}>
            Edit the shared roadmap for the subjects you teach. Changes stay in draft until you
            publish them.
          </p>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={sectionStyles.stat}>
          <p className={sectionStyles.statLabel}>Sections</p>
          <p className={sectionStyles.statValue}>{sections.length}</p>
        </div>
        <div className={sectionStyles.stat}>
          <p className={sectionStyles.statLabel}>Subjects</p>
          <p className={sectionStyles.statValue}>{courseIds.size}</p>
        </div>
        <div className={sectionStyles.stat}>
          <p className={sectionStyles.statLabel}>Students</p>
          <p className={sectionStyles.statValue}>{totalStudents}</p>
        </div>
      </div>

      <div className={sectionStyles.card}>
        <div className={styles.header}>
          <div>
            <h2 className={sectionStyles.cardTitle}>Recent activity</h2>
            <p className={sectionStyles.cardHint}>
              The latest roadmap changes you made across your subjects.
            </p>
          </div>
          <Link href="/teacher/activity" className={sectionStyles.secondaryBtn}>
            View full log
          </Link>
        </div>

        {recentActivity.length === 0 ? (
          <p className={sectionStyles.empty}>
            No activity yet. Save or publish a roadmap and it will appear here.
          </p>
        ) : (
          <div className={activityStyles.recentList}>
            {recentActivity.map((log) => (
              <div key={log.id} className={activityStyles.recentItem}>
                <div className={activityStyles.recentMain}>
                  <span className={activityStyles.recentAction}>
                    {activityLabels[log.action] ?? log.action.replace(/_/g, " ")}
                  </span>
                  <span className={activityStyles.recentDetail}>{log.detail}</span>
                </div>
                <time className={activityStyles.recentTime} dateTime={log.created_at}>
                  {formatActivityTime(log.created_at)}
                </time>
              </div>
            ))}
          </div>
        )}
      </div>

      {sections.length === 0 ? (
        <div className={sectionStyles.card}>
          <h2 className={sectionStyles.cardTitle}>No sections assigned yet</h2>
          <p className={sectionStyles.cardHint}>
            An administrator needs to assign you to a section before you can edit a course
            roadmap. Contact your program administrator if this looks wrong.
          </p>
        </div>
      ) : (
        <div className={sectionStyles.stack}>
          {sections.map((section) => (
            <div key={section.id} className={sectionStyles.card}>
              <div className={styles.header}>
                <div>
                  <h2 className={sectionStyles.cardTitle}>
                    {section.course?.code} · {section.section_code}
                  </h2>
                  <p className={sectionStyles.cardHint}>{section.course?.title}</p>
                  <div className={sectionStyles.headerMeta}>
                    <span className={sectionStyles.badge}>{section.academic_year}</span>
                    <span className={sectionStyles.badge}>{section.term}</span>
                    <span className={sectionStyles.code}>{section.join_code}</span>
                    <span className={sectionStyles.badge}>
                      {studentCounts.get(section.id) ?? 0} student
                      {(studentCounts.get(section.id) ?? 0) === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>
                <div className={sectionStyles.rowActions}>
                  <Link
                    href={`/roadmap/course/${section.course?.id}`}
                    target="_blank"
                    className={sectionStyles.secondaryBtn}
                  >
                    Preview published
                  </Link>
                  <Link
                    href={`/admin/courses/${section.course?.id}/roadmap`}
                    className={styles.primaryBtn}
                  >
                    Build roadmap
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
