"use client";

import { useMemo } from "react";
import { ReactFlow, Background, Controls, MarkerType, type Edge, type Node } from "@xyflow/react";
import dagre from "dagre";
import "@xyflow/react/dist/style.css";
import { Course, Enrollment } from "@/types";
import { getCourseStatus, getPassedCourseCodes } from "@/lib/courseStatus";
import CourseNode from "./CourseNode";

type Props = {
  courses: Course[];
  enrollments: Enrollment[];
  onCourseClick: (course: Course) => void;
};

const nodeWidth = 280;
const nodeHeight = 120;

const edgeColors = {
  completed: "#16a34a",
  in_progress: "#f97316",
  failed: "#dc2626",
  available: "#1e3a8a",
  locked: "#cbd5e1",
} as const;

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  // TB = Top to Bottom. nodesep = horizontal gap, ranksep = vertical gap
  dagreGraph.setGraph({ rankdir: "TB", nodesep: 72, ranksep: 110 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };
  });

  return { nodes, edges };
};

export default function GridTree({ courses, enrollments, onCourseClick }: Props) {
  const { nodes, edges } = useMemo(() => {
    const initialNodes: Node[] = [];
    const initialEdges: Edge[] = [];

    // 1. Work out which courses the student has passed so prerequisites can
    //    unlock the next set of courses.
    const passedCodes = getPassedCourseCodes(courses, enrollments);
    const statusByCourseId = new Map(
      courses.map((course) => {
        const enrollment = enrollments.find((e) => e.course_id === course.id);
        return [
          course.id,
          getCourseStatus(course, enrollment, passedCodes, courses),
        ] as const;
      })
    );

    // 2. Create Nodes
    courses.forEach((course) => {
      const status = statusByCourseId.get(course.id);

      initialNodes.push({
        id: course.id,
        type: "courseNode",
        data: {
          course,
          enrollment: status?.enrollment,
          state: status?.state ?? "available",
          isLocked: status?.isLocked ?? false,
          lockReason: status?.lockReason,
          onClick: onCourseClick,
        },
        position: { x: 0, y: 0 },
      });
    });

    // 3. Create Edges based on the prerequisite_code
    courses.forEach((course) => {
      if (!course.prerequisite_code) return;

      const sourceCourse = courses.find((c) => c.code === course.prerequisite_code);
      if (!sourceCourse) return;

      const sourceStatus = statusByCourseId.get(sourceCourse.id);
      const edgeColor = edgeColors[sourceStatus?.state ?? "available"];

      initialEdges.push({
        id: `${sourceCourse.id}-${course.id}`,
        source: sourceCourse.id,
        target: course.id,
        type: "smoothstep", // Gives the clean right-angle routing
        animated: sourceStatus?.state !== "locked",
        style: { stroke: edgeColor, strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor },
      });
    });

    return getLayoutedElements(initialNodes, initialEdges);
  }, [courses, enrollments, onCourseClick]);

  const nodeTypes = useMemo(() => ({ courseNode: CourseNode }), []);

  return (
    <div style={{ width: "100%", height: "100%", background: "#f7f9fc" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15, minZoom: 0.5, maxZoom: 1.1 }}
        minZoom={0.3}
        maxZoom={2}
        colorMode="light"
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false} // Prevents the student from messing up the layout
      >
        <Background color="#e2e8f0" gap={16} />
        <Controls />
      </ReactFlow>
    </div>
  );
}
