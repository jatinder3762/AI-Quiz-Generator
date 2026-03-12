export type DocumentItem = {
  id: string;
  filename: string;
  file_url: string;
  file_type: string;
  created_at: string;
};

export type Question = {
  id: string;
  prompt: string;
  options: Record<string, string>;
};

export type Quiz = {
  id: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  num_questions: number;
  created_at: string;
  questions: Question[];
};

export type QuizResult = {
  quiz_id: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  incorrect_answers: number;
  score_percentage: number;
  reviews: {
    question_id: string;
    prompt: string;
    selected_answer: string;
    correct_answer: string;
    explanation: string;
    is_correct: boolean;
  }[];
};
