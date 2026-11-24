"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "../sections.module.css";

type Professor = {
  id: string;
  full_name: string;
  email: string | null;
};

export default function SectionProfessors({
  sectionId,
  assigned,
  available,
}: {
  sectionId: string;
  assigned: Professor[];
  available: Professor[];
}) {
  const router = useRouter();
  const [professorId, setProfessorId] = useState(available[0]?.id ?? "");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function assign(event: React.FormEvent) {
    event.preventDefault();
    if (!professorId) return;

    setBusyId(professorId);
    setError(null);

    const supabase = createClient();
    const { error: insertError } = await supabase
      .from("section_professors")
      .insert({ section_id: sectionId, professor_id: professorId });

    setBusyId(null);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setProfessorId("");
    router.refresh();
  }

  async function remove(professor: Professor) {
    if (!window.confirm(`Remove ${professor.full_name} from this section?`)) return;

    setBusyId(professor.id);
    setError(null);

    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("section_professors")
      .delete()
      .eq("section_id", sectionId)
      .eq("professor_id", professor.id);

    setBusyId(null);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    router.refresh();
  }

  return (
    <div className={styles.stack}>
      {assigned.length === 0 ? (
        <div className={styles.empty}>No professors assigned to this section yet.</div>
      ) : (
        <div className={styles.stack}>
          {assigned.map((professor) => (
            <div key={professor.id} className={styles.personRow}>
              <div className={styles.personMain}>
                <span className={styles.personName}>{professor.full_name}</span>
                <span className={styles.personEmail}>{professor.email ?? "No email on file"}</span>
              </div>
              <button
                type="button"
                className={styles.dangerBtn}
                onClick={() => void remove(professor)}
                disabled={busyId === professor.id}
              >
                {busyId === professor.id ? "Removing..." : "Remove"}
              </button>
            </div>
          ))}
        </div>
      )}

      {available.length === 0 ? (
        <p className={styles.cardHint}>
          Every professor account is already assigned to this section. Create a professor account from{" "}
          <strong>Add Students</strong> if you need a new one.
        </p>
      ) : (
        <form onSubmit={assign} className={styles.inlineRow}>
          <select
            className={styles.select}
            value={professorId}
            onChange={(event) => setProfessorId(event.target.value)}
          >
            <option value="">Choose a professor</option>
            {available.map((professor) => (
              <option key={professor.id} value={professor.id}>
                {professor.full_name}
                {professor.email ? ` — ${professor.email}` : ""}
              </option>
            ))}
          </select>
          <button type="submit" className={styles.primaryBtn} disabled={!professorId || Boolean(busyId)}>
            {busyId ? "Assigning..." : "Assign professor"}
          </button>
        </form>
      )}

      {error && <div className={styles.noticeError}>{error}</div>}
    </div>
  );
}
