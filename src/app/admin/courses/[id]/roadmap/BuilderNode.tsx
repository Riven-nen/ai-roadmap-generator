"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { DraftNode } from "@/lib/roadmapDraft";
import styles from "./roadmapBuilder.module.css";

const typeLabels: Record<DraftNode["node_type"], string> = {
  module: "Section",
  topic: "Topic",
  quiz: "Quiz",
  material: "Material",
  coursework: "Coursework",
};

const typeClasses: Record<DraftNode["node_type"], string> = {
  module: styles.badgeModule,
  topic: styles.badgeTopic,
  quiz: styles.badgeQuiz,
  material: styles.badgeMaterial,
  coursework: styles.badgeCoursework,
};

export default function BuilderNode({ data, selected }: NodeProps) {
  const node = data as unknown as DraftNode;
  const isModule = node.node_type === "module";

  return (
    <div
      className={`${styles.node} ${isModule ? styles.module : ""} ${selected ? styles.selected : ""}`}
    >
      <Handle type="target" position={Position.Top} className={styles.handle} />
      <div className={`${styles.badge} ${typeClasses[node.node_type]}`}>
        {typeLabels[node.node_type]}
      </div>
      <div className={styles.title}>{node.title}</div>
      <div className={styles.desc}>{node.description || "No description yet."}</div>
      {node.resource_name && (
        <div className={styles.meta}>📚 {node.resource_name}</div>
      )}
      {node.node_type === "quiz" && (
        <div className={node.quiz_id ? styles.meta : styles.metaWarn}>
          {node.quiz_id ? "Quiz linked" : "No quiz linked"}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} className={styles.handle} />
    </div>
  );
}
