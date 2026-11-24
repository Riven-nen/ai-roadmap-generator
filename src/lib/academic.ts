export const ACADEMIC_TERMS = ["1st Semester", "2nd Semester", "Summer"] as const;
export type AcademicTerm = (typeof ACADEMIC_TERMS)[number];

export const DEPARTMENTS = [
  { value: "BSIT", label: "BSIT — Information Technology" },
  { value: "BSCpE", label: "BSCpE — Computer Engineering" },
  { value: "BSIE", label: "BSIE — Industrial Engineering" },
] as const;

export type Department = (typeof DEPARTMENTS)[number]["value"];

export const STUDENT_SECTIONS = ["A", "B", "C", "D", "E", "F"] as const;

export type StudentSection = (typeof STUDENT_SECTIONS)[number];

export function isDepartment(value: string): value is Department {
  return DEPARTMENTS.some((department) => department.value === value);
}

export function isStudentSection(value: string): value is StudentSection {
  return STUDENT_SECTIONS.includes(value as StudentSection);
}

export function normalizeDepartment(value: string): Department {
  const cleaned = String(value ?? "").trim().toLowerCase();
  return (
    DEPARTMENTS.find((department) => department.value.toLowerCase() === cleaned)
      ?.value ?? "BSIT"
  );
}

export function normalizeStudentSection(value: string): StudentSection {
  const cleaned = String(value ?? "").trim().toUpperCase();
  return (
    STUDENT_SECTIONS.find((section) => section === cleaned) ?? "A"
  );
}

/** August is treated as the start of the academic year. */
export function getCurrentAcademicYear(date = new Date()): string {
  const year = date.getFullYear();
  const startYear = date.getMonth() >= 7 ? year : year - 1;
  return `${startYear}-${startYear + 1}`;
}

export function getAcademicYearOptions(date = new Date()): string[] {
  const currentStart = Number(getCurrentAcademicYear(date).slice(0, 4));
  return [-2, -1, 0, 1, 2].map((offset) => {
    const start = currentStart + offset;
    return `${start}-${start + 1}`;
  });
}

export function getCurrentTerm(date = new Date()): AcademicTerm {
  const month = date.getMonth();

  if (month >= 7) return "1st Semester";
  if (month <= 4) return "2nd Semester";
  return "Summer";
}

export function termFromSemester(semester: number | null | undefined): AcademicTerm {
  return Number(semester) === 2 ? "2nd Semester" : "1st Semester";
}

export function isValidAcademicYear(value: string): boolean {
  if (!/^\d{4}-\d{4}$/.test(value)) return false;
  return Number(value.slice(0, 4)) + 1 === Number(value.slice(5));
}

export function makeJoinCode(
  courseCode: string,
  sectionCode: string,
  academicYear: string
): string {
  const clean = (value: string) =>
    String(value ?? "")
      .replace(/[^a-z0-9]/gi, "")
      .toUpperCase();

  const [startYear, endYear] = String(academicYear ?? "").split("-");
  const suffix = `${String(startYear ?? "").replace(/\D/g, "").slice(-2)}${String(
    endYear ?? ""
  )
    .replace(/\D/g, "")
    .slice(-2)}`;

  return `${clean(courseCode) || "CLASS"}-${clean(sectionCode) || "SECTION"}-${suffix || "0000"}`;
}
