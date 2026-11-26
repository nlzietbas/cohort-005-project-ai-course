import type { getCourseWithDetails } from "~/lib/course-details.server";
import type { WeeklyCommitment } from "~/modules/course-time";

export type EditorCourse = NonNullable<
  ReturnType<typeof getCourseWithDetails>
> & { weeklyCommitment: WeeklyCommitment };

export type EditorStudent = {
  userId: number;
  name: string;
  email: string;
  enrolledAt: string;
  completedAt: string | null;
  progress: number;
  quizScores: {
    quizId: number;
    quizTitle: string;
    lessonTitle: string;
    bestScore: number | null;
    passed: boolean | null;
  }[];
};
