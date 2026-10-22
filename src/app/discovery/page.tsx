"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Card from "@/components/Card";
import styles from "./discovery.module.css";

type CareerPath = {
  id: string;
  title: string;
  description: string;
  career_requirements: { domain: string; required_score: number }[];
};

export default function Discovery() {
  const [careers, setCareers] = useState<CareerPath[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCareers() {
      console.log("--- FETCH STARTED ---");
      const supabase = createClient();
      
      const { data: paths, error: pathError } = await supabase.from("career_paths").select("*");
      
      console.log("PATH DATA:", paths);
      console.log("PATH ERROR:", pathError);

      if (pathError || !paths) {
        setLoading(false);
        return;
      }

      const { data: reqs, error: reqError } = await supabase.from("career_requirements").select("*");
      
      console.log("REQ DATA:", reqs);
      console.log("REQ ERROR:", reqError);

      const combined = paths.map(path => ({
        ...path,
        career_requirements: (reqs || []).filter(r => r.career_id === path.id)
      }));

      console.log("COMBINED DATA:", combined);
      console.log("--- FETCH ENDED ---");

      setCareers(combined);
      setLoading(false);
    }
    fetchCareers();
  }, []);

  if (loading) return <div style={{ color: "white", padding: 40 }}>Loading Matrix...</div>;

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
        <div style={{ color: "#94a3b8", textAlign: "center", padding: 40 }}>
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
                {career.career_requirements.map((req, i) => (
                  <div key={i} className={styles.reqItem}>
                    <div className={styles.reqLabelRow}>
                      <span className={styles.domainName}>{req.domain}</span>
                      <span className={styles.reqScore}>{req.required_score}%</span>
                    </div>
                    <div className={styles.progressBarBg}>
                      <div 
                        className={styles.progressBarFill}
                        style={{ width: `${req.required_score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}