import { Link } from "react-router";
import { CheckCircle2, Circle, Clock, Pencil, PlayCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { LessonProgressStatus } from "~/db/schema";
import { formatDuration } from "~/lib/utils";

type Lesson = {
  id: number;
  title: string;
  durationMinutes: number | null;
};

type Module = {
  id: number;
  title: string;
  lessons: Array<Lesson>;
};

type CourseContentProps = {
  course: {
    id: number;
    slug: string;
    modules: Array<Module>;
  };
  canView: boolean;
  isInstructor: boolean;
  lessonProgressMap: Record<number, LessonProgressStatus>;
};

export function CourseContent(props: CourseContentProps) {
  const { course } = props;
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
            <ModuleCard key={mod.id} {...props} mod={mod} />
          ))}
        </div>
      )}
    </div>
  );
}

function ModuleCard({
  course,
  mod,
  ...rest
}: CourseContentProps & { mod: Module }) {
  return (
    <Card>
      <CardHeader>
        <h3 className="font-semibold">
          <Link
            to={`/courses/${course.slug}/${mod.id}`}
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
            <LessonRow
              key={lesson.id}
              {...rest}
              course={course}
              lesson={lesson}
            />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function LessonRow({
  course,
  lesson,
  canView,
  isInstructor,
  lessonProgressMap,
}: CourseContentProps & { lesson: Lesson }) {
  if (isInstructor) {
    return (
      <li>
        <Link
          to={`/instructor/${course.id}/lessons/${lesson.id}`}
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted"
        >
          <Pencil className="size-4 shrink-0 text-muted-foreground" />
          <LessonLabel lesson={lesson} />
        </Link>
      </li>
    );
  }

  return (
    <li>
      {canView ? (
        <Link
          to={`/courses/${course.slug}/lessons/${lesson.id}`}
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted"
        >
          <LessonStatusIcon status={lessonProgressMap[lesson.id]} />
          <LessonLabel lesson={lesson} />
        </Link>
      ) : (
        <div className="flex items-center gap-3 px-3 py-2 text-sm">
          <Circle className="size-4 shrink-0 text-muted-foreground" />
          <LessonLabel lesson={lesson} />
        </div>
      )}
    </li>
  );
}

function LessonStatusIcon({
  status,
}: {
  status: LessonProgressStatus | undefined;
}) {
  if (status === LessonProgressStatus.Completed) {
    return <CheckCircle2 className="size-4 shrink-0 text-green-500" />;
  }
  if (status === LessonProgressStatus.InProgress) {
    return <PlayCircle className="size-4 shrink-0 text-blue-500" />;
  }
  return <Circle className="size-4 shrink-0 text-muted-foreground" />;
}

function LessonLabel({ lesson }: { lesson: Lesson }) {
  return (
    <>
      <span className="flex-1">{lesson.title}</span>
      {lesson.durationMinutes && (
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="size-3" />
          {formatDuration(lesson.durationMinutes, true, false, false)}
        </span>
      )}
    </>
  );
}
