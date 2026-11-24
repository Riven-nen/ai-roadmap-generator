import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type PendingCookie = {
  name: string;
  value: string;
  options: CookieOptions;
};

/**
 * Server client for Route Handlers. Unlike the read-only helper used by Server
 * Components, this collects cookies written during sign-in and attaches them to
 * the JSON response we actually return.
 */
export function createRouteClient(request: NextRequest) {
  const pendingCookies: PendingCookie[] = [];
  const pendingHeaders: Record<string, string> = {};
  let storageApplied = false;
  let resolveStorage: (() => void) | null = null;
  const storageAppliedPromise = new Promise<void>((resolve) => {
    resolveStorage = resolve;
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headersToSet) {
          pendingCookies.push(...cookiesToSet);
          Object.assign(pendingHeaders, headersToSet ?? {});
          if (!storageApplied) {
            storageApplied = true;
            resolveStorage?.();
          }
        },
      },
    }
  );

  /**
   * `createServerClient` applies session cookies asynchronously from its
   * onAuthStateChange handler. Wait briefly so the Set-Cookie headers are in
   * pendingCookies before the route builds its response.
   */
  async function waitForCookies(timeoutMs = 1000) {
    if (storageApplied) return;
    await Promise.race([
      storageAppliedPromise,
      new Promise<void>((resolve) => setTimeout(resolve, timeoutMs)),
    ]);
  }

  function applyCookies(response: NextResponse) {
    pendingCookies.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options);
    });
    Object.entries(pendingHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }

  return { supabase, applyCookies, waitForCookies };
}
