/**
 * Final exam eligibility is shared by the course page, the quiz page, and the
 * enrolled-subjects list so every screen reports the same lock state.
 *
 * A student must complete every topic in the course before taking the final
 * exam. This matches the "Course Progress" bar shown on the course page.
 */

export type FinalExamEligibility = {
  totalTopics: number;
  completedTopics: number;
  remainingTopics: number;
  eligible: boolean;
};

export function getFinalExamEligibility(
  topicIds: string[],
  completedTopicIds: ReadonlySet<string>
): FinalExamEligibility {
  const totalTopics = topicIds.length;
  const completedTopics = topicIds.reduce(
    (count, topicId) => (completedTopicIds.has(topicId) ? count + 1 : count),
    0
  );

  return {
    totalTopics,
    completedTopics,
    remainingTopics: Math.max(0, totalTopics - completedTopics),
    eligible: completedTopics >= totalTopics,
  };
}
