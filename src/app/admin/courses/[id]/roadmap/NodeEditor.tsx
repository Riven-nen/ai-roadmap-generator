"use client";

import { useState } from "react";
import type { DraftNode } from "@/lib/roadmapDraft";
import type { Course, Quiz, TopicNodeType } from "@/types";
import styles from "./roadmapBuilder.module.css";

type AIContext = {
  course: Course;
  preceding: Array<{
    title: string;
    node_type: TopicNodeType;
    description: string;
  }>;
  outline: Array<{
    title: string;
    node_type: TopicNodeType;
  }>;
};

type Props = {
  initial: DraftNode;
  isNew: boolean;
  quizzes: Quiz[];
  usedQuizIds: Set<string>;
  aiContext: AIContext;
  onClose: () => void;
  onSave: (node: DraftNode) => void;
  onDelete?: () => void;
};

type GeneratedNodeContent = {
  description?: string;
  overview?: string;
  content?: string;
  learning_objectives?: string[];
  estimated_time?: string;
  resource_name?: string;
  resource_url?: string;
};

const nodeTypes: Array<{ value: TopicNodeType; label: string }> = [
  { value: "module", label: "Section / Module" },
  { value: "topic", label: "Topic" },
  { value: "quiz", label: "Quiz" },
  { value: "material", label: "Material" },
  { value: "coursework", label: "Coursework" },
];

export default function NodeEditor({
  initial,
  isNew,
  quizzes,
  usedQuizIds,
  aiContext,
  onClose,
  onSave,
  onDelete,
}: Props) {
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [overview, setOverview] = useState(initial.overview);
  const [content, setContent] = useState(initial.content);
  const [nodeType, setNodeType] = useState<TopicNodeType>(initial.node_type);
  const [estimatedTime, setEstimatedTime] = useState(initial.estimated_time);
  const [resourceName, setResourceName] = useState(initial.resource_name);
  const [resourceUrl, setResourceUrl] = useState(initial.resource_url);
  const [objectives, setObjectives] = useState(
    (initial.learning_objectives ?? []).join(", ")
  );
  const [quizId, setQuizId] = useState(initial.quiz_id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiNotice, setAiNotice] = useState<string | null>(null);

  const availableQuizzes = quizzes.filter(
    (quiz) =>
      quiz.id === initial.quiz_id ||
      (!usedQuizIds.has(quiz.id) &&
        (quiz.topic_id !== null || quiz.section_id === null))
  );

  async function handleGenerate() {
    const cleanTitle = title.trim();

    if (!cleanTitle) {
      setAiError("Add a title first so the AI knows what to write about.");
      return;
    }

    setGenerating(true);
    setAiError(null);
    setAiNotice(null);

    try {
      const response = await fetch("/api/ai/node", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course: aiContext.course,
          node: { title: cleanTitle, node_type: nodeType },
          preceding: aiContext.preceding,
          outline: aiContext.outline,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not generate this node.");
      }

      const generated = (data.content ?? {}) as GeneratedNodeContent;

      if (generated.description) setDescription(generated.description);
      if (generated.overview) setOverview(generated.overview);
      if (generated.content) setContent(generated.content);
      if (generated.estimated_time) setEstimatedTime(generated.estimated_time);
      if (generated.resource_name) setResourceName(generated.resource_name);
      if (generated.resource_url) setResourceUrl(generated.resource_url);
      if (Array.isArray(generated.learning_objectives)) {
        setObjectives(generated.learning_objectives.join(", "));
      }

      setAiNotice("AI filled this node. Review it, then save.");
    } catch (generationError) {
      setAiError(
        generationError instanceof Error
          ? generationError.message
          : "Could not generate this node."
      );
    } finally {
      setGenerating(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Give this node a title.");
      return;
    }

    onSave({
      ...initial,
      title: title.trim(),
      description: description.trim(),
      overview: overview.trim(),
      content: content.trim(),
      node_type: nodeType,
      estimated_time: estimatedTime.trim(),
      resource_name: resourceName.trim(),
      resource_url: resourceUrl.trim(),
      learning_objectives: objectives
        .split(",")
        .map((objective) => objective.trim())
        .filter(Boolean),
      quiz_id: nodeType === "quiz" ? quizId || null : null,
    });
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(event) => event.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div>
            <p className={styles.modalEyebrow}>Draft only</p>
            <h2 className={styles.modalTitle}>{isNew ? "Add roadmap node" : "Edit roadmap node"}</h2>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <form className={styles.editorForm} onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span className={styles.label}>Node type</span>
              <select
                className={styles.input}
                value={nodeType}
                onChange={(event) => setNodeType(event.target.value as TopicNodeType)}
              >
                {nodeTypes.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Estimated time</span>
              <input
                className={styles.input}
                value={estimatedTime}
                onChange={(event) => setEstimatedTime(event.target.value)}
                placeholder="e.g. 45 mins"
              />
            </label>

            <label className={`${styles.field} ${styles.fieldFull}`}>
              <span className={styles.label}>Title</span>
              <input
                className={styles.input}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
              />
            </label>

            <div className={`${styles.aiBar} ${styles.fieldFull}`}>
              <div className={styles.aiBarText}>
                <span className={styles.aiBarTitle}>✨ AI assistant</span>
                <span className={styles.aiBarHint}>
                  Uses this title and the course
                  {aiContext.preceding.length > 0
                    ? `, plus ${aiContext.preceding.length} preceding node${
                        aiContext.preceding.length === 1 ? "" : "s"
                      }`
                    : ""}{" "}
                  to draft the fields below.
                </span>
              </div>
              <button
                type="button"
                className={styles.aiBtn}
                onClick={() => void handleGenerate()}
                disabled={generating || !title.trim()}
              >
                {generating ? "Writing..." : "Write with AI"}
              </button>
            </div>

            {aiError && (
              <div className={`${styles.fieldFull} ${styles.aiMessage} ${styles.aiMessageError}`}>
                {aiError}
              </div>
            )}

            {aiNotice && (
              <div className={`${styles.fieldFull} ${styles.aiMessage} ${styles.aiMessageSuccess}`}>
                {aiNotice}
              </div>
            )}

            <label className={`${styles.field} ${styles.fieldFull}`}>
              <span className={styles.label}>Short description</span>
              <input
                className={styles.input}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Shown on the roadmap node"
              />
            </label>

            <label className={`${styles.field} ${styles.fieldFull}`}>
              <span className={styles.label}>Overview</span>
              <textarea
                className={styles.textarea}
                rows={3}
                value={overview}
                onChange={(event) => setOverview(event.target.value)}
                placeholder="A short introduction shown in the student modal"
              />
            </label>

            <label className={`${styles.field} ${styles.fieldFull}`}>
              <span className={styles.label}>Extra information / coursework instructions</span>
              <textarea
                className={styles.textarea}
                rows={4}
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Paste readings, instructions, notes, or coursework details"
              />
            </label>

            <label className={`${styles.field} ${styles.fieldFull}`}>
              <span className={styles.label}>Learning objectives (comma separated)</span>
              <textarea
                className={styles.textarea}
                rows={2}
                value={objectives}
                onChange={(event) => setObjectives(event.target.value)}
                placeholder="Understand X, apply Y, explain Z"
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Resource name</span>
              <input
                className={styles.input}
                value={resourceName}
                onChange={(event) => setResourceName(event.target.value)}
                placeholder="e.g. Python tutorial"
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Resource URL</span>
              <input
                className={styles.input}
                type="url"
                value={resourceUrl}
                onChange={(event) => setResourceUrl(event.target.value)}
                placeholder="https://..."
              />
            </label>
          </div>

          {nodeType === "quiz" && (
            <div className={styles.quizSection}>
              <label className={styles.field}>
                <span className={styles.label}>Linked quiz</span>
                <select
                  className={styles.input}
                  value={quizId}
                  onChange={(event) => setQuizId(event.target.value)}
                >
                  <option value="">No quiz selected</option>
                  {availableQuizzes.map((quiz) => (
                    <option key={quiz.id} value={quiz.id}>
                      {quiz.title}{quiz.topic_id === null ? " (final exam)" : ""}
                    </option>
                  ))}
                </select>
              </label>
              <p className={styles.hint}>
                Quizzes are predetermined at the course level. A quiz can only be linked to one roadmap node.
              </p>
            </div>
          )}

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.editorActions}>
            {!isNew && onDelete && (
              <button type="button" className={styles.dangerBtn} onClick={onDelete}>
                Delete node
              </button>
            )}
            <div className={styles.rightActions}>
              <button type="button" className={styles.secondaryBtn} onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className={styles.primaryBtn}>
                {isNew ? "Add node" : "Save node"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
