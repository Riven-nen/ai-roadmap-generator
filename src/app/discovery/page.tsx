"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { gradeToScore } from "@/lib/grading";
import Card from "@/components/Card";
import styles from "./discovery.module.css";

type CareerPath = {
  id: string;
  title: string;
  description: string;
  career_requirements: { domain: string; required_score: number }[];
};

type EnrollmentRow = {
  grade: string | null;
  course: { category: string | null } | { category: string | null }[] | null;
};

export default function Discovery() {
  const [careers, setCareers] = useState<CareerPath[]>([]);
  const [skills, setSkills] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCareers() {
      const supabase = createClient();

      const [pathsRes, reqsRes] = await Promise.all([
        supabase.from("career_paths").select("*"),
        supabase.from("career_requirements").select("*"),
      ]);

      if (pathsRes.error || !pathsRes.data) {
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: enrollmentData } = await supabase
          .from("enrollments")
          .select("grade, course:courses(category)")
          .eq("user_id", user.id);

        const domainScores: Record<string, { total: number; count: number }> = {};

        ((enrollmentData || []) as unknown as EnrollmentRow[]).forEach((enrollment) => {
          const course = Array.isArray(enrollment.course)
            ? enrollment.course[0]
            : enrollment.course;
          const category = course?.category;
          if (!category) return;

          if (!domainScores[category]) domainScores[category] = { total: 0, count: 0 };
          domainScores[category].total += gradeToScore(enrollment.grade);
          domainScores[category].count += 1;
        });

        const currentSkills: Record<string, number> = {};
        for (const [domain, scores] of Object.entries(domainScores)) {
          currentSkills[domain] = scores.count > 0 ? Math.round(scores.total / scores.count) : 0;
        }
        setSkills(currentSkills);
      }

      const combined = pathsRes.data.map(path => ({
        ...path,
        career_requirements: (reqsRes.data || []).filter(r => r.career_id === path.id)
      }));

      setCareers(combined);
      setLoading(false);
    }
    fetchCareers();
  }, []);

  if (loading) return <div style={{ color: "#0b1f3a", padding: 40 }}>Loading Matrix...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          Explore <span className={styles.highlight}>Career Paths</span>
        </h1>
        <p className={styles.subtitle}>
          See exactly what domains you need to master for your target career.
        </p>
      </div>

      {careers.length === 0 ? (
        <div style={{ color: "#64748b", textAlign: "center", padding: 40 }}>
          No career paths found in the database.
        </div>
      ) : (
        <div className={styles.careerGrid}>
          {careers.map((career) => (
            <Card key={career.id} className={styles.careerCard}>
              <div className={styles.cardHeader}>
                <h2 className={styles.careerTitle}>{career.title}</h2>
                <span className={styles.targetBadge}>Target Matrix</span>
              </div>
              <p className={styles.careerDesc}>{career.description}</p>

              <div className={styles.requirementsList}>
                <h3 className={styles.reqTitle}>Required Domain Mastery:</h3>
                <p className={styles.reqHint}>
                  The bar is your current score; the marker is the target.
                </p>
                {career.career_requirements.map((req, i) => {
                  const currentScore = skills[req.domain] ?? 0;
                  const met = currentScore >= req.required_score;

                  return (
                    <div key={i} className={styles.reqItem}>
                      <div className={styles.reqLabelRow}>
                        <span className={styles.domainName}>{req.domain}</span>
                        <span className={met ? styles.reqScoreMet : styles.reqScoreGap}>
                          {currentScore}% / {req.required_score}%
                        </span>
                      </div>
                      <div className={styles.progressBarBg}>
                        <div
                          className={styles.progressBarFill}
                          style={{
                            width: `${Math.min(currentScore, 100)}%`,
                            background: met
                              ? "linear-gradient(to right, #16a34a, #15803d)"
                              : "linear-gradient(to right, #f97316, #1e3a8a)",
                          }}
                        />
                        <div
                          className={styles.targetMarker}
                          style={{ left: `${Math.min(req.required_score, 100)}%` }}
                          title={`Target: ${req.required_score}%`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
