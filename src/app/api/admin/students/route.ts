import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateTemporaryPassword } from "@/lib/password";
import { getStudentEmailError, normalizeEmail } from "@/lib/validation";

type StudentInput = {
  fullName?: unknown;
  email?: unknown;
  yearLevel?: unknown;
};

type AdminStudentResult = {
  index: number;
  fullName: string;
  email: string;
  yearLevel: number;
  status: "created" | "error";
  userId?: string;
  temporaryPassword?: string;
  error?: string;
};

const MAX_BATCH_SIZE = 200;

function normalizeYearLevel(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 1;
  return Math.min(6, Math.max(1, Math.trunc(parsed)));
}

function cleanName(value: unknown): string {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

export async function POST(req: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Only administrators can add students." }, { status: 403 });
  }

  let body: { students?: StudentInput[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const rows = Array.isArray(body.students) ? body.students : [];
  if (rows.length === 0) {
    return NextResponse.json({ error: "Add at least one student." }, { status: 400 });
  }
  if (rows.length > MAX_BATCH_SIZE) {
    return NextResponse.json(
      { error: `You can import up to ${MAX_BATCH_SIZE} students at a time.` },
      { status: 400 }
    );
  }

  const results: AdminStudentResult[] = [];
  const seenEmails = new Set<string>();

  for (const [index, row] of rows.entries()) {
    const fullName = cleanName(row.fullName);
    const email = normalizeEmail(String(row.email ?? ""));
    const yearLevel = normalizeYearLevel(row.yearLevel);

    const baseResult = { index, fullName, email, yearLevel };

    if (fullName.length < 2) {
      results.push({ ...baseResult, status: "error", error: "Full name is required." });
      continue;
    }

    const emailError = getStudentEmailError(email);
    if (emailError) {
      results.push({ ...baseResult, status: "error", error: emailError });
      continue;
    }

    if (seenEmails.has(email)) {
      results.push({
        ...baseResult,
        status: "error",
        error: "Duplicate email in this import.",
      });
      continue;
    }
    seenEmails.add(email);

    // The plain-text password exists only in this request/response. The database
    // stores only the bcrypt hash.
    const temporaryPassword = generateTemporaryPassword(12);

    const { data: userId, error: createError } = await supabase.rpc("admin_create_student", {
      p_email: email,
      p_password: temporaryPassword,
      p_full_name: fullName,
      p_year_level: yearLevel,
    });

    if (createError) {
      const message = createError.message.replace(/^.*?:\s*/, "").trim();
      results.push({
        ...baseResult,
        status: "error",
        error: message || "Could not create this student.",
      });
      continue;
    }

    results.push({
      ...baseResult,
      status: "created",
      userId: String(userId),
      temporaryPassword,
    });
  }

  const createdCount = results.filter((result) => result.status === "created").length;

  return NextResponse.json({
    results,
    createdCount,
    failedCount: results.length - createdCount,
  });
}
