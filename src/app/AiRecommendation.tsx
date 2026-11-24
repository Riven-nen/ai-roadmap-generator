"use client";

import { useState } from "react";
import { Enrollment } from "@/types";
import { gradeToScore } from "@/lib/grading";

type CareerPath = {
  title: string;
  career_requirements: { domain: string; required_score: number }[];
};

export default function AiRecommendation({ 
  enrollments, 
  careerPaths 
}: { 
  enrollments: Enrollment[]; 
  careerPaths: CareerPath[];
}) {
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function getAiAdvice() {
    setLoading(true);

    // 1. Calculate the student's current domain scores
    const domainScores: Record<string, { total: number; count: number }> = {};
    enrollments.forEach(e => {
        const cat = e.course?.category;
        if (cat) {
            if (!domainScores[cat]) domainScores[cat] = { total: 0, count: 0 };
            const score = gradeToScore(e.grade);

            domainScores[cat].total += score;
            domainScores[cat].count += 1;
        }
    });

    const currentSkills: Record<string, number> = {};
    Object.keys(domainScores).forEach(k => {
        currentSkills[k] = Math.round(domainScores[k].total / domainScores[k].count);
    });

    // 2. Compare against the Career Matrix
    let bestCareer = "";
    let lowestGap = 999;
    let missingRequirement = "";

    careerPaths.forEach(career => {
        let totalGap = 0;
        let biggestMissing = "";

        career.career_requirements.forEach(req => {
            const studentScore = currentSkills[req.domain] || 0;
            const gap = Math.max(0, req.required_score - studentScore);
            totalGap += gap;
            
            if (gap > 0 && (biggestMissing === "" || gap > (req.required_score - (currentSkills[req.domain] || 0)))) {
                biggestMissing = `${req.domain} (Needs ${req.required_score}%, has ${studentScore}%)`;
            }
        });

        if (totalGap < lowestGap) {
            lowestGap = totalGap;
            bestCareer = career.title;
            missingRequirement = biggestMissing;
        }
    });

    // 3. Send to AI
    try {
        const res = await fetch("/api/recommendation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            skills: Object.keys(currentSkills).map(name => ({ name, progress: currentSkills[name] })),
            targetCareer: bestCareer,
            missingRequirement: missingRequirement,
            weakCourses: enrollments
              .filter(e => e.grade === "5.0" || e.grade === "INC" || e.grade === "3.0")
              .map(e => e.course?.title)
          }),
        });
        
        const data = await res.json();
        
        if (data.recommendation) {
            setRecommendation(data.recommendation);
        } else {
            throw new Error("No recommendation string found in data");
        }

    } catch (error) {
        console.error("FRONTEND ERROR:", error);
        setRecommendation("Failed to generate recommendation. Please try again.");
    } finally {        setLoading(false);
    }
  }

  return (
    <div style={{ textAlign: "center", padding: "20px 0", minHeight: "200px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
      
      {!recommendation && !loading && (
        <div>
            <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: 16 }}>
                Click below to run your Knowledge Map against the BSIT Career Matrix.
            </p>
            <button onClick={getAiAdvice} style={{ background: "#f97316", color: "white", padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer", width: "100%", fontWeight: 600 }}>
                Analyze My Career Path
            </button>
        </div>
      )}
      
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <div style={{ width: "32px", height: "32px", border: "3px solid #e2e8f0", borderTopColor: "#f97316", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
            <p style={{ color: "#64748b", fontSize: "0.85rem", animation: "pulse 1.5s ease-in-out infinite" }}>
                Analyzing Knowledge Map...
            </p>
            <style>{`
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
            `}</style>
        </div>
      )}
      
      {recommendation && !loading && (
        <div style={{ background: "#ffffff", padding: 16, borderRadius: 12, border: "1px solid #e2e8f0", textAlign: "left", fontSize: "0.9rem", lineHeight: 1.6 }}>
          <p>{recommendation}</p>
          <button onClick={() => setRecommendation(null)} style={{ marginTop: 12, background: "transparent", color: "#ea580c", border: "none", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 }}>
            Ask Again
          </button>
        </div>
      )}

    </div>
  );
}