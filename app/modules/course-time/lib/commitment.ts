import { z } from "zod";

export type WeeklyCommitment = {
  minMinutes: number;
  maxMinutes: number;
  weeks: number;
};

const MINUTES_PER_HOUR = 60;
const STUDY_MINUTES_PER_WEEK = 180;
const STUDY_PER_VIDEO_MINUTE = 2;
const LOW_STUDY_PER_VIDEO_MINUTE = 1.5;
const HIGH_STUDY_PER_VIDEO_MINUTE = 2.5;

export function isValidWeeklyCommitment({
  minMinutes,
  maxMinutes,
  weeks,
}: WeeklyCommitment): boolean {
  return (
    Number.isInteger(minMinutes) &&
    Number.isInteger(maxMinutes) &&
    Number.isInteger(weeks) &&
    minMinutes > 0 &&
    minMinutes <= maxMinutes &&
    weeks > 0
  );
}

export function totalVideoMinutes(
  lessons: readonly { durationMinutes: number }[]
): number {
  return lessons.reduce((sum, lesson) => sum + lesson.durationMinutes, 0);
}

export function estimateWeeklyCommitment(
  videoMinutes: number
): WeeklyCommitment {
  const weeks = Math.max(
    1,
    Math.ceil((videoMinutes * STUDY_PER_VIDEO_MINUTE) / STUDY_MINUTES_PER_WEEK)
  );
  const minMinutes = Math.max(
    1,
    Math.round((videoMinutes * LOW_STUDY_PER_VIDEO_MINUTE) / weeks)
  );
  const maxMinutes = Math.max(
    minMinutes,
    Math.round((videoMinutes * HIGH_STUDY_PER_VIDEO_MINUTE) / weeks)
  );
  return { minMinutes, maxMinutes, weeks };
}

function formatHours(minutes: number): string {
  const tenths = Math.max(1, Math.round((minutes / MINUTES_PER_HOUR) * 10));
  return String(tenths / 10);
}

function formatHourRange({ minMinutes, maxMinutes }: WeeklyCommitment) {
  const min = formatHours(minMinutes);
  const max = formatHours(maxMinutes);
  return min === max ? min : `${min}–${max}`;
}

export function formatWeeklyCommitment(commitment: WeeklyCommitment): string {
  const weeks = commitment.weeks === 1 ? "1 week" : `${commitment.weeks} weeks`;
  return `${formatHourRange(commitment)} h/week for ${weeks}`;
}

export function hoursForInput(minutes: number): string {
  return String(Math.round((minutes / MINUTES_PER_HOUR) * 100) / 100);
}

const hoursField = (label: string) =>
  z.coerce
    .number({ invalid_type_error: `${label} must be a number.` })
    .positive(`${label} must be more than 0 hours.`)
    .max(168, `${label} cannot be more than 168 hours a week.`)
    .transform((hours) => Math.max(1, Math.round(hours * MINUTES_PER_HOUR)));

export const weeklyCommitmentFields = {
  weeklyMinHours: hoursField("Minimum weekly time"),
  weeklyMaxHours: hoursField("Maximum weekly time"),
  durationWeeks: z.coerce
    .number({ invalid_type_error: "Weeks must be a number." })
    .int("Weeks must be a whole number.")
    .positive("A course must last at least 1 week.")
    .max(520, "A course cannot last more than 520 weeks."),
};

export function toWeeklyCommitment(fields: {
  weeklyMinHours: number;
  weeklyMaxHours: number;
  durationWeeks: number;
}): WeeklyCommitment | null {
  if (fields.weeklyMinHours > fields.weeklyMaxHours) return null;
  return {
    minMinutes: fields.weeklyMinHours,
    maxMinutes: fields.weeklyMaxHours,
    weeks: fields.durationWeeks,
  };
}

export const lessonDurationMinutes = z.coerce
  .number({ invalid_type_error: "Video length must be a number." })
  .int("Video length must be a whole number of minutes.")
  .positive("Video length must be at least 1 minute.");
