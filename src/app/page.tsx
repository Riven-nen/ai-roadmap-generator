import Card from "@/components/Card";
import styles from "./page.module.css";

export default function Dashboard() {
  const stats = [
    { label: "Learning Streak", value: "12 days", icon: "⚡", colorClass: styles.iconYellow },
    { label: "Courses Completed", value: "8", icon: "🏆", colorClass: styles.iconPurple },
    { label: "Skills Acquired", value: "24", icon: "🎯", colorClass: styles.iconBlue },
    { label: "Study Hours", value: "156h", icon: "🕒", colorClass: styles.iconGreen },
  ];

  const paths = [
    { name: "Front-End Developer", next: "Next: React Hooks", progress: 65, colorClass: styles.bgPink },
    { name: "UI/UX Designer", next: "Next: Figma Advanced", progress: 40, colorClass: styles.bgBlue },
    { name: "Full-Stack Developer", next: "Next: Node.js Basics", progress: 25, colorClass: styles.bgGreen },
  ];

  const recommendations = [
    { title: "Learn React.js", desc: "Based on your JavaScript skills", level: "Intermediate", time: "6 weeks" },
    { title: "TypeScript Fundamentals", desc: "Enhance your JavaScript knowledge", level: "Intermediate", time: "4 weeks" },
    { title: "Tailwind CSS", desc: "Modern CSS framework", level: "Beginner", time: "2 weeks" },
  ];

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            Welcome back, <span className={styles.highlight}>John!</span>
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
          <Card title="Your Learning Paths" description="Track your progress across different career paths">
            <div className={styles.pathsList}>
              {paths.map((path, i) => (
                <div key={i}>
                  <div className={styles.pathHeader}>
                    <div>
                      <h4 className={styles.pathName}>{path.name}</h4>
                      <p className={styles.pathNext}>{path.next}</p>
                    </div>
                    <span className={styles.pathPercent}>{path.progress}%</span>
                  </div>
                  <div className={styles.progressBarBg}>
                    <div
                      className={`${styles.progressBarFill} ${path.colorClass}`}
                      style={{ width: `${path.progress}%` }}
                    ></div>
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
          <Card title="AI Recommendations" description="Personalized for your skills">
            <div className={styles.recommendationsList}>
              {recommendations.map((rec, i) => (
                <div key={i} className={styles.recItem}>
                  <h4 className={styles.recTitle}>{rec.title}</h4>
                  <p className={styles.recDesc}>{rec.desc}</p>
                  <div className={styles.recMeta}>
                    <span className={styles.recLevel}>
                      {rec.level}
                    </span>
                    <span className={styles.recTime}>⏱ {rec.time}</span>
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