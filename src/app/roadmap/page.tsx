import Card from "@/components/Card";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import styles from "./roadmap.module.css";

export default async function Roadmap() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [semestersRes, enrollmentsRes] = await Promise.all([
    supabase
      .from("semesters")
      .select("*")
      .eq("user_id", user.id)
      .order("number"),
    supabase
      .from("enrollments")
      .select("*, course:courses(*)")
      .eq("user_id", user.id),
  ]);

  const semesters = semestersRes.data ?? [];
  const enrollments = enrollmentsRes.data ?? [];

  const activeSemester = semesters[0];
  const totalCredits = semesters.reduce((sum, s) => sum + s.total_credits, 0);
  const completedCredits = enrollments
    .filter((e) => e.status === "completed")
    .reduce((sum, e) => sum + (e.course?.credits ?? 0), 0);

  const completedEnrollments = enrollments.filter(
    (e) => e.status === "completed"
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            Your Learning <span className={styles.highlight}>Roadmap</span>
          </h1>
          <p className={styles.subtitle}>
            Track your academic progress semester by semester
          </p>
        </div>
        <div className={styles.statsRow}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{totalCredits}</span>
            <span className={styles.statLabel}>Total Credits</span>
          </div>
          <div className={styles.statItem}>
            <span className={`${styles.statValue} ${styles.textPurple}`}>
              {completedCredits}
            </span>
            <span className={styles.statLabel}>Completed</span>
          </div>
          <div className={styles.statItem}>
            <span className={`${styles.statValue} ${styles.textBlue}`}>3.67</span>
            <span className={styles.statLabel}>GPA</span>
          </div>
        </div>
      </div>

      <div className={styles.tabs}>
        {semesters.map((sem, i) => (
          <button
            key={sem.id}
            className={`${styles.tab} ${i === 0 ? styles.activeTab : ""}`}
          >
            {sem.name}
          </button>
        ))}
      </div>

      {activeSemester && (
        <div className={styles.semesterBanner}>
          <div>
            <h3 className={styles.semesterTitle}>{activeSemester.name}</h3>
            <p className={styles.semesterCredits}>
              {activeSemester.total_credits} Credits
            </p>
          </div>
          <div className={styles.bannerIcon}>🏆</div>
        </div>
      )}

      <div className={styles.coursesGrid}>
        {completedEnrollments.map((enrollment) => {
          const course = enrollment.course;
          if (!course) return null;

          return (
            <Card key={enrollment.id} className={styles.courseCard}>
              <div className={styles.courseHeader}>
                <div
                  className={styles.courseIcon}
                  style={{ backgroundColor: `${course.icon_bg}33`, color: course.icon_bg }}
                >
                  {course.icon}
                </div>
                {enrollment.status === "completed" && (
                  <div className={styles.checkIcon}>✓</div>
                )}
              </div>
              <h4 className={styles.courseTitle}>{course.title}</h4>
              <p className={styles.courseCode}>{course.code}</p>

              <div className={styles.courseMeta}>
                <span>{course.credits} Credits</span>
                <span className={styles.completedBadge}>Completed</span>
              </div>

              <div className={styles.gradeRow}>
                <span className={styles.gradeLabel}>Grade:</span>
                <span className={styles.gradeValue}>{enrollment.grade}</span>
              </div>

              <div className={styles.tagsContainer}>
                {course.tags?.map((tag: string, j: number) => (
                  <span key={j} className={styles.tag}>
                    {tag}
                  </span>
                ))}
              </div>
            </Card>
          );
        })}
      </div>

      <p className={styles.footerText}>Complete to unlock next semester</p>
    </div>
  );
}