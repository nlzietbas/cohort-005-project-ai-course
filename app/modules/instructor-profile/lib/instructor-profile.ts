import { data } from "react-router";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type * as schema from "~/db/schema";
import { CourseStatus, UserRole, courses, users } from "~/db/schema";
import { renderComment } from "~/lib/comment-markdown.server";
import { markdown } from "~/lib/text";

export type Db = BetterSQLite3Database<typeof schema>;

/** Who is looking at a profile: null when signed out. */
export type ProfileViewer = {
  id: number;
  role: "student" | "instructor" | "platform-admin";
} | null;

export type ProfileCourse = {
  id: number;
  title: string;
  slug: string;
  description: string;
  coverImageUrl: string | null;
  status: CourseStatus;
};

export type InstructorProfile = {
  instructor: {
    name: string;
    slug: string;
    avatarUrl: string | null;
    /** Sanitised HTML, or null when there is no bio. */
    bioHtml: string | null;
  };
  /** False when only the Instructor and Platform Admins can see the page. */
  isPublic: boolean;
  courses: ProfileCourse[];
  page: number;
  pageCount: number;
};

export const PROFILE_PAGE_SIZE = 12;

/** Draft courses are never listed and never make a profile public. */
const LISTED_STATUSES = [CourseStatus.Published, CourseStatus.Archived];

const NOT_FOUND = "Instructor not found";

function findUser(db: Db, slug: string) {
  return db
    .select({
      id: users.id,
      name: users.name,
      slug: users.slug,
      role: users.role,
      avatarUrl: users.avatarUrl,
      bio: users.bio,
    })
    .from(users)
    .where(eq(users.slug, slug))
    .get();
}

function listedCourses(instructorId: number) {
  return and(
    eq(courses.instructorId, instructorId),
    inArray(courses.status, LISTED_STATUSES)
  );
}

function countListedCourses(db: Db, instructorId: number) {
  const row = db
    .select({ count: sql<number>`count(*)` })
    .from(courses)
    .where(listedCourses(instructorId))
    .get();
  return row?.count ?? 0;
}

function getCoursePage(db: Db, instructorId: number, page: number) {
  return db
    .select({
      id: courses.id,
      title: courses.title,
      slug: courses.slug,
      description: courses.description,
      coverImageUrl: courses.coverImageUrl,
      status: courses.status,
    })
    .from(courses)
    .where(listedCourses(instructorId))
    .orderBy(
      sql`CASE ${courses.status} WHEN ${CourseStatus.Published} THEN 0 ELSE 1 END`,
      desc(courses.createdAt),
      desc(courses.id)
    )
    .limit(PROFILE_PAGE_SIZE)
    .offset((page - 1) * PROFILE_PAGE_SIZE)
    .all();
}

function canSeePrivateProfile(viewer: ProfileViewer, instructorId: number) {
  return viewer?.role === "platform-admin" || viewer?.id === instructorId;
}

export async function getInstructorProfile(
  db: Db,
  { slug, viewer, page }: { slug: string; viewer: ProfileViewer; page: number }
): Promise<InstructorProfile> {
  const user = findUser(db, slug);
  if (!user?.slug) throw data(NOT_FOUND, { status: 404 });

  const total = countListedCourses(db, user.id);
  const isPublic = total > 0;
  const hasProfile = isPublic || user.role === UserRole.Instructor;
  if (!hasProfile) throw data(NOT_FOUND, { status: 404 });
  if (!isPublic && !canSeePrivateProfile(viewer, user.id)) {
    throw data(NOT_FOUND, { status: 404 });
  }

  const bio = user.bio?.trim();
  return {
    instructor: {
      name: user.name,
      slug: user.slug,
      avatarUrl: user.avatarUrl,
      bioHtml: bio ? await renderComment(markdown(bio)) : null,
    },
    isPublic,
    courses: getCoursePage(db, user.id, page),
    page,
    pageCount: Math.max(1, Math.ceil(total / PROFILE_PAGE_SIZE)),
  };
}
