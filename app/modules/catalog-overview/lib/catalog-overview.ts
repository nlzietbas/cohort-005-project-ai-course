import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { asc, count, countDistinct, eq } from "drizzle-orm";
import * as schema from "~/db/schema";
import { categories, courses, CourseStatus } from "~/db/schema";

export type Db = BetterSQLite3Database<typeof schema>;

export type CatalogOverview = {
  publishedCourses: number;
  publishedTopics: number;
  firstTopics: string[];
};

const TOPICS_NAMED_IN_FULL = 3;

export function readCatalogOverview(database: Db): CatalogOverview {
  const published = eq(courses.status, CourseStatus.Published);

  const totals = database
    .select({
      courses: count(courses.id),
      topics: countDistinct(courses.categoryId),
    })
    .from(courses)
    .innerJoin(categories, eq(courses.categoryId, categories.id))
    .where(published)
    .get();

  const firstTopics = database
    .select({ topic: categories.name })
    .from(courses)
    .innerJoin(categories, eq(courses.categoryId, categories.id))
    .where(published)
    .groupBy(categories.id)
    .orderBy(asc(categories.name))
    .limit(TOPICS_NAMED_IN_FULL + 1)
    .all()
    .map((row) => row.topic);

  return {
    publishedCourses: totals?.courses ?? 0,
    publishedTopics: totals?.topics ?? 0,
    firstTopics,
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
  return `${plural(overview.publishedCourses, "published course")} in ${plural(overview.publishedTopics, "topic")}`;
}
