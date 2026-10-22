export type Course = {
  id: string;
  code: string;
  title: string;
  description: string;
  credits: number;
  category: string;
  level: string;
  duration_weeks: number;
  rating: number;
  student_count: string;
  is_trending: boolean;
  tags: string[];
  icon: string;
  icon_bg: string;
};

export type Enrollment = {
  id: string;
  user_id: string;
  course_id: string;
  progress: number;
  grade: string | null;
  status: string;
  enrolled_at: string;
  completed_at: string | null;
  course: Course;
};

export type Skill = {
  name: string;
  progress: number;
};

export type CareerPath = {
  id: string;
  title: string;
  description: string;
};

export type CareerRequirement = {
  domain: string;
  required_score: number;
};

export type CourseTopic = {
  id: string;
  course_id: string;
  parent_id: string | null;
  title: string;
  description: string;
  resource_name: string;
  resource_url: string;
  overview?: string;
  learning_objectives?: string[];
  estimated_time?: string;
};

export type Quiz = {
  id: string;
  course_id: string;
  topic_id: string | null;
  title: string;
  description: string;
  passing_score: number;
};

export type QuizQuestion = {
  id: string;
  quiz_id: string;
  question_text: string;
  options: Record<string, string>;
  correct_option: string;
};