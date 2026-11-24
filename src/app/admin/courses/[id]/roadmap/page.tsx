import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RoadmapBuilder from "./RoadmapBuilder";

export default async function CourseRoadmapBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [courseRes, profileRes, professorRes] = await Promise.all([
    supabase.from("courses").select("*").eq("id", id).single(),
    supabase.from("profiles").select("role").eq("id", user.id).single(),
    supabase.rpc("is_course_professor", { p_course_id: id }),
  ]);

  if (!courseRes.data) notFound();

  const role = profileRes.data?.role;
  const isAdmin = role === "admin";
  const isProfessor = role === "professor" && professorRes.data === true;

  if (!isAdmin && !isProfessor) {
    redirect(role === "professor" ? "/teacher" : "/");
  }

  return (
    <RoadmapBuilder
      course={courseRes.data}
      backHref={isAdmin ? "/admin/courses" : "/teacher"}
    />
  );
}
