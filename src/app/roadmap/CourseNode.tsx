"use client";

import { Handle, Position } from "@xyflow/react";
import styles from "./GridTree.module.css";

export default function CourseNode({ data }: any) {
  const { course, enrollment, onClick } = data;

  let statusClass = styles.locked;
  let gradeText = "Not Taken";

  if (enrollment) {
    if (enrollment.status === "in_progress") {
      statusClass = styles.inProgress;
      gradeText = "In Progress";
    } else if (enrollment.grade === "5.0" || enrollment.grade === "INC") {
      statusClass = styles.failed;
      gradeText = `Failed (${enrollment.grade})`;
    } else {
      statusClass = styles.passed;
      gradeText = `Grade: ${enrollment.grade}`;
    }
  }

  return (
    <div 
      className={`${styles.node} ${statusClass}`}
      onClick={() => onClick(course)}
    >
      <Handle type="target" position={Position.Top} style={{ background: 'transparent', border: 'none' }} />
      
      <div className={styles.nodeCode}>{course.code}</div>
      <div className={styles.nodeTitle}>{course.title}</div>
      <div className={styles.nodeGrade}>{gradeText}</div>

      <Handle type="source" position={Position.Bottom} style={{ background: 'transparent', border: 'none' }} />
    </div>
  );
}