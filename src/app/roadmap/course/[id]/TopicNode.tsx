"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { CourseTopic } from "@/types";
import styles from "./course.module.css";

type TopicNodeData = {
  topic: CourseTopic;
  status: "unread" | "reading" | "completed";
  isLocked: boolean;
  lockReason?: string;
  onClick: (topic: CourseTopic) => void;
};

export default function TopicNode({ data }: NodeProps) {
  const { topic, status, isLocked, lockReason, onClick } =
    data as unknown as TopicNodeData;

  let statusClass = styles.defaultNode;
  let statusText = "Not Started";

  if (isLocked) {
    statusClass = styles.lockedNode;
    statusText = "🔒 Locked";
  } else if (status === "completed") {
    statusClass = styles.completedNode;
    statusText = "Completed";
  } else if (status === "reading") {
    statusClass = styles.readingNode;
    statusText = "In Progress";
  }

  return (
    <div
      className={`${styles.treeNode} ${statusClass}`}
      onClick={() => !isLocked && onClick(topic)}
      title={isLocked && lockReason ? `Complete "${lockReason}" first` : topic.title}
      aria-disabled={isLocked}
      style={{ cursor: isLocked ? "not-allowed" : "pointer" }}
    >
      <Handle type="target" position={Position.Top} style={{ background: 'transparent', border: 'none' }} />

      <div className={styles.nodeTitle}>{topic.title}</div>
      <div className={styles.nodeDesc}>{topic.description}</div>
      <div className={styles.nodeStatus}>{statusText}</div>

      <Handle type="source" position={Position.Bottom} style={{ background: 'transparent', border: 'none' }} />
    </div>
  );
}
