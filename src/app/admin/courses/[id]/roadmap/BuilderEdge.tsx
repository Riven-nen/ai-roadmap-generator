"use client";

import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from "@xyflow/react";
import { themeColor } from "@/lib/theme";
import styles from "./roadmapBuilder.module.css";

type EdgeData = {
  onDelete?: (edgeId: string) => void;
};

export default function BuilderEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  selected,
  data,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetPosition,
    targetX,
    targetY,
  });

  const selectedColor = themeColor("--danger", "#b45757");
  const onDelete = (data as EdgeData | undefined)?.onDelete;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        interactionWidth={26}
        style={{
          ...style,
          stroke: selected ? selectedColor : style?.stroke,
          strokeWidth: selected ? 3.5 : style?.strokeWidth ?? 2,
        }}
      />

      {selected && onDelete && (
        <EdgeLabelRenderer>
          <div
            className={`${styles.edgeAction} nodrag nopan`}
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
          >
            <button
              type="button"
              className={styles.edgeDeleteBtn}
              onClick={(event) => {
                event.stopPropagation();
                onDelete(id);
              }}
            >
              Delete connection
            </button>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
