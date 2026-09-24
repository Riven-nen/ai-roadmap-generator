import Card from "@/components/Card";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import styles from "./page.module.css";

export default async function Dashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [
    profileRes,
    pathsRes,
    recommendationsRes,
    enrollmentsRes,
    skillsRes,
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("learning_paths").select("*").eq("user_id", user.id),
    supabase
      .from("recommendations")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_dismissed", false),
    supabase
      .from("enrollments")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "completed"),
    supabase.from("skills").select("*").eq("user_id", user.id),
  ]);

  const profile = profileRes.data;
  const paths = pathsRes.data ?? [];
  const recommendations = recommendationsRes.data ?? [];
  const enrollments = enrollmentsRes.data ?? [];
  const skills = skillsRes.data ?? [];

  if (!profile) return <div>Profile not found.</div>;

  const stats = [
    {
      label: "Learning Streak",
      value: `${profile.current_streak} days`,
      icon: "⚡",
      colorClass: styles.iconYellow,
    },
    {
      label: "Courses Completed",
      value: enrollments.length.toString(),
      icon: "🏆",
      colorClass: styles.iconPurple,
    },
    {
      label: "Skills Acquired",
      value: skills.length.toString(),
      icon: "🎯",
      colorClass: styles.iconBlue,
    },
    {
      label: "Study Hours",
      value: `${profile.study_hours}h`,
      icon: "🕒",
      colorClass: styles.iconGreen,
    },
  ];

  const colorMap: Record<string, string> = {
    pink: styles.bgPink,
    blue: styles.bgBlue,
    green: styles.bgGreen,
  };

  const firstName = profile.full_name.split(" ")[0];

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            Welcome back, <span className={styles.highlight}>{firstName}!</span>
          </h1>
          <p className={styles.subtitle}>
            Track your progress and continue your learning journey
          </p>
        </div>
        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Search courses, skills..."
            className={styles.searchInput}
          />
        </div>
      </div>

      <div className={styles.statsGrid}>
        {stats.map((stat, i) => (
          <Card key={i}>
            <div className={styles.statCardContent}>
              <div>
                <p className={styles.statLabel}>{stat.label}</p>
                <p className={styles.statValue}>{stat.value}</p>
              </div>
              <div className={stat.colorClass}>{stat.icon}</div>
            </div>
          </Card>
        ))}
      </div>

      <div className={styles.mainGrid}>
        <div>
          <Card
            title="Your Learning Paths"
            description="Track your progress across different career paths"
          >
            <div className={styles.pathsList}>
              {paths.map((path) => (
                <div key={path.id}>
                  <div className={styles.pathHeader}>
                    <div>
                      <h4 className={styles.pathName}>{path.name}</h4>
                      <p className={styles.pathNext}>{path.next_step}</p>
                    </div>
                    <span className={styles.pathPercent}>{path.progress}%</span>
                  </div>
                  <div className={styles.progressBarBg}>
                    <div
                      className={`${styles.progressBarFill} ${
                        colorMap[path.color] ?? styles.bgBlue
                      }`}
                      style={{ width: `${path.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <button className={styles.viewRoadmapBtn}>
              View Full Roadmap
            </button>
          </Card>
        </div>

        <div>
          <Card
            title="AI Recommendations"
            description="Personalized for your skills"
          >
            <div className={styles.recommendationsList}>
              {recommendations.map((rec) => (
                <div key={rec.id} className={styles.recItem}>
                  <h4 className={styles.recTitle}>{rec.title}</h4>
                  <p className={styles.recDesc}>{rec.description}</p>
                  <div className={styles.recMeta}>
                    <span className={styles.recLevel}>{rec.level}</span>
                    <span className={styles.recTime}>⏱ {rec.duration_weeks} weeks</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}