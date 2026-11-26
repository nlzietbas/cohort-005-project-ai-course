import { eq } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type * as schema from "~/db/schema";
import { courses } from "~/db/schema";
import { isValidWeeklyCommitment, type WeeklyCommitment } from "./commitment";

export type Db = BetterSQLite3Database<typeof schema>;

export function getWeeklyCommitment(
  database: Db,
  courseId: number
): WeeklyCommitment | null {
  const row = database
    .select({
      minMinutes: courses.weeklyCommitmentMinMinutes,
      maxMinutes: courses.weeklyCommitmentMaxMinutes,
      weeks: courses.durationWeeks,
    })
    .from(courses)
    .where(eq(courses.id, courseId))
    .get();
  return row ?? null;
}

export function setWeeklyCommitment(
  database: Db,
  {
    courseId,
    commitment,
    now,
  }: { courseId: number; commitment: WeeklyCommitment; now: Date }
) {
  if (!isValidWeeklyCommitment(commitment)) {
    throw new Error("A weekly commitment needs 0 < min <= max and weeks >= 1.");
  }
  database
    .update(courses)
    .set({
      weeklyCommitmentMinMinutes: commitment.minMinutes,
      weeklyCommitmentMaxMinutes: commitment.maxMinutes,
      durationWeeks: commitment.weeks,
      updatedAt: now.toISOString(),
    })
    .where(eq(courses.id, courseId))
    .run();
}
