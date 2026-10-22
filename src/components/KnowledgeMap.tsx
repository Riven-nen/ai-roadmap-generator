"use client";

import { useEffect, useState } from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { Enrollment } from "@/types";

export default function KnowledgeMap({ enrollments }: { enrollments: Enrollment[] }) {
  const [data, setData] = useState<{ subject: string; A: number; fullMark: number }[]>([]);

  useEffect(() => {
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
        let score = 0;
        const grade = e.grade;

        // Adjusted for PH Grading System (1.0 is highest, 5.0 is failed)
        if (grade === "1.0") score = 98;
        else if (grade === "1.25") score = 94;
        else if (grade === "1.5") score = 90;
        else if (grade === "1.75") score = 86;
        else if (grade === "2.0") score = 82;
        else if (grade === "2.25") score = 78;
        else if (grade === "2.5") score = 74;
        else if (grade === "2.75") score = 70;
        else if (grade === "3.0") score = 60;
        else if (grade === "5.0" || grade === "INC") score = 10; // Failed

        domainMap[category].total += score;
        domainMap[category].count += 1;
      }
    });

    const chartData = Object.keys(domainMap).map((key) => ({
      subject: key,
      A: domainMap[key].count > 0 ? Math.round(domainMap[key].total / domainMap[key].count) : 0,
      fullMark: 100,
    }));

    setData(chartData);
  }, [enrollments]);

  return (
    <div style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="#2a2f45" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: "#94a3b8", fontSize: 10 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar name="Student" dataKey="A" stroke="#a855f7" fill="#a855f7" fillOpacity={0.5} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}