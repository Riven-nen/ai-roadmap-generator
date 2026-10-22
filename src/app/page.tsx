import Card from "@/components/Card";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import styles from "./page.module.css";
import KnowledgeMap from "@/components/KnowledgeMap";
import AiRecommendation from "./AiRecommendation";
import { Enrollment } from "@/types";

export default async function Dashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  
  const { data: enrollmentsData } = await supabase.from("enrollments").select("*, course:courses(*)").eq("user_id", user.id);
  const enrollments = (enrollmentsData || []) as Enrollment[];

  // Fetch the career matrix data
  const { data: careers } = await supabase.from("career_paths").select("*, career_requirements(*)");
  const careerPaths = careers || [];

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            Welcome back, <span className={styles.highlight}>{profile?.full_name.split(" ")[0]}!</span>
          </h1>
          <p className={styles.subtitle}>Dean's Dashboard: Knowledge Mapping & AI Analytics</p>
        </div>
      </div>

      <div className={styles.mainGrid}>
        <div>
          <Card title="📊 IT Knowledge Map" description="Your proficiency across the 7 BSIT Domains">
            <KnowledgeMap enrollments={enrollments} />
          </Card>
        </div>

        <div>
          <Card title="✨ AI Academic Advisor" description="Compare your map against career requirements">
            <AiRecommendation 
              enrollments={enrollments} 
              careerPaths={careerPaths}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}