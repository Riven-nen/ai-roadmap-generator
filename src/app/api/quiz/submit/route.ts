import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

  // Grading and enrollment updates happen inside a security-definer function.
  // This prevents students from updating their own grades and avoids exposing
  // correct_option to the browser.
  const { data, error } = await supabase.rpc("record_quiz_result", {
    p_quiz_id: quizId,
    p_answers: answers,
  });

  if (error) {
    const message = error.message.replace(/^.*?:\s*/, "").trim();
    const status =
      error.code === "P0002"
        ? 404
        : error.code === "42501"
          ? 401
          : 400;

    return NextResponse.json(
      { error: message || "Could not submit this quiz." },
      { status }
    );
  }

  return NextResponse.json(data);
}
