"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Course, Enrollment } from "@/types";
import GridTree from "./GridTree";

export default function RoadmapPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: courseData } = await supabase
        .from("courses")
        .select("*")
        .neq("category", "General Education")
        .order("year_level", { ascending: true });

      const { data: enrollData } = await supabase
        .from("enrollments")
        .select("*")
        .eq("user_id", user.id);

      setCourses(courseData || []);
      setEnrollments(enrollData || []);
      setLoading(false);
    }
    fetchData();
  }, []);

  const handleCourseClick = (course: Course) => {
    router.push(`/roadmap/course/${course.id}`);
  };

  if (loading) return <div style={{ color: "white", padding: 40 }}>Loading Roadmap...</div>;

  return (
    <div style={{ width: "100%", height: "100vh", display: "flex", flexDirection: "column", background: "#0f111a" }}>
      <div style={{ textAlign: 'center', padding: "40px 20px 0", background: "#0f111a", zIndex: 10 }}>
        <h1 style={{ fontSize: "1.875rem", fontWeight: 700, color: "white" }}>
          BSIT <span style={{ color: "#c084fc" }}>Roadmap</span>
        </h1>
        <p style={{ color: "#94a3b8", marginTop: 4 }}>Click and drag to pan. Courses you aren't enrolled in are locked.</p>
      </div>

      <GridTree 
        courses={courses} 
        enrollments={enrollments} 
      onCourseClick={handleCourseClick}
      />
    </div>
  );
}