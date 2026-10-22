"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Course } from "@/types";
import styles from "./courses.module.css";

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchCourses() {
      const supabase = createClient();
      const { data } = await supabase
        .from("courses")
        .select("*")
        .neq("category", "General Education")
        .order("code");
      
      setCourses(data || []);
      setLoading(false);
    }
    fetchCourses();
  }, []);

  const filteredCourses = courses.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div style={{ color: "white", padding: 40 }}>Loading Library...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            Course <span className={styles.highlight}>Library</span>
          </h1>
          <p className={styles.subtitle}>Explore your IT curriculum and dive into the syllabus.</p>
        </div>
        <div className={styles.headerBadges}>
          <span className={styles.badgePurple}>{courses.length} Courses</span>
        </div>
      </div>

      <div className={styles.filterBar}>
        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Search courses by code or title..."
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.coursesGrid}>
        {filteredCourses.map((course) => (
          <div key={course.id} className={styles.courseCard}>
            <div className={styles.cardTop}>
              <span className={styles.courseCode}>{course.code}</span>
              <span className={styles.rating}>⭐ {course.rating || "N/A"}</span>
            </div>
            
            <h3 className={styles.courseTitle}>{course.title}</h3>
            <p className={styles.courseDesc}>{course.description}</p>
            
            <div className={styles.metaRow}>
              <span className={styles.metaText}>🕒 {course.duration_weeks} weeks</span>
              <span className={styles.metaText}>📚 {course.category}</span>
            </div>

            <Link href={`/roadmap/course/${course.id}`} className={styles.actionBtn}>
              View Syllabus & AI Tutor
            </Link>
          </div>
        ))}

        {filteredCourses.length === 0 && (
          <div style={{ color: "#94a3b8", gridColumn: "1 / -1", textAlign: "center", padding: 40 }}>
            No courses found matching your search.
          </div>
        )}
      </div>
    </div>
  );
}