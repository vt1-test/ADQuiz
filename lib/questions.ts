export type Difficulty = "easy" | "medium" | "hard";

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  difficulty: Difficulty;
  questions: Question[];
}

/**
 * Public quiz payload: questions are shipped WITHOUT the correct answer or
 * explanation so scoring stays server-side. The client tracks selected option
 * text and submits it for grading.
 */
export interface QuizClient {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  difficulty: Difficulty;
  questions: Array<Pick<Question, "id" | "question" | "options">>;
}

export interface QuizSummary {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  difficulty: Difficulty;
  questionCount: number;
}

export interface BreakdownItem {
  questionId: string;
  question: string;
  selected: string | null;
  correct: string;
  isCorrect: boolean;
  explanation: string | null;
}

export interface GradeResult {
  quizId: string;
  score: number;
  total: number;
  percentage: number;
  breakdown: BreakdownItem[];
}

export function toClientQuiz(quiz: Quiz): QuizClient {
  return {
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    category: quiz.category,
    icon: quiz.icon,
    difficulty: quiz.difficulty,
    questions: quiz.questions.map(({ id, question, options }) => ({ id, question, options })),
  };
}

export function toSummary(quiz: Quiz): QuizSummary {
  return {
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    category: quiz.category,
    icon: quiz.icon,
    difficulty: quiz.difficulty,
    questionCount: quiz.questions.length,
  };
}

/**
 * Grade a submission on the server. Answers are keyed by question id and hold
 * the option text the player selected. Unknown or malformed input is ignored
 * safely.
 */
export function gradeQuiz(quiz: Quiz, answers: Record<string, string> | null | undefined): GradeResult {
  const breakdown: BreakdownItem[] = quiz.questions.map((q) => {
    const selected = answers?.[q.id];
    const correctText = q.options[q.correctIndex];
    const isCorrect = typeof selected === "string" && selected === correctText;

    return {
      questionId: q.id,
      question: q.question,
      selected: typeof selected === "string" ? selected : null,
      correct: correctText,
      isCorrect,
      explanation: q.explanation ?? null,
    };
  });

  const score = breakdown.filter((item) => item.isCorrect).length;

  return {
    quizId: quiz.id,
    score,
    total: quiz.questions.length,
    percentage: Math.round((score / quiz.questions.length) * 100),
    breakdown,
  };
}
