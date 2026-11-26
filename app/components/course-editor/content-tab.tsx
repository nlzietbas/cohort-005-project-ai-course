import { useEffect } from "react";
import { Link, useFetcher } from "react-router";
import { toast } from "sonner";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DraggableProvided,
  type DropResult,
} from "@hello-pangea/dnd";
import { formatDuration } from "~/lib/utils";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { BookOpen, Clock, Eye, FileEdit, GripVertical } from "lucide-react";
import {
  AddModuleForm,
  DeleteLessonButton,
  DeleteModuleButton,
} from "./content-forms";
import {
  InlineEditableLessonTitle,
  InlineEditableModuleTitle,
} from "./inline-editors";
import { AddLessonForm } from "./add-lesson-form";
import { getDragEndSubmission } from "./drag-end";
import type { EditorCourse } from "./types";

type EditorModule = EditorCourse["modules"][number];
type EditorLesson = EditorModule["lessons"][number];

export function ContentTab({ course }: { course: EditorCourse }) {
  const reorderFetcher = useFetcher();
  const lessonReorderFetcher = useFetcher();

  useEffect(() => {
    if (reorderFetcher.state === "idle" && reorderFetcher.data?.success) {
      toast.success("Modules reordered.");
    }
    if (reorderFetcher.state === "idle" && reorderFetcher.data?.error) {
      toast.error(reorderFetcher.data.error);
    }
  }, [reorderFetcher.state, reorderFetcher.data]);

  useEffect(() => {
    if (
      lessonReorderFetcher.state === "idle" &&
      lessonReorderFetcher.data?.success
    ) {
      toast.success("Lessons reordered.");
    }
    if (
      lessonReorderFetcher.state === "idle" &&
      lessonReorderFetcher.data?.error
    ) {
      toast.error(lessonReorderFetcher.data.error);
    }
  }, [lessonReorderFetcher.state, lessonReorderFetcher.data]);

  function handleDragEnd(result: DropResult) {
    const submission = getDragEndSubmission(result, course.modules);
    if (!submission) return;
    const fetcher =
      submission.target === "modules" ? reorderFetcher : lessonReorderFetcher;
    fetcher.submit(submission.data, { method: "post" });
  }

  return (
    <>
      {course.modules.length === 0 ? (
        <NoModulesCard />
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <ModuleList course={course} />
        </DragDropContext>
      )}
      <AddModuleForm />
    </>
  );
}

function NoModulesCard() {
  return (
    <Card>
      <CardContent className="py-8 text-center">
        <BookOpen className="mx-auto mb-3 size-8 text-muted-foreground/50" />
        <p className="text-muted-foreground">
          No modules yet. Add your first module to start building content.
        </p>
      </CardContent>
    </Card>
  );
}

function ModuleList({ course }: { course: EditorCourse }) {
  return (
    <Droppable droppableId="modules" type="module">
      {(provided) => (
        <div
          className="space-y-4"
          ref={provided.innerRef}
          {...provided.droppableProps}
        >
          {course.modules.map((mod, index) => (
            <ModuleCard key={mod.id} course={course} mod={mod} index={index} />
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
}

function ModuleCard({
  course,
  mod,
  index,
}: {
  course: EditorCourse;
  mod: EditorModule;
  index: number;
}) {
  return (
    <Draggable draggableId={String(mod.id)} index={index}>
      {(provided, snapshot) => (
        <div ref={provided.innerRef} {...provided.draggableProps}>
          <Card
            className={
              snapshot.isDragging ? "shadow-lg ring-2 ring-primary/50" : ""
            }
          >
            <ModuleCardHeader mod={mod} provided={provided} />
            <CardContent>
              {mod.lessons.length === 0 ? (
                <p className="px-3 py-2 text-sm text-muted-foreground">
                  No lessons yet.
                </p>
              ) : (
                <LessonList course={course} mod={mod} />
              )}
              <AddLessonForm moduleId={mod.id} />
            </CardContent>
          </Card>
        </div>
      )}
    </Draggable>
  );
}

function ModuleCardHeader({
  mod,
  provided,
}: {
  mod: EditorModule;
  provided: DraggableProvided;
}) {
  return (
    <CardHeader>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <div
            {...provided.dragHandleProps}
            className="cursor-grab active:cursor-grabbing rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <GripVertical className="size-5" />
          </div>
          <div className="flex-1">
            <InlineEditableModuleTitle value={mod.title} moduleId={mod.id} />
            <p className="mt-1 px-2 text-sm text-muted-foreground">
              {mod.lessons.length}{" "}
              {mod.lessons.length === 1 ? "lesson" : "lessons"}
            </p>
          </div>
        </div>
        <DeleteModuleButton moduleId={mod.id} moduleTitle={mod.title} />
      </div>
    </CardHeader>
  );
}

function LessonList({
  course,
  mod,
}: {
  course: EditorCourse;
  mod: EditorModule;
}) {
  return (
    <Droppable droppableId={`lessons-${mod.id}`} type="lesson">
      {(lessonDropProvided) => (
        <ul
          className="space-y-1"
          ref={lessonDropProvided.innerRef}
          {...lessonDropProvided.droppableProps}
        >
          {mod.lessons.map((lesson, lessonIndex) => (
            <LessonRow
              key={lesson.id}
              course={course}
              lesson={lesson}
              index={lessonIndex}
            />
          ))}
          {lessonDropProvided.placeholder}
        </ul>
      )}
    </Droppable>
  );
}

function LessonRow({
  course,
  lesson,
  index,
}: {
  course: EditorCourse;
  lesson: EditorLesson;
  index: number;
}) {
  return (
    <Draggable draggableId={`lesson-${lesson.id}`} index={index}>
      {(lessonProvided, lessonSnapshot) => (
        <li ref={lessonProvided.innerRef} {...lessonProvided.draggableProps}>
          <div
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm${
              lessonSnapshot.isDragging
                ? " bg-muted shadow-md ring-1 ring-primary/30"
                : ""
            }`}
          >
            <div
              {...lessonProvided.dragHandleProps}
              className="cursor-grab active:cursor-grabbing rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <GripVertical className="size-4" />
            </div>
            <div className="flex-1">
              <InlineEditableLessonTitle
                value={lesson.title}
                lessonId={lesson.id}
              />
            </div>
            <LessonRowActions course={course} lesson={lesson} />
          </div>
        </li>
      )}
    </Draggable>
  );
}

function LessonRowActions({
  course,
  lesson,
}: {
  course: EditorCourse;
  lesson: EditorLesson;
}) {
  return (
    <>
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Clock className="size-3" />
        {formatDuration(lesson.durationMinutes, true, false, false)}
      </span>
      <Link
        to={`/courses/${course.slug}/lessons/${lesson.id}`}
        title="View lesson"
      >
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
        >
          <Eye className="size-3.5" />
        </Button>
      </Link>
      <Link
        to={`/instructor/${course.id}/lessons/${lesson.id}`}
        title="Edit lesson"
      >
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
        >
          <FileEdit className="size-3.5" />
        </Button>
      </Link>
      <DeleteLessonButton lessonId={lesson.id} lessonTitle={lesson.title} />
    </>
  );
}
