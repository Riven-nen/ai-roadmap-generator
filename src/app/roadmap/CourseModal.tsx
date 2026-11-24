"use client";

import { Course, CourseTopic } from "@/types";

export default function CourseModal({ 
  course, 
  topics, 
  onClose 
}: { 
  course: Course; 
  topics: CourseTopic[]; 
  onClose: () => void;
}) {
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(11, 37, 69,0.45)", backdropFilter: "blur(4px)",
      display: "flex", justifyContent: "center", alignItems: "center",
      zIndex: 1000, padding: "20px"
    }}>
      <div style={{
        background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px",
        width: "100%", maxWidth: "600px", maxHeight: "80vh", overflowY: "auto",
        padding: "32px", position: "relative"
      }}>
        {/* Close Button */}
        <button onClick={onClose} style={{
          position: "absolute", top: "16px", right: "16px",
          background: "transparent", border: "none", color: "#64748b",
          fontSize: "1.5rem", cursor: "pointer"
        }}>×</button>

        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <p style={{ color: "#ea580c", fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase" }}>
            {course.code}
          </p>
          <h2 style={{ color: "var(--text-main)", fontSize: "1.5rem", margin: "4px 0 8px" }}>
            {course.title}
          </h2>
          <p style={{ color: "#64748b", fontSize: "0.9rem" }}>{course.description}</p>
        </div>

        {/* Inner Tree (Topics) */}
        <h3 style={{ color: "var(--text-main)", marginBottom: "16px", fontSize: "1.1rem" }}>Syllabus & Resources</h3>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {topics.length === 0 ? (
            <p style={{ color: "#64748b", fontStyle: "italic" }}>No topics added for this course yet.</p>
          ) : (
            topics.map((topic, index) => (
              <div key={topic.id} style={{ display: "flex", gap: "16px" }}>
                {/* Timeline line */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{
                    width: "24px", height: "24px", borderRadius: "50%",
                    background: "#f97316", color: "white", display: "flex",
                    alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: "bold"
                  }}>
                    {index + 1}
                  </div>
                  {index < topics.length - 1 && (
                    <div style={{ width: "2px", flex: 1, background: "#e2e8f0", margin: "4px 0" }} />
                  )}
                </div>

                {/* Topic Content */}
                <div style={{ background: "#f1f5f9", padding: "16px", borderRadius: "8px", flex: 1, border: "1px solid #e2e8f0" }}>
                  <h4 style={{ color: "var(--text-main)", fontSize: "0.95rem", marginBottom: "4px" }}>{topic.title}</h4>
                  <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "12px" }}>{topic.description}</p>
                  
                  {topic.resource_url && (
                    <a href={topic.resource_url} target="_blank" rel="noopener noreferrer" style={{
                      display: "inline-flex", alignItems: "center", gap: "6px",
                      background: "rgba(30, 58, 138, 0.1)", color: "#1e3a8a",
                      padding: "6px 12px", borderRadius: "6px", fontSize: "0.8rem",
                      textDecoration: "none", fontWeight: 600
                    }}>
                      📚 {topic.resource_name || "View Resource"}
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}