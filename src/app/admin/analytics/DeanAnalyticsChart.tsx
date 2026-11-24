"use client";

import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Enrollment } from "@/types";
import { gradeToScore } from "@/lib/grading";

type ChartDatum = { subject: string; A: number };

type TooltipProps = {
  active?: boolean;
  payload?: Array<{ payload: ChartDatum; value: number }>;
};

// Declared outside the page so it isn't recreated on every render.
function CustomTooltip({ active, payload }: TooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: "#131620", padding: "10px", border: "1px solid #2a2f45", borderRadius: "8px" }}>
        <p style={{ color: "#fff", margin: 0, fontSize: "0.85rem" }}>{payload[0].payload.subject}</p>
        <p style={{ color: "#c084fc", margin: 0, fontWeight: "bold" }}>{payload[0].value}% Avg</p>
      </div>
    );
  }
  return null;
}

export default function DeanAnalyticsChart({ enrollments }: { enrollments: Enrollment[] }) {
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
        domainMap[category].total += gradeToScore(e.grade);
        domainMap[category].count += 1;
      }
    });

    const chartData = Object.keys(domainMap).map((key) => ({
      subject: key,
      A: domainMap[key].count > 0 ? Math.round(domainMap[key].total / domainMap[key].count) : 0,
    }));

    // Sort from lowest to highest so the Dean sees the worst domains first
    return chartData.sort((a, b) => a.A - b.A);
  }, [enrollments]);

  return (
    <div style={{ width: "100%", height: 400, marginTop: 20 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2f45" horizontal={false} />
          <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" />
          <YAxis type="category" dataKey="subject" stroke="#94a3b8" width={150} tick={{ fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#2a2f45' }} />
          <Bar dataKey="A" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                // If score is below 60, color it red (danger zone), otherwise purple
                fill={entry.A < 60 ? "#ef4444" : "#a855f7"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
