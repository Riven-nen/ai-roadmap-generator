import Card from "@/components/Card";
import styles from "./roadmap.module.css";

export default function Roadmap() {
  const semesters = ["Semester 1", "Semester 2", "Semester 3"];
  
  const courses = [
    {
      title: "Introduction to Programming",
      code: "CS 101",
      credits: 3,
      grade: "A",
      tags: ["Python", "Problem Solving", "Algorithms"],
      icon: "<>",
      iconBg: styles.iconGreen,
      completed: true,
    },
    {
      title: "Web Development Basics",
      code: "WEB 101",
      credits: 3,
      grade: "A-",
      tags: ["HTML", "CSS", "JavaScript"],
      icon: "🎨",
      iconBg: styles.iconPink,
      completed: true,
    },
    {
      title: "Database Fundamentals",
      code: "DB 101",
      credits: 3,
      grade: "B+",
      tags: ["SQL", "Database Design", "MySQL"],
      icon: "🗄️",
      iconBg: styles.iconBlue,
      completed: true,
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            Your Learning <span className={styles.highlight}>Roadmap</span>
          </h1>
          <p className={styles.subtitle}>Track your academic progress semester by semester</p>
        </div>
        <div className={styles.statsRow}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>54</span>
            <span className={styles.statLabel}>Total Credits</span>
          </div>
          <div className={styles.statItem}>
            <span className={`${styles.statValue} ${styles.textPurple}`}>18</span>
            <span className={styles.statLabel}>Completed</span>
          </div>
          <div className={styles.statItem}>
            <span className={`${styles.statValue} ${styles.textBlue}`}>3.67</span>
            <span className={styles.statLabel}>GPA</span>
          </div>
        </div>
      </div>

      <div className={styles.tabs}>
        {semesters.map((sem, i) => (
          <button key={i} className={`${styles.tab} ${i === 0 ? styles.activeTab : ""}`}>
            {sem}
          </button>
        ))}
      </div>

      <div className={styles.semesterBanner}>
        <div>
          <h3 className={styles.semesterTitle}>Semester 1</h3>
          <p className={styles.semesterCredits}>18 Credits</p>
        </div>
        <div className={styles.bannerIcon}>🏆</div>
      </div>

      <div className={styles.coursesGrid}>
        {courses.map((course, i) => (
          <Card key={i} className={styles.courseCard}>
            <div className={styles.courseHeader}>
              <div className={`${styles.courseIcon} ${course.iconBg}`}>{course.icon}</div>
              {course.completed && <div className={styles.checkIcon}>✓</div>}
            </div>
            <h4 className={styles.courseTitle}>{course.title}</h4>
            <p className={styles.courseCode}>{course.code}</p>
            
            <div className={styles.courseMeta}>
              <span>{course.credits} Credits</span>
              <span className={styles.completedBadge}>Completed</span>
            </div>
            
            <div className={styles.gradeRow}>
              <span className={styles.gradeLabel}>Grade:</span>
              <span className={styles.gradeValue}>{course.grade}</span>
            </div>

            <div className={styles.tagsContainer}>
              {course.tags.map((tag, j) => (
                <span key={j} className={styles.tag}>{tag}</span>
              ))}
            </div>
          </Card>
        ))}
      </div>
      
      <p className={styles.footerText}>Complete to unlock next semester</p>
    </div>
  );
}