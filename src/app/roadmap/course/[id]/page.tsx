"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { ReactFlow, Background, Controls, MiniMap, MarkerType, type Edge, type Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { createClient } from "@/lib/supabase/client";
import { Course, CourseTopic, Quiz, RoadmapEdge } from "@/types";
import { layoutRoadmapGraph } from "@/lib/roadmapLayout";
import { themeColor } from "@/lib/theme";
import styles from "./course.module.css";
import TopicModal from "./TopicModal";
import TopicNode from "./TopicNode";

type Progress = {
  topic_id: string;
  status: "unread" | "reading" | "completed";
};

type SectionInfo = {
  section_code: string;
  academic_year: string;
  term: string;
};

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [topics, setTopics] = useState<CourseTopic[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [roadmapEdges, setRoadmapEdges] = useState<RoadmapEdge[]>([]);
  const [sectionId, setSectionId] = useState<string | null>(null);
  const [sectionInfo, setSectionInfo] = useState<SectionInfo | null>(null);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [selectedTopic, setSelectedTopic] = useState<CourseTopic | null>(null);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const [courseResult, topicsResult, quizzesResult, edgesResult, enrollmentResult] = await Promise.all([
        supabase.from("courses").select("*").eq("id", courseId).single(),
        supabase.from("course_topics").select("*").eq("course_id", courseId).order("created_at"),
        supabase.from("quizzes").select("*").eq("course_id", courseId),
        supabase.from("roadmap_edges").select("*").eq("course_id", courseId),
        user
          ? supabase
              .from("enrollments")
              .select("section_id, section:sections(section_code, academic_year, term)")
              .eq("user_id", user.id)
              .eq("course_id", courseId)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      if (courseResult.error) {
        setLoadError("We couldn't load this course.");
      }

      let progressData: Progress[] = [];
      if (user) {
        const { data } = await supabase
          .from("student_topic_progress")
          .select("topic_id,status")
          .eq("user_id", user.id);
        progressData = (data || []) as Progress[];
      }

      const enrollment = enrollmentResult.data as
        | {
            section_id?: string | null;
            section?: SectionInfo | SectionInfo[] | null;
          }
        | null;
      const enrollmentSection = Array.isArray(enrollment?.section)
        ? enrollment.section[0] ?? null
        : enrollment?.section ?? null;

      setCourse(courseResult.data);
      setTopics(topicsResult.data || []);
      setQuizzes(quizzesResult.data || []);
      setRoadmapEdges((edgesResult.data || []) as RoadmapEdge[]);
      setSectionId(enrollment?.section_id ?? null);
      setSectionInfo(enrollmentSection);
      setProgress(progressData);
      setLoading(false);
    }
    if (courseId) fetchData();
  }, [courseId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, isChatOpen]);

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !course) return;

    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setIsTyping(true);

    const courseContext = topics.map(t => `- ${t.title}: ${t.description}`).join("\n");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, courseTitle: course.title, courseContext }),
      });
      const data = await res.json();
      setMessages([...newMessages, { role: "assistant", content: data.reply || "Sorry, I couldn't answer that. Please try again." }]);
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Error connecting to AI." }]);
    } finally {
      setIsTyping(false);
    }
  }

  const updateTopicStatus = async (topicId: string, newStatus: "reading" | "completed") => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setSaveError(null);

    const { error } = await supabase.from("student_topic_progress").upsert({
      user_id: user.id,
      topic_id: topicId,
      status: newStatus,
      updated_at: new Date().toISOString()
    }, { onConflict: "user_id,topic_id" });

    if (error) {
      setSaveError("Couldn't save your progress. Please try again.");
      return;
    }

    setProgress(prev => {
      const existing = prev.find(p => p.topic_id === topicId);
      if (existing) {
        return prev.map(p => p.topic_id === topicId ? { ...p, status: newStatus } : p);
      }
      return [...prev, { topic_id: topicId, status: newStatus }];
    });
  };

  const { nodes, edges } = useMemo(() => {
    const topicsById = new Map(topics.map((topic) => [topic.id, topic]));
    const completedIds = new Set(
      progress.filter((entry) => entry.status === "completed").map((entry) => entry.topic_id)
    );

    const graphEdges = roadmapEdges.length > 0
      ? roadmapEdges.map((edge) => ({
          id: edge.id,
          source: edge.source_topic_id,
          target: edge.target_topic_id,
          label: edge.label,
        }))
      : topics
          .filter((topic) => topic.parent_id)
          .map((topic) => ({
            id: `${topic.parent_id}-${topic.id}`,
            source: topic.parent_id as string,
            target: topic.id,
            label: null as string | null,
          }));

    const incomingByTarget = new Map<string, string[]>();
    for (const edge of graphEdges) {
      const current = incomingByTarget.get(edge.target) ?? [];
      current.push(edge.source);
      incomingByTarget.set(edge.target, current);
    }

    const lockedByTopic = new Map<string, boolean>();
    const lockReasonByTopic = new Map<string, string | undefined>();

    for (const topic of topics) {
      if (completedIds.has(topic.id)) {
        lockedByTopic.set(topic.id, false);
        continue;
      }

      const incoming = incomingByTarget.get(topic.id) ?? [];
      const missing = incoming.find((sourceId) => !completedIds.has(sourceId));
      const locked = incoming.length > 0 && Boolean(missing);
      lockedByTopic.set(topic.id, locked);

      if (locked && missing) {
        lockReasonByTopic.set(topic.id, topicsById.get(missing)?.title);
      }
    }

    const isModuleTopic = (topic: CourseTopic) =>
      topic.node_type === "module" || topic.title.startsWith("Module ");

    const getModuleMeta = (topic: CourseTopic) => {
      const childTopicIds = graphEdges
        .filter((edge) => edge.source === topic.id)
        .map((edge) => edge.target)
        .filter((targetId) => {
          const target = topicsById.get(targetId);
          return target && !isModuleTopic(target);
        });

      return {
        topicCount: childTopicIds.length,
        completedTopicCount: childTopicIds.filter((id) => completedIds.has(id)).length,
      };
    };

    const lockedEdgeColor = themeColor("--border-strong", "#cfc8bb");
    const moduleEdgeColor = themeColor("--accent-strong", "#3d6b60");
    const topicEdgeColor = themeColor("--accent", "#5f8f83");

    const initialEdges: Edge[] = graphEdges
      .filter((edge) => topicsById.has(edge.source) && topicsById.has(edge.target))
      .map((edge) => {
        const target = topicsById.get(edge.target);
        const targetIsModule = target ? isModuleTopic(target) : false;
        const isLocked = lockedByTopic.get(edge.target) ?? false;
        const edgeColor = isLocked
          ? lockedEdgeColor
          : targetIsModule
            ? moduleEdgeColor
            : topicEdgeColor;

        return {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          type: "default",
          label: edge.label ?? undefined,
          style: {
            stroke: edgeColor,
            strokeWidth: targetIsModule ? 3 : 2,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: edgeColor,
            width: 18,
            height: 18,
          },
        } as Edge;
      });

    const allPositioned = topics.length > 0 && topics.every(
      (topic) => topic.position_x !== null && topic.position_y !== null
    );

    let initialNodes: Node[] = topics.map((topic) => {
      const isModule = isModuleTopic(topic);
      const status = progress.find((entry) => entry.topic_id === topic.id)?.status || "unread";

      return {
        id: topic.id,
        type: "topicNode",
        data: {
          topic,
          status,
          isLocked: lockedByTopic.get(topic.id) ?? false,
          lockReason: lockReasonByTopic.get(topic.id),
          isModule,
          nodeType: topic.node_type,
          hasQuiz: quizzes.some((quiz) => quiz.topic_id === topic.id),
          ...(isModule ? getModuleMeta(topic) : {}),
          onClick: setSelectedTopic,
        },
        position: allPositioned
          ? { x: topic.position_x as number, y: topic.position_y as number }
          : { x: 0, y: 0 },
      };
    });

    if (!allPositioned) {
      initialNodes = layoutRoadmapGraph(initialNodes, initialEdges);
    }

    return { nodes: initialNodes, edges: initialEdges };
  }, [topics, progress, roadmapEdges, quizzes]);

  const nodeTypes = useMemo(() => ({ topicNode: TopicNode }), []);

  const courseTopicIds = useMemo(() => new Set(topics.map(t => t.id)), [topics]);
  const completedTopicCount = useMemo(
    () => progress.filter(p => courseTopicIds.has(p.topic_id) && p.status === "completed").length,
    [progress, courseTopicIds]
  );
  const topicProgressPercent = topics.length > 0
    ? Math.round((completedTopicCount / topics.length) * 100)
    : 0;

  if (loading) return <div style={{ color: "var(--text-main)", padding: 40 }}>Loading Course...</div>;
  if (loadError) return <div style={{ color: "var(--text-main)", padding: 40 }}>{loadError}</div>;
  if (!course) return <div style={{ color: "var(--text-main)", padding: 40 }}>Course not found.</div>;

  const canvasGridColor = themeColor("--border-color", "#e3ded4");
  const moduleMiniMapColor = themeColor("--accent-strong", "#3d6b60");
  const topicMiniMapColor = themeColor("--accent", "#5f8f83");
  const miniMapMaskColor = `rgba(${themeColor("--ink-rgb", "44, 58, 55")}, 0.08)`;

  const sectionFinalExam = sectionId
    ? quizzes.find((quiz) => !quiz.topic_id && quiz.section_id === sectionId)
    : undefined;
  const courseFinalExam = quizzes.find((quiz) => !quiz.topic_id && !quiz.section_id);
  const finalExam = sectionFinalExam || courseFinalExam;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.roadmapColumn}>
        <div className={styles.header}>
          <Link href="/roadmap" className={styles.backLink}>← Back to Main Roadmap</Link>
          <div className={styles.headerMain}>
            <div>
              <h1 className={styles.title}>{course.code}: {course.title}</h1>
              <p className={styles.desc}>{course.description}</p>
              <div className={styles.courseMetaRow}>
                <span className={styles.metaChip}>📚 {course.category}</span>
                <span className={styles.metaChip}>🎓 {course.credits} credits</span>
                {sectionInfo && (
                  <span className={styles.metaChip}>
                    🏷️ {sectionInfo.section_code} · {sectionInfo.academic_year} · {sectionInfo.term}
                  </span>
                )}
                {course.prerequisite_code && (
                  <span className={styles.metaChip}>🔗 Prerequisite: {course.prerequisite_code}</span>
                )}
              </div>
            </div>

            {finalExam && (
              <Link
                href={`/roadmap/course/${courseId}/quiz/${finalExam.id}`}
                className={styles.finalExamBtn}
              >
                ⚠️ Take Final Exam
              </Link>
            )}
          </div>

          {topics.length > 0 && (
            <div className={styles.progressWrap}>
              <div className={styles.progressLabelRow}>
                <span>Course Progress</span>
                <span>{completedTopicCount} / {topics.length} topics · {topicProgressPercent}%</span>
              </div>
              <div className={styles.progressTrack}>
                <div className={styles.progressFill} style={{ width: `${topicProgressPercent}%` }} />
              </div>
            </div>
          )}

          {saveError && <div className={styles.inlineError}>{saveError}</div>}
        </div>

        {topics.length === 0 ? (
          <div className={styles.emptySyllabus}>
            <div className={styles.emptyIcon}>📚</div>
            <h2 className={styles.emptyTitle}>No syllabus yet</h2>
            <p className={styles.emptyText}>
              This course doesn&apos;t have any topics yet. An administrator can add
              topics, resources, and quizzes from the Admin Panel.
            </p>
            <Link href="/roadmap" className={styles.emptyAction}>
              Back to Roadmap
            </Link>
          </div>
        ) : (
          <div className={styles.treeArea}>
            <div className={styles.treeHint}>Drag to pan · Scroll to zoom</div>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.1, minZoom: 0.6, maxZoom: 1.15 }}
              minZoom={0.3}
              maxZoom={2}
              colorMode="light"
              proOptions={{ hideAttribution: true }}
              nodesDraggable={false}
            >
              <Background bgColor="var(--bg-card)" color={canvasGridColor} gap={18} />
              <Controls />
              <MiniMap
                pannable
                zoomable
                position="top-right"
                className={styles.minimap}
                maskColor={miniMapMaskColor}
                nodeColor={(node) =>
                  (node.data as { isModule?: boolean } | undefined)?.isModule
                    ? moduleMiniMapColor
                    : topicMiniMapColor
                }
              />
            </ReactFlow>
          </div>
        )}
      </div>

      <button className={styles.floatingChatBtn} onClick={() => setIsChatOpen(true)}>
        ✨ Ask AI Tutor
      </button>

      {isChatOpen && (
        <div className={styles.chatWindow}>
          <div className={styles.chatHeader}>
            <div>
              <h2>✨ AI Course Tutor</h2>
              <p>Ask me anything about {course.code}!</p>
            </div>
            <button className={styles.closeChatBtn} onClick={() => setIsChatOpen(false)}>✕</button>
          </div>
          <div className={styles.chatMessages}>
            {messages.length === 0 && (
              <div className={styles.chatPlaceholder}>
                <p>Hi! I&apos;m your AI tutor for <strong>{course.title}</strong>.</p>
                <p>I know your syllabus. Try asking:</p>
                <ul>
                  <li>&quot;Can you explain the OSI model?&quot;</li>
                  <li>&quot;Give me an example of polymorphism.&quot;</li>
                  <li>&quot;What are the learning objectives?&quot;</li>
                </ul>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`${styles.message} ${msg.role === "user" ? styles.userMsg : styles.aiMsg}`}>
                <div className={styles.markdown}>
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            ))}
            {isTyping && <div className={`${styles.message} ${styles.aiMsg}`}>Typing...</div>}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSendMessage} className={styles.chatInputArea}>
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask a question..." className={styles.chatInput} />
            <button type="submit" className={styles.sendBtn} disabled={isTyping}>Send</button>
          </form>
        </div>
      )}

      {selectedTopic && (
        <TopicModal
          topic={selectedTopic}
          status={progress.find(p => p.topic_id === selectedTopic.id)?.status || "unread"}
          hasQuiz={quizzes.some(q => q.topic_id === selectedTopic.id)}
          nodeType={selectedTopic.node_type}
          onTakeQuiz={() => {
            const topicQuiz = quizzes.find(q => q.topic_id === selectedTopic.id);
            if (topicQuiz) router.push(`/roadmap/course/${courseId}/quiz/${topicQuiz.id}`);
          }}
          onClose={() => setSelectedTopic(null)}
          onUpdateStatus={(status) => updateTopicStatus(selectedTopic.id, status)}
        />
      )}
    </div>
  );
}
