"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getEmailError, isReservedEmailDomain, normalizeEmail } from "@/lib/validation";
import styles from "../login/login.module.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const emailError = getEmailError(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    if (isReservedEmailDomain(email)) {
      setError(
        "Password reset emails cannot be sent to test/example addresses. Ask an administrator to reset the password for this demo account."
      );
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      normalizeEmail(email),
      { redirectTo: `${window.location.origin}/reset-password` }
    );
    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setMessage(
      "If an account exists for that email, a password reset link has been sent. Check your inbox and spam folder."
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>IT</div>
          <span className={styles.logoText}>IT Roadmap</span>
        </div>

        <h1 className={styles.title}>Reset Password</h1>
        <p className={styles.subtitle}>
          Enter your account email and we&apos;ll send you a reset link.
        </p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={styles.input}
              autoComplete="email"
              required
            />
          </div>

          {message && <div className={styles.success}>{message}</div>}
          {error && <div className={styles.error}>{error}</div>}

          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <p className={styles.footer}>
          <Link href="/login" className={styles.inlineLink}>Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
