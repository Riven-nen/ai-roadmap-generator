import Card from "@/components/Card";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import styles from "./profile.module.css";

export default async function Profile() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [profileRes, skillsRes, achievementsRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("skills").select("*").eq("user_id", user.id).order("progress", { ascending: false }),
    supabase.from("achievements").select("*").eq("user_id", user.id).order("unlocked_at", { ascending: false }),
  ]);

  const profile = profileRes.data;
  const skills = skillsRes.data ?? [];
  const achievements = achievementsRes.data ?? [];

  if (!profile) {
    return <div>Profile not found.</div>;
  }

  const stats = [
    { label: "Total Study Hours", value: `${profile.study_hours}h`, icon: "📅", color: styles.iconPurple },
    { label: "Completed Courses", value: "12", icon: "📖", color: styles.iconBlue },
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
              <span className={styles.badgePurple}>Front-End Developer</span>
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
        <Card title="🎯 Skills Acquired">
          <div className={styles.skillsList}>
            {skills.map((skill) => (
              <div key={skill.id} className={styles.skillItem}>
                <div className={styles.skillHeader}>
                  <div className={styles.skillNameContainer}>
                    <span className={styles.skillName}>{skill.name}</span>
                    <span className={styles.skillCategory}>{skill.category}</span>
                  </div>
                  <span className={styles.skillPercent}>{skill.progress}%</span>
                </div>
                <div className={styles.progressBarBg}>
                  <div
                    className={styles.progressBarFill}
                    style={{ width: `${skill.progress}%` }}
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
          </div>
        </Card>
      </div>
    </div>
  );
}