"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Course, Enrollment } from "@/types";
import { getRoadmapStats } from "@/lib/courseStatus";
import GridTree from "./GridTree";
import styles from "./roadmap.module.css";

export default function RoadmapPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadRoadmap() {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          if (!cancelled) {
            setError("Your session expired. Please sign in again to view your roadmap.");
          }
          return;
        }

        const [coursesResult, enrollmentsResult] = await Promise.all([
          supabase
            .from("courses")
            .select("*")
            .neq("category", "General Education")
            .order("year_level", { ascending: true }),
          supabase
            .from("enrollments")
            .select("*")
            .eq("user_id", user.id),
        ]);

        if (coursesResult.error) throw coursesResult.error;
        if (enrollmentsResult.error) throw enrollmentsResult.error;

        if (!cancelled) {
          setCourses(coursesResult.data || []);
          setEnrollments(enrollmentsResult.data || []);
        }
      } catch (loadError) {
        console.error("Failed to load roadmap:", loadError);
        if (!cancelled) {
          setError("We couldn't load your roadmap. Check your connection and try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadRoadmap();

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const stats = useMemo(
    () => getRoadmapStats(courses, enrollments),
    [courses, enrollments]
  );

  const handleCourseClick = (course: Course) => {
    router.push(`/roadmap/course/${course.id}`);
  };

  if (loading) {
    return (
      <div className={styles.stateScreen}>
        <div className={styles.spinner} />
        <p>Loading Roadmap...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.stateScreen}>
        <div className={styles.stateIcon}>⚠️</div>
        <h1 className={styles.stateTitle}>Roadmap unavailable</h1>
        <p className={styles.stateText}>{error}</p>
        <button className={styles.retryBtn} onClick={() => setReloadKey((key) => key + 1)}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <div>
            <h1 className={styles.title}>
              BSIT <span className={styles.highlight}>Roadmap</span>
            </h1>
            <p className={styles.subtitle}>
              Complete a course to unlock the courses that depend on it.
            </p>
          </div>

          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={`${styles.statValue} ${styles.statCompleted}`}>{stats.completed}</span>
              <span className={styles.statLabel}>Completed</span>
            </div>
            <div className={styles.stat}>
              <span className={`${styles.statValue} ${styles.statProgress}`}>{stats.in_progress}</span>
              <span className={styles.statLabel}>In Progress</span>
            </div>
            <div className={styles.stat}>
              <span className={`${styles.statValue} ${styles.statAvailable}`}>{stats.available}</span>
              <span className={styles.statLabel}>Available</span>
            </div>
            <div className={styles.stat}>
              <span className={`${styles.statValue} ${styles.statLocked}`}>{stats.locked}</span>
              <span className={styles.statLabel}>Locked</span>
            </div>
          </div>
        </div>

        <div className={styles.legend}>
          <span className={styles.legendItem}>
            <i className={`${styles.dot} ${styles.dotCompleted}`} /> Completed
          </span>
          <span className={styles.legendItem}>
            <i className={`${styles.dot} ${styles.dotProgress}`} /> In Progress
          </span>
          <span className={styles.legendItem}>
            <i className={`${styles.dot} ${styles.dotAvailable}`} /> Available
          </span>
          <span className={styles.legendItem}>
            <i className={`${styles.dot} ${styles.dotFailed}`} /> Failed / Retake
          </span>
          <span className={styles.legendItem}>
            <i className={`${styles.dot} ${styles.dotLocked}`} /> Locked
          </span>
        </div>
      </header>

      {courses.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.stateIcon}>🗺️</div>
          <h2 className={styles.stateTitle}>No courses found</h2>
          <p className={styles.stateText}>
            The curriculum catalog is empty. Ask an administrator to add courses.
          </p>
        </div>
      ) : (
        <div className={styles.canvas}>
          <GridTree
            courses={courses}
            enrollments={enrollments}
            onCourseClick={handleCourseClick}
          />
        </div>
      )}
    </div>
  );
}
