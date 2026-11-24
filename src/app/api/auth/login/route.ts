import { NextResponse, type NextRequest } from "next/server";
import { createRouteClient } from "@/lib/supabase/route";
import { getEmailError, normalizeEmail } from "@/lib/validation";

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

type LockState = {
  locked?: boolean;
  failed_count?: number;
  remaining?: number;
  retry_after_seconds?: number;
};

type FailureState = LockState & {
  locked_until?: string | null;
};

export async function POST(request: NextRequest) {
  const { supabase, applyCookies, waitForCookies } = createRouteClient(request);
  const json = (body: unknown, init?: ResponseInit) =>
    applyCookies(NextResponse.json(body, init));

  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = normalizeEmail(String(body.email ?? ""));
  const password = String(body.password ?? "");

  const emailError = getEmailError(email);
  if (emailError) {
    return json({ error: emailError }, { status: 400 });
  }
  if (!password) {
    return json({ error: "Password is required." }, { status: 400 });
  }

  // Check the custom penalty before asking Supabase Auth to verify the password.
  const { data: lock, error: lockError } = await supabase.rpc("check_login_lock", {
    p_email: email,
  });

  if (lockError) {
    // Do not block sign-in if the lockout helper is unavailable.
    console.error("Could not check login lock:", lockError.message);
  } else {
    const state = (lock ?? {}) as LockState;
    if (state.locked) {
      const retryAfter = Math.max(0, Number(state.retry_after_seconds) || LOCK_MINUTES * 60);
      return json(
        {
          error: `Too many failed sign-in attempts. Try again in ${Math.ceil(retryAfter / 60)} minute${Math.ceil(retryAfter / 60) === 1 ? "" : "s"}.`,
          locked: true,
          retryAfterSeconds: retryAfter,
        },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    const { data: failure, error: failureError } = await supabase.rpc(
      "record_login_failure",
      {
        p_email: email,
        p_max_attempts: MAX_ATTEMPTS,
        p_lock_minutes: LOCK_MINUTES,
      }
    );

    if (failureError) {
      console.error("Could not record login failure:", failureError.message);
    }

    const state = (failure ?? {}) as FailureState;
    const locked = state.locked === true;
    const remaining = typeof state.remaining === "number" ? state.remaining : null;
    const retryAfter = Math.max(0, Number(state.retry_after_seconds) || LOCK_MINUTES * 60);

    const error = locked
      ? `Too many failed sign-in attempts. Your account is locked for ${LOCK_MINUTES} minutes.`
      : remaining !== null && remaining >= 0
        ? `Invalid email or password. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining before a temporary lock.`
        : "Invalid email or password.";

    return json(
      {
        error,
        locked,
        remaining,
        retryAfterSeconds: locked ? retryAfter : 0,
      },
      { status: locked ? 429 : 401 }
    );
  }

  // Successful login: clear the failed-attempt counter for this email.
  const { error: resetError } = await supabase.rpc("reset_login_attempts", {
    p_email: email,
  });
  if (resetError) {
    console.error("Could not reset login attempts:", resetError.message);
  }

  // The session cookie is written by onAuthStateChange asynchronously.
  await waitForCookies();

  return json({ ok: true });
}
