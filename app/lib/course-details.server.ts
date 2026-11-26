import { db } from "~/db";
import {
  courses,
  categories,
  users,
  modules,
  lessons,
  lessonProgress,
  LessonProgressStatus,
} from "~/db/schema";
import { eq, and, or, sql } from "drizzle-orm";

export function getCourseWithDetails(id: number) {
  const course = db
    .select({
      id: courses.id,
      title: courses.title,
      slug: courses.slug,
      description: courses.description,
      salesCopy: courses.salesCopy,
      instructorId: courses.instructorId,
      categoryId: courses.categoryId,
      status: courses.status,
      coverImageUrl: courses.coverImageUrl,
      price: courses.price,
      pppEnabled: courses.pppEnabled,
      createdAt: courses.createdAt,
      updatedAt: courses.updatedAt,
      instructorName: users.name,
      instructorAvatarUrl: users.avatarUrl,
      instructorBio: users.bio,
      categoryName: categories.name,
    })
    .from(courses)
    .innerJoin(users, eq(courses.instructorId, users.id))
    .innerJoin(categories, eq(courses.categoryId, categories.id))
    .where(eq(courses.id, id))
    .get();

  if (!course) return null;

  const courseModules = db
    .select()
    .from(modules)
    .where(eq(modules.courseId, id))
    .orderBy(modules.position)
    .all();

  const moduleIds = courseModules.map((m) => m.id);

  const courseLessons = getLessonsForModules(moduleIds);

  return {
    ...course,
    modules: courseModules.map((mod) => ({
      ...mod,
      lessons: courseLessons.filter((l) => l.moduleId === mod.id),
    })),
  };
}

function getLessonsForModules(moduleIds: number[]) {
  return moduleIds.length > 0
    ? db
        .select()
        .from(lessons)
        .where(or(...moduleIds.map((mid) => eq(lessons.moduleId, mid))))
        .orderBy(lessons.position)
        .all()
    : [];
}

export function getLessonCountForCourse(courseId: number) {
  const courseModules = db
    .select({ id: modules.id })
    .from(modules)
    .where(eq(modules.courseId, courseId))
    .all();

  if (courseModules.length === 0) return 0;

  const count = db
    .select({ count: sql<number>`count(*)` })
    .from(lessons)
    .where(or(...courseModules.map((m) => eq(lessons.moduleId, m.id))))
    .get();

  return count?.count ?? 0;
}

export function getCourseLessonIds(courseId: number): number[] {
  const courseModules = db
    .select({ id: modules.id })
    .from(modules)
    .where(eq(modules.courseId, courseId))
    .all();

  if (courseModules.length === 0) return [];

  const courseLessons = db
    .select({ id: lessons.id })
    .from(lessons)
    .where(or(...courseModules.map((m) => eq(lessons.moduleId, m.id))))
    .all();

  return courseLessons.map((l) => l.id);
}

function calculateDurationWeightedProgress(
  userId: number,
  lessonIds: number[]
) {
  const courseLessons = db
    .select({
      id: lessons.id,
      durationMinutes: lessons.durationMinutes,
    })
    .from(lessons)
    .where(or(...lessonIds.map((id) => eq(lessons.id, id))))
    .all();

  const totalDuration = courseLessons.reduce(
    (sum, l) => sum + l.durationMinutes,
    0
  );

  if (totalDuration === 0) return 0;

  const completed = db
    .select()
    .from(lessonProgress)
    .where(
      and(
        eq(lessonProgress.userId, userId),
        eq(lessonProgress.status, LessonProgressStatus.Completed),
        or(...lessonIds.map((id) => eq(lessonProgress.lessonId, id)))
      )
    )
    .all();

  const completedIds = new Set(completed.map((p) => p.lessonId));

  const completedDuration = courseLessons
    .filter((l) => completedIds.has(l.id))
    .reduce((sum, l) => sum + l.durationMinutes, 0);

  return Math.round((completedDuration / totalDuration) * 100);
}

export function calculateProgress(
  userId: number,
  courseId: number,
  weightByDuration: boolean
) {
  const lessonIds = getCourseLessonIds(courseId);

  if (lessonIds.length === 0) return 0;

  if (weightByDuration) {
    return calculateDurationWeightedProgress(userId, lessonIds);
  }

  const completedCount = db
    .select({ count: sql<number>`count(*)` })
    .from(lessonProgress)
    .where(
      and(
        eq(lessonProgress.userId, userId),
        eq(lessonProgress.status, LessonProgressStatus.Completed),
        or(...lessonIds.map((id) => eq(lessonProgress.lessonId, id)))
      )
    )
    .get();

  return Math.round(((completedCount?.count ?? 0) / lessonIds.length) * 100);
}
