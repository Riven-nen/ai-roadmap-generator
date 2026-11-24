import { CourseTopic, Quiz, RoadmapEdge, TopicNodeType } from "@/types";

export type DraftNode = {
  id: string;
  title: string;
  description: string;
  overview: string;
  content: string;
  node_type: TopicNodeType;
  estimated_time: string;
  resource_name: string;
  resource_url: string;
  learning_objectives: string[];
  position_x: number | null;
  position_y: number | null;
  quiz_id: string | null;
};

export type DraftEdge = {
  id: string;
  source: string;
  target: string;
  label: string | null;
};

export type RoadmapDraftContent = {
  nodes: DraftNode[];
  edges: DraftEdge[];
};

export const emptyDraft: RoadmapDraftContent = { nodes: [], edges: [] };

const NODE_TYPES: TopicNodeType[] = [
  "module",
  "topic",
  "quiz",
  "material",
  "coursework",
];

export function draftNodeFromTopic(
  topic: CourseTopic,
  quizId: string | null
): DraftNode {
  return {
    id: topic.id,
    title: topic.title,
    description: topic.description ?? "",
    overview: topic.overview ?? "",
    content: topic.content ?? "",
    node_type: NODE_TYPES.includes(topic.node_type) ? topic.node_type : "topic",
    estimated_time: topic.estimated_time ?? "",
    resource_name: topic.resource_name ?? "",
    resource_url: topic.resource_url ?? "",
    learning_objectives: topic.learning_objectives ?? [],
    position_x: topic.position_x,
    position_y: topic.position_y,
    quiz_id: quizId,
  };
}

export function contentFromPublished(
  topics: CourseTopic[],
  edges: RoadmapEdge[],
  quizzes: Quiz[]
): RoadmapDraftContent {
  return {
    nodes: topics.map((topic) =>
      draftNodeFromTopic(
        topic,
        quizzes.find((quiz) => quiz.topic_id === topic.id)?.id ?? null
      )
    ),
    edges: edges.map((edge) => ({
      id: edge.id,
      source: edge.source_topic_id,
      target: edge.target_topic_id,
      label: edge.label,
    })),
  };
}

export function normalizeDraft(value: unknown): RoadmapDraftContent {
  if (!value || typeof value !== "object") return emptyDraft;

  const raw = value as { nodes?: unknown; edges?: unknown };
  const nodes = Array.isArray(raw.nodes) ? raw.nodes : [];
  const edges = Array.isArray(raw.edges) ? raw.edges : [];

  return {
    nodes: nodes
      .filter((node): node is Record<string, unknown> => Boolean(node && typeof node === "object"))
      .map((node) => ({
        id: String(node.id ?? ""),
        title: String(node.title ?? "Untitled"),
        description: String(node.description ?? ""),
        overview: String(node.overview ?? ""),
        content: String(node.content ?? ""),
        node_type: NODE_TYPES.includes(node.node_type as TopicNodeType)
          ? (node.node_type as TopicNodeType)
          : "topic",
        estimated_time: String(node.estimated_time ?? ""),
        resource_name: String(node.resource_name ?? ""),
        resource_url: String(node.resource_url ?? ""),
        learning_objectives: Array.isArray(node.learning_objectives)
          ? node.learning_objectives.map((objective) => String(objective))
          : [],
        position_x:
          typeof node.position_x === "number" ? node.position_x : null,
        position_y:
          typeof node.position_y === "number" ? node.position_y : null,
        quiz_id: node.quiz_id ? String(node.quiz_id) : null,
      }))
      .filter((node) => node.id),
    edges: edges
      .filter((edge): edge is Record<string, unknown> => Boolean(edge && typeof edge === "object"))
      .map((edge) => ({
        id: String(edge.id ?? ""),
        source: String(edge.source ?? ""),
        target: String(edge.target ?? ""),
        label: edge.label ? String(edge.label) : null,
      }))
      .filter((edge) => edge.id && edge.source && edge.target),
  };
}
