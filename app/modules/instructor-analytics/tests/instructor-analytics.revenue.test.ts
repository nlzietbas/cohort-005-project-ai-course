import { describe, it, expect, beforeEach } from "vitest";
import { createInstructorAnalytics } from "../index.server";
import {
  setup,
  NOW,
  DAY_MS,
  course,
  instructor,
  otherCourse,
  db,
  addUser,
  addCourse,
  buy,
  asInstructor,
} from "./fixtures";

beforeEach(setup);

describe("revenue summary", () => {
  it("splits gross into the platform fee and the instructor's net", () => {
    const student = addUser("Sam Student");
    buy(student.id, course.id, 7900);
    buy(student.id, course.id, 2100);

    expect(asInstructor().summary).toEqual({
      grossCents: 10000,
      feeCents: 2000,
      netCents: 8000,
      purchaseCount: 2,
    });
  });

  it("is all zeroes with no sales", () => {
    expect(asInstructor().summary).toEqual({
      grossCents: 0,
      feeCents: 0,
      netCents: 0,
      purchaseCount: 0,
    });
  });

  it("only counts purchases inside the range", () => {
    const student = addUser("Sam Student");
    buy(student.id, course.id, 1000, { daysBack: 29 });
    buy(student.id, course.id, 2000, { daysBack: 31 });
    buy(student.id, course.id, 4000, { daysBack: 400 });

    expect(asInstructor({ range: "30d" }).summary.grossCents).toBe(1000);
    expect(asInstructor({ range: "90d" }).summary.grossCents).toBe(3000);
    expect(asInstructor({ range: "all" }).summary.grossCents).toBe(7000);
  });

  it("includes a purchase landing exactly on the start of the range", () => {
    const student = addUser("Sam Student");
    buy(student.id, course.id, 1000, { daysBack: 7 });

    expect(asInstructor({ range: "7d" }).summary.grossCents).toBe(1000);
  });

  it("rounds the fee and still adds up", () => {
    const student = addUser("Sam Student");
    buy(student.id, course.id, 999);

    expect(asInstructor().summary).toMatchObject({
      grossCents: 999,
      feeCents: 200,
      netCents: 799,
    });
  });
});

describe("revenue by course", () => {
  it("lists courses biggest earner first, leaving out unsold ones", () => {
    const small = addCourse(instructor.id, "Small Earner");
    addCourse(instructor.id, "Never Sold");
    const student = addUser("Sam Student");
    buy(student.id, small.id, 500);
    buy(student.id, course.id, 3000);
    buy(student.id, course.id, 2000);

    expect(asInstructor().courses).toEqual([
      {
        courseId: course.id,
        title: "Test Course",
        grossCents: 5000,
        feeCents: 1000,
        netCents: 4000,
        purchaseCount: 2,
      },
      {
        courseId: small.id,
        title: "Small Earner",
        grossCents: 500,
        feeCents: 100,
        netCents: 400,
        purchaseCount: 1,
      },
    ]);
  });
});

describe("revenue over time", () => {
  it("has a daily point for every day of a fixed range, sales or not", () => {
    const student = addUser("Sam Student");
    buy(student.id, course.id, 3000, { daysBack: 5 });
    buy(student.id, course.id, 2000, { daysBack: 5 });
    buy(student.id, course.id, 1000, { daysBack: 0 });

    expect(asInstructor({ range: "7d" }).series).toEqual({
      granularity: "day",
      points: [
        { bucket: "2026-09-29", grossCents: 0, netCents: 0 },
        { bucket: "2026-09-30", grossCents: 0, netCents: 0 },
        { bucket: "2026-10-01", grossCents: 5000, netCents: 4000 },
        { bucket: "2026-10-02", grossCents: 0, netCents: 0 },
        { bucket: "2026-10-03", grossCents: 0, netCents: 0 },
        { bucket: "2026-10-04", grossCents: 0, netCents: 0 },
        { bucket: "2026-10-05", grossCents: 0, netCents: 0 },
        { bucket: "2026-10-06", grossCents: 1000, netCents: 800 },
      ],
    });
  });

  it("spans the whole window even with no sales at all", () => {
    const { points } = asInstructor({ range: "30d" }).series;

    expect(points).toHaveLength(31);
    expect(points[0].bucket).toBe("2026-09-06");
    expect(points.at(-1)?.bucket).toBe("2026-10-06");
    expect(points.every((point) => point.grossCents === 0)).toBe(true);
  });

  it("goes monthly for all time, from the first sale's month to now", () => {
    const student = addUser("Sam Student");
    buy(student.id, course.id, 1000, { daysBack: 80 }); // 18 July
    buy(student.id, course.id, 2500, { daysBack: 26 }); // 10 September

    expect(asInstructor({ range: "all" }).series).toEqual({
      granularity: "month",
      points: [
        { bucket: "2026-07", grossCents: 1000, netCents: 800 },
        { bucket: "2026-08", grossCents: 0, netCents: 0 },
        { bucket: "2026-09", grossCents: 2500, netCents: 2000 },
        { bucket: "2026-10", grossCents: 0, netCents: 0 },
      ],
    });
  });

  it("is empty for all time with no sales", () => {
    expect(asInstructor({ range: "all" }).series).toEqual({
      granularity: "month",
      points: [],
    });
  });
});

describe("refund exposure", () => {
  it("adds up purchases still inside their refund window", () => {
    const secondCourse = addCourse(instructor.id, "Second Course");
    const student = addUser("Sam Student");
    buy(student.id, course.id, 10000, { daysBack: 3 });
    buy(student.id, course.id, 5000, { daysBack: 14 });
    buy(student.id, course.id, 4000, { daysBack: 15 });
    buy(student.id, secondCourse.id, 2000, { daysBack: 1 });

    expect(asInstructor({ range: "30d" }).refundExposure).toEqual({
      grossCents: 17000,
      netCents: 13600,
      purchaseCount: 3,
      sharePercent: 81,
      closingTodayCount: 1,
      courses: [
        {
          courseId: course.id,
          title: "Test Course",
          grossCents: 15000,
          purchaseCount: 2,
          daysLeft: 0,
        },
        {
          courseId: secondCourse.id,
          title: "Second Course",
          grossCents: 2000,
          purchaseCount: 1,
          daysLeft: 13,
        },
      ],
    });
  });

  it("keeps the fourteenth day open and closes the fifteenth", () => {
    const student = addUser("Sam Student");
    buy(student.id, course.id, 1000, { daysBack: 14 });
    buy(student.id, course.id, 2000, { daysBack: 15 });

    expect(asInstructor().refundExposure).toMatchObject({
      grossCents: 1000,
      closingTodayCount: 1,
    });
  });

  it("counts days left from today, with a purchase made today having fourteen", () => {
    buy(addUser("Sam Student").id, course.id, 1000, { daysBack: 0 });

    expect(asInstructor().refundExposure.courses[0].daysLeft).toBe(14);
  });

  it("only looks at purchases inside the selected range", () => {
    buy(addUser("Sam Student").id, course.id, 1000, { daysBack: 10 });

    expect(asInstructor({ range: "7d" }).refundExposure.grossCents).toBe(0);
    expect(asInstructor({ range: "30d" }).refundExposure.grossCents).toBe(1000);
  });

  it("is empty with no sales", () => {
    expect(asInstructor().refundExposure).toEqual({
      grossCents: 0,
      netCents: 0,
      purchaseCount: 0,
      sharePercent: 0,
      closingTodayCount: 0,
      courses: [],
    });
  });

  it("moves with the clock it is given", () => {
    buy(addUser("Sam Student").id, course.id, 1000, { daysBack: 3 });
    const aWeekLater = new Date(NOW.getTime() + 7 * DAY_MS);
    const twelveDaysLater = new Date(NOW.getTime() + 12 * DAY_MS);
    const viewer = { userId: instructor.id, isAdmin: false };
    const params = new URLSearchParams();

    expect(
      createInstructorAnalytics(db).get(viewer, params, aWeekLater)
        .refundExposure.courses[0].daysLeft
    ).toBe(4);
    expect(
      createInstructorAnalytics(db).get(viewer, params, twelveDaysLater)
        .refundExposure.grossCents
    ).toBe(0);
  });
});

describe("revenue by country", () => {
  function countries(params: Record<string, string> = {}) {
    return asInstructor({ course: String(course.id), ...params }).countries;
  }

  it("breaks sales down by country, biggest first, with parity discounts", () => {
    const student = addUser("Student");
    buy(student.id, course.id, 10000, { country: "US" });
    buy(student.id, course.id, 10000, { country: "US" });
    buy(student.id, course.id, 8000, { country: null });
    buy(student.id, course.id, 5000, { country: "IN" });
    buy(student.id, course.id, 3000, { country: "NG" });

    expect(countries()).toEqual({
      grossCents: 36000,
      netCents: 28800,
      purchaseCount: 5,
      discountedGrossCents: 8000,
      discountedNetCents: 6400,
      discountedSharePercent: 22,
      rows: [
        {
          country: "US",
          purchaseCount: 2,
          grossCents: 20000,
          netCents: 16000,
          sharePercent: 56,
          averagePaidCents: 10000,
          discountPercent: 0,
        },
        {
          country: null,
          purchaseCount: 1,
          grossCents: 8000,
          netCents: 6400,
          sharePercent: 22,
          averagePaidCents: 8000,
          discountPercent: null,
        },
        {
          country: "IN",
          purchaseCount: 1,
          grossCents: 5000,
          netCents: 4000,
          sharePercent: 14,
          averagePaidCents: 5000,
          discountPercent: 50,
        },
        {
          country: "NG",
          purchaseCount: 1,
          grossCents: 3000,
          netCents: 2400,
          sharePercent: 8,
          averagePaidCents: 3000,
          discountPercent: 70,
        },
      ],
    });
  });

  it("only counts this course's sales inside the range", () => {
    const student = addUser("Student");
    buy(student.id, course.id, 1000, { daysBack: 2 });
    buy(student.id, course.id, 2000, { daysBack: 40 });
    buy(student.id, otherCourse.id, 4000, { daysBack: 2 });

    expect(countries({ range: "30d" })?.grossCents).toBe(1000);
    expect(countries({ range: "all" })?.grossCents).toBe(3000);
  });

  it("is all zeroes with no sales", () => {
    expect(countries()).toEqual({
      grossCents: 0,
      netCents: 0,
      purchaseCount: 0,
      discountedGrossCents: 0,
      discountedNetCents: 0,
      discountedSharePercent: 0,
      rows: [],
    });
  });
});
