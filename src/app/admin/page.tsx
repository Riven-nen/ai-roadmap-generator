import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentAcademicYear, getCurrentTerm } from "@/lib/academic";
import styles from "./admin-home.module.css";

type Student = {
  id: string;
  full_name: string;
  department: string | null;
  level: number | null;
  section: string | null;
};

type Professor = { id: string; full_name: string };
type Subject = { id: string; code: string; title: string };
type ClassRow = {
  id: string;
  course_id: string;
  section_code: string;
  academic_year: string;
  term: string;
  created_at: string;
};
type Enrollment = {
  id: string;
  user_id: string;
  section_id: string | null;
  status: string | null;
};
type Assignment = { section_id: string; professor_id: string };
type Draft = { course_id: string; published_at: string | null };

export default async function AdminHome() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/");

  const [
    studentsRes,
    professorsRes,
    subjectsRes,
    classesRes,
    enrollmentsRes,
    assignmentsRes,
    draftsRes,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, department, level, section")
      .eq("role", "student")
      .order("full_name"),
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "professor")
      .order("full_name"),
    supabase.from("courses").select("id, code, title").order("code"),
    supabase
      .from("sections")
      .select("id, course_id, section_code, academic_year, term, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("enrollments").select("id, user_id, section_id, status"),
    supabase.from("section_professors").select("section_id, professor_id"),
    supabase.from("roadmap_drafts").select("course_id, published_at"),
  ]);

  const students = (studentsRes.data ?? []) as Student[];
  const professors = (professorsRes.data ?? []) as Professor[];
  const subjects = (subjectsRes.data ?? []) as Subject[];
  const classes = (classesRes.data ?? []) as ClassRow[];
  const enrollments = (enrollmentsRes.data ?? []) as Enrollment[];
  const assignments = (assignmentsRes.data ?? []) as Assignment[];
  const drafts = (draftsRes.data ?? []) as Draft[];

  const subjectById = new Map(subjects.map((subject) => [subject.id, subject]));
  const professorById = new Map(professors.map((professor) => [professor.id, professor]));

  const studentCountByClass = new Map<string, number>();
  const enrolledStudentIds = new Set<string>();
  for (const enrollment of enrollments) {
    enrolledStudentIds.add(enrollment.user_id);
    if (!enrollment.section_id) continue;
    studentCountByClass.set(
      enrollment.section_id,
      (studentCountByClass.get(enrollment.section_id) ?? 0) + 1
    );
  }

  const professorsByClass = new Map<string, Professor[]>();
  for (const assignment of assignments) {
    const professor = professorById.get(assignment.professor_id);
    if (!professor) continue;
    const list = professorsByClass.get(assignment.section_id) ?? [];
    list.push(professor);
    professorsByClass.set(assignment.section_id, list);
  }

  const classesWithoutProfessors = classes.filter(
    (section) => (professorsByClass.get(section.id)?.length ?? 0) === 0
  );
  const classesWithoutStudents = classes.filter(
    (section) => (studentCountByClass.get(section.id) ?? 0) === 0
  );
  const subjectsWithoutClasses = subjects.filter(
    (subject) => !classes.some((section) => section.course_id === subject.id)
  );
  const studentsWithoutEnrollments = students.filter(
    (student) => !enrolledStudentIds.has(student.id)
  );
  const publishedSubjects = new Set(
    drafts.filter((draft) => draft.published_at).map((draft) => draft.course_id)
  ).size;

  const departmentCounts = new Map<string, number>();
  const yearCounts = new Map<number, number>();
  for (const student of students) {
    departmentCounts.set(
      student.department ?? "BSIT",
      (departmentCounts.get(student.department ?? "BSIT") ?? 0) + 1
    );
    yearCounts.set(student.level ?? 1, (yearCounts.get(student.level ?? 1) ?? 0) + 1);
  }

  const statusCounts = new Map<string, number>();
  for (const enrollment of enrollments) {
    const status = enrollment.status ?? "in_progress";
    statusCounts.set(status, (statusCounts.get(status) ?? 0) + 1);
  }

  const recentClasses = classes.slice(0, 4);
  const firstName = profile?.full_name?.split(" ")[0] ?? "Admin";
  const publishedPercent = subjects.length
    ? Math.round((publishedSubjects / subjects.length) * 100)
    : 0;

  const kpis = [
    { label: "Students", value: students.length, hint: `${enrolledStudentIds.size} enrolled`, icon: "👥" },
    { label: "Professors", value: professors.length, hint: "Teaching accounts", icon: "🎓" },
    { label: "Subjects", value: subjects.length, hint: `${publishedSubjects} with published roadmaps`, icon: "📚" },
    { label: "Classes", value: classes.length, hint: `${classesWithoutProfessors.length} need a professor`, icon: "🗂️" },
    { label: "Enrollments", value: enrollments.length, hint: "Active subject enrollments", icon: "📝" },
  ];

  const managementCards = [
    {
      href: "/admin/students",
      icon: "👥",
      title: "Students",
      description: "Profiles, course, year level, section, and enrollment history.",
    },
    {
      href: "/admin/students/new",
      icon: "➕",
      title: "Add users",
      description: "Create students or professors, single or bulk CSV import.",
    },
    {
      href: "/admin/courses",
      icon: "📚",
      title: "Subjects",
      description: "Manage the subject catalog, prerequisites, and roadmaps.",
    },
    {
      href: "/admin/sections",
      icon: "🗂️",
      title: "Classes",
      description: "Assign subjects to sections, professors, rosters, and final exams.",
    },
    {
      href: "/admin/stats",
      icon: "📈",
      title: "Program stats",
      description: "Enrollment mix, class health, and curriculum coverage at a glance.",
    },
    {
      href: "/profile",
      icon: "🎨",
      title: "Appearance",
      description: "Switch themes and update your administrator profile.",
    },
  ];

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroMain}>
          <p className={styles.eyebrow}>Admin workspace</p>
          <h1 className={styles.title}>
            Good day, <span>{firstName}</span>
          </h1>
          <p className={styles.heroText}>
            One place to manage students, professors, subjects, classes, and the curriculum.
            No sidebar, no digging.
          </p>
          <div className={styles.heroActions}>
            <Link href="/admin/stats" className={styles.primaryAction}>
              Open program stats
            </Link>
            <Link href="/admin/sections" className={styles.secondaryAction}>
              Manage classes
            </Link>
          </div>
        </div>

        <div className={styles.heroCard}>
          <div className={styles.heroCardTop}>
            <span className={styles.heroChip}>AY {getCurrentAcademicYear()}</span>
            <span className={styles.heroChip}>{getCurrentTerm()}</span>
          </div>
          <p className={styles.heroCardLabel}>Roadmap publishing</p>
          <p className={styles.heroCardValue}>{publishedPercent}%</p>
          <div className={styles.heroProgress}>
            <span style={{ width: `${publishedPercent}%` }} />
          </div>
          <p className={styles.heroCardHint}>
            {publishedSubjects} of {subjects.length} subjects have a published roadmap.
          </p>
        </div>
      </section>

      <section className={styles.kpiGrid}>
        {kpis.map((kpi) => (
          <div key={kpi.label} className={styles.kpiCard}>
            <span className={styles.kpiIcon}>{kpi.icon}</span>
            <span className={styles.kpiLabel}>{kpi.label}</span>
            <strong className={styles.kpiValue}>{kpi.value}</strong>
            <span className={styles.kpiHint}>{kpi.hint}</span>
          </div>
        ))}
      </section>

      <section>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Manage everything</h2>
            <p className={styles.sectionHint}>Jump straight to the area you need.</p>
          </div>
        </div>
        <div className={styles.managementGrid}>
          {managementCards.map((card) => (
            <Link key={card.title} href={card.href} className={styles.managementCard}>
              <span className={styles.managementIcon}>{card.icon}</span>
              <h3 className={styles.managementTitle}>{card.title}</h3>
              <p className={styles.managementDesc}>{card.description}</p>
              <span className={styles.managementArrow}>→</span>
            </Link>
          ))}
        </div>
      </section>

      <div className={styles.splitGrid}>
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Recent classes</h2>
              <p className={styles.panelHint}>The newest subject classes in the system.</p>
            </div>
            <Link href="/admin/sections" className={styles.panelLink}>
              View all
            </Link>
          </div>

          {recentClasses.length === 0 ? (
            <p className={styles.empty}>No classes yet. Create one from the Classes page.</p>
          ) : (
            <div className={styles.classList}>
              {recentClasses.map((section) => {
                const subject = subjectById.get(section.course_id);
                const classProfessors = professorsByClass.get(section.id) ?? [];
                return (
                  <Link
                    key={section.id}
                    href={`/admin/sections/${section.id}`}
                    className={styles.classRow}
                  >
                    <div className={styles.classBadge}>{subject?.code ?? "—"}</div>
                    <div className={styles.classInfo}>
                      <span className={styles.className}>{section.section_code}</span>
                      <span className={styles.classMeta}>
                        {section.academic_year} · {section.term}
                      </span>
                    </div>
                    <div className={styles.classStats}>
                      <span>{studentCountByClass.get(section.id) ?? 0} students</span>
                      <span>
                        {classProfessors.length > 0
                          ? classProfessors.map((professor) => professor.full_name).join(", ")
                          : "No professor"}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Needs attention</h2>
              <p className={styles.panelHint}>Small gaps worth fixing before defense day.</p>
            </div>
          </div>

          <div className={styles.attentionList}>
            <Link href="/admin/sections" className={styles.attentionItem}>
              <span className={styles.attentionIcon}>🧑‍🏫</span>
              <span>
                <strong>{classesWithoutProfessors.length}</strong> classes have no professor
              </span>
              <span className={styles.attentionArrow}>→</span>
            </Link>
            <Link href="/admin/sections" className={styles.attentionItem}>
              <span className={styles.attentionIcon}>🪑</span>
              <span>
                <strong>{classesWithoutStudents.length}</strong> classes have no students
              </span>
              <span className={styles.attentionArrow}>→</span>
            </Link>
            <Link href="/admin/courses" className={styles.attentionItem}>
              <span className={styles.attentionIcon}>📚</span>
              <span>
                <strong>{subjectsWithoutClasses.length}</strong> subjects have no class
              </span>
              <span className={styles.attentionArrow}>→</span>
            </Link>
            <Link href="/admin/students" className={styles.attentionItem}>
              <span className={styles.attentionIcon}>👤</span>
              <span>
                <strong>{studentsWithoutEnrollments.length}</strong> students have no enrollment
              </span>
              <span className={styles.attentionArrow}>→</span>
            </Link>
          </div>
        </section>
      </div>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h2 className={styles.panelTitle}>Student mix</h2>
            <p className={styles.panelHint}>Who is in the program right now.</p>
          </div>
          <Link href="/admin/stats" className={styles.panelLink}>
            Full stats
          </Link>
        </div>

        <div className={styles.mixGrid}>
          <div className={styles.mixBlock}>
            <p className={styles.mixLabel}>By course</p>
            {Array.from(departmentCounts.entries()).map(([department, count]) => (
              <div key={department} className={styles.mixRow}>
                <span>{department}</span>
                <div className={styles.mixBar}>
                  <span
                    style={{
                      width: `${students.length ? Math.round((count / students.length) * 100) : 0}%`,
                    }}
                  />
                </div>
                <strong>{count}</strong>
              </div>
            ))}
            {departmentCounts.size === 0 && <p className={styles.empty}>No students yet.</p>}
          </div>

          <div className={styles.mixBlock}>
            <p className={styles.mixLabel}>By year level</p>
            {Array.from(yearCounts.entries())
              .sort(([a], [b]) => a - b)
              .map(([year, count]) => (
                <div key={year} className={styles.mixRow}>
                  <span>Year {year}</span>
                  <div className={styles.mixBar}>
                    <span
                      style={{
                        width: `${students.length ? Math.round((count / students.length) * 100) : 0}%`,
                      }}
                    />
                  </div>
                  <strong>{count}</strong>
                </div>
              ))}
            {yearCounts.size === 0 && <p className={styles.empty}>No students yet.</p>}
          </div>

          <div className={styles.mixBlock}>
            <p className={styles.mixLabel}>Enrollment status</p>
            {Array.from(statusCounts.entries()).map(([status, count]) => (
              <div key={status} className={styles.mixRow}>
                <span className={styles.statusLabel}>{status.replace(/_/g, " ")}</span>
                <div className={styles.mixBar}>
                  <span
                    style={{
                      width: `${enrollments.length ? Math.round((count / enrollments.length) * 100) : 0}%`,
                    }}
                  />
                </div>
                <strong>{count}</strong>
              </div>
            ))}
            {statusCounts.size === 0 && <p className={styles.empty}>No enrollments yet.</p>}
          </div>
        </div>
      </section>
    </div>
  );
}
