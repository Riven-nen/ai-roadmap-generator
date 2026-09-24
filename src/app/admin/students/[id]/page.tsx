import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Card from "@/components/Card";
import EnrollForm from "./EnrollForm";
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

  const [studentRes, enrollmentsRes, coursesRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", id).single(),
    supabase.from("enrollments").select("*, course:courses(*)").eq("user_id", id),
    supabase.from("courses").select("*").order("code"),
  ]);

  const student = studentRes.data;
  const enrollments = enrollmentsRes.data ?? [];
  const courses = coursesRes.data ?? [];

  if (!student) return <div>Student not found.</div>;

  const enrolledCourseIds = enrollments.map((e) => e.course_id);
  const availableCourses = courses.filter(
    (c) => !enrolledCourseIds.includes(c.id)
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{student.full_name}</h1>
          <p className={styles.subtitle}>Enrolled in {enrollments.length} courses</p>
        </div>
      </div>

      <Card title="Current Enrollments">
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Code</th>
              <th>Title</th>
              <th>Grade</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {enrollments.map((e) => (
              <tr key={e.id}>
                <td>{e.course?.code}</td>
                <td>{e.course?.title}</td>
                <td>{e.grade ?? "—"}</td>
                <td>{e.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card title="Enroll in a New Course">
        <EnrollForm studentId={student.id} courses={availableCourses} />
      </Card>
    </div>
  );
}