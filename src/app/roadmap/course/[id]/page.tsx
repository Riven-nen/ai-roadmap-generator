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
      
      const { data: courseData } = await supabase.from("courses").select("*").eq("id", courseId).single();
      const { data: topicsData } = await supabase.from("course_topics").select("*").eq("course_id", courseId).order("created_at");
      const { data: quizzesData } = await supabase.from("quizzes").select("*").eq("course_id", courseId);
      
      let progressData: any[] = [];
      if (user) {
        const { data } = await supabase.from("student_topic_progress").select("*").eq("user_id", user.id);
        progressData = data || [];
      }

      setCourse(courseData);
      setTopics(topicsData || []);
      setQuizzes(quizzesData || []);
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
      setMessages([...newMessages, { role: "assistant", content: data.reply }]);
    } catch (error) {
      setMessages([...newMessages, { role: "assistant", content: "Error connecting to AI." }]);
    } finally {
      setIsTyping(false);
    }
  }

  const updateTopicStatus = async (topicId: string, newStatus: "reading" | "completed") => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("student_topic_progress").upsert({
      user_id: user.id,
      topic_id: topicId,
      status: newStatus,
      updated_at: new Date().toISOString()
    }, { onConflict: "user_id, topic_id" });

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
            style: { stroke: isLocked ? "#334155" : "#475569", strokeWidth: 2 },
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

  if (loading) return <div style={{ color: "white", padding: 40 }}>Loading Course...</div>;
  if (!course) return <div style={{ color: "white", padding: 40 }}>Course not found.</div>;

  const finalExam = quizzes.find(q => !q.topic_id);

  return (
    <div className={styles.pageContainer}>
      <div className={styles.roadmapColumn}>
        <div className={styles.header}>
          <Link href="/roadmap" className={styles.backLink}>← Back to Main Roadmap</Link>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <h1 className={styles.title}>{course.code}: {course.title}</h1>
              <p className={styles.desc}>{course.description}</p>
            </div>
            
            {finalExam && (
              <Link 
                href={`/roadmap/course/${courseId}/quiz/${finalExam.id}`}
                style={{ 
                  background: "linear-gradient(to right, #eab308, #f97316)", 
                  color: "white", padding: "12px 24px", borderRadius: "8px", 
                  textDecoration: "none", fontWeight: "bold", marginLeft: 20, whiteSpace: "nowrap"
                }}
              >
                ⚠️ Take Final Exam
              </Link>
            )}
          </div>
        </div>

        <div style={{ flex: 1, width: "100%", height: "100%" }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.4} // <--- CHANGED: Prevents zooming out into a tiny line
            maxZoom={2}
            colorMode="dark"
            proOptions={{ hideAttribution: true }}
            nodesDraggable={false}
          >
            <Background color="#2a2f45" gap={16} />
            <Controls />
          </ReactFlow>
        </div>
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
                <p>Hi! I'm your AI tutor for <strong>{course.title}</strong>.</p>
                <p>I know your syllabus. Try asking:</p>
                <ul>
                  <li>"Can you explain the OSI model?"</li>
                  <li>"Give me an example of polymorphism."</li>
                  <li>"What are the learning objectives?"</li>
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