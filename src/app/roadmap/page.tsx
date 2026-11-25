import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Course } from "@/types";
import styles from "./roadmap.module.css";

type SectionInfo = {
  section_code: string;
  academic_year: string;
  term: string;
};

type EnrollmentRow = {
  id: string;
  course_id: string;
  section_id: string | null;
  progress: number | null;
  grade: string | null;
  status: string | null;
  enrolled_at: string;
  course: Course | Course[] | null;
  section: SectionInfo | SectionInfo[] | null;
};

type EnrolledSubject = Omit<EnrollmentRow, "course" | "section"> & {
  course: Course;
  section: SectionInfo | null;
};

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function statusLabel(status: string | null, grade: string | null) {
  if (grade === "5.0" || grade === "4.0" || grade === "INC") {
    return { text: "Failed / Retake", className: styles.statusFailed };
  }
  if (status === "completed") {
    return { text: "Completed", className: styles.statusCompleted };
  }
  if (status === "in_progress") {
    return { text: "In Progress", className: styles.statusProgress };
  }
  return { text: status?.replace(/_/g, " ") ?? "Enrolled", className: styles.statusDefault };
}

export default async function EnrolledSubjectsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role === "admin") redirect("/admin");
  if (profile?.role === "professor") redirect("/teacher");

  const { data: enrollmentData } = await supabase
    .from("enrollments")
    .select(
      "id, course_id, section_id, progress, grade, status, enrolled_at, course:courses(*), section:sections(section_code, academic_year, term)"
    )
    .eq("user_id", user.id)
    .order("enrolled_at", { ascending: false });

  const enrollments: EnrolledSubject[] = ((enrollmentData ?? []) as unknown as EnrollmentRow[])
    .flatMap((enrollment) => {
      const course = firstRelation(enrollment.course);
      if (!course) return [];
      return [
        {
          ...enrollment,
          course,
          section: firstRelation(enrollment.section),
        },
      ];
    });

  const courseIds = enrollments.map((enrollment) => enrollment.course_id);

  const [topicsRes, progressRes] = await Promise.all([
    courseIds.length > 0
      ? supabase.from("course_topics").select("id, course_id").in("course_id", courseIds)
      : Promise.resolve({ data: [] as Array<{ id: string; course_id: string }> }),
    supabase
      .from("student_topic_progress")
      .select("topic_id,status")
      .eq("user_id", user.id)
      .eq("status", "completed"),
  ]);

  const totalTopicsByCourse = new Map<string, number>();
  for (const topic of topicsRes.data ?? []) {
    totalTopicsByCourse.set(
      topic.course_id,
      (totalTopicsByCourse.get(topic.course_id) ?? 0) + 1
    );
  }

  const completedTopicIds = new Set(
    (progressRes.data ?? []).map((progress) => progress.topic_id)
  );

  const completedTopicsByCourse = new Map<string, number>();
  for (const topic of topicsRes.data ?? []) {
    if (!completedTopicIds.has(topic.id)) continue;
    completedTopicsByCourse.set(
      topic.course_id,
      (completedTopicsByCourse.get(topic.course_id) ?? 0) + 1
    );
  }

  const enriched = enrollments
    .map((enrollment) => {
      const totalTopics = totalTopicsByCourse.get(enrollment.course_id) ?? 0;
      const completedTopics = completedTopicsByCourse.get(enrollment.course_id) ?? 0;
      const topicProgress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
      const progress = totalTopics > 0 ? topicProgress : enrollment.progress ?? 0;
      const status = statusLabel(enrollment.status, enrollment.grade);

      return {
        ...enrollment,
        totalTopics,
        completedTopics,
        progress: Math.min(100, Math.max(0, progress)),
        status,
      };
    })
    .sort((a, b) => {
      const rank = (status: string) =>
        status === "In Progress" ? 0 : status === "Completed" ? 1 : 2;
      const rankDiff = rank(a.status.text) - rank(b.status.text);
      if (rankDiff !== 0) return rankDiff;
      return a.course.code.localeCompare(b.course.code);
    });

  const completedCount = enriched.filter((item) => item.status.text === "Completed").length;
  const inProgressCount = enriched.filter((item) => item.status.text === "In Progress").length;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>My learning</p>
          <h1 className={styles.title}>
            Enrolled <span>Subjects</span>
          </h1>
          <p className={styles.subtitle}>
            Your current subjects, section, academic year, and progress in one place.
          </p>
        </div>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <strong>{enriched.length}</strong>
            <span>Subjects</span>
          </div>
          <div className={styles.stat}>
            <strong>{inProgressCount}</strong>
            <span>In progress</span>
          </div>
          <div className={styles.stat}>
            <strong>{completedCount}</strong>
            <span>Completed</span>
          </div>
        </div>
      </header>

      {enriched.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📚</div>
          <h2>No enrolled subjects yet</h2>
          <p>Ask an administrator to enroll you in your subjects for the current term.</p>
          <Link href="/courses" className={styles.emptyLink}>
            Browse subjects
          </Link>
        </div>
      ) : (
        <div className={styles.subjectGrid}>
          {enriched.map((item) => (
            <article key={item.id} className={styles.subjectCard}>
              <div className={styles.cardTop}>
                <span className={styles.code}>{item.course.code}</span>
                <span className={`${styles.status} ${item.status.className}`}>
                  {item.status.text}
                </span>
              </div>

              <h2 className={styles.subjectTitle}>{item.course.title}</h2>

              {item.section && (
                <p className={styles.sectionLine}>
                  {item.section.section_code} · {item.section.academic_year} ·{" "}
                  {item.section.term}
                </p>
              )}

              <div className={styles.progressHeader}>
                <span>Subject progress</span>
                <strong>{item.progress}%</strong>
              </div>
              <div className={styles.progressTrack}>
                <span style={{ width: `${item.progress}%` }} />
              </div>

              <div className={styles.cardMeta}>
                <span>
                  {item.totalTopics > 0
                    ? `${item.completedTopics}/${item.totalTopics} topics completed`
                    : "No topics yet"}
                </span>
                <span>{item.grade ? `Grade: ${item.grade}` : "No grade yet"}</span>
              </div>

              <Link href={`/roadmap/course/${item.course.id}`} className={styles.openLink}>
                Open subject <span aria-hidden="true">→</span>
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
