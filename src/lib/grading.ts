/**
 * Grade helpers shared by the quiz, roadmap, dashboard, and profile screens.
 *
 * The app uses the Philippine college grading scale where 1.0 is the best
 * grade, 3.0 is the lowest passing grade, and 5.0 / INC are failing marks.
 */

export function percentageToGrade(percentage: number): string {
  if (percentage >= 95) return "1.0";
  if (percentage >= 90) return "1.25";
  if (percentage >= 85) return "1.5";
  if (percentage >= 80) return "1.75";
  if (percentage >= 75) return "2.0";
  if (percentage >= 70) return "2.25";
  if (percentage >= 65) return "2.5";
  if (percentage >= 60) return "3.0";
  return "5.0";
}

/** Convert a recorded grade into a 0-100 proficiency score. */
export function gradeToScore(grade: string | null | undefined): number {
  if (!grade) return 0;

  switch (grade.trim()) {
    case "1.0":
      return 98;
    case "1.25":
      return 94;
    case "1.5":
      return 90;
    case "1.75":
      return 86;
    case "2.0":
      return 82;
    case "2.25":
      return 78;
    case "2.5":
      return 74;
    case "2.75":
      return 70;
    case "3.0":
      return 60;
    case "5.0":
    case "INC":
      return 10;
    default:
      return 0;
  }
}

/** A grade counts as passed when it is not a failing mark. */
export function isPassingGrade(grade: string | null | undefined): boolean {
  if (!grade) return true;

  const normalized = grade.trim();
  return normalized !== "5.0" && normalized !== "4.0" && normalized !== "INC";
}
