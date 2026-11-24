"use client";

import { CourseTopic, TopicNodeType } from "@/types";
import styles from "./course.module.css";

type Props = {
  topic: CourseTopic;
  status: string;
  hasQuiz: boolean;
  nodeType: TopicNodeType;
  onClose: () => void;
  onUpdateStatus: (status: "reading" | "completed") => void;
  onTakeQuiz: () => void;
};

const typeLabels: Record<TopicNodeType, string> = {
  module: "Section",
  topic: "Topic",
  quiz: "Quiz",
  material: "Material",
  coursework: "Coursework",
};

export default function TopicModal({
  topic,
  status,
  hasQuiz,
  nodeType,
  onClose,
  onUpdateStatus,
  onTakeQuiz,
}: Props) {
  const isCompleted = status === "completed";
  const isReading = status === "reading";
  const isQuizNode = nodeType === "quiz";

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>

        <div className={styles.modalHeader}>
          <div>
            <div className={styles.modalTypeBadge}>{typeLabels[nodeType] ?? "Topic"}</div>
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

          {topic.content && (
            <div className={styles.modalSection}>
              <h3 className={styles.sectionTitle}>
                {nodeType === "coursework" ? "Coursework Details" : "Additional Information"}
              </h3>
              <p className={styles.contentText}>{topic.content}</p>
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
              <h3 className={styles.sectionTitle}>
                {nodeType === "material" ? "Material" : "Recommended Resource"}
              </h3>
              <a href={topic.resource_url} target="_blank" rel="noopener noreferrer" className={styles.resourceLink}>
                📚 {topic.resource_name || "Open resource"}
              </a>
            </div>
          )}
        </div>

        <div className={styles.modalActions}>
          {isCompleted ? (
            <div className={styles.completedBanner}>
              ✅ {isQuizNode ? "Quiz Passed" : "Completed"}
            </div>
          ) : isQuizNode ? (
            hasQuiz ? (
              <div className={styles.quizActionWrap}>
                <button
                  className={styles.quizBtn}
                  onClick={onTakeQuiz}
                >
                  📝 Take Quiz
                </button>
                <p className={styles.quizHint}>
                  Pass the quiz to complete this section.
                </p>
              </div>
            ) : (
              <div className={styles.quizUnavailable}>
                This quiz has not been attached yet. Ask your professor.
              </div>
            )
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
