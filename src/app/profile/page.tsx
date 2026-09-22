import Card from "@/components/Card";
import styles from "./profile.module.css";

export default function Profile() {
  const stats = [
    { label: "Total Study Hours", value: "256h", icon: "📅", color: styles.iconPurple },
    { label: "Completed Courses", value: "12", icon: "📖", color: styles.iconBlue },
    { label: "Current Streak", value: "15 days", icon: "⚡", color: styles.iconYellow },
    { label: "Overall Progress", value: "68%", icon: "📈", color: styles.iconGreen },
  ];

  const skills = [
    { name: "HTML", category: "Frontend", progress: 95 },
    { name: "CSS", category: "Frontend", progress: 90 },
    { name: "JavaScript", category: "Frontend", progress: 85 },
    { name: "React", category: "Frontend", progress: 75 },
    { name: "Python", category: "Backend", progress: 70 },
    { name: "Git", category: "Tools", progress: 80 },
    { name: "SQL", category: "Database", progress: 65 },
  ];

  const achievements = [
    { title: "7 Day Streak", icon: "⚡" },
    { title: "5 Courses Completed", icon: "📖" },
    { title: "10 Skills Mastered", icon: "🎯" },
    { title: "Top Learner", icon: "🏆" },
    { title: "Fast Learner", icon: "📈" },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.profileInfo}>
          <div className={styles.avatar}>JD</div>
          <div>
            <h1 className={styles.name}>John Doe</h1>
            <p className={styles.role}>Computer Science Student</p>
            <div className={styles.badges}>
              <span className={styles.badgePurple}>Front-End Developer</span>
              <span className={styles.badgeBlue}>Level 5</span>
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
            {skills.map((skill, i) => (
              <div key={i} className={styles.skillItem}>
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
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="🏆 Achievements">
          <div className={styles.achievementsList}>
            {achievements.map((ach, i) => (
              <div key={i} className={styles.achievementItem}>
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