"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Course, Enrollment } from "@/types";
import type { CourseState } from "@/lib/courseStatus";
import styles from "./GridTree.module.css";

type CourseNodeData = {
  course: Course;
  enrollment?: Enrollment;
  state: CourseState;
  isLocked?: boolean;
  lockReason?: string;
  onClick: (course: Course) => void;
};

const stateClass = {
  completed: styles.passed,
  in_progress: styles.inProgress,
  failed: styles.failed,
  available: styles.available,
  locked: styles.locked,
} as const;

function getStatusText(
  state: CourseState,
  grade: string | null | undefined,
  isLocked: boolean
) {
  if (isLocked) return "🔒 Locked";

  switch (state) {
    case "completed":
      return grade ? `Grade: ${grade}` : "Completed";
    case "in_progress":
      return "In Progress";
    case "failed":
      return `Failed (${grade ?? "5.0"})`;
    case "locked":
      return "🔒 Locked";
    default:
      return "Available";
  }
}

export default function CourseNode({ data }: NodeProps) {
  const { course, enrollment, state = "available", isLocked, lockReason, onClick } =
    data as unknown as CourseNodeData;

  const statusClass = stateClass[state] ?? styles.available;
  const gradeText = getStatusText(state, enrollment?.grade, Boolean(isLocked));

  const handleClick = () => {
    if (isLocked) return;
    onClick(course);
  };

  return (
    <div
      className={`${styles.node} ${statusClass}`}
      onClick={handleClick}
      title={isLocked ? `Complete ${lockReason} first` : course.title}
      style={{ cursor: isLocked ? "not-allowed" : "pointer" }}
    >
      <Handle type="target" position={Position.Top} style={{ background: 'transparent', border: 'none' }} />

      <div className={styles.nodeCode}>{course.code}</div>
      <div className={styles.nodeTitle}>{course.title}</div>
      <div className={styles.nodeGrade}>{gradeText}</div>

      <Handle type="source" position={Position.Bottom} style={{ background: 'transparent', border: 'none' }} />
    </div>
  );
}
