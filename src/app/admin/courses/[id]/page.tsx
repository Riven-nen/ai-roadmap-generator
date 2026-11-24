"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Course, CourseTopic } from "@/types";
import styles from "./manage.module.css";

type FlatTopic = {
  topic: CourseTopic;
  depth: number;
};

type Notice = {
  type: "success" | "error";
  text: string;
};

function flattenTopics(
  topics: CourseTopic[],
  parentId: string | null = null,
  depth = 0,
  visited = new Set<string>()
): FlatTopic[] {
  const result: FlatTopic[] = [];

  for (const topic of topics) {
    if ((topic.parent_id ?? null) !== parentId) continue;
    if (visited.has(topic.id)) continue;

    visited.add(topic.id);
    result.push({ topic, depth });
    result.push(...flattenTopics(topics, topic.id, depth + 1, visited));
  }

  return result;
}

/** Children before parents, so a branch can be deleted safely. */
function collectSubtreePostOrder(
  topics: CourseTopic[],
  rootId: string
): string[] {
  const result: string[] = [];
  const visited = new Set<string>();

  const walk = (id: string) => {
    if (visited.has(id)) return;
    visited.add(id);

    for (const child of topics) {
      if (child.parent_id === id) walk(child.id);
    }

    result.push(id);
  };

  walk(rootId);
  return result;
}

export default function ManageCourseTopics() {
  const params = useParams();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [topics, setTopics] = useState<CourseTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [overview, setOverview] = useState("");
  const [objectives, setObjectives] = useState("");
  const [time, setTime] = useState("");
  const [resourceName, setResourceName] = useState("");
  const [resourceUrl, setResourceUrl] = useState("");
  const [parentId, setParentId] = useState<string>("");

  const titleInputRef = useRef<HTMLInputElement>(null);
  const formPanelRef = useRef<HTMLDivElement>(null);

  const loadTopics = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("course_topics")
      .select("*")
      .eq("course_id", courseId)
      .order("created_at");

    setTopics((data || []) as CourseTopic[]);
  }, [courseId]);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();

      const { data: courseData } = await supabase.from("courses").select("*").eq("id", courseId).single();
      const { data: topicsData } = await supabase
        .from("course_topics")
        .select("*")
        .eq("course_id", courseId)
        .order("created_at");

      setCourse(courseData);
      setTopics((topicsData || []) as CourseTopic[]);
      setLoading(false);
    }
    if (courseId) fetchData();
  }, [courseId]);

  const flatTopics = useMemo(() => flattenTopics(topics), [topics]);

  const directChildCount = useMemo(() => {
    const counts = new Map<string, number>();
    for (const topic of topics) {
      if (!topic.parent_id) continue;
      counts.set(topic.parent_id, (counts.get(topic.parent_id) || 0) + 1);
    }
    return counts;
  }, [topics]);

  async function handleAddTopic(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setNotice(null);

    const supabase = createClient();

    // Convert comma-separated objectives string to an array
    const objectivesArray = objectives
      .split(",")
      .map(o => o.trim())
      .filter(o => o !== "");

    const { error } = await supabase.from("course_topics").insert({
      course_id: courseId,
      parent_id: parentId || null,
      title,
      description,
      overview: overview || null,
      learning_objectives: objectivesArray.length > 0 ? objectivesArray : null,
      estimated_time: time || null,
      resource_name: resourceName || null,
      resource_url: resourceUrl || null
    });

    if (error) {
      setNotice({ type: "error", text: `Error adding topic: ${error.message}` });
    } else {
      setNotice({ type: "success", text: `Added "${title}".` });

      // Reset form
      setTitle("");
      setDescription("");
      setOverview("");
      setObjectives("");
      setTime("");
      setResourceName("");
      setResourceUrl("");
      setParentId("");

      await loadTopics();
    }
    setIsSubmitting(false);
  }

  async function handleDeleteTopic(topic: CourseTopic) {
    const branch = collectSubtreePostOrder(topics, topic.id);
    const childCount = branch.length - 1;
    const confirmation = childCount > 0
      ? `Delete "${topic.title}" and its ${childCount} sub-topic${childCount === 1 ? "" : "s"}? This cannot be undone.`
      : `Delete "${topic.title}"? This cannot be undone.`;

    if (!window.confirm(confirmation)) return;

    setDeletingId(topic.id);
    setNotice(null);

    const supabase = createClient();
    for (const id of branch) {
      const { error } = await supabase.from("course_topics").delete().eq("id", id);
      if (error) {
        setNotice({
          type: "error",
          text: `Couldn't delete the topic: ${error.message}`,
        });
        setDeletingId(null);
        await loadTopics();
        return;
      }
    }

    if (topic.id === parentId) setParentId("");
    setNotice({
      type: "success",
      text: `Deleted "${topic.title}"${childCount > 0 ? ` and ${childCount} sub-topic${childCount === 1 ? "" : "s"}` : ""}.`,
    });
    setDeletingId(null);
    await loadTopics();
  }

  function handleAddSubTopic(topic: CourseTopic) {
    setParentId(topic.id);
    setNotice({
      type: "success",
      text: `New topics will be added under "${topic.title}".`,
    });
    formPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    titleInputRef.current?.focus();
  }

  if (loading) return <div style={{ color: "var(--text-main)", padding: 40 }}>Loading...</div>;
  if (!course) return <div style={{ color: "var(--text-main)", padding: 40 }}>Course not found.</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/admin/courses" className={styles.backLink}>← Back to Courses</Link>
        <h1 className={styles.title}>Manage Syllabus: {course.code} - {course.title}</h1>
        <p className={styles.subtitle}>
          {topics.length} topic{topics.length === 1 ? "" : "s"} across {flatTopics.filter(t => t.depth === 0).length} root branch{flatTopics.filter(t => t.depth === 0).length === 1 ? "" : "es"}.
          Sub-topics unlock in order on the student roadmap.
        </p>
      </div>

      <div className={styles.grid}>

        {/* Left Side: Existing Topics */}
        <div className={styles.topicList}>
          <h2 className={styles.sectionTitle}>Current Syllabus</h2>

          {flatTopics.length === 0 ? (
            <div className={styles.emptyState}>
              <p style={{ color: "var(--text-muted)" }}>No topics added yet.</p>
              <p className={styles.emptyHint}>Add the first root topic using the form on the right.</p>
            </div>
          ) : (
            flatTopics.map(({ topic, depth }) => {
              const childCount = directChildCount.get(topic.id) || 0;
              const isDeleting = deletingId === topic.id;

              return (
                <div
                  key={topic.id}
                  className={styles.topicRow}
                  style={{ marginLeft: depth * 20 }}
                >
                  <div
                    className={`${styles.topicCard} ${depth > 0 ? styles.childCard : ""}`}
                    style={{ borderLeftWidth: depth > 0 ? 3 : 1 }}
                  >
                    <div className={styles.topicInfo}>
                      <div className={styles.topicTitleRow}>
                        <strong className={styles.topicTitle}>{topic.title}</strong>
                        <span className={styles.depthBadge}>
                          {depth === 0 ? "Root" : `Level ${depth}`}
                        </span>
                        {childCount > 0 && (
                          <span className={styles.childCount}>{childCount} sub-topic{childCount === 1 ? "" : "s"}</span>
                        )}
                      </div>
                      <p className={styles.topicDesc}>{topic.description}</p>
                    </div>

                    <div className={styles.topicActions}>
                      <button
                        type="button"
                        className={styles.smallBtn}
                        onClick={() => handleAddSubTopic(topic)}
                      >
                        + Sub-topic
                      </button>
                      <button
                        type="button"
                        className={styles.dangerBtn}
                        onClick={() => handleDeleteTopic(topic)}
                        disabled={isDeleting}
                      >
                        {isDeleting ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Side: Add New Topic Form */}
        <div className={styles.formPanel} ref={formPanelRef}>
          <h2 className={styles.sectionTitle}>Add New Topic</h2>

          {notice && (
            <div className={`${styles.notice} ${notice.type === "success" ? styles.noticeSuccess : styles.noticeError}`}>
              {notice.text}
            </div>
          )}

          <form onSubmit={handleAddTopic} className={styles.form}>

            <label className={styles.label}>Parent Topic (Optional)</label>
            <select value={parentId} onChange={e => setParentId(e.target.value)} className={styles.input}>
              <option value="">None (Make this a Root Topic)</option>
              {flatTopics.map(({ topic, depth }) => (
                <option key={topic.id} value={topic.id}>
                  {`${"— ".repeat(depth)}${topic.title}`}
                </option>
              ))}
            </select>
            {parentId && (
              <p className={styles.formHint}>
                This topic will unlock after &quot;{flatTopics.find(t => t.topic.id === parentId)?.topic.title}&quot; is completed.
              </p>
            )}

            <label className={styles.label}>Topic Title</label>
            <input ref={titleInputRef} required value={title} onChange={e => setTitle(e.target.value)} className={styles.input} />

            <label className={styles.label}>Short Description</label>
            <input required value={description} onChange={e => setDescription(e.target.value)} className={styles.input} />

            <label className={styles.label}>In-depth Overview</label>
            <textarea rows={3} value={overview} onChange={e => setOverview(e.target.value)} className={styles.input} />

            <label className={styles.label}>Learning Objectives (comma separated)</label>
            <textarea rows={2} placeholder="e.g. Understand X, Learn Y, Apply Z" value={objectives} onChange={e => setObjectives(e.target.value)} className={styles.input} />

            <label className={styles.label}>Estimated Time</label>
            <input placeholder="e.g. 45 mins" value={time} onChange={e => setTime(e.target.value)} className={styles.input} />

            <label className={styles.label}>Resource Name</label>
            <input placeholder="e.g. W3Schools Guide" value={resourceName} onChange={e => setResourceName(e.target.value)} className={styles.input} />

            <label className={styles.label}>Resource URL</label>
            <input type="url" placeholder="https://..." value={resourceUrl} onChange={e => setResourceUrl(e.target.value)} className={styles.input} />

            <button type="submit" disabled={isSubmitting} className={styles.submitBtn}>
              {isSubmitting ? "Adding..." : "Add Topic"}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
