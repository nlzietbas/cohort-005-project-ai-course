import { db } from "~/db";
import {
  getInstructorProfile,
  type Db,
  type ProfileViewer,
} from "./lib/instructor-profile";

export {
  PROFILE_PAGE_SIZE,
  type InstructorProfile,
  type ProfileCourse,
  type ProfileViewer,
} from "./lib/instructor-profile";

/**
 * Instructor profiles bound to a database. The app uses
 * `instructorProfiles`, which reads the app database; tests build their own
 * against a test database.
 */
export function createInstructorProfiles(database: Db) {
  return {
    /**
     * The profile at `/instructors/:slug`: the Instructor's name, avatar and
     * sanitised bio, and one page of their Published courses followed by
     * their Archived ones. Draft courses never appear and email never leaves.
     *
     * The profile is public once the Instructor has a Published or Archived
     * course. Until then only the Instructor and Platform Admins see it.
     * Throws a 404 for everyone else, for an unknown slug, and for a user
     * who is not an Instructor and has no listed course.
     */
    get(slug: string, viewer: ProfileViewer, page: number) {
      return getInstructorProfile(database, { slug, viewer, page });
    },
  };
}

// Pure so a route importing this only for its loader doesn't pull the
// database into the client bundle (see `~/db`).
export const instructorProfiles = /* @__PURE__ */ createInstructorProfiles(db);
