import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import BackButton from "@/components/BackButton";
import { createClient } from "@/lib/supabase/server";
import SectionProfessors from "./SectionProfessors";
import SectionEnrollments from "./SectionEnrollments";
import SectionFinalExam from "./SectionFinalExam";
import SectionSettings from "./SectionSettings";
import styles from "../../admin.module.css";
import sectionStyles from "../sections.module.css";

type Section = {
  id: string;
  course_id: string;
  section_code: string;
  program: string;
  year_level: number;
  section_letter: string;
  academic_year: string;
  term: string;
  join_code: string;
  archived_at: string | null;
  course: {
    id: string;
    code: string;
    title: string;
    year_level: number | null;
    semester: number | null;
  };
};

export default async function AdminSectionDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (me?.role !== "admin") redirect("/");

  const { data: sectionData } = await supabase
    .from("sections")
    .select("*, course:courses(id, code, title, year_level, semester)")
    .eq("id", id)
    .single();

  if (!sectionData) notFound();
  const section = sectionData as unknown as Section;

  const [assignmentsRes, professorsRes, studentsRes, enrollmentsRes, quizzesRes] =
    await Promise.all([
      supabase.from("section_professors").select("*").eq("section_id", id),
      supabase.from("profiles").select("id, full_name, email").eq("role", "professor").order("full_name"),
      supabase
        .from("profiles")
        .select("id, full_name, email, level, department, section")
        .eq("role", "student")
        .order("full_name"),
      supabase
        .from("enrollments")
        .select("id, user_id, status, grade, enrolled_at")
        .eq("section_id", id)
        .order("enrolled_at"),
      supabase
        .from("quizzes")
        .select("id, course_id, title, description, passing_score, topic_id, section_id")
        .eq("course_id", section.course_id)
        .is("topic_id", null)
        .order("title"),
    ]);

  const assignments = assignmentsRes.data ?? [];
  const professors = professorsRes.data ?? [];
  const students = studentsRes.data ?? [];
  const enrollments = enrollmentsRes.data ?? [];
  const finalExams = (quizzesRes.data ?? []).filter((quiz) => !quiz.section_id || quiz.section_id === id);

  const professorById = new Map(professors.map((professor) => [professor.id, professor]));
  const studentById = new Map(students.map((student) => [student.id, student]));

  const assignedProfessorIds = new Set(assignments.map((assignment) => assignment.professor_id));
  const assignedProfessors = assignments
    .map((assignment) => professorById.get(assignment.professor_id))
    .filter((professor): professor is NonNullable<typeof professor> => Boolean(professor));

  const enrolled = enrollments.map((enrollment) => {
    const student = studentById.get(enrollment.user_id);
    return {
      id: enrollment.id,
      user_id: enrollment.user_id,
      status: enrollment.status,
      grade: enrollment.grade,
      full_name: student?.full_name ?? "Unknown student",
      email: student?.email ?? null,
      level: student?.level ?? null,
      department: student?.department ?? null,
      section: student?.section ?? null,
    };
  });

  return (
    <div className={styles.container}>
      <div>
        <BackButton fallbackHref="/admin/sections" className={styles.backLink} />
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>
              {section.course.code} · {section.section_code}
            </h1>
            <p className={styles.subtitle}>{section.course.title}</p>
            <div className={sectionStyles.headerMeta}>
              <span className={sectionStyles.badge}>{section.academic_year}</span>
              <span className={sectionStyles.badge}>{section.term}</span>
              <span className={sectionStyles.code}>{section.join_code}</span>
              <span className={sectionStyles.badge}>
                {assignedProfessors.length} professor{assignedProfessors.length === 1 ? "" : "s"}
              </span>
              <span className={sectionStyles.badge}>
                {enrolled.length} student{enrolled.length === 1 ? "" : "s"}
              </span>
              {section.archived_at && <span className={sectionStyles.badgeWarn}>Archived</span>}
            </div>
          </div>
          <div className={sectionStyles.rowActions}>
            <Link
              href={`/roadmap/course/${section.course.id}`}
              target="_blank"
              className={styles.primaryBtn}
            >
              Preview roadmap
            </Link>
            <Link
              href={`/admin/courses/${section.course.id}/roadmap`}
              className={styles.primaryBtn}
            >
              Build roadmap
            </Link>
          </div>
        </div>
      </div>

      <div className={sectionStyles.layout}>
        <div className={sectionStyles.stack}>
          <div className={sectionStyles.card}>
            <div>
              <h2 className={sectionStyles.cardTitle}>Section details</h2>
              <p className={sectionStyles.cardHint}>
                A section is BSIT 1A: course, year level, and letter. This class pairs the
                subject with that section for the academic year and term.
              </p>
            </div>
            <SectionSettings
              sectionId={section.id}
              courseCode={section.course.code}
              subjectYearLevel={section.course.year_level ?? section.year_level}
              subjectTerm={
                section.course.semester === 2 ? "2nd Semester" : "1st Semester"
              }
              initial={{
                program: section.program,
                section_letter: section.section_letter,
                academic_year: section.academic_year,
                join_code: section.join_code,
              }}
            />
          </div>

          <div className={sectionStyles.card}>
            <div>
              <h2 className={sectionStyles.cardTitle}>Assigned professors</h2>
              <p className={sectionStyles.cardHint}>
                Any professor assigned here can edit the shared course roadmap.
              </p>
            </div>
            <SectionProfessors
              sectionId={id}
              assigned={assignedProfessors}
              available={professors.filter((professor) => !assignedProfessorIds.has(professor.id))}
            />
          </div>

          <div className={sectionStyles.card}>
            <div>
              <h2 className={sectionStyles.cardTitle}>Enrolled students</h2>
              <p className={sectionStyles.cardHint}>
                Add students in bulk by email. A student can only be enrolled in a course once.
              </p>
            </div>
            <SectionEnrollments
              sectionId={id}
              courseId={section.course_id}
              enrolled={enrolled}
              students={students}
            />
          </div>
        </div>

        <aside className={sectionStyles.stack}>
          <div className={sectionStyles.card}>
            <div>
              <h2 className={sectionStyles.cardTitle}>Final exam</h2>
              <p className={sectionStyles.cardHint}>
                Sections without their own exam inherit the course-wide final exam.
              </p>
            </div>
            <SectionFinalExam
              sectionId={id}
              sectionLabel={`${section.course.code} ${section.section_code}`}
              courseId={section.course_id}
              exams={finalExams}
            />
          </div>

          <div className={sectionStyles.card}>
            <h2 className={sectionStyles.cardTitle}>Section summary</h2>
            <div className={sectionStyles.statGrid}>
              <div className={sectionStyles.stat}>
                <p className={sectionStyles.statLabel}>Students</p>
                <p className={sectionStyles.statValue}>{enrolled.length}</p>
              </div>
              <div className={sectionStyles.stat}>
                <p className={sectionStyles.statLabel}>Professors</p>
                <p className={sectionStyles.statValue}>{assignedProfessors.length}</p>
              </div>
              <div className={sectionStyles.stat}>
                <p className={sectionStyles.statLabel}>Final exams</p>
                <p className={sectionStyles.statValue}>
                  {finalExams.filter((exam) => exam.section_id === id).length}
                </p>
              </div>
            </div>
            {assignedProfessors.length === 0 && (
              <div className={sectionStyles.noticeInfo}>
                Assign at least one professor so this course has an editor and the section has an owner.
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
