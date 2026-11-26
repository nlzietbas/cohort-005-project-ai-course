import { describe, it, expect, beforeEach } from "vitest";
import { createTestDb, seedBaseData, type TestDb } from "~/test/setup";
import * as schema from "~/db/schema";
import { createCourseTime } from "../index.server";

let db: TestDb;
let base: ReturnType<typeof seedBaseData>;
let courseTime: ReturnType<typeof createCourseTime>;

const NOW = new Date("2026-11-26T12:00:00.000Z");

beforeEach(() => {
  db = createTestDb();
  base = seedBaseData(db);
  courseTime = createCourseTime(db);
});

describe("setWeeklyCommitment", () => {
  it("stores the range and weeks the Instructor set", () => {
    courseTime.setWeeklyCommitment(
      base.course.id,
      { minMinutes: 90, maxMinutes: 150, weeks: 6 },
      NOW
    );

    expect(courseTime.getWeeklyCommitment(base.course.id)).toEqual({
      minMinutes: 90,
      maxMinutes: 150,
      weeks: 6,
    });
  });

  it("marks the course as updated at the given time", () => {
    courseTime.setWeeklyCommitment(
      base.course.id,
      { minMinutes: 90, maxMinutes: 150, weeks: 6 },
      NOW
    );

    const course = db.query.courses
      .findFirst({ where: (c, { eq }) => eq(c.id, base.course.id) })
      .sync();
    expect(course?.updatedAt).toBe(NOW.toISOString());
  });

  it("refuses a commitment that isn't valid and keeps the old one", () => {
    const before = courseTime.getWeeklyCommitment(base.course.id);

    expect(() =>
      courseTime.setWeeklyCommitment(
        base.course.id,
        { minMinutes: 200, maxMinutes: 100, weeks: 2 },
        NOW
      )
    ).toThrow("A weekly commitment needs 0 < min <= max and weeks >= 1.");
    expect(() =>
      courseTime.setWeeklyCommitment(
        base.course.id,
        { minMinutes: 60, maxMinutes: 100, weeks: 0 },
        NOW
      )
    ).toThrow("A weekly commitment needs 0 < min <= max and weeks >= 1.");

    expect(courseTime.getWeeklyCommitment(base.course.id)).toEqual(before);
  });

  it("leaves other courses alone", () => {
    const other = db
      .insert(schema.courses)
      .values({ ...base.course, id: undefined, slug: "other-course" })
      .returning()
      .get();

    courseTime.setWeeklyCommitment(
      base.course.id,
      { minMinutes: 30, maxMinutes: 45, weeks: 2 },
      NOW
    );

    expect(courseTime.getWeeklyCommitment(other.id)).toEqual({
      minMinutes: base.course.weeklyCommitmentMinMinutes,
      maxMinutes: base.course.weeklyCommitmentMaxMinutes,
      weeks: base.course.durationWeeks,
    });
  });
});

describe("getWeeklyCommitment", () => {
  it("is null for a course that doesn't exist", () => {
    expect(courseTime.getWeeklyCommitment(9999)).toBeNull();
  });
});
