"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getFinalExamEligibility } from "@/lib/finalExam";
import { Quiz } from "@/types";
import styles from "./quiz.module.css";

type FinalExamBlock = {
  title: string;
  message: string;
};

type ProctorState = {
  warnings: number;
  locked: boolean;
};

function readProctorState(key: string): ProctorState {
  if (typeof window === "undefined") return { warnings: 0, locked: false };

  try {
    const stored = window.sessionStorage.getItem(key);
    if (!stored) return { warnings: 0, locked: false };

    const parsed = JSON.parse(stored) as { warnings?: number; locked?: boolean };
    return {
      warnings: typeof parsed.warnings === "number" ? parsed.warnings : 0,
      locked: Boolean(parsed.locked),
    };
  } catch {
    return { warnings: 0, locked: false };
  }
}

type ClientQuestion = {
  id: string;
  quiz_id: string;
  question_text: string;
  options: Record<string, string>;
};

type QuizResult = {
  score: number;
  passed: boolean;
  correctCount: number;
  total: number;
};

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const quizId = params.quizId as string;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<ClientQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const [finalExamBlock, setFinalExamBlock] = useState<FinalExamBlock | null>(null);
  const proctorStorageKey = `it-roadmap-final-exam:${quizId}`;
  const [examLocked, setExamLocked] = useState(
    () => readProctorState(proctorStorageKey).locked
  );
  const [focusWarnings, setFocusWarnings] = useState(
    () => readProctorState(proctorStorageKey).warnings
  );
  const [showFocusWarning, setShowFocusWarning] = useState(false);
  const focusWarningsRef = useRef(focusWarnings);

  const isFinalExam = Boolean(quiz && !quiz.topic_id);

  useEffect(() => {
    async function fetchQuiz() {
      const supabase = createClient();

      const { data: quizData } = await supabase.from("quizzes").select("*").eq("id", quizId).single();

      // Do not select correct_option: grading happens in the server route.
      const { data: qData } = await supabase
        .from("quiz_questions")
        .select("id,quiz_id,question_text,options")
        .eq("quiz_id", quizId);

      const { data: { user } } = await supabase.auth.getUser();
      if (user && quizData?.topic_id) {
        const { data: progressData } = await supabase
          .from("student_topic_progress")
          .select("status")
          .eq("user_id", user.id)
          .eq("topic_id", quizData.topic_id)
          .maybeSingle();

        if (progressData?.status === "completed") {
          setAlreadyCompleted(true);
        }
      }

      if (user && quizData && !quizData.topic_id) {
        const [topicsResult, progressResult, enrollmentResult] = await Promise.all([
          supabase
            .from("course_topics")
            .select("id")
            .eq("course_id", quizData.course_id),
          supabase
            .from("student_topic_progress")
            .select("topic_id")
            .eq("user_id", user.id)
            .eq("status", "completed"),
          supabase
            .from("enrollments")
            .select("id, section_id")
            .eq("user_id", user.id)
            .eq("course_id", quizData.course_id)
            .maybeSingle(),
        ]);

        if (!enrollmentResult.data) {
          setFinalExamBlock({
            title: "Final exam unavailable",
            message: "You need to be enrolled in this subject before you can take its final exam.",
          });
        } else if (
          quizData.section_id &&
          enrollmentResult.data.section_id !== quizData.section_id
        ) {
          setFinalExamBlock({
            title: "Final exam unavailable",
            message: "This final exam belongs to a different section. Open the exam from your own class.",
          });
        } else {
          const eligibility = getFinalExamEligibility(
            (topicsResult.data ?? []).map((topic) => topic.id),
            new Set((progressResult.data ?? []).map((progress) => progress.topic_id))
          );

          if (!eligibility.eligible) {
            setFinalExamBlock({
              title: "Final exam locked",
              message: `Complete every topic in this subject first. You have finished ${eligibility.completedTopics} of ${eligibility.totalTopics} topics.`,
            });
          }
        }
      }

      setQuiz(quizData);
      setQuestions((qData || []) as ClientQuestion[]);
      setLoading(false);
    }
    fetchQuiz();
  }, [quizId]);

  useEffect(() => {
    if (!isFinalExam || result || finalExamBlock || examLocked) return;

    let lastViolation = 0;

    const registerViolation = () => {
      const now = Date.now();
      if (now - lastViolation < 1500) return;
      lastViolation = now;

      const next = focusWarningsRef.current + 1;
      focusWarningsRef.current = next;
      setFocusWarnings(next);

      const locked = next >= 3;
      if (locked) {
        setShowFocusWarning(false);
        setExamLocked(true);
      } else {
        setShowFocusWarning(true);
      }

      try {
        window.sessionStorage.setItem(
          proctorStorageKey,
          JSON.stringify({ warnings: next, locked })
        );
      } catch {
        // Ignore storage failures; the in-memory lock still applies.
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") registerViolation();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", registerViolation);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", registerViolation);
    };
  }, [examLocked, finalExamBlock, isFinalExam, proctorStorageKey, result]);

  useEffect(() => {
    if (!result) return;
    focusWarningsRef.current = 0;
    try {
      window.sessionStorage.removeItem(proctorStorageKey);
    } catch {
      // Ignore storage failures.
    }
  }, [proctorStorageKey, result]);

  const handleSelectOption = (questionId: string, option: string) => {
    setAnswers({ ...answers, [questionId]: option });
  };

  const handleSubmit = async () => {
    if (examLocked) {
      setError("This final exam is locked because you left the exam tab too many times.");
      return;
    }

    if (Object.keys(answers).length !== questions.length) {
      setError("Please answer all questions before submitting.");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId, answers }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "We couldn't submit your quiz. Please try again.");
        return;
      }

      setResult({
        score: data.score,
        passed: data.passed,
        correctCount: data.correctCount,
        total: data.total,
      });
    } catch {
      setError("We couldn't submit your quiz. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    setResult(null);
    setAnswers({});
    setError(null);
  };

  if (loading) return <div className={styles.container}>Loading Quiz...</div>;
  if (!quiz) return <div className={styles.container}>Quiz not found.</div>;

  if (finalExamBlock) {
    return (
      <div className={styles.container}>
        <div className={styles.resultCard}>
          <h1 className={styles.resultTitle}>{finalExamBlock.title}</h1>
          <p className={styles.resultText}>{finalExamBlock.message}</p>
          <button className={styles.backBtn} onClick={() => router.push(`/roadmap/course/${courseId}`)}>
            Back to Course
          </button>
        </div>
      </div>
    );
  }

  if (examLocked) {
    return (
      <div className={styles.container}>
        <div className={styles.resultCard}>
          <h1 className={styles.resultTitle}>Final exam locked</h1>
          <p className={styles.resultText}>
            You switched away from the final exam {focusWarnings} times. The exam has been locked
            for this attempt. Contact your professor if you need it reopened.
          </p>
          <button className={styles.backBtn} onClick={() => router.push(`/roadmap/course/${courseId}`)}>
            Back to Course
          </button>
        </div>
      </div>
    );
  }

  if (alreadyCompleted && !result) {
    return (
      <div className={styles.container}>
        <div className={styles.resultCard}>
          <h1 className={styles.resultTitle}>Already Completed</h1>
          <p className={styles.resultText}>
            You have already passed this quiz.
          </p>
          <button className={styles.backBtn} onClick={() => router.push(`/roadmap/course/${courseId}`)}>
            Back to Course
          </button>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className={styles.container}>
        <div className={styles.resultCard}>
          <h1 className={styles.resultTitle}>Quiz Completed</h1>
          <p className={styles.resultScore}>{result.score}%</p>
          <p className={`${styles.resultStatus} ${result.passed ? styles.passed : styles.failed}`}>
            {result.passed ? "PASSED" : "FAILED"}
          </p>
          <p className={styles.resultText}>
            You answered {result.correctCount} of {result.total} questions correctly.{" "}
            {result.passed
              ? "Your progress has been updated."
              : "Review the topic and try again when you're ready."}
          </p>
          <div className={styles.resultActions}>
            {!result.passed && (
              <button className={styles.retryBtn} onClick={handleRetry}>
                Try Again
              </button>
            )}
            <button className={styles.backBtn} onClick={() => router.push(`/roadmap/course/${courseId}`)}>
              Back to Course
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.resultCard}>
          <h1 className={styles.resultTitle}>No Questions Yet</h1>
          <p className={styles.resultText}>
            This quiz doesn&apos;t have any questions yet. Please check back later.
          </p>
          <button className={styles.backBtn} onClick={() => router.push(`/roadmap/course/${courseId}`)}>
            Back to Course
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {showFocusWarning && (
        <div
          className={styles.proctorOverlay}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="proctor-title"
        >
          <div className={styles.proctorModal}>
            <span className={styles.proctorBadge}>Tab switch detected</span>
            <h2 id="proctor-title" className={styles.proctorTitle}>
              Stay on the final exam
            </h2>
            <p className={styles.proctorText}>
              Leaving the exam tab is recorded. Warning {focusWarnings} of 3 — the exam locks
              after 3 tab switches.
            </p>
            <button
              type="button"
              className={styles.proctorBtn}
              onClick={() => setShowFocusWarning(false)}
            >
              Return to exam
            </button>
          </div>
        </div>
      )}

      <div className={styles.quizHeader}>
        <h1 className={styles.quizTitle}>{quiz.title}</h1>
        <p className={styles.quizDesc}>{quiz.description}</p>
        <span className={styles.passingBadge}>Passing Score: {quiz.passing_score ?? 70}%</span>
      </div>

      {isFinalExam && (
        <div className={styles.proctorNotice}>
          ⚠️ Final exam mode: leaving this tab is recorded. The attempt locks after 3 tab
          switches.
        </div>
      )}

      {error && <div className={styles.errorBanner}>{error}</div>}

      <div className={styles.questionsList}>
        {questions.map((q, index) => (
          <div key={q.id} className={styles.questionCard}>
            <h2 className={styles.questionText}>{index + 1}. {q.question_text}</h2>
            <div className={styles.optionsList}>
              {Object.entries(q.options).map(([key, value]) => (
                <label
                  key={key}
                  className={`${styles.optionLabel} ${answers[q.id] === key ? styles.optionSelected : ""}`}
                >
                  <input
                    type="radio"
                    name={q.id}
                    value={key}
                    checked={answers[q.id] === key}
                    onChange={() => handleSelectOption(q.id, key)}
                    className={styles.radioInput}
                  />
                  <span className={styles.optionText}><strong>{key}.</strong> {value as string}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button className={styles.submitBtn} onClick={handleSubmit} disabled={submitting}>
        {submitting ? "Submitting..." : "Submit Quiz"}
      </button>
    </div>
  );
}
