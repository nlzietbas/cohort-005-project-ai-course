import { Link } from "react-router";
import { BookOpen, EyeOff } from "lucide-react";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { CourseImage } from "~/components/course-image";
import { UserAvatar } from "~/components/user-avatar";
import { CourseStatus } from "~/db/schema";
import type {
  InstructorProfile,
  ProfileCourse,
} from "~/modules/instructor-profile/index.server";

type ProfileProps = { profile: InstructorProfile };

export function ProfileHeader({ profile }: ProfileProps) {
  const { instructor, isPublic } = profile;
  return (
    <header className="mb-10">
      {!isPublic && (
        <div className="mb-6 flex gap-2 rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm">
          <EyeOff className="mt-0.5 size-4 shrink-0 text-amber-500" />
          <p>
            This profile is hidden. Only {instructor.name} and Platform Admins
            can see it until a course is published.
          </p>
        </div>
      )}
      <div className="flex items-center gap-4">
        <UserAvatar
          name={instructor.name}
          avatarUrl={instructor.avatarUrl}
          className="size-16 text-lg"
        />
        <div>
          <p className="text-sm font-medium text-primary">Instructor</p>
          <h1 className="text-3xl font-bold">{instructor.name}</h1>
        </div>
      </div>
      {instructor.bioHtml && (
        <div
          className="prose prose-neutral dark:prose-invert mt-6 max-w-none"
          // oxlint-disable-next-line react/no-danger -- renderComment escapes the bio's HTML
          dangerouslySetInnerHTML={{ __html: instructor.bioHtml }}
        />
      )}
    </header>
  );
}

export function ProfileCourseList({ profile }: ProfileProps) {
  return (
    <section>
      <h2 className="mb-4 text-2xl font-bold">
        Courses by {profile.instructor.name}
      </h2>
      {profile.courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <BookOpen className="mb-4 size-12 text-muted-foreground/50" />
          <p className="text-muted-foreground">No published courses yet.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {profile.courses.map((course) => (
            <ProfileCourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
      <Pagination profile={profile} />
    </section>
  );
}

function ProfileCourseCard({ course }: { course: ProfileCourse }) {
  const isArchived = course.status === CourseStatus.Archived;
  return (
    <Link to={`/courses/${course.slug}`} className="group">
      <Card className="h-full overflow-hidden pt-0 transition-shadow group-hover:shadow-md">
        <div className="aspect-video overflow-hidden">
          <CourseImage
            src={course.coverImageUrl}
            alt={course.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        </div>
        <CardHeader>
          {isArchived && (
            <span className="mb-1 inline-flex w-fit items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              Archived
            </span>
          )}
          <h3 className="text-lg font-semibold leading-tight group-hover:text-primary">
            {course.title}
          </h3>
        </CardHeader>
        <CardContent>
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {course.description}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

function Pagination({ profile }: ProfileProps) {
  const { page, pageCount } = profile;
  if (pageCount <= 1) return null;
  return (
    <nav className="mt-8 flex items-center justify-center gap-3 text-sm">
      {page > 1 && (
        <Link to={`?page=${page - 1}`}>
          <Button variant="outline" size="sm">
            Previous
          </Button>
        </Link>
      )}
      <span className="text-muted-foreground">
        Page {page} of {pageCount}
      </span>
      {page < pageCount && (
        <Link to={`?page=${page + 1}`}>
          <Button variant="outline" size="sm">
            Next
          </Button>
        </Link>
      )}
    </nav>
  );
}

/** The Instructor's name, linked to their profile when they have one. */
export function InstructorName({
  name,
  slug,
}: {
  name: string;
  slug: string | null;
}) {
  if (!slug) return <>{name}</>;
  return (
    <Link
      to={`/instructors/${encodeURIComponent(slug)}`}
      className="relative z-10 font-medium text-foreground underline-offset-2 hover:underline"
    >
      {name}
    </Link>
  );
}
