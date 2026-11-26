import { Link } from "react-router";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { CheckCircle2, Circle, Clock, Pencil, PlayCircle } from "lucide-react";
import { LessonProgressStatus } from "~/db/schema";
import { formatDuration } from "~/lib/utils";

type ContentLesson = { id: number; title: string; durationMinutes: number };

type ContentModule = { id: number; title: string; lessons: ContentLesson[] };

type Viewer = {
  courseId: number;
  slug: string;
  canView: boolean;
  isInstructor: boolean;
  lessonProgressMap: Record<number, string>;
};

export function CourseContent({
  course,
  canView,
  isInstructor,
  lessonProgressMap,
}: {
  course: { id: number; slug: string; modules: ContentModule[] };
  canView: boolean;
  isInstructor: boolean;
  lessonProgressMap: Record<number, string>;
}) {
  const viewer: Viewer = {
    courseId: course.id,
    slug: course.slug,
    canView,
    isInstructor,
    lessonProgressMap,
  };

  return (
    <div>
      <h2 className="mb-4 text-2xl font-bold">Course Content</h2>
      {course.modules.length === 0 ? (
        <p className="text-muted-foreground">
          No content has been added to this course yet.
        </p>
      ) : (
        <div className="space-y-4">
          {course.modules.map((mod) => (
            <ModuleCard key={mod.id} mod={mod} viewer={viewer} />
          ))}
        </div>
      )}
    </div>
  );
}

function ModuleCard({ mod, viewer }: { mod: ContentModule; viewer: Viewer }) {
  return (
    <Card>
      <CardHeader>
        <h3 className="font-semibold">
          <Link
            to={`/courses/${viewer.slug}/${mod.id}`}
            className="hover:underline"
          >
            {mod.title}
          </Link>
        </h3>
        <p className="text-sm text-muted-foreground">
          {mod.lessons.length} lessons
        </p>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {mod.lessons.map((lesson) => (
            <li key={lesson.id}>
              <LessonRow lesson={lesson} viewer={viewer} />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function LessonRow({
  lesson,
  viewer,
}: {
  lesson: ContentLesson;
  viewer: Viewer;
}) {
  if (viewer.isInstructor) {
    return (
      <Link
        to={`/instructor/${viewer.courseId}/lessons/${lesson.id}`}
        className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted"
      >
        <Pencil className="size-4 shrink-0 text-muted-foreground" />
        <LessonLabel lesson={lesson} />
      </Link>
    );
  }

  if (!viewer.canView) {
    return (
      <div className="flex items-center gap-3 px-3 py-2 text-sm">
        <Circle className="size-4 shrink-0 text-muted-foreground" />
        <LessonLabel lesson={lesson} />
      </div>
    );
  }

  return (
    <Link
      to={`/courses/${viewer.slug}/lessons/${lesson.id}`}
      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted"
    >
      <ProgressIcon status={viewer.lessonProgressMap[lesson.id]} />
      <LessonLabel lesson={lesson} />
    </Link>
  );
}

function ProgressIcon({ status }: { status: string | undefined }) {
  if (status === LessonProgressStatus.Completed) {
    return <CheckCircle2 className="size-4 shrink-0 text-green-500" />;
  }
  if (status === LessonProgressStatus.InProgress) {
    return <PlayCircle className="size-4 shrink-0 text-blue-500" />;
  }
  return <Circle className="size-4 shrink-0 text-muted-foreground" />;
}

function LessonLabel({ lesson }: { lesson: ContentLesson }) {
  return (
    <>
      <span className="flex-1">{lesson.title}</span>
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Clock className="size-3" />
        {formatDuration(lesson.durationMinutes, true, false, false)}
      </span>
    </>
  );
}
