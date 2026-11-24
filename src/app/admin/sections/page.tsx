import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SectionForm from "./SectionForm";
import styles from "../admin.module.css";
import sectionStyles from "./sections.module.css";

type Course = {
  id: string;
  code: string;
  title: string;
  year_level: number | null;
  semester: number | null;
};
type SectionRow = {
  id: string;
  course_id: string;
  section_code: string;
  academic_year: string;
  term: string;
  join_code: string;
  created_at: string;
  archived_at: string | null;
};
type Assignment = { section_id: string; professor_id: string };
type Professor = { id: string; full_name: string; email: string | null };

export default async function AdminSections({
  searchParams,
}: {
  searchParams: Promise<{ course?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (me?.role !== "admin") redirect("/");

  const { course: courseFilter } = await searchParams;

  const [sectionsRes, coursesRes, enrollmentsRes, assignmentsRes, professorsRes] =
    await Promise.all([
      supabase.from("sections").select("*").order("created_at", { ascending: false }),
      supabase.from("courses").select("id, code, title, year_level, semester").order("code"),
      supabase.from("enrollments").select("id, section_id"),
      supabase.from("section_professors").select("section_id, professor_id"),
      supabase.from("profiles").select("id, full_name, email").eq("role", "professor"),
    ]);

  const courses = (coursesRes.data ?? []) as Course[];
  const professors = (professorsRes.data ?? []) as Professor[];
  const assignments = (assignmentsRes.data ?? []) as Assignment[];
  const enrollments = enrollmentsRes.data ?? [];

  const courseById = new Map(courses.map((course) => [course.id, course]));
  const professorById = new Map(professors.map((professor) => [professor.id, professor]));

  const enrollmentCounts = new Map<string, number>();
  for (const enrollment of enrollments) {
    if (!enrollment.section_id) continue;
    enrollmentCounts.set(
      enrollment.section_id,
      (enrollmentCounts.get(enrollment.section_id) ?? 0) + 1
    );
  }

  const professorsBySection = new Map<string, Professor[]>();
  for (const assignment of assignments) {
    const professor = professorById.get(assignment.professor_id);
    if (!professor) continue;
    const list = professorsBySection.get(assignment.section_id) ?? [];
    list.push(professor);
    professorsBySection.set(assignment.section_id, list);
  }

  let sections = (sectionsRes.data ?? []) as SectionRow[];
  if (courseFilter) {
    sections = sections.filter((section) => section.course_id === courseFilter);
  }

  const filteredCourse = courseFilter ? courseById.get(courseFilter) : undefined;

  return (
    <div className={styles.container}>
      <div>
        <Link href="/admin" className={styles.backLink}>
          <span className={styles.backArrow}>←</span> Back to Admin
        </Link>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Classes</h1>
            <p className={styles.subtitle}>
              {filteredCourse
                ? `${filteredCourse.code}: ${filteredCourse.title}`
                : `${sections.length} class${sections.length === 1 ? "" : "es"} across all subjects`}
            </p>
          </div>
          {filteredCourse && (
            <Link href="/admin/sections" className={styles.primaryBtn}>
              Show all classes
            </Link>
          )}
        </div>
      </div>

      <div className={sectionStyles.layout}>
        <div className={sectionStyles.stack}>
          <div className={sectionStyles.card}>
            <div>
              <h2 className={sectionStyles.cardTitle}>All classes</h2>
              <p className={sectionStyles.cardHint}>
                A subject such as IT 101 can have classes for several sections, such as BSIT 1A,
                BSIT 1B, or BSIT 1C. Open a class to assign professors, enroll students, and set
                its final exam.
              </p>
            </div>

            {sections.length === 0 ? (
              <div className={sectionStyles.empty}>
                No sections yet. Create one with the form on the right.
              </div>
            ) : (
              <div className={sectionStyles.tableWrap}>
                <table className={sectionStyles.table}>
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Section</th>
                      <th>Academic year</th>
                      <th>Term</th>
                      <th>Professors</th>
                      <th>Students</th>
                      <th>Join code</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sections.map((section) => {
                      const course = courseById.get(section.course_id);
                      const sectionProfessors = professorsBySection.get(section.id) ?? [];
                      return (
                        <tr key={section.id}>
                          <td>
                            <strong>{course?.code ?? "—"}</strong>
                            <div className={sectionStyles.muted}>{course?.title ?? ""}</div>
                          </td>
                          <td>{section.section_code}</td>
                          <td>{section.academic_year}</td>
                          <td>{section.term}</td>
                          <td>
                            {sectionProfessors.length === 0 ? (
                              <span className={sectionStyles.badgeWarn}>Not assigned</span>
                            ) : (
                              sectionProfessors
                                .map((professor) => professor.full_name)
                                .join(", ")
                            )}
                          </td>
                          <td>{enrollmentCounts.get(section.id) ?? 0}</td>
                          <td>
                            <span className={sectionStyles.code}>{section.join_code}</span>
                          </td>
                          <td>
                            <Link
                              href={`/admin/sections/${section.id}`}
                              className={styles.editLink}
                            >
                              Manage
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <aside className={sectionStyles.card}>
          <div>
            <h2 className={sectionStyles.cardTitle}>Create a class</h2>
            <p className={sectionStyles.cardHint}>
              Choose the subject, then its section (course, year level, and letter), academic
              year, and term. Students are enrolled by an administrator.
            </p>
          </div>
          <SectionForm courses={courses} defaultCourseId={courseFilter} />
        </aside>
      </div>
    </div>
  );
}
