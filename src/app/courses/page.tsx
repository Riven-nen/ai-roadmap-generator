import Card from "@/components/Card";
import styles from "./courses.module.css";

export default function Courses() {
  const courses = [
    {
      title: "React Fundamentals",
      desc: "Master the basics of React including components, props, state, and hooks.",
      rating: 4.8,
      level: "Beginner",
      duration: "8 weeks",
      students: "12.4K",
      tags: ["React", "JavaScript", "HTML"],
      levelColor: styles.levelBeginner,
    },
    {
      title: "Python for Data Science",
      desc: "Learn data analysis and visualization with Python, Pandas, and NumPy.",
      rating: 4.7,
      level: "Intermediate",
      duration: "10 weeks",
      students: "8.9K",
      tags: ["Python", "Pandas", "NumPy"],
      levelColor: styles.levelIntermediate,
    },
    {
      title: "Node.js Backend Development",
      desc: "Build scalable backend applications with Node.js, Express, and MongoDB.",
      rating: 4.6,
      level: "Intermediate",
      duration: "12 weeks",
      students: "7.6K",
      tags: ["Node.js", "Express", "MongoDB"],
      levelColor: styles.levelIntermediate,
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            Course <span className={styles.highlight}>Library</span>
          </h1>
          <p className={styles.subtitle}>Explore our collection of courses and start learning</p>
        </div>
        <div className={styles.headerBadges}>
          <span className={styles.badgePurple}>12 Courses</span>
          <span className={styles.badgeBlue}>8 Categories</span>
        </div>
      </div>

      <Card className={styles.filterBar}>
        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon}>🔍</span>
          <input type="text" placeholder="Search courses..." className={styles.searchInput} />
        </div>
        <select className={styles.select}>
          <option>All</option>
        </select>
        <select className={styles.select}>
          <option>All Levels</option>
        </select>
      </Card>

      <div>
        <h2 className={styles.sectionTitle}>📈 Trending Courses</h2>
        <div className={styles.coursesGrid}>
          {courses.map((course, i) => (
            <Card key={i} className={styles.courseCard}>
              <div className={styles.cardTop}>
                <span className={styles.trendingBadge}>🔥 Trending</span>
                <span className={styles.rating}>⭐ {course.rating}</span>
              </div>
              <h3 className={styles.courseTitle}>{course.title}</h3>
              <p className={styles.courseDesc}>{course.desc}</p>
              
              <div className={styles.metaRow}>
                <span className={`${styles.levelBadge} ${course.levelColor}`}>
                  {course.level}
                </span>
                <span className={styles.metaText}>🕒 {course.duration}</span>
                <span className={styles.metaText}>👥 {course.students}</span>
              </div>

              <div className={styles.tagsContainer}>
                {course.tags.map((tag, j) => (
                  <span key={j} className={styles.tag}>{tag}</span>
                ))}
              </div>

              <button className={styles.enrollBtn}>Enroll Now</button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}