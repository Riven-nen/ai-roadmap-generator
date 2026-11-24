"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Quiz } from "@/types";
import styles from "./quiz.module.css";

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

      setQuiz(quizData);
      setQuestions((qData || []) as ClientQuestion[]);
      setLoading(false);
    }
    fetchQuiz();
  }, [quizId]);

  const handleSelectOption = (questionId: string, option: string) => {
    setAnswers({ ...answers, [questionId]: option });
  };

  const handleSubmit = async () => {
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
      <div className={styles.quizHeader}>
        <h1 className={styles.quizTitle}>{quiz.title}</h1>
        <p className={styles.quizDesc}>{quiz.description}</p>
        <span className={styles.passingBadge}>Passing Score: {quiz.passing_score ?? 70}%</span>
      </div>

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
