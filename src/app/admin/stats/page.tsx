import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentAcademicYear, getCurrentTerm } from "@/lib/academic";
import {
  ClassSizeBars,
  DepartmentPie,
  StatusBars,
  YearBars,
  type ChartDatum,
} from "./StatsCharts";
import styles from "./stats.module.css";

type Student = {
  id: string;
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
};
type Enrollment = {
  id: string;
  user_id: string;
  section_id: string | null;
  status: string | null;
};
type Assignment = { section_id: string; professor_id: string };
type Draft = { course_id: string; published_at: string | null };

function percent(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

export default async function AdminStatsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
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
    supabase.from("profiles").select("id, department, level, section").eq("role", "student"),
    supabase.from("profiles").select("id, full_name").eq("role", "professor"),
    supabase.from("courses").select("id, code, title").order("code"),
    supabase
      .from("sections")
      .select("id, course_id, section_code, academic_year, term"),
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

  const departmentCounts = new Map<string, number>();
  const yearCounts = new Map<number, number>();
  for (const student of students) {
    const department = student.department ?? "BSIT";
    departmentCounts.set(department, (departmentCounts.get(department) ?? 0) + 1);
    const year = student.level ?? 1;
    yearCounts.set(year, (yearCounts.get(year) ?? 0) + 1);
  }

  const statusCounts = new Map<string, number>();
  for (const enrollment of enrollments) {
    const status = enrollment.status ?? "in_progress";
    statusCounts.set(status, (statusCounts.get(status) ?? 0) + 1);
  }

  const departmentData: ChartDatum[] = Array.from(departmentCounts.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const yearData: ChartDatum[] = Array.from(yearCounts.entries())
    .sort(([a], [b]) => a - b)
    .map(([year, value]) => ({ name: `Year ${year}`, value }));

  const statusData: ChartDatum[] = Array.from(statusCounts.entries()).map(
    ([status, value]) => ({
      name: status.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
      value,
    })
  );

  const classSizeData: ChartDatum[] = classes
    .map((section) => {
      const subject = subjectById.get(section.course_id);
      return {
        name: `${subject?.code ?? "Subject"} ${section.section_code}`,
        value: studentCountByClass.get(section.id) ?? 0,
      };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const classesWithProfessors = classes.filter(
    (section) => (professorsByClass.get(section.id)?.length ?? 0) > 0
  ).length;
  const classesWithStudents = classes.filter(
    (section) => (studentCountByClass.get(section.id) ?? 0) > 0
  ).length;
  const subjectsWithClasses = subjects.filter((subject) =>
    classes.some((section) => section.course_id === subject.id)
  ).length;
  const publishedSubjects = new Set(
    drafts.filter((draft) => draft.published_at).map((draft) => draft.course_id)
  ).size;
  const studentsWithoutEnrollments = students.filter(
    (student) => !enrolledStudentIds.has(student.id)
  );
  const subjectsWithoutClasses = subjects.length - subjectsWithClasses;
  const classesWithoutProfessors = classes.length - classesWithProfessors;
  const classesWithoutStudents = classes.length - classesWithStudents;

  const averageClassSize = classes.length
    ? Math.round((enrollments.length / classes.length) * 10) / 10
    : 0;
  const averageSubjectsPerStudent = students.length
    ? Math.round((enrollments.length / students.length) * 10) / 10
    : 0;

  const coverage = [
    {
      label: "Classes with a professor",
      value: percent(classesWithProfessors, classes.length),
      detail: `${classesWithProfessors} of ${classes.length}`,
    },
    {
      label: "Classes with students",
      value: percent(classesWithStudents, classes.length),
      detail: `${classesWithStudents} of ${classes.length}`,
    },
    {
      label: "Subjects with a class",
      value: percent(subjectsWithClasses, subjects.length),
      detail: `${subjectsWithClasses} of ${subjects.length}`,
    },
    {
      label: "Subjects with a published roadmap",
      value: percent(publishedSubjects, subjects.length),
      detail: `${publishedSubjects} of ${subjects.length}`,
    },
  ];

  const topClasses = classes
    .map((section) => {
      const subject = subjectById.get(section.course_id);
      return {
        id: section.id,
        label: `${subject?.code ?? "Subject"} · ${section.section_code}`,
        academicYear: section.academic_year,
        term: section.term,
        students: studentCountByClass.get(section.id) ?? 0,
        professors: (professorsByClass.get(section.id) ?? [])
          .map((professor) => professor.full_name)
          .join(", "),
      };
    })
    .sort((a, b) => b.students - a.students)
    .slice(0, 5);

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Program intelligence</p>
          <h1 className={styles.title}>Stats &amp; health</h1>
          <p className={styles.subtitle}>
            A real-time look at the program. Use it to spot curriculum gaps, empty classes, and
            students who still need an enrollment.
          </p>
          <div className={styles.heroMeta}>
            <span className={styles.chip}>AY {getCurrentAcademicYear()}</span>
            <span className={styles.chip}>{getCurrentTerm()}</span>
          </div>
        </div>
        <div className={styles.heroActions}>
          <Link href="/admin" className={styles.secondaryBtn}>
            Back to panel
          </Link>
          <Link href="/admin/sections" className={styles.primaryBtn}>
            Manage classes
          </Link>
        </div>
      </section>

      <section className={styles.kpiGrid}>
        <div className={styles.kpi}>
          <span>Students</span>
          <strong>{students.length}</strong>
          <small>{enrolledStudentIds.size} with enrollments</small>
        </div>
        <div className={styles.kpi}>
          <span>Professors</span>
          <strong>{professors.length}</strong>
          <small>Teaching accounts</small>
        </div>
        <div className={styles.kpi}>
          <span>Subjects</span>
          <strong>{subjects.length}</strong>
          <small>{subjectsWithClasses} with classes</small>
        </div>
        <div className={styles.kpi}>
          <span>Classes</span>
          <strong>{classes.length}</strong>
          <small>{averageClassSize} avg. enrollments</small>
        </div>
        <div className={styles.kpi}>
          <span>Enrollments</span>
          <strong>{enrollments.length}</strong>
          <small>{averageSubjectsPerStudent} avg. subjects/student</small>
        </div>
        <div className={styles.kpi}>
          <span>Roadmaps live</span>
          <strong>{publishedSubjects}</strong>
          <small>{percent(publishedSubjects, subjects.length)}% of subjects</small>
        </div>
      </section>

      <div className={styles.splitGrid}>
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Coverage &amp; health</h2>
              <p className={styles.panelHint}>The things worth checking before a defense.</p>
            </div>
          </div>
          <div className={styles.coverageList}>
            {coverage.map((item) => (
              <div key={item.label} className={styles.coverageRow}>
                <div className={styles.coverageTop}>
                  <span>{item.label}</span>
                  <strong>{item.value}%</strong>
                </div>
                <div className={styles.coverageBar}>
                  <span style={{ width: `${item.value}%` }} />
                </div>
                <span className={styles.coverageDetail}>{item.detail}</span>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Needs attention</h2>
              <p className={styles.panelHint}>Tap a card to fix it.</p>
            </div>
          </div>
          <div className={styles.attentionList}>
            <Link href="/admin/sections" className={styles.attentionItem}>
              <span className={styles.attentionNumber}>{classesWithoutProfessors}</span>
              <span>
                <strong>Classes without a professor</strong>
                <small>Assign at least one professor per class.</small>
              </span>
            </Link>
            <Link href="/admin/sections" className={styles.attentionItem}>
              <span className={styles.attentionNumber}>{classesWithoutStudents}</span>
              <span>
                <strong>Classes without students</strong>
                <small>Enroll students or archive the class.</small>
              </span>
            </Link>
            <Link href="/admin/courses" className={styles.attentionItem}>
              <span className={styles.attentionNumber}>{subjectsWithoutClasses}</span>
              <span>
                <strong>Subjects without a class</strong>
                <small>Create a class for the subject.</small>
              </span>
            </Link>
            <Link href="/admin/students" className={styles.attentionItem}>
              <span className={styles.attentionNumber}>{studentsWithoutEnrollments.length}</span>
              <span>
                <strong>Students without enrollments</strong>
                <small>Enroll them in their subjects.</small>
              </span>
            </Link>
          </div>
        </section>
      </div>

      <div className={styles.chartGrid}>
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Student mix by course</h2>
              <p className={styles.panelHint}>Where the student body sits today.</p>
            </div>
          </div>
          {departmentData.length > 0 ? (
            <DepartmentPie data={departmentData} />
          ) : (
            <p className={styles.empty}>No students yet.</p>
          )}
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Students by year level</h2>
              <p className={styles.panelHint}>How the program is distributed by year.</p>
            </div>
          </div>
          {yearData.length > 0 ? (
            <YearBars data={yearData} />
          ) : (
            <p className={styles.empty}>No students yet.</p>
          )}
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Enrollment status</h2>
              <p className={styles.panelHint}>Active versus completed subject enrollments.</p>
            </div>
          </div>
          {statusData.length > 0 ? (
            <StatusBars data={statusData} />
          ) : (
            <p className={styles.empty}>No enrollments yet.</p>
          )}
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Largest classes</h2>
              <p className={styles.panelHint}>The rosters with the most students.</p>
            </div>
          </div>
          {classSizeData.length > 0 ? (
            <ClassSizeBars data={classSizeData} />
          ) : (
            <p className={styles.empty}>No classes yet.</p>
          )}
        </section>
      </div>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h2 className={styles.panelTitle}>Top rosters</h2>
            <p className={styles.panelHint}>Quick view of the biggest classes on record.</p>
          </div>
          <Link href="/admin/sections" className={styles.panelLink}>
            View all classes
          </Link>
        </div>
        {topClasses.length === 0 ? (
          <p className={styles.empty}>No classes yet.</p>
        ) : (
          <div className={styles.topClassList}>
            {topClasses.map((section) => (
              <Link
                key={section.id}
                href={`/admin/sections/${section.id}`}
                className={styles.topClassRow}
              >
                <span className={styles.topClassRank}>
                  {topClasses.indexOf(section) + 1}
                </span>
                <span className={styles.topClassInfo}>
                  <strong>{section.label}</strong>
                  <small>
                    {section.academicYear} · {section.term}
                  </small>
                </span>
                <span className={styles.topClassProfessor}>
                  {section.professors || "No professor assigned"}
                </span>
                <span className={styles.topClassCount}>{section.students} students</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
