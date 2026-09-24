import { createClient } from "@/lib/supabase/server";

export default async function TestPage() {
  const supabase = await createClient();

  const [profile, skills, paths, achievements, recommendations, enrollments] =
    await Promise.all([
      supabase.from("profiles").select("*").limit(1).single(),
      supabase.from("skills").select("*"),
      supabase.from("learning_paths").select("*"),
      supabase.from("achievements").select("*"),
      supabase.from("recommendations").select("*"),
      supabase.from("enrollments").select("*, course:courses(*)"),
    ]);

  return (
    <pre style={{ color: "white", padding: 20 }}>
      {JSON.stringify(
        {
          profile: profile.data,
          skills: skills.data,
          paths: paths.data,
          achievements: achievements.data,
          recommendations: recommendations.data,
          enrollments: enrollments.data,
        },
        null,
        2
      )}
    </pre>
  );
}