"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { CourseTopic, TopicNodeType } from "@/types";
import styles from "./course.module.css";

type TopicNodeData = {
  topic: CourseTopic;
  status: "unread" | "reading" | "completed";
  isLocked: boolean;
  lockReason?: string;
  isModule?: boolean;
  nodeType?: TopicNodeType;
  hasQuiz?: boolean;
  topicCount?: number;
  completedTopicCount?: number;
  onClick: (topic: CourseTopic) => void;
};

const typeMeta: Record<TopicNodeType, { label: string; className: string }> = {
  module: { label: "Section", className: styles.moduleBadge },
  quiz: { label: "Quiz", className: styles.quizBadge },
  material: { label: "Material", className: styles.materialBadge },
  coursework: { label: "Coursework", className: styles.courseworkBadge },
  topic: { label: "", className: "" },
};

export default function TopicNode({ data }: NodeProps) {
  const {
    topic,
    status,
    isLocked,
    lockReason,
    isModule,
    nodeType = "topic",
    hasQuiz,
    topicCount = 0,
    completedTopicCount = 0,
    onClick,
  } = data as unknown as TopicNodeData;

  let statusClass = styles.defaultNode;
  let statusText = "Not Started";

  if (isLocked) {
    statusClass = styles.lockedNode;
    statusText = "🔒 Locked";
  } else if (status === "completed") {
    statusClass = styles.completedNode;
    statusText = nodeType === "quiz" ? "Quiz Passed" : "Completed";
  } else if (status === "reading") {
    statusClass = styles.readingNode;
    statusText = "In Progress";
  }

  const badge = typeMeta[nodeType];

  return (
    <div
      className={`${styles.treeNode} ${isModule ? styles.moduleNode : ""} ${statusClass}`}
      onClick={() => !isLocked && onClick(topic)}
      title={isLocked && lockReason ? `Complete "${lockReason}" first` : topic.title}
      aria-disabled={isLocked}
      style={{ cursor: isLocked ? "not-allowed" : "pointer" }}
    >
      <Handle type="target" position={Position.Top} style={{ background: 'transparent', border: 'none' }} />

      {badge.label && (
        <div className={`${styles.moduleBadge} ${badge.className}`}>
          {badge.label}
        </div>
      )}
      <div className={styles.nodeTitle}>{topic.title}</div>
      <div className={styles.nodeDesc}>{topic.description}</div>
      {isModule && (
        <div className={styles.moduleMeta}>
          {completedTopicCount}/{topicCount} topics complete
        </div>
      )}
      {nodeType === "quiz" && !hasQuiz && (
        <div className={styles.quizMissingBadge}>Quiz not attached</div>
      )}
      <div className={styles.nodeStatus}>{statusText}</div>

      <Handle type="source" position={Position.Bottom} style={{ background: 'transparent', border: 'none' }} />
    </div>
  );
}
