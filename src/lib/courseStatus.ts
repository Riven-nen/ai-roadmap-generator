import { Course, Enrollment } from "@/types";
import { isPassingGrade } from "@/lib/grading";

export type CourseState =
  | "completed"
  | "in_progress"
  | "failed"
  | "available"
  | "locked";

export type CourseStatus = {
  state: CourseState;
  enrollment?: Enrollment;
  isLocked: boolean;
  lockReason?: string;
};

/**
 * Build the set of course codes the student has passed.
 *
 * A completed enrollment with a failing grade (5.0 / INC) does not unlock the
 * next course. If a student has passed an advanced course, its prerequisites
 * are treated as satisfied too — imported transcripts do not always include
 * every lower-level course.
 */
export function getPassedCourseCodes(
  courses: Course[],
  enrollments: Enrollment[]
): Set<string> {
  const courseById = new Map(courses.map((course) => [course.id, course]));
  const passed = new Set<string>();

  for (const enrollment of enrollments) {
    if (enrollment.status !== "completed") continue;

    const course = courseById.get(enrollment.course_id);
    if (course && isPassingGrade(enrollment.grade)) {
      passed.add(course.code);
    }
  }

  const queue = [...passed];
  while (queue.length > 0) {
    const code = queue.pop();
    if (!code) continue;

    const course = courses.find((candidate) => candidate.code === code);
    const prerequisite = course?.prerequisite_code;
    if (!prerequisite || passed.has(prerequisite)) continue;

    passed.add(prerequisite);
    queue.push(prerequisite);
  }

  return passed;
}

/**
 * Resolve how a course should be shown on the roadmap.
 *
 * Enrolled courses are never locked: the student can always open a course they
 * are already taking. Courses without an enrollment unlock once their
 * prerequisite has been passed.
 */
export function getCourseStatus(
  course: Course,
  enrollment: Enrollment | undefined,
  passedCodes: Set<string>,
  courses: Course[]
): CourseStatus {
  if (enrollment) {
    if (enrollment.status === "completed") {
      return {
        state: isPassingGrade(enrollment.grade) ? "completed" : "failed",
        enrollment,
        isLocked: false,
      };
    }

    return { state: "in_progress", enrollment, isLocked: false };
  }

  if (course.prerequisite_code && !passedCodes.has(course.prerequisite_code)) {
    const prerequisite = courses.find(
      (candidate) => candidate.code === course.prerequisite_code
    );

    return {
      state: "locked",
      isLocked: true,
      lockReason: prerequisite
        ? `${prerequisite.code} — ${prerequisite.title}`
        : course.prerequisite_code,
    };
  }

  return { state: "available", isLocked: false };
}

export function getRoadmapStats(
  courses: Course[],
  enrollments: Enrollment[]
): Record<CourseState, number> {
  const passedCodes = getPassedCourseCodes(courses, enrollments);
  const stats: Record<CourseState, number> = {
    completed: 0,
    in_progress: 0,
    failed: 0,
    available: 0,
    locked: 0,
  };

  for (const course of courses) {
    const enrollment = enrollments.find((e) => e.course_id === course.id);
    const status = getCourseStatus(course, enrollment, passedCodes, courses);
    stats[status.state] += 1;
  }

  return stats;
}
