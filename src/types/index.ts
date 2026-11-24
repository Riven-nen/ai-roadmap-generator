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
  year_level: number;
  semester: number;
  prerequisite_code: string | null;
};

export type Enrollment = {
  id: string;
  user_id: string;
  course_id: string;
  section_id: string | null;
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

export type TopicNodeType =
  | "module"
  | "topic"
  | "quiz"
  | "material"
  | "coursework";

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
  node_type: TopicNodeType;
  content: string | null;
  position_x: number | null;
  position_y: number | null;
  updated_at?: string;
};

export type RoadmapEdge = {
  id: string;
  course_id: string;
  source_topic_id: string;
  target_topic_id: string;
  label: string | null;
  created_at: string;
};

export type Quiz = {
  id: string;
  course_id: string;
  topic_id: string | null;
  section_id: string | null;
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