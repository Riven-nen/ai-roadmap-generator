"use client";

import { Handle, Position } from "@xyflow/react";
import styles from "./course.module.css";

export default function TopicNode({ data }: any) {
  const { topic, status, isLocked, onClick } = data;

  let statusClass = styles.defaultNode;
  let statusText = "Not Started";

  if (isLocked) {
    statusClass = styles.lockedNode;
    statusText = "Locked";
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