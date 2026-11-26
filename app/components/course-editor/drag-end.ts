import type { DraggableLocation, DropResult } from "@hello-pangea/dnd";
import type { EditorCourse } from "./types";

type EditorModule = EditorCourse["modules"][number];

/** Which fetcher submits a drag's outcome, and with what form data. */
export type DragEndSubmission = {
  target: "modules" | "lessons";
  data: Record<string, string>;
};

function moveItem<T>(items: T[], from: number, to: number) {
  const reordered = Array.from(items);
  const [moved] = reordered.splice(from, 1);
  reordered.splice(to, 0, moved);
  return reordered;
}

function parseModuleId(droppableId: string) {
  return parseInt(droppableId.replace("lessons-", ""), 10);
}

function getLessonDropSubmission(
  source: DraggableLocation,
  destination: DraggableLocation,
  modules: EditorModule[]
): DragEndSubmission | null {
  const sourceModuleId = parseModuleId(source.droppableId);
  const destModuleId = parseModuleId(destination.droppableId);

  if (sourceModuleId === destModuleId) {
    // Reorder within the same module
    const mod = modules.find((m) => m.id === sourceModuleId);
    if (!mod) return null;

    const reordered = moveItem(mod.lessons, source.index, destination.index);
    const lessonIds = reordered.map((l) => l.id);
    return {
      target: "lessons",
      data: {
        intent: "reorder-lessons",
        moduleId: String(sourceModuleId),
        lessonIds: JSON.stringify(lessonIds),
      },
    };
  }

  // Move lesson to a different module
  const sourceMod = modules.find((m) => m.id === sourceModuleId);
  if (!sourceMod) return null;

  const lesson = sourceMod.lessons[source.index];
  if (!lesson) return null;

  // Target position is 1-based (destination index + 1)
  const targetPosition = destination.index + 1;

  return {
    target: "lessons",
    data: {
      intent: "move-lesson",
      lessonId: String(lesson.id),
      targetModuleId: String(destModuleId),
      targetPosition: String(targetPosition),
    },
  };
}

/** Decides what a finished drag submits, or null when nothing changes. */
export function getDragEndSubmission(
  result: DropResult,
  modules: EditorModule[]
): DragEndSubmission | null {
  const { source, destination } = result;
  if (!destination) return null;
  if (
    source.droppableId === destination.droppableId &&
    source.index === destination.index
  ) {
    return null;
  }

  if (result.type === "module") {
    const reordered = moveItem(modules, source.index, destination.index);
    const moduleIds = reordered.map((m) => m.id);
    return {
      target: "modules",
      data: { intent: "reorder-modules", moduleIds: JSON.stringify(moduleIds) },
    };
  }
  if (result.type === "lesson") {
    return getLessonDropSubmission(source, destination, modules);
  }
  return null;
}
