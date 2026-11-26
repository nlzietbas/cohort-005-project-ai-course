import { beforeEach, describe, expect, it } from "vitest";
import type { TestDb } from "~/test/setup";
import { CourseStatus, UserRole } from "~/db/schema";
import { PROFILE_PAGE_SIZE, type ProfileViewer } from "../index.server";
import { addCourse, addUser, setup } from "./fixtures";

let db: TestDb;
let categoryId: number;
let profiles: ReturnType<typeof setup>["profiles"];

beforeEach(() => {
  ({ db, categoryId, profiles } = setup());
});

const ANONYMOUS: ProfileViewer = null;

function publish(
  instructorId: number,
  title: string,
  {
    status = CourseStatus.Published,
    createdAt,
  }: { status?: CourseStatus; createdAt?: string } = {}
) {
  return addCourse(db, { instructorId, categoryId, title, status, createdAt });
}

const NOT_FOUND = { init: { status: 404 }, data: "Instructor not found" };

describe("slugs", () => {
  it("gives a user a slug made from their name", () => {
    expect(addUser(db, "Sarah Chen").slug).toBe("sarah-chen");
  });

  it("drops punctuation and collapses separators", () => {
    expect(addUser(db, "  Seán O'Brien / Jr.  (PhD) ").slug).toBe(
      "seán-obrien-jr-phd"
    );
  });

  it("adds the new user's id when the name is taken", () => {
    const first = addUser(db, "Sarah Chen");
    const second = addUser(db, "Sarah Chen");

    expect(first.slug).toBe("sarah-chen");
    expect(second.slug).toBe(`sarah-chen-${second.id}`);
  });

  it("falls back to 'user' for a name with no usable characters", () => {
    expect(addUser(db, "???").slug).toBe("user");
  });
});

describe("a public profile", () => {
  it("shows the Instructor to a signed-out visitor", async () => {
    const sarah = addUser(db, "Sarah Chen", {
      role: UserRole.Instructor,
      bio: "Hi there",
    });
    publish(sarah.id, "Node APIs");

    const profile = await profiles.get(sarah.slug, ANONYMOUS, 1);

    expect(profile.isPublic).toBe(true);
    expect(profile.instructor).toEqual({
      name: "Sarah Chen",
      slug: "sarah-chen",
      avatarUrl: null,
      bioHtml: "<p>Hi there</p>\n",
    });
    expect(JSON.stringify(profile)).not.toContain("@example.com");
  });

  it("lists Published courses first, then Archived, and never Draft", async () => {
    const sarah = addUser(db, "Sarah Chen");
    publish(sarah.id, "Old", {
      status: CourseStatus.Archived,
      createdAt: "2026-01-03T00:00:00Z",
    });
    publish(sarah.id, "Hidden", {
      status: CourseStatus.Draft,
      createdAt: "2026-01-04T00:00:00Z",
    });
    publish(sarah.id, "Older", {
      status: CourseStatus.Published,
      createdAt: "2026-01-01T00:00:00Z",
    });
    publish(sarah.id, "Newer", {
      status: CourseStatus.Published,
      createdAt: "2026-01-02T00:00:00Z",
    });

    const profile = await profiles.get(sarah.slug, ANONYMOUS, 1);

    expect(profile.courses.map((c) => [c.title, c.status])).toEqual([
      ["Newer", CourseStatus.Published],
      ["Older", CourseStatus.Published],
      ["Old", CourseStatus.Archived],
    ]);
  });

  it("lists only the Instructor's own courses", async () => {
    const sarah = addUser(db, "Sarah Chen");
    const marcus = addUser(db, "Marcus Johnson");
    publish(sarah.id, "Sarah's");
    publish(marcus.id, "Marcus's");

    const profile = await profiles.get(sarah.slug, ANONYMOUS, 1);

    expect(profile.courses.map((c) => c.title)).toEqual(["Sarah's"]);
  });

  it("is public with only Archived courses", async () => {
    const sarah = addUser(db, "Sarah Chen");
    publish(sarah.id, "Old", { status: CourseStatus.Archived });

    const profile = await profiles.get(sarah.slug, ANONYMOUS, 1);

    expect(profile.isPublic).toBe(true);
  });

  it("pages the course list", async () => {
    const sarah = addUser(db, "Sarah Chen");
    for (let i = 0; i <= PROFILE_PAGE_SIZE; i++) {
      publish(sarah.id, `Course ${i}`);
    }

    const first = await profiles.get(sarah.slug, ANONYMOUS, 1);
    const second = await profiles.get(sarah.slug, ANONYMOUS, 2);

    expect(first.courses).toHaveLength(PROFILE_PAGE_SIZE);
    expect(second.courses).toHaveLength(1);
    expect(first.pageCount).toBe(2);
    expect(second.page).toBe(2);
  });

  it("shows the last page for a page past the end", async () => {
    const sarah = addUser(db, "Sarah Chen");
    for (let i = 0; i <= PROFILE_PAGE_SIZE; i++) {
      publish(sarah.id, `Course ${i}`);
    }

    const profile = await profiles.get(sarah.slug, ANONYMOUS, 99);

    expect(profile.page).toBe(2);
    expect(profile.courses).toHaveLength(1);
  });

  it("belongs to anyone who teaches a listed course, whatever their role", async () => {
    const alex = addUser(db, "Alex Rivera", { role: UserRole.Admin });
    publish(alex.id, "Admin's course");

    const profile = await profiles.get(alex.slug, ANONYMOUS, 1);

    expect(profile.courses).toHaveLength(1);
  });
});

describe("the bio", () => {
  it("renders Markdown", async () => {
    const sarah = addUser(db, "Sarah Chen", { bio: "I **love** it" });
    publish(sarah.id, "Node APIs");

    const { instructor } = await profiles.get(sarah.slug, ANONYMOUS, 1);

    expect(instructor.bioHtml).toContain("<strong>love</strong>");
  });

  it("never emits HTML the Instructor wrote", async () => {
    const bio = "<script>alert(1)</script> [x](javascript:alert(1))";
    const sarah = addUser(db, "Sarah Chen", { role: UserRole.Instructor, bio });
    publish(sarah.id, "Node APIs");

    const { instructor } = await profiles.get(sarah.slug, ANONYMOUS, 1);

    expect(instructor.bioHtml).not.toContain("<script>");
    expect(instructor.bioHtml).toContain("&lt;script&gt;");
    expect(instructor.bioHtml).not.toContain("<a");
  });

  it("drops a link that is not http, https or mailto", async () => {
    const bio = "See [my site](javascript:alert(1))";
    const sarah = addUser(db, "Sarah Chen", { role: UserRole.Instructor, bio });
    publish(sarah.id, "Node APIs");

    const { instructor } = await profiles.get(sarah.slug, ANONYMOUS, 1);

    expect(instructor.bioHtml).toBe("<p>See my site</p>\n");
  });

  it("is null when empty or blank", async () => {
    const sarah = addUser(db, "Sarah Chen", {
      role: UserRole.Instructor,
      bio: "   ",
    });
    publish(sarah.id, "Node APIs");

    const { instructor } = await profiles.get(sarah.slug, ANONYMOUS, 1);

    expect(instructor.bioHtml).toBeNull();
  });
});

describe("a profile with no listed course", () => {
  let priya: ReturnType<typeof addUser>;

  beforeEach(() => {
    priya = addUser(db, "Priya Nair", {
      role: UserRole.Instructor,
      bio: "Soon",
    });
  });

  it("is hidden from signed-out visitors", async () => {
    await expect(profiles.get(priya.slug, ANONYMOUS, 1)).rejects.toMatchObject(
      NOT_FOUND
    );
  });

  it("is hidden from Students and other Instructors", async () => {
    const student = addUser(db, "Sam Student", { role: UserRole.Student });
    const other = addUser(db, "Olive Other");

    await expect(
      profiles.get(priya.slug, { id: student.id, role: "student" }, 1)
    ).rejects.toMatchObject(NOT_FOUND);
    await expect(
      profiles.get(priya.slug, { id: other.id, role: "instructor" }, 1)
    ).rejects.toMatchObject(NOT_FOUND);
  });

  it("stays hidden while every course is a Draft", async () => {
    publish(priya.id, "Work in progress", { status: CourseStatus.Draft });

    await expect(profiles.get(priya.slug, ANONYMOUS, 1)).rejects.toMatchObject(
      NOT_FOUND
    );
  });

  it("is shown, empty, to the Instructor", async () => {
    const profile = await profiles.get(
      priya.slug,
      { id: priya.id, role: "instructor" },
      1
    );

    expect(profile.isPublic).toBe(false);
    expect(profile.courses).toEqual([]);
    expect(profile.pageCount).toBe(1);
  });

  it("is shown to a Platform Admin", async () => {
    const admin = addUser(db, "Alex Rivera", { role: UserRole.Admin });

    const profile = await profiles.get(
      priya.slug,
      { id: admin.id, role: "platform-admin" },
      1
    );

    expect(profile.instructor.name).toBe("Priya Nair");
  });

  it("becomes public with the first Published course", async () => {
    publish(priya.id, "First course");

    const profile = await profiles.get(priya.slug, ANONYMOUS, 1);

    expect(profile.isPublic).toBe(true);
  });
});

describe("no profile", () => {
  it("for an unknown slug", async () => {
    await expect(profiles.get("nobody", ANONYMOUS, 1)).rejects.toMatchObject(
      NOT_FOUND
    );
  });

  it("for a Student, even to a Platform Admin", async () => {
    const student = addUser(db, "Sam Student", { role: UserRole.Student });
    const admin = addUser(db, "Alex Rivera", { role: UserRole.Admin });

    await expect(
      profiles.get(student.slug, { id: admin.id, role: "platform-admin" }, 1)
    ).rejects.toMatchObject(NOT_FOUND);
  });
});
