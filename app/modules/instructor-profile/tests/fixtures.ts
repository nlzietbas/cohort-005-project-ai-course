import { eq } from "drizzle-orm";
import { createTestDb, type TestDb } from "~/test/setup";
import * as schema from "~/db/schema";
import { CourseStatus, UserRole } from "~/db/schema";
import { markdown } from "~/lib/text";
import { createInstructorProfiles } from "../index.server";

// Users and courses are written by routes and the seed, not by a module, so
// rows go in directly. Kept in one place so a schema change touches only this
// file.

export function setup() {
  const db = createTestDb();
  const category = db
    .insert(schema.categories)
    .values({ name: "Programming", slug: "programming" })
    .returning()
    .get();
  return {
    db,
    categoryId: category.id,
    profiles: createInstructorProfiles(db),
  };
}

let emailCounter = 0;

export function addUser(
  db: TestDb,
  name: string,
  {
    role = UserRole.Instructor,
    bio = null,
  }: { role?: UserRole; bio?: string | null } = {}
) {
  emailCounter += 1;
  const { id } = db
    .insert(schema.users)
    .values({ name, email: `user${emailCounter}@example.com`, role, bio })
    .returning({ id: schema.users.id })
    .get();
  // RETURNING runs before the AFTER INSERT trigger that sets the slug, so
  // read the row back.
  const user = db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, id))
    .get();
  if (!user?.slug) throw new Error("The user has no slug");
  return { ...user, slug: user.slug };
}

let slugCounter = 0;

export function addCourse(
  db: TestDb,
  course: {
    instructorId: number;
    categoryId: number;
    title: string;
    status: CourseStatus;
    createdAt?: string;
  }
) {
  slugCounter += 1;
  return db
    .insert(schema.courses)
    .values({
      ...course,
      slug: `course-${slugCounter}`,
      description: `About ${course.title}`,
      salesCopy: markdown(course.title),
    })
    .returning()
    .get();
}
