import { db } from "~/db";
import type { WeeklyCommitment } from "./lib/commitment";
import { getWeeklyCommitment, setWeeklyCommitment, type Db } from "./lib/store";

/**
 * Course Time bound to a database. The app uses `courseTime`, which reads the
 * app database; tests build their own against a test database.
 */
export function createCourseTime(database: Db) {
  return {
    /** The course's Weekly Commitment, or null when there is no such course. */
    getWeeklyCommitment(courseId: number) {
      return getWeeklyCommitment(database, courseId);
    },

    /**
     * Replaces the course's Weekly Commitment. Throws unless
     * 0 < min <= max and weeks >= 1, all whole numbers.
     */
    setWeeklyCommitment(
      courseId: number,
      commitment: WeeklyCommitment,
      now: Date
    ) {
      setWeeklyCommitment(database, { courseId, commitment, now });
    },
  };
}

// Pure so a route importing this only for its action doesn't pull the
// database into the client bundle (see `~/db`).
export const courseTime = /* @__PURE__ */ createCourseTime(db);
