"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogoutButton } from "@/lib/supabase/logout";
import styles from "../login/login.module.css";

export default function SetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return;

      if (!session) {
        router.replace("/login");
        return;
      }

      setReady(true);
    });

    return () => {
      active = false;
    };
  }, [router]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
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
    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    const { error: flagError } = await supabase.rpc("complete_password_change");
    if (flagError) {
      setError(
        "Your password was changed, but the first-login setup could not be completed. Refresh and try again."
      );
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  if (!ready) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <p className={styles.centerText}>Checking your account...</p>
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

        <h1 className={styles.title}>Set Your Password</h1>
        <p className={styles.subtitle}>
          Your account was created by an administrator. Choose your own password to continue.
        </p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">New Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
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
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Re-enter your new password"
              className={styles.input}
              autoComplete="new-password"
              required
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? "Saving..." : "Set Password and Continue"}
          </button>
        </form>

        <p className={styles.footer}>
          <LogoutButton className={styles.inlineLink} />
        </p>
      </div>
    </div>
  );
}
