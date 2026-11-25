import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Card from "@/components/Card";
import BackButton from "@/components/BackButton";
import EnrollForm from "./EnrollForm";
import StudentDetailsForm from "./StudentDetailsForm";
import styles from "../../admin.module.css";

export default async function StudentDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "admin") redirect("/");

  const [studentRes, enrollmentsRes, coursesRes, sectionsRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", id).single(),
    supabase
      .from("enrollments")
      .select("*, course:courses(*), section:sections(section_code, academic_year, term)")
      .eq("user_id", id),
    supabase.from("courses").select("*").order("code"),
    supabase
      .from("sections")
      .select("id, course_id, section_code, academic_year, term")
      .order("section_code"),
  ]);

  const student = studentRes.data;
  const enrollments = enrollmentsRes.data ?? [];
  const courses = coursesRes.data ?? [];
  const sections = sectionsRes.data ?? [];

  if (!student) return <div>Student not found.</div>;

  const enrolledCourseIds = enrollments.map((e) => e.course_id);
  const availableCourses = courses.filter(
    (c) => !enrolledCourseIds.includes(c.id)
  );

  return (
    <div className={styles.container}>
      <div>
        <BackButton fallbackHref="/admin/students" className={styles.backLink} />
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>{student.full_name}</h1>
            <p className={styles.subtitle}>
              {student.email || "No email on file"} · {student.department ?? "BSIT"} · Year{" "}
              {student.level ?? 1} - {student.section ?? "A"} · Enrolled in {enrollments.length}{" "}
              course{enrollments.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>
      </div>

      <Card title="Program Details">
        <StudentDetailsForm
          studentId={student.id}
          initialYear={student.level ?? 1}
          initialDepartment={student.department ?? "BSIT"}
          initialSection={student.section ?? "A"}
        />
      </Card>

      <Card title="Current Enrollments">
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Code</th>
              <th>Title</th>
              <th>Section</th>
              <th>Grade</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {enrollments.map((e) => (
              <tr key={e.id}>
                <td>{e.course?.code}</td>
                <td>{e.course?.title}</td>
                <td>
                  {e.section
                    ? `${e.section.section_code} · ${e.section.academic_year} · ${e.section.term}`
                    : "No section"}
                </td>
                <td>{e.grade ?? "—"}</td>
                <td>{e.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card title="Enroll in a New Course">
        <EnrollForm
          studentId={student.id}
          courses={availableCourses}
          sections={sections}
        />
      </Card>
    </div>
  );
}