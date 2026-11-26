import { describe, it, expect, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { createTestDb, seedBaseData, type TestDb } from "~/test/setup";
import * as schema from "~/db/schema";
import { CourseStatus } from "~/db/schema";
import { markdown } from "~/lib/text";
import { createCatalogOverview } from "../index.server";

let db: TestDb;
let instructorId: number;
let programmingId: number;

beforeEach(() => {
  db = createTestDb();
  const base = seedBaseData(db);
  instructorId = base.instructor.id;
  programmingId = base.category.id;
});

// ─── Fixtures ───

let slugCounter = 0;

function addCategory(name: string) {
  return db
    .insert(schema.categories)
    .values({ name, slug: name.toLowerCase().replaceAll(" ", "-") })
    .returning()
    .get().id;
}

function addCourse(categoryId: number, status = CourseStatus.Published) {
  slugCounter += 1;
  db.insert(schema.courses)
    .values({
      title: `Course ${slugCounter}`,
      slug: `course-${slugCounter}`,
      description: "A course",
      salesCopy: markdown("Sales copy"),
      instructorId,
      categoryId,
      status,
    })
    .run();
}

function overview() {
  return createCatalogOverview(db).get();
}

describe("catalogOverview.get", () => {
  it("names the topic of the one seeded published course", () => {
    expect(overview()).toEqual({
      topics: "Programming",
      exactFigures: "1 published course in 1 topic",
    });
  });

  it("leaves out categories with no published course", () => {
    const devOps = addCategory("DevOps");
    addCategory("Marketing");
    addCourse(devOps, CourseStatus.Draft);
    addCourse(devOps, CourseStatus.Archived);

    expect(overview()).toEqual({
      topics: "Programming",
      exactFigures: "1 published course in 1 topic",
    });
  });

  it("counts only published courses", () => {
    addCourse(programmingId, CourseStatus.Draft);
    addCourse(programmingId);

    expect(overview().exactFigures).toBe("2 published courses in 1 topic");
  });

  it("does not cap the course count at 50", () => {
    for (let i = 0; i < 60; i++) addCourse(programmingId);

    expect(overview().exactFigures).toBe("61 published courses in 1 topic");
  });

  it("joins two or three topics in alphabetical order with 'and'", () => {
    addCourse(addCategory("Design"));
    expect(overview().topics).toBe("Design and Programming");

    addCourse(addCategory("Data Science"));
    expect(overview()).toEqual({
      topics: "Data Science, Design, and Programming",
      exactFigures: "3 published courses in 3 topics",
    });
  });

  it("names the first three topics and says 'and more' after that", () => {
    addCourse(addCategory("Design"));
    addCourse(addCategory("Data Science"));
    addCourse(addCategory("Writing"));

    expect(overview().topics).toBe(
      "Data Science, Design, Programming, and more"
    );
  });

  it("counts every topic, not only the ones it names", () => {
    for (const name of ["Design", "Data Science", "Writing", "Testing"])
      addCourse(addCategory(name));

    expect(overview().exactFigures).toBe("5 published courses in 5 topics");
  });

  it("names two categories that share a name as two topics", () => {
    addCourse(addCategory("Programming 2"));
    db.update(schema.categories)
      .set({ name: "Programming" })
      .where(eq(schema.categories.name, "Programming 2"))
      .run();

    expect(overview()).toEqual({
      topics: "Programming and Programming",
      exactFigures: "2 published courses in 2 topics",
    });
  });

  it("says topics are coming soon when nothing is published", () => {
    db.update(schema.courses).set({ status: CourseStatus.Draft }).run();

    expect(overview()).toEqual({
      topics: "Coming soon",
      exactFigures: "0 published courses in 0 topics",
    });
  });
});
