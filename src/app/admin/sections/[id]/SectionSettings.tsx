"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  DEPARTMENTS,
  STUDENT_SECTIONS,
  type AcademicTerm,
  type Department,
  type StudentSection,
  getAcademicYearOptions,
  isValidAcademicYear,
  makeJoinCode,
} from "@/lib/academic";
import styles from "../sections.module.css";

type Props = {
  sectionId: string;
  courseCode: string;
  subjectYearLevel: number;
  subjectTerm: AcademicTerm;
  initial: {
    program: string;
    section_letter: string;
    academic_year: string;
    join_code: string;
  };
};

export default function SectionSettings({
  sectionId,
  courseCode,
  subjectYearLevel,
  subjectTerm,
  initial,
}: Props) {
  const router = useRouter();
  const [program, setProgram] = useState<Department>(
    DEPARTMENTS.some((option) => option.value === initial.program)
      ? (initial.program as Department)
      : "BSIT"
  );
  const [sectionLetter, setSectionLetter] = useState<StudentSection>(
    STUDENT_SECTIONS.includes(initial.section_letter as StudentSection)
      ? (initial.section_letter as StudentSection)
      : "A"
  );
  const [academicYear, setAcademicYear] = useState(initial.academic_year);
  const [joinCode, setJoinCode] = useState(initial.join_code);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  const sectionCode = `${program} ${subjectYearLevel}${sectionLetter}`;
  const initialSectionCode = `${initial.program} ${subjectYearLevel}${initial.section_letter}`;
  const initialSuggestedJoinCode = makeJoinCode(
    courseCode,
    initialSectionCode,
    initial.academic_year
  );
  const academicYearOptions = getAcademicYearOptions();
  const suggestedJoinCode = makeJoinCode(courseCode, sectionCode, academicYear);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    if (!isValidAcademicYear(academicYear.trim())) {
      setError("Use an academic year with two consecutive years, such as 2026-2027.");
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("sections")
      .update({
        program,
        year_level: subjectYearLevel,
        section_letter: sectionLetter,
        academic_year: academicYear.trim(),
        term: subjectTerm,
        join_code:
          joinCode === initialSuggestedJoinCode
            ? suggestedJoinCode
            : joinCode.trim() || suggestedJoinCode,
      })
      .eq("id", sectionId);

    setSaving(false);

    if (updateError) {
      setError(
        updateError.message.includes("duplicate")
          ? "Another class already uses this subject, section, academic year, term, or join code."
          : updateError.message
      );
      return;
    }

    setNotice("Section details updated.");
    router.refresh();
  }

  async function copyJoinCode() {
    try {
      await navigator.clipboard.writeText(joinCode);
      setCopyMessage("Join code copied.");
    } catch {
      setCopyMessage("Could not copy the join code.");
    }
    window.setTimeout(() => setCopyMessage(null), 2500);
  }

  return (
    <form onSubmit={save} className={styles.stack}>
      <div className={styles.formGrid}>
        <label className={styles.field}>
          <span className={styles.label}>Course</span>
          <select
            className={styles.select}
            value={program}
            onChange={(event) => {
              setProgram(event.target.value as Department);
              setError(null);
            }}
          >
            {DEPARTMENTS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.value}
              </option>
            ))}
          </select>
        </label>

        <div className={styles.field}>
          <span className={styles.label}>Year level / term</span>
          <p className={styles.sectionLabel}>
            Year {subjectYearLevel} · {subjectTerm}
          </p>
          <span className={styles.cardHint}>From the subject record</span>
        </div>

        <label className={styles.field}>
          <span className={styles.label}>Section</span>
          <select
            className={styles.select}
            value={sectionLetter}
            onChange={(event) => {
              setSectionLetter(event.target.value as StudentSection);
              setError(null);
            }}
          >
            {STUDENT_SECTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Academic year</span>
          <input
            className={styles.input}
            list={`academic-years-${sectionId}`}
            value={academicYear}
            onChange={(event) => {
              setAcademicYear(event.target.value);
              setError(null);
            }}
            placeholder="e.g. 2026-2027"
            required
          />
          <datalist id={`academic-years-${sectionId}`}>
            {academicYearOptions.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
        </label>

        <div className={styles.field}>
          <span className={styles.label}>Join code</span>
          <div className={styles.inlineRow}>
            <input
              className={styles.input}
              value={joinCode}
              onChange={(event) => {
                setJoinCode(event.target.value.toUpperCase());
                setError(null);
              }}
              placeholder={suggestedJoinCode}
            />
            <button type="button" className={styles.secondaryBtn} onClick={copyJoinCode}>
              Copy
            </button>
          </div>
        </div>
      </div>

      <div className={styles.joinCodePreview}>
        <div>
          <span className={styles.label}>Section</span>
          <p className={styles.sectionLabel}>{sectionCode}</p>
        </div>
        <div>
          <span className={styles.label}>Suggested join code</span>
          <code className={styles.code}>{suggestedJoinCode}</code>
          {suggestedJoinCode !== joinCode && (
            <button
              type="button"
              className={styles.linkBtn}
              onClick={() => setJoinCode(suggestedJoinCode)}
            >
              Use this code
            </button>
          )}
        </div>
      </div>

      {copyMessage && <div className={styles.noticeInfo}>{copyMessage}</div>}
      {error && <div className={styles.noticeError}>{error}</div>}
      {notice && <div className={styles.noticeSuccess}>{notice}</div>}

      <div className={styles.rowActions}>
        <button type="submit" className={styles.primaryBtn} disabled={saving}>
          {saving ? "Saving..." : "Save section details"}
        </button>
      </div>
    </form>
  );
}
