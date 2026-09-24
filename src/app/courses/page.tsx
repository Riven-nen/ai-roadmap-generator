import Card from "@/components/Card";
import { createClient } from "@/lib/supabase/server";
import styles from "./courses.module.css";

export default async function Courses() {
  const supabase = await createClient();

  const { data: courses } = await supabase
    .from("courses")
    .select("*")
    .order("rating", { ascending: false });

  const allCourses = courses ?? [];

  const trending = allCourses.filter((c) => c.is_trending);

  const levelClassMap: Record<string, string> = {
    Beginner: styles.levelBeginner,
    Intermediate: styles.levelIntermediate,
    Advanced: styles.levelIntermediate,
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            Course <span className={styles.highlight}>Library</span>
          </h1>
          <p className={styles.subtitle}>
            Explore our collection of courses and start learning
          </p>
        </div>
        <div className={styles.headerBadges}>
          <span className={styles.badgePurple}>{allCourses.length} Courses</span>
          <span className={styles.badgeBlue}>8 Categories</span>
        </div>
      </div>

      <Card className={styles.filterBar}>
        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Search courses..."
            className={styles.searchInput}
          />
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
          {trending.map((course) => (
            <Card key={course.id} className={styles.courseCard}>
              <div className={styles.cardTop}>
                <span className={styles.trendingBadge}>🔥 Trending</span>
                <span className={styles.rating}>⭐ {course.rating}</span>
              </div>
              <h3 className={styles.courseTitle}>{course.title}</h3>
              <p className={styles.courseDesc}>{course.description}</p>

              <div className={styles.metaRow}>
                <span
                  className={`${styles.levelBadge} ${
                    levelClassMap[course.level] ?? styles.levelBeginner
                  }`}
                >
                  {course.level}
                </span>
                <span className={styles.metaText}>
                  🕒 {course.duration_weeks} weeks
                </span>
                <span className={styles.metaText}>👥 {course.student_count}</span>
              </div>

              <div className={styles.tagsContainer}>
                {course.tags?.map((tag: string, j: number) => (
                  <span key={j} className={styles.tag}>
                    {tag}
                  </span>
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