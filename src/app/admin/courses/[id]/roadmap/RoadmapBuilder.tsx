"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  MarkerType,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type Connection,
  type Edge,
  type EdgeChange,
  type EdgeTypes,
  type Node,
  type NodeChange,
  type ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { createClient } from "@/lib/supabase/client";
import BackButton from "@/components/BackButton";
import { Course, Quiz, TopicNodeType } from "@/types";
import {
  DraftNode,
  RoadmapDraftContent,
  contentFromPublished,
  normalizeDraft,
} from "@/lib/roadmapDraft";
import { layoutRoadmapGraph } from "@/lib/roadmapLayout";
import { themeColor } from "@/lib/theme";
import BuilderEdge from "./BuilderEdge";
import BuilderNode from "./BuilderNode";
import NodeEditor from "./NodeEditor";
import styles from "./roadmapBuilder.module.css";

type Props = {
  course: Course;
  backHref: string;
};

type Notice = {
  type: "success" | "error" | "info";
  text: string;
};

const nodeTypes = { builderNode: BuilderNode };
const edgeTypes: EdgeTypes = { roadmapEdge: BuilderEdge };

function toRfNode(node: DraftNode): Node {
  const x = node.position_x ?? 0;
  const y = node.position_y ?? 0;

  return {
    id: node.id,
    type: "builderNode",
    position: { x, y },
    data: { ...node, position_x: x, position_y: y },
    deletable: false,
  };
}

function toRfEdge(edge: { id: string; source: string; target: string; label: string | null }): Edge {
  const edgeColor = themeColor("--accent-strong", "#3d6b60");

  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: "roadmapEdge",
    label: edge.label ?? undefined,
    interactionWidth: 26,
    markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor, width: 18, height: 18 },
    style: { stroke: edgeColor, strokeWidth: 2 },
  };
}

function serializeDraft(nodes: Node[], edges: Edge[]): RoadmapDraftContent {
  return {
    nodes: nodes.map((node) => ({
      ...(node.data as DraftNode),
      position_x: node.position.x,
      position_y: node.position.y,
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: typeof edge.label === "string" ? edge.label : null,
    })),
  };
}

function createsCycle(source: string, target: string, edges: Edge[]): boolean {
  const adjacency = new Map<string, string[]>();

  for (const edge of edges) {
    const targets = adjacency.get(edge.source) ?? [];
    targets.push(edge.target);
    adjacency.set(edge.source, targets);
  }

  const stack = [target];
  const visited = new Set<string>();

  while (stack.length > 0) {
    const current = stack.pop() as string;
    if (current === source) return true;
    if (visited.has(current)) continue;
    visited.add(current);

    for (const next of adjacency.get(current) ?? []) {
      stack.push(next);
    }
  }

  return false;
}

function collectPrecedingNodes(
  nodeId: string,
  nodes: Node[],
  edges: Edge[]
): Array<{ title: string; node_type: TopicNodeType; description: string }> {
  const byId = new Map(nodes.map((node) => [node.id, node.data as DraftNode]));
  const incoming = new Map<string, string[]>();

  for (const edge of edges) {
    const sources = incoming.get(edge.target) ?? [];
    sources.push(edge.source);
    incoming.set(edge.target, sources);
  }

  const result: Array<{
    title: string;
    node_type: TopicNodeType;
    description: string;
  }> = [];
  const visited = new Set<string>([nodeId]);
  const queue = [...(incoming.get(nodeId) ?? [])];

  while (queue.length > 0 && result.length < 6) {
    const currentId = queue.shift() as string;
    if (visited.has(currentId)) continue;

    visited.add(currentId);
    const current = byId.get(currentId);

    if (current) {
      result.push({
        title: current.title,
        node_type: current.node_type,
        description: current.description,
      });
    }

    queue.push(...(incoming.get(currentId) ?? []));
  }

  return result.reverse();
}

function newDraftNode(position: { x: number; y: number }): DraftNode {
  return {
    id: crypto.randomUUID(),
    title: "New topic",
    description: "",
    overview: "",
    content: "",
    node_type: "topic" as TopicNodeType,
    estimated_time: "",
    resource_name: "",
    resource_url: "",
    learning_objectives: [],
    position_x: position.x,
    position_y: position.y,
    quiz_id: null,
  };
}

export default function RoadmapBuilder({ course, backHref }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [revision, setRevision] = useState(1);
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [editorNode, setEditorNode] = useState<DraftNode | null>(null);
  const [isNewNode, setIsNewNode] = useState(false);

  const revisionRef = useRef(1);
  const saveChainRef = useRef<Promise<void>>(Promise.resolve());
  const initializedRef = useRef(false);
  const flowRef = useRef<ReactFlowInstance | null>(null);

  const persistDraft = useCallback(
    (rfNodes: Node[], rfEdges: Edge[], options?: { silent?: boolean }) => {
      const run = async () => {
        setSaving(true);

        try {
          const content = serializeDraft(rfNodes, rfEdges);
          const currentRevision = revisionRef.current;

          const { data, error } = await supabase
            .from("roadmap_drafts")
            .update({
              content,
              revision: currentRevision + 1,
              updated_at: new Date().toISOString(),
            })
            .eq("course_id", course.id)
            .eq("revision", currentRevision)
            .select("revision")
            .maybeSingle();

          if (error) throw error;

          if (!data) {
            setNotice({
              type: "error",
              text: "This draft was changed in another session. Reload the page before saving again.",
            });
            return;
          }

          revisionRef.current = data.revision;
          setRevision(data.revision);

          if (!options?.silent) {
            setNotice({ type: "success", text: "Draft saved." });
          }
        } catch (error) {
          setNotice({
            type: "error",
            text: error instanceof Error ? error.message : "Could not save the draft.",
          });
        } finally {
          setSaving(false);
        }
      };

      const task = saveChainRef.current.then(run, run);
      saveChainRef.current = task.then(() => undefined, () => undefined);
      return task;
    },
    [course.id, supabase]
  );

  useEffect(() => {
    let active = true;

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();

      const [quizResult, draftResult, topicResult, edgeResult] = await Promise.all([
        supabase.from("quizzes").select("*").eq("course_id", course.id),
        supabase.from("roadmap_drafts").select("*").eq("course_id", course.id).maybeSingle(),
        supabase.from("course_topics").select("*").eq("course_id", course.id).order("created_at"),
        supabase.from("roadmap_edges").select("*").eq("course_id", course.id),
      ]);

      if (!active) return;

      const quizList = (quizResult.data || []) as Quiz[];
      setQuizzes(quizList);

      let draft = draftResult.data;
      let content: RoadmapDraftContent;

      if (draft) {
        content = normalizeDraft(draft.content);
      } else {
        content = contentFromPublished(
          topicResult.data || [],
          edgeResult.data || [],
          quizList
        );

        const { data: inserted, error: insertError } = await supabase
          .from("roadmap_drafts")
          .insert({
            course_id: course.id,
            content,
            revision: 1,
            updated_by: user?.id ?? null,
          })
          .select("*")
          .single();

        if (insertError) {
          const { data: existing } = await supabase
            .from("roadmap_drafts")
            .select("*")
            .eq("course_id", course.id)
            .maybeSingle();

          if (existing) {
            draft = existing;
            content = normalizeDraft(existing.content);
          } else {
            if (active) {
              setNotice({ type: "error", text: "Could not open the roadmap draft." });
              setLoading(false);
            }
            return;
          }
        } else {
          draft = inserted;
        }
      }

      if (!active) return;

      const currentRevision = draft?.revision ?? 1;
      revisionRef.current = currentRevision;
      setRevision(currentRevision);
      setPublishedAt(draft?.published_at ?? null);

      let rfNodes = content.nodes.map(toRfNode);
      const rfEdges = content.edges.map(toRfEdge);
      const positionKeys = content.nodes.map(
        (node) => `${node.position_x},${node.position_y}`
      );
      const allNodesStacked =
        content.nodes.length > 2 &&
        content.nodes.every(
          (node) => node.position_x !== null && node.position_y !== null
        ) &&
        new Set(positionKeys).size === 1;
      const needsLayout =
        content.nodes.some(
          (node) => node.position_x === null || node.position_y === null
        ) || allNodesStacked;

      if (needsLayout) {
        rfNodes = layoutRoadmapGraph(rfNodes, rfEdges);
      }

      setNodes(rfNodes);
      setEdges(rfEdges);
      setLoading(false);
      initializedRef.current = true;

      if (needsLayout) {
        void persistDraft(rfNodes, rfEdges, { silent: true });
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [course.id, persistDraft, supabase]);

  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((current) => applyNodeChanges(changes, current));
  }, []);

  const handleEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((current) => applyEdgeChanges(changes, current));
  }, []);

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      if (connection.source === connection.target) {
        setNotice({ type: "error", text: "A node cannot connect to itself." });
        return;
      }
      if (
        edges.some(
          (edge) =>
            edge.source === connection.source && edge.target === connection.target
        )
      ) {
        setNotice({ type: "info", text: "Those nodes are already linked." });
        return;
      }
      if (createsCycle(connection.source, connection.target, edges)) {
        setNotice({
          type: "error",
          text: "That link would create a cycle. A roadmap must flow forward.",
        });
        return;
      }

      const edgeColor = themeColor("--accent-strong", "#3d6b60");
      const newEdge: Edge = {
        id: crypto.randomUUID(),
        source: connection.source,
        target: connection.target,
        type: "roadmapEdge",
        interactionWidth: 26,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: edgeColor,
          width: 18,
          height: 18,
        },
        style: { stroke: edgeColor, strokeWidth: 2 },
      };

      const updatedEdges = addEdge(newEdge, edges);
      setEdges(updatedEdges);
      setNotice({ type: "success", text: "Link added to draft." });
      void persistDraft(nodes, updatedEdges);
    },
    [edges, nodes, persistDraft]
  );

  const handleEdgeDelete = useCallback(
    (edgeId: string) => {
      const updatedEdges = edges.filter((edge) => edge.id !== edgeId);
      setEdges(updatedEdges);
      void persistDraft(nodes, updatedEdges);
      setNotice({ type: "success", text: "Connection removed from draft." });
    },
    [edges, nodes, persistDraft]
  );

  const handleEdgesDelete = useCallback(
    (deleted: Edge[]) => {
      const deletedIds = new Set(deleted.map((edge) => edge.id));
      const updatedEdges = edges.filter((edge) => !deletedIds.has(edge.id));
      setEdges(updatedEdges);
      void persistDraft(nodes, updatedEdges);
      setNotice({ type: "success", text: "Connection removed from draft." });
    },
    [edges, nodes, persistDraft]
  );

  const renderedEdges = useMemo<Edge[]>(
    () =>
      edges.map((edge) => ({
        ...edge,
        type: "roadmapEdge",
        data: {
          ...(edge.data ?? {}),
          onDelete: handleEdgeDelete,
        },
      })),
    [edges, handleEdgeDelete]
  );

  const handleNodeDragStop = useCallback(
    (_event: MouseEvent | TouchEvent, node: Node) => {
      const updatedNodes = nodes.map((current) =>
        current.id === node.id ? { ...current, position: node.position } : current
      );
      setNodes(updatedNodes);
      void persistDraft(updatedNodes, edges);
    },
    [edges, nodes, persistDraft]
  );

  const openEditor = useCallback((node: Node) => {
    const data = node.data as DraftNode;
    setEditorNode({
      ...data,
      position_x: node.position.x,
      position_y: node.position.y,
    });
    setIsNewNode(false);
  }, []);

  const handleAddNode = useCallback(() => {
    const x = 80 + (nodes.length % 4) * 260;
    const y = 80 + Math.floor(nodes.length / 4) * 160;
    setEditorNode(newDraftNode({ x, y }));
    setIsNewNode(true);
  }, [nodes.length]);

  const handleSaveNode = useCallback(
    async (draft: DraftNode) => {
      if (isNewNode) {
        const node = toRfNode(draft);
        const updatedNodes = [...nodes, node];
        setNodes(updatedNodes);
        setEditorNode(null);
        setIsNewNode(false);
        await persistDraft(updatedNodes, edges);
        return;
      }

      const current = nodes.find((node) => node.id === draft.id);
      const position = current?.position ?? {
        x: draft.position_x ?? 0,
        y: draft.position_y ?? 0,
      };

      const updatedNodes = nodes.map((node) =>
        node.id === draft.id
          ? {
              ...node,
              data: {
                ...draft,
                position_x: position.x,
                position_y: position.y,
              },
            }
          : node
      );

      setNodes(updatedNodes);
      setEditorNode(null);
      await persistDraft(updatedNodes, edges);
    },
    [edges, isNewNode, nodes, persistDraft]
  );

  const handleDeleteNode = useCallback(async () => {
    if (!editorNode || isNewNode) {
      setEditorNode(null);
      return;
    }

    if (!window.confirm(`Delete "${editorNode.title}" from the draft? This is applied to students only when you publish.`)) {
      return;
    }

    const updatedNodes = nodes.filter((node) => node.id !== editorNode.id);
    const updatedEdges = edges.filter(
      (edge) => edge.source !== editorNode.id && edge.target !== editorNode.id
    );

    setNodes(updatedNodes);
    setEdges(updatedEdges);
    setEditorNode(null);
    await persistDraft(updatedNodes, updatedEdges);
  }, [edges, editorNode, isNewNode, nodes, persistDraft]);

  const handleAutoArrange = useCallback(async () => {
    const laidOut = layoutRoadmapGraph(nodes, edges);
    setNodes(laidOut);

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        flowRef.current?.fitView({ padding: 0.15, duration: 300 });
      });
    });

    await persistDraft(laidOut, edges);
    setNotice({ type: "success", text: "Auto-arranged and saved to draft." });
  }, [edges, nodes, persistDraft]);

  const handlePublish = useCallback(async () => {
    setPublishing(true);
    setNotice(null);

    try {
      await saveChainRef.current;

      const content = serializeDraft(nodes, edges);
      const { data, error } = await supabase.rpc("publish_roadmap", {
        p_course_id: course.id,
        p_content: content,
        p_revision: revisionRef.current,
      });

      if (error) throw error;

      const result = data as { revision?: number; published_at?: string } | null;
      if (result?.revision) {
        revisionRef.current = result.revision;
        setRevision(result.revision);
      }
      setPublishedAt(result?.published_at ?? new Date().toISOString());
      setNotice({
        type: "success",
        text: "Published. Students now see this version of the roadmap.",
      });
    } catch (error) {
      setNotice({
        type: "error",
        text: error instanceof Error ? error.message : "Could not publish the roadmap.",
      });
    } finally {
      setPublishing(false);
    }
  }, [course.id, edges, nodes, supabase]);

  const usedQuizIds = useMemo(
    () =>
      new Set(
        nodes
          .map((node) => (node.data as DraftNode).quiz_id)
          .filter((id): id is string => Boolean(id))
      ),
    [nodes]
  );

  if (loading) {
    return <div className={styles.loading}>Opening roadmap draft...</div>;
  }

  const canvasGridColor = themeColor("--border-color", "#e3ded4");
  const moduleMiniMapColor = themeColor("--accent-strong", "#3d6b60");
  const topicMiniMapColor = themeColor("--accent", "#5f8f83");

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarInfo}>
          <BackButton fallbackHref={backHref} className={styles.ghostBtn} />
          <h1 className={styles.builderTitle}>
            {course.code}: {course.title}
          </h1>
          <p className={styles.builderSubtitle}>
            Draft roadmap builder — students only see the published version.
          </p>
          <div className={styles.statusRow}>
            <span className={`${styles.statusPill} ${styles.statusPillDraft}`}>
              Draft revision {revision}
            </span>
            <span
              className={`${styles.statusPill} ${
                publishedAt ? styles.statusPillLive : ""
              }`}
            >
              {publishedAt
                ? `Published ${new Date(publishedAt).toLocaleString()}`
                : "Never published"}
            </span>
            {saving && <span className={styles.statusPill}>Saving...</span>}
          </div>
        </div>

        <div className={styles.toolbarActions}>
          <Link
            href={`/roadmap/course/${course.id}`}
            target="_blank"
            className={styles.secondaryBtn}
          >
            Preview published
          </Link>
          <button type="button" className={styles.secondaryBtn} onClick={handleAutoArrange}>
            Auto arrange
          </button>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={() => void persistDraft(nodes, edges)}
            disabled={saving}
          >
            Save draft
          </button>
          <button type="button" className={styles.primaryBtn} onClick={handleAddNode}>
            + Add node
          </button>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={() => void handlePublish()}
            disabled={publishing}
          >
            {publishing ? "Publishing..." : "Publish changes"}
          </button>
        </div>
      </div>

      {notice && (
        <div
          className={`${styles.notice} ${
            notice.type === "success"
              ? styles.noticeSuccess
              : notice.type === "error"
                ? styles.noticeError
                : styles.noticeInfo
          }`}
        >
          {notice.text}
        </div>
      )}

      <div className={styles.canvas}>
        <div className={styles.canvasHint}>
          Space + drag to pan · click a line, then Delete (or the red button) · drag nodes to move
        </div>
        <ReactFlow
          nodes={nodes}
          edges={renderedEdges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onInit={(instance) => {
            flowRef.current = instance;
          }}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={handleConnect}
          onEdgeClick={(_event, edge) => {
            setNotice({
              type: "info",
              text: `Connection selected${edge.label ? ` (${edge.label})` : ""}. Press Delete, or use the button on the line, to remove it.`,
            });
          }}
          onNodeClick={(_event, node) => {
            setEdges((current) =>
              current.map((candidate) => ({ ...candidate, selected: false }))
            );
            openEditor(node);
          }}
          onPaneClick={() =>
            setEdges((current) =>
              current.map((candidate) => ({ ...candidate, selected: false }))
            )
          }
          onNodeContextMenu={(event, node) => {
            event.preventDefault();
            setNodes((current) =>
              current.map((candidate) => ({
                ...candidate,
                selected: candidate.id === node.id,
              }))
            );
          }}
          onNodeDragStop={handleNodeDragStop}
          onEdgesDelete={handleEdgesDelete}
          onPaneContextMenu={(event) => event.preventDefault()}
          panOnDrag={[1]}
          panActivationKeyCode="Space"
          selectionOnDrag
          fitView
          fitViewOptions={{ padding: 0.15, minZoom: 0.5, maxZoom: 1.1 }}
          minZoom={0.25}
          maxZoom={2}
          colorMode="light"
          deleteKeyCode={["Backspace", "Delete"]}
          proOptions={{ hideAttribution: true }}
        >
          <Background bgColor="var(--bg-card)" color={canvasGridColor} gap={18} />
          <Controls />
          <MiniMap
            pannable
            zoomable
            className={styles.minimap}
            nodeColor={(node) =>
              (node.data as DraftNode | undefined)?.node_type === "module"
                ? moduleMiniMapColor
                : topicMiniMapColor
            }
          />
        </ReactFlow>
      </div>

      {editorNode && (
        <NodeEditor
          initial={editorNode}
          isNew={isNewNode}
          quizzes={quizzes}
          usedQuizIds={usedQuizIds}
          aiContext={{
            course,
            preceding: collectPrecedingNodes(editorNode.id, nodes, edges),
            outline: nodes.map((node) => {
              const data = node.data as DraftNode;
              return { title: data.title, node_type: data.node_type };
            }),
          }}
          onClose={() => setEditorNode(null)}
          onSave={handleSaveNode}
          onDelete={handleDeleteNode}
        />
      )}
    </div>
  );
}
