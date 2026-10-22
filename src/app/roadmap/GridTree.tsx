"use client";

import { useMemo } from "react";
import { ReactFlow, Background, Controls, MarkerType, type Edge, type Node } from "@xyflow/react";
import dagre from "dagre";
import "@xyflow/react/dist/style.css";
import { Course, Enrollment } from "@/types";
import CourseNode from "./CourseNode";

type Props = {
  courses: Course[];
  enrollments: Enrollment[];
  onCourseClick: (course: Course) => void;
};

const nodeWidth = 240;
const nodeHeight = 100;

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  
  // TB = Top to Bottom. nodesep = horizontal gap, ranksep = vertical gap
  dagreGraph.setGraph({ rankdir: "TB", nodesep: 60, ranksep: 100 });

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

    // 1. Create Nodes
    courses.forEach((course) => {
      const enrollment = enrollments.find((e) => e.course_id === course.id);
      initialNodes.push({
        id: course.id,
        type: "courseNode",
        data: { course, enrollment, onClick: onCourseClick },
        position: { x: 0, y: 0 },
      });
    });

    // 2. Create Edges based on the prerequisite_code
    courses.forEach((course) => {
      if (course.prerequisite_code) {
        const sourceCourse = courses.find((c) => c.code === course.prerequisite_code);
        if (sourceCourse) {
          const enrollment = enrollments.find((e) => e.course_id === sourceCourse.id);
          let edgeColor = "#475569"; 
          
          if (enrollment) {
            if (enrollment.status === "completed") edgeColor = "#22c55e";
            else if (enrollment.status === "in_progress") edgeColor = "#3b82f6";
          }

          initialEdges.push({
            id: `${sourceCourse.id}-${course.id}`,
            source: sourceCourse.id,
            target: course.id,
            type: "smoothstep", // Gives the clean right-angle routing
            animated: true,
            style: { stroke: edgeColor, strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor },
          });
        }
      }
    });

    return getLayoutedElements(initialNodes, initialEdges);
  }, [courses, enrollments, onCourseClick]);

  const nodeTypes = useMemo(() => ({ courseNode: CourseNode }), []);

  return (
    <div style={{ width: "100%", height: "100%", background: "#0f111a" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        colorMode="dark"
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false} // Prevents the student from messing up the layout
      >
        <Background color="#2a2f45" gap={16} />
        <Controls />
      </ReactFlow>
    </div>
  );
}