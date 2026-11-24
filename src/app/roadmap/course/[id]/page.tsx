"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { ReactFlow, Background, Controls, type Edge, type Node } from "@xyflow/react";
import dagre from "dagre";
import "@xyflow/react/dist/style.css";
import { createClient } from "@/lib/supabase/client";
import { Course, CourseTopic, Quiz } from "@/types";
import styles from "./course.module.css";
import TopicModal from "./TopicModal";
import TopicNode from "./TopicNode";

type Progress = {
  topic_id: string;
  status: "unread" | "reading" | "completed";
};

const nodeWidth = 200;
const nodeHeight = 80;

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  // Standard centered tree layout
  dagreGraph.setGraph({
    rankdir: "TB",
    nodesep: 40,
    ranksep: 80
  });

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

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [topics, setTopics] = useState<CourseTopic[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
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

      const [courseResult, topicsResult, quizzesResult] = await Promise.all([
        supabase.from("courses").select("*").eq("id", courseId).single(),
        supabase.from("course_topics").select("*").eq("course_id", courseId).order("created_at"),
        supabase.from("quizzes").select("*").eq("course_id", courseId),
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

      setCourse(courseResult.data);
      setTopics(topicsResult.data || []);
      setQuizzes(quizzesResult.data || []);
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
    const initialNodes: Node[] = [];
    const initialEdges: Edge[] = [];

    const rootTopics = topics.filter(t => !t.parent_id);

    const traverse = (parentId: string | null, isParentCompleted: boolean) => {
      const children = topics.filter(t => t.parent_id === parentId);
      const parentTopic = parentId ? topics.find(t => t.id === parentId) : undefined;

      children.forEach((child) => {
        const childProgress = progress.find(p => p.topic_id === child.id);
        const isChildCompleted = childProgress?.status === "completed";
        const isLocked = !isParentCompleted && childProgress?.status !== "completed";

        initialNodes.push({
          id: child.id,
          type: "topicNode",
          data: {
            topic: child,
            status: childProgress?.status || "unread",
            isLocked,
            lockReason: isLocked ? parentTopic?.title : undefined,
            onClick: setSelectedTopic
          },
          position: { x: 0, y: 0 },
        });

        if (parentId) {
          initialEdges.push({
            id: `${parentId}-${child.id}`,
            source: parentId,
            target: child.id,
            type: "smoothstep",
            style: { stroke: isLocked ? "#cbd5e1" : "#94a3b8", strokeWidth: 2 },
          });
        }

        traverse(child.id, isChildCompleted);
      });
    };

    rootTopics.forEach(root => {
      const rootProgress = progress.find(p => p.topic_id === root.id);
      const isRootCompleted = rootProgress?.status === "completed";

      initialNodes.push({
        id: root.id,
        type: "topicNode",
        data: {
          topic: root,
          status: rootProgress?.status || "unread",
          isLocked: false,
          onClick: setSelectedTopic
        },
        position: { x: 0, y: 0 },
      });

      traverse(root.id, isRootCompleted);
    });

    return getLayoutedElements(initialNodes, initialEdges);
  }, [topics, progress]);

  const nodeTypes = useMemo(() => ({ topicNode: TopicNode }), []);

  const courseTopicIds = useMemo(() => new Set(topics.map(t => t.id)), [topics]);
  const completedTopicCount = useMemo(
    () => progress.filter(p => courseTopicIds.has(p.topic_id) && p.status === "completed").length,
    [progress, courseTopicIds]
  );
  const topicProgressPercent = topics.length > 0
    ? Math.round((completedTopicCount / topics.length) * 100)
    : 0;

  if (loading) return <div style={{ color: "#0b1f3a", padding: 40 }}>Loading Course...</div>;
  if (loadError) return <div style={{ color: "#0b1f3a", padding: 40 }}>{loadError}</div>;
  if (!course) return <div style={{ color: "#0b1f3a", padding: 40 }}>Course not found.</div>;

  const finalExam = quizzes.find(q => !q.topic_id);

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
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              minZoom={0.4}
              maxZoom={2}
              colorMode="light"
              proOptions={{ hideAttribution: true }}
              nodesDraggable={false}
            >
              <Background color="#e2e8f0" gap={16} />
              <Controls />
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
