"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Course, CourseTopic } from "@/types";
import styles from "./manage.module.css";

export default function ManageCourseTopics() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [topics, setTopics] = useState<CourseTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [overview, setOverview] = useState("");
  const [objectives, setObjectives] = useState("");
  const [time, setTime] = useState("");
  const [resourceName, setResourceName] = useState("");
  const [resourceUrl, setResourceUrl] = useState("");
  const [parentId, setParentId] = useState<string>("");

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      
      const { data: courseData } = await supabase.from("courses").select("*").eq("id", courseId).single();
      const { data: topicsData } = await supabase.from("course_topics").select("*").eq("course_id", courseId).order("created_at");

      setCourse(courseData);
      setTopics(topicsData || []);
      setLoading(false);
    }
    if (courseId) fetchData();
  }, [courseId]);

  async function handleAddTopic(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

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
      overview,
      learning_objectives: objectivesArray,
      estimated_time: time,
      resource_name: resourceName,
      resource_url: resourceUrl
    });

    if (error) {
      alert("Error adding topic: " + error.message);
    } else {
      // Reset form
      setTitle("");
      setDescription("");
      setOverview("");
      setObjectives("");
      setTime("");
      setResourceName("");
      setResourceUrl("");
      setParentId("");
      
      // Refresh topics list
      const { data } = await supabase.from("course_topics").select("*").eq("course_id", courseId).order("created_at");
      setTopics(data || []);
    }
    setIsSubmitting(false);
  }

  if (loading) return <div style={{ color: "white", padding: 40 }}>Loading...</div>;
  if (!course) return <div style={{ color: "white", padding: 40 }}>Course not found.</div>;

  const rootTopics = topics.filter(t => !t.parent_id);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/admin/courses" className={styles.backLink}>← Back to Courses</Link>
        <h1 className={styles.title}>Manage Syllabus: {course.code} - {course.title}</h1>
      </div>

      <div className={styles.grid}>
        
        {/* Left Side: Existing Topics */}
        <div className={styles.topicList}>
          <h2 className={styles.sectionTitle}>Current Syllabus</h2>
          {rootTopics.length === 0 ? (
            <p style={{ color: "#94a3b8" }}>No topics added yet.</p>
          ) : (
            rootTopics.map(root => {
              const children = topics.filter(t => t.parent_id === root.id);
              return (
                <div key={root.id} className={styles.topicGroup}>
                  <div className={styles.topicCard}>
                    <strong>{root.title}</strong> (Root)
                  </div>
                  {children.map(child => (
                    <div key={child.id} className={`${styles.topicCard} ${styles.childCard}`}>
                      ↳ {child.title}
                    </div>
                  ))}
                </div>
              );
            })
          )}
        </div>

        {/* Right Side: Add New Topic Form */}
        <div className={styles.formPanel}>
          <h2 className={styles.sectionTitle}>Add New Topic</h2>
          <form onSubmit={handleAddTopic} className={styles.form}>
            
            <label className={styles.label}>Parent Topic (Optional)</label>
            <select value={parentId} onChange={e => setParentId(e.target.value)} className={styles.input}>
              <option value="">None (Make this a Root Topic)</option>
              {rootTopics.map(t => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>

            <label className={styles.label}>Topic Title</label>
            <input required value={title} onChange={e => setTitle(e.target.value)} className={styles.input} />

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