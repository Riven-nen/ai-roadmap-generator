import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { percentageToGrade } from "@/lib/grading";

type SubmittedAnswers = Record<string, string>;

export async function POST(req: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Please sign in to submit a quiz." }, { status: 401 });
  }

  let body: { quizId?: string; answers?: SubmittedAnswers };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const quizId = body.quizId;
  const answers = body.answers;

  if (!quizId || !answers || typeof answers !== "object") {
    return NextResponse.json({ error: "Quiz and answers are required." }, { status: 400 });
  }

  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .select("*")
    .eq("id", quizId)
    .single();

  if (quizError || !quiz) {
    return NextResponse.json({ error: "Quiz not found." }, { status: 404 });
  }

  // correct_option is only read on the server so students can't inspect the
  // answers in the browser network tab before submitting.
  const { data: questions, error: questionsError } = await supabase
    .from("quiz_questions")
    .select("id,correct_option")
    .eq("quiz_id", quizId);

  if (questionsError || !questions || questions.length === 0) {
    return NextResponse.json({ error: "This quiz has no questions yet." }, { status: 400 });
  }

  if (Object.keys(answers).length < questions.length) {
    return NextResponse.json({ error: "Please answer all questions before submitting." }, { status: 400 });
  }

  let correctCount = 0;
  for (const question of questions) {
    if (answers[question.id] === question.correct_option) {
      correctCount += 1;
    }
  }

  const percentage = Math.round((correctCount / questions.length) * 100);
  const passingScore = quiz.passing_score || 70;
  const passed = percentage >= passingScore;

  if (quiz.topic_id) {
    const { error: progressError } = await supabase
      .from("student_topic_progress")
      .upsert(
        {
          user_id: user.id,
          topic_id: quiz.topic_id,
          status: passed ? "completed" : "reading",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,topic_id" }
      );

    if (progressError) {
      console.error("Failed to save topic quiz progress:", progressError);
      return NextResponse.json(
        { error: "Your score was calculated but we couldn't save your progress." },
        { status: 500 }
      );
    }
  } else {
    const { data: enrollment, error: enrollmentError } = await supabase
      .from("enrollments")
      .select("id")
      .eq("user_id", user.id)
      .eq("course_id", quiz.course_id)
      .maybeSingle();

    if (enrollmentError || !enrollment) {
      return NextResponse.json(
        { error: "You need to be enrolled in this course to take the final exam." },
        { status: 400 }
      );
    }

    const grade = percentageToGrade(percentage);
    const { error: gradeError } = await supabase
      .from("enrollments")
      .update({
        grade,
        progress: 100,
        status: passed ? "completed" : "in_progress",
        completed_at: passed ? new Date().toISOString() : null,
      })
      .eq("id", enrollment.id);

    if (gradeError) {
      console.error("Failed to save final exam grade:", gradeError);
      return NextResponse.json(
        { error: "Your score was calculated but we couldn't save your grade." },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({
    score: percentage,
    passed,
    correctCount,
    total: questions.length,
  });
}
