import dagre from "dagre";
import type { Edge, Node } from "@xyflow/react";

export const moduleNodeSize = { width: 320, height: 170 };
export const topicNodeSize = { width: 230, height: 124 };

export function getRoadmapNodeSize(node: Node) {
  const data = node.data as
    | { isModule?: boolean; nodeType?: string; node_type?: string }
    | undefined;
  const isModule =
    data?.isModule === true ||
    data?.nodeType === "module" ||
    data?.node_type === "module";

  return isModule ? moduleNodeSize : topicNodeSize;
}

/**
 * Auto-layout a roadmap graph with dagre. The result is a top-down tree, but
 * works for any acyclic flow because it uses the supplied edges.
 */
export function layoutRoadmapGraph(nodes: Node[], edges: Edge[]): Node[] {
  if (nodes.length === 0) return nodes;

  const graph = new dagre.graphlib.Graph();
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({
    rankdir: "TB",
    nodesep: 72,
    ranksep: 128,
    marginx: 24,
    marginy: 24,
  });

  nodes.forEach((node) => {
    // Dagre mutates the label object with x/y coordinates. Every node needs
    // its own object, otherwise all nodes of the same type share one position.
    const size = getRoadmapNodeSize(node);
    graph.setNode(node.id, { width: size.width, height: size.height });
  });

  edges.forEach((edge) => {
    if (!nodes.some((node) => node.id === edge.source)) return;
    if (!nodes.some((node) => node.id === edge.target)) return;
    graph.setEdge(edge.source, edge.target);
  });

  dagre.layout(graph);

  return nodes.map((node) => {
    const position = graph.node(node.id);
    const size = getRoadmapNodeSize(node);
    return {
      ...node,
      position: {
        x: position.x - size.width / 2,
        y: position.y - size.height / 2,
      },
    };
  });
}
