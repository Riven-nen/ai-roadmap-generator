"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./login.module.css";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetNotice = searchParams.get("reset") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Unable to sign in. Please try again.");
        setLoading(false);
        return;
      }

      router.push(data.mustChangePassword ? "/set-password" : "/");
      router.refresh();
    } catch {
      setError("Unable to reach the sign-in service. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>IT</div>
          <span className={styles.logoText}>IT Roadmap</span>
        </div>

        <form className={styles.form} onSubmit={handleLogin}>
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

          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">Password</label>
            <div className={styles.passwordWrap}>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={styles.input}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className={styles.revealBtn}
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <div className={styles.forgotRow}>
              <Link href="/forgot-password" className={styles.inlineLink}>
                Forgot password?
              </Link>
            </div>
          </div>

          {resetNotice && (
            <div className={styles.success}>
              Your password was updated. Sign in with your new password.
            </div>
          )}
          {error && <div className={styles.error}>{error}</div>}

          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.container}>
          <div className={styles.card}>
            <p className={styles.centerText}>Loading sign in...</p>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
