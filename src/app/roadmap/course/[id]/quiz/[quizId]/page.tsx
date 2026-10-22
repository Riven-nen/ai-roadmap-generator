"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Quiz, QuizQuestion } from "@/types";
import styles from "./quiz.module.css";

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const quizId = params.quizId as string;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null);
  
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);

  useEffect(() => {
    async function fetchQuiz() {
      const supabase = createClient();
      
      const { data: quizData } = await supabase.from("quizzes").select("*").eq("id", quizId).single();
      const { data: qData } = await supabase.from("quiz_questions").select("*").eq("quiz_id", quizId);

      const { data: { user } } = await supabase.auth.getUser();
      if (user && quizData?.topic_id) {
        const { data: progressData } = await supabase
          .from("student_topic_progress")
          .select("status")
          .eq("user_id", user.id)
          .eq("topic_id", quizData.topic_id)
          .single();
          
        if (progressData?.status === "completed") {
          setAlreadyCompleted(true);
        }
      }

      setQuiz(quizData);
      setQuestions(qData || []);
      setLoading(false);
    }
    fetchQuiz();
  }, [quizId]);

  const handleSelectOption = (questionId: string, option: string) => {
    setAnswers({ ...answers, [questionId]: option });
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length !== questions.length) {
      alert("Please answer all questions before submitting.");
      return;
    }

    setSubmitting(true);

    let correctCount = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.correct_option) {
        correctCount++;
      }
    });

    const percentage = Math.round((correctCount / questions.length) * 100);
    const passed = percentage >= (quiz?.passing_score || 70);

    let grade = "5.0";
    if (percentage >= 95) grade = "1.0";
    else if (percentage >= 90) grade = "1.25";
    else if (percentage >= 85) grade = "1.5";
    else if (percentage >= 80) grade = "1.75";
    else if (percentage >= 75) grade = "2.0";
    else if (percentage >= 70) grade = "2.25";
    else if (percentage >= 65) grade = "2.5";
    else if (percentage >= 60) grade = "3.0";

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      if (quiz?.topic_id) {
        await supabase.from("student_topic_progress").upsert({
          user_id: user.id,
          topic_id: quiz.topic_id,
          status: passed ? "completed" : "reading",
          updated_at: new Date().toISOString()
        }, { onConflict: "user_id, topic_id" });
      }

      if (!quiz?.topic_id) {
        await supabase.from("enrollments")
          .update({ 
            grade: grade, 
            progress: 100, 
            status: passed ? "completed" : "in_progress",
            completed_at: passed ? new Date().toISOString() : null
          })
          .eq("user_id", user.id)
          .eq("course_id", courseId);
      }
    }

    setResult({ score: percentage, passed });
    setSubmitting(false);
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
            Your progress has been updated.
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
        <span className={styles.passingBadge}>Passing Score: {quiz.passing_score}%</span>
      </div>

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