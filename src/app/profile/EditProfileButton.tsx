"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "./profile.module.css";

type Props = {
  userId: string;
  initialName: string;
  initialInitials: string;
};

export default function EditProfileButton({ userId, initialName, initialInitials }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState(initialName);
  const [initials, setInitials] = useState(initialInitials);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openModal() {
    setFullName(initialName);
    setInitials(initialInitials);
    setError(null);
    setOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const cleanName = fullName.trim();
    const derivedInitials = cleanName
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    const cleanInitials = (initials.trim() || derivedInitials).toUpperCase().slice(0, 2);

    const supabase = createClient();
    const { error: saveError } = await supabase
      .from("profiles")
      .update({ full_name: cleanName, avatar_initials: cleanInitials })
      .eq("id", userId);

    if (saveError) {
      setError(saveError.message);
      setSaving(false);
      return;
    }

    setOpen(false);
    setSaving(false);
    router.refresh();
  }

  return (
    <>
      <button className={styles.editBtn} onClick={openModal}>
        ✎ Edit Profile
      </button>

      {open && (
        <div className={styles.modalOverlay} onClick={() => setOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Edit Profile</h2>
              <button className={styles.modalClose} onClick={() => setOpen(false)} aria-label="Close">
                ×
              </button>
            </div>

            <form onSubmit={handleSave} className={styles.modalForm}>
              {error && <div className={styles.formError}>{error}</div>}

              <label className={styles.formLabel}>
                Display Name
                <input
                  className={styles.formInput}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </label>

              <label className={styles.formLabel}>
                Avatar Initials
                <input
                  className={styles.formInput}
                  value={initials}
                  onChange={(e) => setInitials(e.target.value)}
                  maxLength={2}
                  placeholder="JD"
                />
              </label>

              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className={styles.saveBtn} disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
