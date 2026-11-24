"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "../sections.module.css";

type Student = {
  id: string;
  full_name: string;
  email: string | null;
  level: number | null;
  department: string | null;
  section: string | null;
};

type Enrolled = {
  id: string;
  user_id: string;
  status: string;
  grade: string | null;
  full_name: string;
  email: string | null;
  level: number | null;
  department: string | null;
  section: string | null;
};

type Result = {
  email: string;
  status: "enrolled" | "skipped" | "error";
  message: string;
};

const EMAIL_PATTERN = /[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+/g;

function parseEmails(text: string): string[] {
  const matches = text.match(EMAIL_PATTERN) ?? [];
  return Array.from(new Set(matches.map((email) => email.toLowerCase())));
}

function csvEscape(value: string | number | null | undefined) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export default function SectionEnrollments({
  sectionId,
  courseId,
  enrolled,
  students,
}: {
  sectionId: string;
  courseId: string;
  enrolled: Enrolled[];
  students: Student[];
}) {
  const router = useRouter();
  const [bulkText, setBulkText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const studentsByEmail = useMemo(() => {
    const map = new Map<string, Student>();
    for (const student of students) {
      if (student.email) map.set(student.email.toLowerCase(), student);
    }
    return map;
  }, [students]);

  const enrolledIds = useMemo(
    () => new Set(enrolled.map((entry) => entry.user_id)),
    [enrolled]
  );

  async function handleBulkEnroll(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSummary(null);
    setResults([]);

    const emails = parseEmails(bulkText);
    if (emails.length === 0) {
      setError("Paste at least one student email address.");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();

    const { data: courseEnrollments, error: lookupError } = await supabase
      .from("enrollments")
      .select("user_id, section_id")
      .eq("course_id", courseId);

    if (lookupError) {
      setSubmitting(false);
      setError(lookupError.message);
      return;
    }

    const courseEnrollmentByUser = new Map(
      (courseEnrollments ?? []).map((entry) => [entry.user_id, entry.section_id])
    );

    const nextResults: Result[] = [];

    for (const email of emails) {
      const student = studentsByEmail.get(email);

      if (!student) {
        nextResults.push({
          email,
          status: "error",
          message: "No student account with this email.",
        });
        continue;
      }

      if (enrolledIds.has(student.id)) {
        nextResults.push({
          email,
          status: "skipped",
          message: "Already enrolled in this section.",
        });
        continue;
      }

      if (courseEnrollmentByUser.has(student.id)) {
        nextResults.push({
          email,
          status: "error",
          message: "Already enrolled in this course in another section.",
        });
        continue;
      }

      const { error: insertError } = await supabase.from("enrollments").insert({
        user_id: student.id,
        course_id: courseId,
        section_id: sectionId,
        status: "in_progress",
      });

      if (insertError) {
        nextResults.push({
          email,
          status: "error",
          message: insertError.message,
        });
        continue;
      }

      nextResults.push({ email, status: "enrolled", message: "Enrolled." });
    }

    const added = nextResults.filter((result) => result.status === "enrolled").length;
    const skipped = nextResults.filter((result) => result.status === "skipped").length;
    const failed = nextResults.filter((result) => result.status === "error").length;

    setResults(nextResults);
    setSummary(
      `Added ${added} student${added === 1 ? "" : "s"}${skipped ? `, ${skipped} already enrolled` : ""}${
        failed ? `, ${failed} failed` : ""
      }.`
    );
    setSubmitting(false);
    setBulkText("");
    router.refresh();
  }

  async function removeEnrollment(entry: Enrolled) {
    if (
      !window.confirm(
        `Remove ${entry.full_name} from this section? This also removes their course enrollment.`
      )
    ) {
      return;
    }

    setRemovingId(entry.id);
    setError(null);

    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("enrollments")
      .delete()
      .eq("id", entry.id);

    setRemovingId(null);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    router.refresh();
  }

  function downloadRoster() {
    const header = ["full_name", "email", "department", "year_level", "section", "status", "grade"];
    const lines = [
      header.join(","),
      ...enrolled.map((entry) =>
        [
          entry.full_name,
          entry.email,
          entry.department,
          entry.level,
          entry.section,
          entry.status,
          entry.grade,
        ]
          .map(csvEscape)
          .join(",")
      ),
    ];
    const blob = new Blob(["\uFEFF", lines.join("\r\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "section-roster.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className={styles.stack}>
      {enrolled.length === 0 ? (
        <div className={styles.empty}>No students enrolled in this section yet.</div>
      ) : (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Course · Year - Section</th>
                  <th>Status</th>
                  <th>Grade</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {enrolled.map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.full_name}</td>
                    <td>{entry.email ?? "—"}</td>
                    <td>
                      {entry.department ?? "BSIT"} · {entry.level ?? 1} -{" "}
                      {entry.section ?? "A"}
                    </td>
                    <td>
                      <span className={styles.badge}>{entry.status.replace(/_/g, " ")}</span>
                    </td>
                    <td>{entry.grade ?? "—"}</td>
                    <td>
                      <button
                        type="button"
                        className={styles.smallBtn}
                        onClick={() => void removeEnrollment(entry)}
                        disabled={removingId === entry.id}
                      >
                        {removingId === entry.id ? "Removing..." : "Remove"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={styles.rowActions}>
            <button type="button" className={styles.secondaryBtn} onClick={downloadRoster}>
              Download roster CSV
            </button>
          </div>
        </>
      )}

      <form onSubmit={handleBulkEnroll} className={styles.stack}>
        <label className={styles.field}>
          <span className={styles.label}>Bulk enroll by email</span>
          <textarea
            className={styles.textarea}
            rows={4}
            value={bulkText}
            onChange={(event) => setBulkText(event.target.value)}
            placeholder={"Paste emails separated by new lines, commas, or semicolons\nstudent1@school.edu\nstudent2@school.edu"}
          />
        </label>
        <p className={styles.cardHint}>
          Only existing student accounts can be enrolled. Create accounts first under{" "}
          <strong>Add Students</strong>. Students cannot enroll themselves, and a student cannot
          take the same course twice.
        </p>
        <div className={styles.rowActions}>
          <button type="submit" className={styles.primaryBtn} disabled={submitting}>
            {submitting ? "Enrolling..." : "Enroll students"}
          </button>
        </div>
      </form>

      {error && <div className={styles.noticeError}>{error}</div>}
      {summary && <div className={styles.noticeSuccess}>{summary}</div>}

      {results.length > 0 && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Email</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result) => (
                <tr key={result.email}>
                  <td>{result.email}</td>
                  <td>
                    <span
                      className={
                        result.status === "enrolled"
                          ? styles.badgeOk
                          : result.status === "skipped"
                            ? styles.badgeWarn
                            : styles.badgeError
                      }
                    >
                      {result.message}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
