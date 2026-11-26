import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { asc, count, eq } from "drizzle-orm";
import * as schema from "~/db/schema";
import { categories, courses, CourseStatus } from "~/db/schema";

export type Db = BetterSQLite3Database<typeof schema>;

export type CatalogOverview = {
  publishedCourses: number;
  topics: string[];
};

const TOPICS_NAMED_IN_FULL = 3;

export function readCatalogOverview(database: Db): CatalogOverview {
  const rows = database
    .select({ topic: categories.name, courses: count(courses.id) })
    .from(courses)
    .innerJoin(categories, eq(courses.categoryId, categories.id))
    .where(eq(courses.status, CourseStatus.Published))
    .groupBy(categories.id)
    .orderBy(asc(categories.name))
    .all();

  return {
    publishedCourses: rows.reduce((total, row) => total + row.courses, 0),
    topics: rows.map((row) => row.topic),
  };
}

const listFormat = new Intl.ListFormat("en", {
  style: "long",
  type: "conjunction",
});

export function topicsInWords(topics: string[]): string {
  if (topics.length === 0) return "Coming soon";
  if (topics.length <= TOPICS_NAMED_IN_FULL) return listFormat.format(topics);
  return listFormat.format([...topics.slice(0, TOPICS_NAMED_IN_FULL), "more"]);
}

function plural(amount: number, noun: string) {
  return `${amount} ${noun}${amount === 1 ? "" : "s"}`;
}

export function exactFigures(overview: CatalogOverview): string {
  return `${plural(overview.publishedCourses, "published course")} in ${plural(overview.topics.length, "topic")}`;
}
