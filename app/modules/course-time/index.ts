/**
 * Course Time: what a course asks of a Student's week, and how much video it
 * holds. Safe to import in the browser.
 *
 * - Weekly Commitment: an hour range per week for a number of weeks, set by
 *   the Instructor. Stored in whole minutes, shown in hours.
 * - Video Time: the sum of every lesson's video length. A lesson always has
 *   a length of at least 1 minute.
 */
export {
  estimateWeeklyCommitment,
  formatWeeklyCommitment,
  hoursForInput,
  isValidWeeklyCommitment,
  lessonDurationMinutes,
  toWeeklyCommitment,
  totalVideoMinutes,
  weeklyCommitmentFields,
  type WeeklyCommitment,
} from "./lib/commitment";
