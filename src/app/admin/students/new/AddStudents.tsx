"use client";

import { useMemo, useRef, useState } from "react";
import { getStudentEmailError, normalizeEmail } from "@/lib/validation";
import {
  DEPARTMENTS,
  STUDENT_SECTIONS,
  normalizeDepartment,
  normalizeStudentSection,
  type Department,
  type StudentSection,
} from "@/lib/academic";
import styles from "./add-students.module.css";

type AccountRole = "student" | "professor";

type StudentResult = {
  index: number;
  fullName: string;
  email: string;
  yearLevel: number;
  role: AccountRole;
  department: Department | null;
  section: StudentSection | null;
  status: "created" | "error";
  temporaryPassword?: string;
  error?: string;
};

type CsvRow = {
  rowNumber: number;
  fullName: string;
  email: string;
  yearLevel: number;
  role: AccountRole;
  department: Department;
  section: StudentSection;
  error?: string;
};

const MAX_ROWS = 200;

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((candidate) => candidate.some((cell) => cell.trim() !== ""));
}

function csvEscape(value: string | number | undefined): string {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function downloadCsv(filename: string, content: string) {
  const blob = new Blob(["\uFEFF", content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function AddStudents() {
  const [mode, setMode] = useState<"single" | "csv">("single");

  // Single account form
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [yearLevel, setYearLevel] = useState(1);
  const [role, setRole] = useState<AccountRole>("student");
  const [department, setDepartment] = useState<Department>("BSIT");
  const [section, setSection] = useState<StudentSection>("A");
  const [singleError, setSingleError] = useState<string | null>(null);

  // CSV import
  const [csvRows, setCsvRows] = useState<CsvRow[]>([]);
  const [csvFileName, setCsvFileName] = useState("");
  const [csvError, setCsvError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Results
  const [results, setResults] = useState<StudentResult[]>([]);
  const [lastSummary, setLastSummary] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  const validCsvRows = useMemo(() => csvRows.filter((row) => !row.error), [csvRows]);

  async function submitRows(
    rows: Array<{
      fullName: string;
      email: string;
      yearLevel: number;
      role: AccountRole;
      department: Department | null;
      section: StudentSection | null;
    }>
  ) {
    setSubmitting(true);
    setLastSummary(null);

    try {
      const response = await fetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ students: rows }),
      });
      const data = await response.json();

      if (!response.ok) {
        setLastSummary(data.error || "Could not create the students.");
        return;
      }

      setResults((previous) => [...previous, ...(data.results as StudentResult[])]);
      setLastSummary(
        `Created ${data.createdCount} account${data.createdCount === 1 ? "" : "s"}${
          data.failedCount > 0 ? `, ${data.failedCount} failed` : ""
        }.`
      );
    } catch {
      setLastSummary("Could not reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSingleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSingleError(null);

    const cleanName = fullName.trim().replace(/\s+/g, " ");
    if (cleanName.length < 2) {
      setSingleError("Enter the person's full name.");
      return;
    }

    const emailError = getStudentEmailError(email);
    if (emailError) {
      setSingleError(emailError);
      return;
    }

    await submitRows([
      {
        fullName: cleanName,
        email: normalizeEmail(email),
        yearLevel,
        role,
        department: role === "student" ? department : null,
        section: role === "student" ? section : null,
      },
    ]);

    setFullName("");
    setEmail("");
    setYearLevel(1);
    setRole("student");
    setDepartment("BSIT");
    setSection("A");
  }

  function handleCsvFile(file: File | undefined) {
    setCsvError(null);
    setCsvFileName("");
    setCsvRows([]);

    if (!file) return;
    if (file.size > 1024 * 1024) {
      setCsvError("CSV must be smaller than 1 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result ?? "").replace(/^\uFEFF/, "");
        const rows = parseCsv(text);

        if (rows.length === 0) {
          setCsvError("The CSV file is empty.");
          return;
        }

        const header = rows[0].map((cell) => cell.trim().toLowerCase());
        const hasHeader = header.some((cell) =>
          [
            "email",
            "full_name",
            "name",
            "year_level",
            "role",
            "account_type",
            "course",
            "department",
            "program",
            "section",
            "block",
          ].includes(cell)
        );
        const dataRows = hasHeader ? rows.slice(1) : rows;

        const nameIndex = hasHeader
          ? header.findIndex((cell) => ["full_name", "name", "student_name", "student name"].includes(cell))
          : 0;
        const emailIndex = hasHeader
          ? header.findIndex((cell) => ["email", "email_address", "email address"].includes(cell))
          : 1;
        const levelIndex = hasHeader
          ? header.findIndex((cell) => ["year_level", "year", "level", "year level"].includes(cell))
          : 2;
        const roleIndex = hasHeader
          ? header.findIndex((cell) => ["role", "account_type", "account type", "type"].includes(cell))
          : -1;
        const departmentIndex = hasHeader
          ? header.findIndex((cell) => ["course", "program", "department"].includes(cell))
          : -1;
        const sectionIndex = hasHeader
          ? header.findIndex((cell) => ["section", "block"].includes(cell))
          : -1;

        if (nameIndex < 0 || emailIndex < 0) {
          setCsvError("CSV needs full_name and email columns. Download the template below.");
          return;
        }

        const trimmedRows = dataRows.slice(0, MAX_ROWS);
        const parsed: CsvRow[] = trimmedRows.map((columns, index) => {
          const studentName = (columns[nameIndex] ?? "").trim().replace(/\s+/g, " ");
          const studentEmail = normalizeEmail(columns[emailIndex] ?? "");
          const rawLevel = levelIndex >= 0 ? Number(columns[levelIndex]) : 1;
          const studentLevel = Number.isFinite(rawLevel)
            ? Math.min(6, Math.max(1, Math.trunc(rawLevel)))
            : 1;
          const rawRole = roleIndex >= 0 ? (columns[roleIndex] ?? "").trim().toLowerCase() : "student";
          const accountRole: AccountRole = rawRole === "professor" ? "professor" : "student";
          const rawDepartment =
            departmentIndex >= 0 ? (columns[departmentIndex] ?? "").trim() : "";
          const rawSection =
            sectionIndex >= 0 ? (columns[sectionIndex] ?? "").trim().toUpperCase() : "";
          const studentDepartment: Department = normalizeDepartment(rawDepartment);
          const studentSection: StudentSection = normalizeStudentSection(rawSection);

          const problems: string[] = [];
          if (studentName.length < 2) problems.push("full name is required");
          const emailError = getStudentEmailError(studentEmail);
          if (emailError) problems.push(emailError.toLowerCase());
          if (levelIndex >= 0 && columns[levelIndex] !== undefined && columns[levelIndex].trim() !== "" && (rawLevel < 1 || rawLevel > 6)) {
            problems.push("year level must be between 1 and 6");
          }
          if (roleIndex >= 0 && rawRole && !["student", "professor"].includes(rawRole)) {
            problems.push("role must be student or professor");
          }
          if (
            departmentIndex >= 0 &&
            rawDepartment &&
            studentDepartment.toLowerCase() !== rawDepartment.toLowerCase()
          ) {
            problems.push("course must be BSIT, BSCpE, or BSIE");
          }
          if (
            sectionIndex >= 0 &&
            rawSection &&
            studentSection !== rawSection
          ) {
            problems.push(`section must be one of ${STUDENT_SECTIONS.join(", ")}`);
          }

          return {
            rowNumber: index + (hasHeader ? 2 : 1),
            fullName: studentName,
            email: studentEmail,
            yearLevel: studentLevel,
            role: accountRole,
            department: studentDepartment,
            section: studentSection,
            error: problems.length > 0 ? problems.join("; ") : undefined,
          };
        });

        const deduped: CsvRow[] = [];
        const seen = new Set<string>();
        for (const row of parsed) {
          if (!row.error && seen.has(row.email)) {
            row.error = "duplicate email in this file";
          }
          if (!row.error) seen.add(row.email);
          deduped.push(row);
        }

        if (dataRows.length > MAX_ROWS) {
          setCsvError(`Only the first ${MAX_ROWS} rows will be imported.`);
        }

        setCsvFileName(file.name);
        setCsvRows(deduped);
        if (deduped.length === 0) {
          setCsvError("No student rows found in this CSV.");
        }
      } catch {
        setCsvError("Could not read that CSV file.");
      }
    };
    reader.readAsText(file);
  }

  async function handleCsvSubmit() {
    if (csvRows.length === 0) return;

    await submitRows(
      csvRows.map((row) => ({
        fullName: row.fullName,
        email: row.email,
        yearLevel: row.yearLevel,
        role: row.role,
        department: row.role === "student" ? row.department : null,
        section: row.role === "student" ? row.section : null,
      }))
    );

    setCsvRows([]);
    setCsvFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function copyText(text: string, message: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyMessage(message);
    } catch {
      setCopyMessage("Copy failed. Select the password manually.");
    }
    window.setTimeout(() => setCopyMessage(null), 2500);
  }

  function downloadCredentials() {
    const header = [
      "full_name",
      "email",
      "role",
      "department",
      "year_level",
      "section",
      "temporary_password",
      "status",
      "error",
    ];
    const lines = [
      header.join(","),
      ...results.map((result) =>
        [
          result.fullName,
          result.email,
          result.role,
          result.department ?? "",
          result.yearLevel,
          result.section ?? "",
          result.temporaryPassword ?? "",
          result.status,
          result.error ?? "",
        ]
          .map(csvEscape)
          .join(",")
      ),
    ];
    downloadCsv("user-credentials.csv", lines.join("\r\n"));
  }

  const createdResults = results.filter((result) => result.status === "created");

  return (
    <div className={styles.wrapper}>
      <div className={styles.modeTabs}>
        <button
          type="button"
          className={`${styles.modeTab} ${mode === "single" ? styles.modeTabActive : ""}`}
          onClick={() => setMode("single")}
        >
          Add One User
        </button>
        <button
          type="button"
          className={`${styles.modeTab} ${mode === "csv" ? styles.modeTabActive : ""}`}
          onClick={() => setMode("csv")}
        >
          Import CSV
        </button>
      </div>

      {mode === "single" ? (
        <form className={styles.panel} onSubmit={handleSingleSubmit}>
          <h2 className={styles.panelTitle}>Account Details</h2>
          <p className={styles.panelHint}>
            Create a student or professor account. A temporary password is generated automatically
            and shown once after the account is created.
          </p>

          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span className={styles.label}>Full Name</span>
              <input
                className={styles.input}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Alyssa Mercado"
                required
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Email</span>
              <input
                className={styles.input}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@example.com"
                required
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Account type</span>
              <select
                className={styles.input}
                value={role}
                onChange={(e) => setRole(e.target.value as AccountRole)}
              >
                <option value="student">Student</option>
                <option value="professor">Professor</option>
              </select>
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Year Level</span>
              <select
                className={styles.input}
                value={yearLevel}
                onChange={(e) => setYearLevel(Number(e.target.value))}
                disabled={role === "professor"}
              >
                {[1, 2, 3, 4, 5, 6].map((level) => (
                  <option key={level} value={level}>Year {level}</option>
                ))}
              </select>
              {role === "professor" && (
                <span className={styles.panelHint}>Year level is only used for students.</span>
              )}
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Course</span>
              <select
                className={styles.input}
                value={department}
                onChange={(e) => setDepartment(e.target.value as Department)}
                disabled={role !== "student"}
              >
                {DEPARTMENTS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Section</span>
              <select
                className={styles.input}
                value={section}
                onChange={(e) => setSection(e.target.value as StudentSection)}
                disabled={role !== "student"}
              >
                {STUDENT_SECTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {role === "student" && (
                <span className={styles.panelHint}>
                  Shown as Year {yearLevel} - {section}, for example 3 - A.
                </span>
              )}
            </label>
          </div>

          {singleError && <div className={styles.error}>{singleError}</div>}

          <div className={styles.formActions}>
            <button type="submit" className={styles.primaryBtn} disabled={submitting}>
              {submitting ? "Creating..." : "Create Account"}
            </button>
          </div>
        </form>
      ) : (
        <div className={styles.panel}>
          <h2 className={styles.panelTitle}>Import Users from CSV</h2>
          <p className={styles.panelHint}>
            Required columns: <code>full_name</code>, <code>email</code>. Optional:{" "}
            <code>year_level</code>, <code>course</code> (<code>BSIT</code>,{" "}
            <code>BSCpE</code>, <code>BSIE</code>), <code>section</code> (A–F), and{" "}
            <code>role</code> (<code>student</code> or <code>professor</code>). Up to{" "}
            {MAX_ROWS} accounts per file.
          </p>

          <div className={styles.csvActions}>
            <a href="/student-import-template.csv" className={styles.secondaryBtn} download>
              Download Blank Template
            </a>
            <a href="/dummy-students.csv" className={styles.secondaryBtn} download>
              Download Dummy Students
            </a>
          </div>

          <label className={styles.dropzone}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className={styles.fileInput}
              onChange={(e) => handleCsvFile(e.target.files?.[0])}
            />
            <span className={styles.dropzoneIcon}>📄</span>
            <span>{csvFileName || "Choose a CSV file"}</span>
            <span className={styles.dropzoneHint}>Click to browse · .csv up to 1 MB</span>
          </label>

          {csvError && <div className={styles.error}>{csvError}</div>}

          {csvRows.length > 0 && (
            <>
              <div className={styles.previewHeader}>
                <strong>{csvRows.length} row{csvRows.length === 1 ? "" : "s"} found</strong>
                <span>{validCsvRows.length} ready · {csvRows.length - validCsvRows.length} with issues</span>
              </div>

              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Row</th>
                      <th>Full Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Course</th>
                      <th>Year / Section</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {csvRows.map((row) => (
                      <tr key={row.rowNumber}>
                        <td>{row.rowNumber}</td>
                        <td>{row.fullName || "—"}</td>
                        <td>{row.email || "—"}</td>
                        <td>{row.role}</td>
                        <td>{row.role === "student" ? row.department : "—"}</td>
                        <td>
                          {row.role === "student"
                            ? `${row.yearLevel} - ${row.section}`
                            : "—"}
                        </td>
                        <td>
                          {row.error ? (
                            <span className={styles.badgeError}>{row.error}</span>
                          ) : (
                            <span className={styles.badgeOk}>Ready</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.primaryBtn}
                  onClick={handleCsvSubmit}
                  disabled={submitting}
                >
                  {submitting ? "Importing..." : `Import ${csvRows.length} Account${csvRows.length === 1 ? "" : "s"}`}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {lastSummary && <div className={styles.summary}>{lastSummary}</div>}

      {results.length > 0 && (
        <div className={styles.panel}>
          <div className={styles.resultsHeader}>
            <div>
              <h2 className={styles.panelTitle}>Temporary Credentials</h2>
              <p className={styles.warning}>
                Passwords are shown once. Copy or download them now before leaving this page.
              </p>
            </div>
            <div className={styles.resultsActions}>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() =>
                  copyText(
                    createdResults
                      .map((result) => `${result.email},${result.temporaryPassword}`)
                      .join("\n"),
                    "All credentials copied."
                  )
                }
                disabled={createdResults.length === 0}
              >
                Copy All
              </button>
              <button type="button" className={styles.secondaryBtn} onClick={downloadCredentials}>
                Download CSV
              </button>
              <button type="button" className={styles.textBtn} onClick={() => setResults([])}>
                Clear
              </button>
            </div>
          </div>

          {copyMessage && <div className={styles.copyMessage}>{copyMessage}</div>}

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Course</th>
                  <th>Year / Section</th>
                  <th>Temporary Password</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {results.map((result, rowIndex) => (
                  <tr key={rowIndex}>
                    <td>{result.fullName}</td>
                    <td>{result.email}</td>
                    <td>{result.role ?? "student"}</td>
                    <td>{result.role === "professor" ? "—" : result.department ?? "BSIT"}</td>
                    <td>
                      {result.role === "professor"
                        ? "—"
                        : `${result.yearLevel} - ${result.section ?? "A"}`}
                    </td>
                    <td>
                      {result.temporaryPassword ? (
                        <code className={styles.password}>{result.temporaryPassword}</code>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      {result.status === "created" ? (
                        <span className={styles.badgeOk}>Created</span>
                      ) : (
                        <span className={styles.badgeError}>{result.error || "Failed"}</span>
                      )}
                    </td>
                    <td>
                      {result.temporaryPassword && (
                        <button
                          type="button"
                          className={styles.smallBtn}
                          onClick={() =>
                            copyText(result.temporaryPassword!, `Password copied for ${result.email}.`)
                          }
                        >
                          Copy
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {createdResults.length > 0 && (
        <p className={styles.initialHint}>
          Tip: users should change their temporary password after their first sign-in.
        </p>
      )}
    </div>
  );
}
