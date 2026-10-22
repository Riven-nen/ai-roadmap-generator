"use client";

import { CourseTopic } from "@/types";
import styles from "./course.module.css";

type Props = {
  topic: CourseTopic;
  status: string;
  hasQuiz: boolean;
  onClose: () => void;
  onUpdateStatus: (status: "reading" | "completed") => void;
  onTakeQuiz: () => void;
};

export default function TopicModal({ topic, status, hasQuiz, onClose, onUpdateStatus, onTakeQuiz }: Props) {
  const isCompleted = status === "completed";

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        
        <div className={styles.modalHeader}>
          <div>
            <h2 className={styles.modalTitle}>{topic.title}</h2>
            {topic.estimated_time && (
              <span className={styles.timeBadge}>⏱ {topic.estimated_time}</span>
            )}
          </div>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>
        
        <div className={styles.modalBody}>
          <p className={styles.modalDesc}>{topic.description}</p>

          {topic.overview && (
            <div className={styles.modalSection}>
              <h3 className={styles.sectionTitle}>Overview</h3>
              <p className={styles.sectionText}>{topic.overview}</p>
            </div>
          )}

          {topic.learning_objectives && topic.learning_objectives.length > 0 && (
            <div className={styles.modalSection}>
              <h3 className={styles.sectionTitle}>Learning Objectives</h3>
              <ul className={styles.objectivesList}>
                {topic.learning_objectives.map((obj, i) => (
                  <li key={i}>{obj}</li>
                ))}
              </ul>
            </div>
          )}

          {topic.resource_url && (
            <div className={styles.modalSection}>
              <h3 className={styles.sectionTitle}>Recommended Resource</h3>
              <a href={topic.resource_url} target="_blank" rel="noopener noreferrer" className={styles.resourceLink}>
                📚 {topic.resource_name}
              </a>
            </div>
          )}
        </div>

        <div className={styles.modalActions}>
          {isCompleted ? (
            <div style={{ width: "100%", textAlign: "center", color: "#22c55e", fontWeight: "bold", padding: "14px", background: "rgba(34, 197, 94, 0.1)", borderRadius: "8px" }}>
              ✅ Topic Completed
            </div>
          ) : hasQuiz ? (
             <button 
               className={styles.quizBtn} 
               onClick={onTakeQuiz}
             >
               📝 Take Topic Quiz
             </button>
          ) : (
            <>
              <button 
                className={`${styles.statusBtn} ${status === "reading" ? styles.activeReading : ""}`}
                onClick={() => onUpdateStatus("reading")}
              >
                🕒 Mark as In Progress
              </button>
              <button 
                className={`${styles.statusBtn} ${status === "completed" ? styles.activeCompleted : ""}`}
                onClick={() => onUpdateStatus("completed")}
              >
                ✅ Mark as Completed
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}