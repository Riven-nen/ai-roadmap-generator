"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "../login/login.module.css";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    const finish = (hasRecoverySession: boolean) => {
      if (!active) return;
      setHasSession(hasRecoverySession);
      setReady(true);
    };

    const timeout = window.setTimeout(() => finish(false), 2000);

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return;
      if (session) {
        window.clearTimeout(timeout);
        finish(true);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && ["PASSWORD_RECOVERY", "SIGNED_IN", "TOKEN_REFRESHED"].includes(event)) {
        window.clearTimeout(timeout);
        finish(true);
      }
    });

    return () => {
      active = false;
      window.clearTimeout(timeout);
      listener.subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Your new password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("The two passwords do not match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    await supabase.auth.signOut();
    router.push("/login?reset=1");
    router.refresh();
  }

  if (!ready) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <p className={styles.centerText}>Checking your reset link...</p>
        </div>
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}>IT</div>
            <span className={styles.logoText}>IT Roadmap</span>
          </div>
          <h1 className={styles.title}>Link Expired</h1>
          <p className={styles.centerText}>
            This password reset link is invalid or has expired. Request a new link to continue.
          </p>
          <p className={styles.footer}>
            <Link href="/forgot-password" className={styles.inlineLink}>Request a new link</Link>
            {" · "}
            <Link href="/login" className={styles.inlineLink}>Back to sign in</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>IT</div>
          <span className={styles.logoText}>IT Roadmap</span>
        </div>

        <h1 className={styles.title}>Choose a New Password</h1>
        <p className={styles.subtitle}>Set a new password for your account.</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">New Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className={styles.input}
              autoComplete="new-password"
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your new password"
              className={styles.input}
              autoComplete="new-password"
              required
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
