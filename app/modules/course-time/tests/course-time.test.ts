import { describe, it, expect } from "vitest";
import {
  estimateWeeklyCommitment,
  formatWeeklyCommitment,
  hoursForInput,
  isValidWeeklyCommitment,
  lessonDurationMinutes,
  toWeeklyCommitment,
  totalVideoMinutes,
  weeklyCommitmentFields,
} from "../index";
import { z } from "zod";

describe("totalVideoMinutes", () => {
  it("adds up every lesson's video length", () => {
    expect(
      totalVideoMinutes([
        { durationMinutes: 10 },
        { durationMinutes: 15 },
        { durationMinutes: 7 },
      ])
    ).toBe(32);
  });

  it("is 0 for a course with no lessons", () => {
    expect(totalVideoMinutes([])).toBe(0);
  });
});

describe("estimateWeeklyCommitment", () => {
  it("spreads 2× the video over 3-hour weeks, at 1.5× to 2.5× the video", () => {
    // 277 min of video → 554 min of study → 4 weeks.
    expect(estimateWeeklyCommitment(277)).toEqual({
      minMinutes: 104,
      maxMinutes: 173,
      weeks: 4,
    });
  });

  it("rounds the number of weeks up", () => {
    expect(estimateWeeklyCommitment(90).weeks).toBe(1);
    expect(estimateWeeklyCommitment(91).weeks).toBe(2);
  });

  it("gives an empty course 1 week of at least 1 minute", () => {
    expect(estimateWeeklyCommitment(0)).toEqual({
      minMinutes: 1,
      maxMinutes: 1,
      weeks: 1,
    });
  });

  it("always gives a valid commitment", () => {
    for (const video of [0, 1, 2, 5, 89, 90, 91, 180, 1000]) {
      expect(isValidWeeklyCommitment(estimateWeeklyCommitment(video))).toBe(
        true
      );
    }
  });
});

describe("formatWeeklyCommitment", () => {
  it("shows the range in hours per week and the number of weeks", () => {
    expect(
      formatWeeklyCommitment({ minMinutes: 104, maxMinutes: 173, weeks: 4 })
    ).toBe("1.7–2.9 h/week for 4 weeks");
  });

  it("shows one number when both ends round to the same hours", () => {
    expect(
      formatWeeklyCommitment({ minMinutes: 120, maxMinutes: 122, weeks: 1 })
    ).toBe("2 h/week for 1 week");
  });

  it("never shows 0 hours", () => {
    expect(
      formatWeeklyCommitment({ minMinutes: 1, maxMinutes: 2, weeks: 2 })
    ).toBe("0.1 h/week for 2 weeks");
  });
});

describe("hoursForInput", () => {
  it("turns stored minutes into hours for a form field", () => {
    expect(hoursForInput(90)).toBe("1.5");
    expect(hoursForInput(120)).toBe("2");
    expect(hoursForInput(100)).toBe("1.67");
  });
});

describe("isValidWeeklyCommitment", () => {
  const valid = { minMinutes: 60, maxMinutes: 120, weeks: 3 };

  it("accepts a range of whole positive minutes over at least 1 week", () => {
    expect(isValidWeeklyCommitment(valid)).toBe(true);
    expect(
      isValidWeeklyCommitment({ minMinutes: 60, maxMinutes: 60, weeks: 1 })
    ).toBe(true);
  });

  it.each([
    ["a minimum of 0", { ...valid, minMinutes: 0 }],
    ["a minimum above the maximum", { ...valid, minMinutes: 121 }],
    ["0 weeks", { ...valid, weeks: 0 }],
    ["fractional minutes", { ...valid, minMinutes: 60.5 }],
    ["a fractional maximum", { ...valid, maxMinutes: 120.5 }],
    ["fractional weeks", { ...valid, weeks: 2.5 }],
  ])("rejects %s", (_name, commitment) => {
    expect(isValidWeeklyCommitment(commitment)).toBe(false);
  });
});

describe("weeklyCommitmentFields", () => {
  const schema = z.object(weeklyCommitmentFields);

  function parse(fields: Record<string, string>) {
    return schema.safeParse(fields);
  }

  function firstError(fields: Record<string, string>) {
    const result = parse(fields);
    if (result.success) throw new Error("expected a parse failure");
    return result.error.issues[0].message;
  }

  const valid = {
    weeklyMinHours: "1.5",
    weeklyMaxHours: "3",
    durationWeeks: "4",
  };

  it("reads hours from the form and stores whole minutes", () => {
    const result = parse(valid);
    expect(result.success && result.data).toEqual({
      weeklyMinHours: 90,
      weeklyMaxHours: 180,
      durationWeeks: 4,
    });
  });

  it("keeps a tiny positive number of hours at 1 minute", () => {
    const result = parse({ ...valid, weeklyMinHours: "0.001" });
    expect(result.success && result.data.weeklyMinHours).toBe(1);
  });

  it("rejects an empty or zero weekly time", () => {
    expect(firstError({ ...valid, weeklyMinHours: "" })).toBe(
      "Minimum weekly time must be more than 0 hours."
    );
    expect(firstError({ ...valid, weeklyMaxHours: "0" })).toBe(
      "Maximum weekly time must be more than 0 hours."
    );
  });

  it("rejects text and more hours than a week has", () => {
    expect(firstError({ ...valid, weeklyMinHours: "lots" })).toBe(
      "Minimum weekly time must be a number."
    );
    expect(firstError({ ...valid, weeklyMaxHours: "168.5" })).toBe(
      "Maximum weekly time cannot be more than 168 hours a week."
    );
    expect(parse({ ...valid, weeklyMaxHours: "168" }).success).toBe(true);
  });

  it("needs a whole, positive number of weeks", () => {
    expect(firstError({ ...valid, durationWeeks: "0" })).toBe(
      "A course must last at least 1 week."
    );
    expect(firstError({ ...valid, durationWeeks: "2.5" })).toBe(
      "Weeks must be a whole number."
    );
    expect(firstError({ ...valid, durationWeeks: "x" })).toBe(
      "Weeks must be a number."
    );
    expect(firstError({ ...valid, durationWeeks: "521" })).toBe(
      "A course cannot last more than 520 weeks."
    );
    expect(parse({ ...valid, durationWeeks: "520" }).success).toBe(true);
  });
});

describe("toWeeklyCommitment", () => {
  it("turns parsed form fields into a commitment", () => {
    expect(
      toWeeklyCommitment({
        weeklyMinHours: 90,
        weeklyMaxHours: 180,
        durationWeeks: 4,
      })
    ).toEqual({ minMinutes: 90, maxMinutes: 180, weeks: 4 });
  });

  it("accepts an equal minimum and maximum", () => {
    expect(
      toWeeklyCommitment({
        weeklyMinHours: 90,
        weeklyMaxHours: 90,
        durationWeeks: 1,
      })
    ).toEqual({ minMinutes: 90, maxMinutes: 90, weeks: 1 });
  });

  it("refuses a minimum above the maximum", () => {
    expect(
      toWeeklyCommitment({
        weeklyMinHours: 181,
        weeklyMaxHours: 180,
        durationWeeks: 4,
      })
    ).toBeNull();
  });
});

describe("lessonDurationMinutes", () => {
  it("accepts a whole number of minutes of at least 1", () => {
    expect(lessonDurationMinutes.parse("1")).toBe(1);
    expect(lessonDurationMinutes.parse("15")).toBe(15);
  });

  it.each([
    ["", "Video length must be at least 1 minute."],
    ["0", "Video length must be at least 1 minute."],
    ["-3", "Video length must be at least 1 minute."],
    ["2.5", "Video length must be a whole number of minutes."],
    ["ten", "Video length must be a number."],
  ])("rejects %j", (input, message) => {
    const result = lessonDurationMinutes.safeParse(input);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe(message);
  });
});
