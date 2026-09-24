/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState } from "react";
import Link from "next/link";
import Card from "@/components/Card";
import { createClient } from "@/lib/supabase/client";
import styles from "./discovery.module.css";

type Course = {
  id: string;
  title: string;
  description: string;
  level: string;
  duration_weeks: number;
  rating: number;
  tags: string[];
  icon: string;
  icon_bg: string;
};

export default function Discovery() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const quickSearches = [
    "HTML", "Python", "Java", "JavaScript", "Database",
    "Networking", "UI Design", "React",
  ];

  async function handleSearch(term: string) {
    const searchTerm = term.trim();
    if (!searchTerm) return;

    setQuery(searchTerm);
    setLoading(true);
    setSearched(true);

    const supabase = createClient();

    const { data } = await supabase
      .from("courses")
      .select("*")
      .or(
        `title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,tags.cs.{${searchTerm}}`
      );

    setResults(data ?? []);
    setLoading(false);
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          Discover Your <span className={styles.highlight}>Perfect Career</span>
        </h1>
        <p className={styles.subtitle}>
          Enter a skill, subject, or programming language you know, and we'll
          show you the perfect career paths
        </p>
      </div>

      <Card className={styles.searchCard}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch(query);
          }}
          className={styles.searchBox}
        >
          <span className={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="e.g., HTML, Python, JavaScript, Database, UI Design..."
            className={styles.searchInput}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" className={styles.discoverBtn} disabled={loading}>
            {loading ? "Searching..." : "✨ Discover"}
          </button>
        </form>

        <div className={styles.quickSearchContainer}>
          <p className={styles.quickSearchLabel}>Quick search:</p>
          <div className={styles.quickSearchTags}>
            {quickSearches.map((tag) => (
              <button
                key={tag}
                type="button"
                className={styles.quickTag}
                onClick={() => handleSearch(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {searched && (
        <div className={styles.resultsSection}>
          <h2 className={styles.resultsTitle}>
            {loading
              ? "Searching..."
              : `${results.length} course${results.length === 1 ? "" : "s"} found for "${query}"`}
          </h2>

          {!loading && results.length === 0 && (
            <Card className={styles.emptyCard}>
              <p className={styles.emptyText}>
                No courses matched your search. Try another skill like "React" or "Python".
              </p>
            </Card>
          )}

          {!loading && results.length > 0 && (
            <div className={styles.resultsGrid}>
              {results.map((course) => (
                <Link key={course.id} href="/courses" className={styles.resultLink}>
                  <Card className={styles.resultCard}>
                    <div
                      className={styles.resultIcon}
                      style={{
                        backgroundColor: `${course.icon_bg}33`,
                        color: course.icon_bg,
                      }}
                    >
                      {course.icon}
                    </div>
                    <h3 className={styles.resultTitle}>{course.title}</h3>
                    <p className={styles.resultDesc}>{course.description}</p>
                    <div className={styles.resultMeta}>
                      <span className={styles.resultLevel}>{course.level}</span>
                      <span className={styles.resultMetaText}>
                        🕒 {course.duration_weeks} weeks
                      </span>
                      <span className={styles.resultMetaText}>⭐ {course.rating}</span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {!searched && (
        <div className={styles.featuresGrid}>
          <Card className={styles.featureCard}>
            <div className={`${styles.featureIcon} ${styles.iconPurple}`}>◎</div>
            <h3 className={styles.featureTitle}>AI-Powered Recommendations</h3>
            <p className={styles.featureDesc}>
              Get personalized career suggestions based on your current skills
            </p>
          </Card>
          <Card className={styles.featureCard}>
            <div className={`${styles.featureIcon} ${styles.iconBlue}`}>💡</div>
            <h3 className={styles.featureTitle}>Next Steps Guide</h3>
            <p className={styles.featureDesc}>
              Discover what skills to learn next to advance your career
            </p>
          </Card>
          <Card className={styles.featureCard}>
            <div className={`${styles.featureIcon} ${styles.iconGreen}`}>📈</div>
            <h3 className={styles.featureTitle}>Market Insights</h3>
            <p className={styles.featureDesc}>
              See salary ranges and job demand for different tech roles
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}