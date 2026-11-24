"use client";

import { useMemo } from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { Enrollment } from "@/types";
import { gradeToScore } from "@/lib/grading";

export default function KnowledgeMap({ enrollments }: { enrollments: Enrollment[] }) {
  const data = useMemo(() => {
    const domainMap: Record<string, { total: number; count: number }> = {
      "Programming": { total: 0, count: 0 },
      "Database Management": { total: 0, count: 0 },
      "Networking": { total: 0, count: 0 },
      "Cybersecurity": { total: 0, count: 0 },
      "Web Development": { total: 0, count: 0 },
      "Systems Analysis and Design": { total: 0, count: 0 },
      "Cloud Computing": { total: 0, count: 0 },
    };

    enrollments.forEach((e) => {
      const category = e.course?.category;

      if (category && domainMap[category]) {
        // PH grading: 1.0 is highest, 5.0 / INC is failed.
        domainMap[category].total += gradeToScore(e.grade);
        domainMap[category].count += 1;
      }
    });

    return Object.keys(domainMap).map((key) => ({
      subject: key,
      A: domainMap[key].count > 0 ? Math.round(domainMap[key].total / domainMap[key].count) : 0,
      fullMark: 100,
    }));
  }, [enrollments]);

  return (
    <div style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: "#64748b", fontSize: 10 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar name="Student" dataKey="A" stroke="#f97316" fill="#f97316" fillOpacity={0.35} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
