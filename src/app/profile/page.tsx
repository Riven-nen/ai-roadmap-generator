import Card from "@/components/Card";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import styles from "./profile.module.css";

export default async function Profile() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileRes, enrollmentsRes, achievementsRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("enrollments").select("*, course:courses(*)").eq("user_id", user.id),
    supabase.from("achievements").select("*").eq("user_id", user.id).order("unlocked_at", { ascending: false }),
  ]);

  const profile = profileRes.data;
  const enrollments = enrollmentsRes.data ?? [];
  const achievements = achievementsRes.data ?? [];

  if (!profile) return <div>Profile not found.</div>;

  // Calculate dynamic domain scores based on grades
  const domainScores: Record<string, { total: number; count: number }> = {};
  const domains = [
    "Programming", "Database Management", "Networking", 
    "Cybersecurity", "Web Development", "Systems Analysis and Design", "Cloud Computing"
  ];

  // Initialize all domains to 0
  domains.forEach(d => domainScores[d] = { total: 0, count: 0 });

  enrollments.forEach((e) => {
    const cat = e.course?.category;
    if (cat && domainScores[cat]) {
      let score = 0;
      const grade = e.grade;
      if (grade === "1.0") score = 98;
      else if (grade === "1.25") score = 94;
      else if (grade === "1.5") score = 90;
      else if (grade === "1.75") score = 86;
      else if (grade === "2.0") score = 82;
      else if (grade === "2.25") score = 78;
      else if (grade === "2.5") score = 74;
      else if (grade === "2.75") score = 70;
      else if (grade === "3.0") score = 60;
      else if (grade === "5.0" || grade === "INC") score = 10;

      domainScores[cat].total += score;
      domainScores[cat].count += 1;
    }
  });

  // Convert to array for rendering
  const skillsList = domains.map(domain => {
    const score = domainScores[domain].count > 0 
      ? Math.round(domainScores[domain].total / domainScores[domain].count) 
      : 0;
    return { name: domain, progress: score };
  }).sort((a, b) => b.progress - a.progress); 

  // Calculate completed courses
  const completedCount = enrollments.filter(e => e.status === "completed").length;

  const stats = [
    { label: "Total Study Hours", value: `${profile.study_hours}h`, icon: "📅", color: styles.iconPurple },
    { label: "Completed Courses", value: completedCount.toString(), icon: "📖", color: styles.iconBlue },
    { label: "Current Streak", value: `${profile.current_streak} days`, icon: "⚡", color: styles.iconYellow },
    { label: "Overall Progress", value: `${profile.overall_progress}%`, icon: "📈", color: styles.iconGreen },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.profileInfo}>
          <div className={styles.avatar}>{profile.avatar_initials}</div>
          <div>
            <h1 className={styles.name}>{profile.full_name}</h1>
            <p className={styles.role}>{profile.role}</p>
            <div className={styles.badges}>
              <span className={styles.badgePurple}>BSIT Student</span>
              <span className={styles.badgeBlue}>Level {profile.level}</span>
            </div>
          </div>
        </div>
        <button className={styles.editBtn}>✎ Edit Profile</button>
      </div>

      <div className={styles.statsGrid}>
        {stats.map((stat, i) => (
          <Card key={i} className={styles.statCard}>
            <div className={`${styles.statIcon} ${stat.color}`}>{stat.icon}</div>
            <div>
              <p className={styles.statLabel}>{stat.label}</p>
              <p className={styles.statValue}>{stat.value}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className={styles.mainGrid}>
        <Card title="🎯 IT Domain Proficiency">
          <div className={styles.skillsList}>
            {skillsList.map((skill, i) => (
              <div key={i} className={styles.skillItem}>
                <div className={styles.skillHeader}>
                  <div className={styles.skillNameContainer}>
                    <span className={styles.skillName}>{skill.name}</span>
                  </div>
                  <span className={styles.skillPercent}>{skill.progress}%</span>
                </div>
                <div className={styles.progressBarBg}>
                  <div
                    className={styles.progressBarFill}
                    style={{ 
                      width: `${skill.progress}%`, 
                      background: skill.progress < 60 ? "#ef4444" : skill.progress < 80 ? "#eab308" : "#a855f7" 
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="🏆 Achievements">
          <div className={styles.achievementsList}>
            {achievements.map((ach) => (
              <div key={ach.id} className={styles.achievementItem}>
                <div className={styles.achIconWrapper}>{ach.icon}</div>
                <span className={styles.achTitle}>{ach.title}</span>
              </div>
            ))}
            {achievements.length === 0 && (
              <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>No achievements unlocked yet.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}