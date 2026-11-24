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
  const isReading = status === "reading";

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>

        <div className={styles.modalHeader}>
          <div>
            <h2 className={styles.modalTitle}>{topic.title}</h2>
            <div className={styles.modalBadges}>
              <span
                className={`${styles.modalStatus} ${
                  isCompleted ? styles.modalStatusCompleted : isReading ? styles.modalStatusReading : ""
                }`}
              >
                {isCompleted ? "Completed" : isReading ? "In Progress" : "Not Started"}
              </span>
              {topic.estimated_time && (
                <span className={styles.timeBadge}>⏱ {topic.estimated_time}</span>
              )}
            </div>
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
            <div className={styles.completedBanner}>
              ✅ Topic Completed
            </div>
          ) : hasQuiz ? (
            <div className={styles.quizActionWrap}>
              <button
                className={styles.quizBtn}
                onClick={onTakeQuiz}
              >
                📝 Take Topic Quiz
              </button>
              <p className={styles.quizHint}>
                Pass the quiz to mark this topic as completed.
              </p>
            </div>
          ) : (
            <>
              <button
                className={`${styles.statusBtn} ${isReading ? styles.activeReading : ""}`}
                onClick={() => onUpdateStatus("reading")}
              >
                🕒 Mark as In Progress
              </button>
              <button
                className={`${styles.statusBtn} ${isCompleted ? styles.activeCompleted : ""}`}
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
