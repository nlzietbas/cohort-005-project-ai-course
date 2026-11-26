import { useState, useRef, useEffect } from "react";
import { useFetcher } from "react-router";
import { toast } from "sonner";
import { Pencil } from "lucide-react";

function useFocusWhenEditing(
  ref: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>,
  isEditing: boolean
) {
  useEffect(() => {
    if (isEditing && ref.current) {
      ref.current.focus();
      ref.current.select();
    }
  }, [isEditing, ref]);
}

function useInlineEdit<
  TElement extends HTMLInputElement | HTMLTextAreaElement,
>({
  value,
  onSave,
  isSaveKey,
}: {
  value: string;
  onSave: (trimmed: string) => void;
  isSaveKey: (event: React.KeyboardEvent) => boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const ref = useRef<TElement>(null);
  useFocusWhenEditing(ref, isEditing);

  // Update local state when server responds with new data
  useEffect(() => {
    setEditValue(value);
  }, [value]);

  function handleSave() {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== value) {
      onSave(trimmed);
    }
    setIsEditing(false);
  }

  function handleCancel() {
    setEditValue(value);
    setIsEditing(false);
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (isSaveKey(event)) {
      event.preventDefault();
      handleSave();
    } else if (event.key === "Escape") {
      handleCancel();
    }
  }

  return {
    isEditing,
    setIsEditing,
    editValue,
    setEditValue,
    ref,
    handleSave,
    handleKeyDown,
  };
}

function isEnter(event: React.KeyboardEvent) {
  return event.key === "Enter";
}

function InlineEditableText({
  value,
  onSave,
  inputClassName,
  buttonClassName,
  children,
}: {
  value: string;
  onSave: (trimmed: string) => void;
  inputClassName: string;
  buttonClassName: string;
  children: React.ReactNode;
}) {
  const edit = useInlineEdit<HTMLInputElement>({
    value,
    onSave,
    isSaveKey: isEnter,
  });

  if (edit.isEditing) {
    return (
      <input
        ref={edit.ref}
        type="text"
        value={edit.editValue}
        onChange={(event) => edit.setEditValue(event.target.value)}
        onBlur={edit.handleSave}
        onKeyDown={edit.handleKeyDown}
        className={inputClassName}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => edit.setIsEditing(true)}
      className={buttonClassName}
    >
      {children}
    </button>
  );
}

export function InlineEditableTitle({
  value,
}: {
  value: string;
  courseId: number;
}) {
  const fetcher = useFetcher();

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.success) {
      toast.success("Title saved.");
    }
    if (fetcher.state === "idle" && fetcher.data?.error) {
      toast.error(fetcher.data.error);
    }
  }, [fetcher.state, fetcher.data]);

  return (
    <InlineEditableText
      value={value}
      onSave={(trimmed) =>
        fetcher.submit(
          { intent: "update-title", title: trimmed },
          { method: "post" }
        )
      }
      inputClassName="w-full rounded-md border border-input bg-background px-3 py-1.5 text-3xl font-bold outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
      buttonClassName="group flex w-full items-start gap-2 rounded-md px-3 py-1.5 text-left hover:bg-muted"
    >
      <h1 className="flex-1 text-3xl font-bold">{value}</h1>
      <Pencil className="mt-2 size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </InlineEditableText>
  );
}

function isModifierEnter(event: React.KeyboardEvent) {
  return event.key === "Enter" && (event.metaKey || event.ctrlKey);
}

function autoResize(textarea: HTMLTextAreaElement) {
  textarea.style.height = "auto";
  textarea.style.height = textarea.scrollHeight + "px";
}

function DescriptionTextarea({
  textareaRef,
  value,
  onValueChange,
  onSave,
  onKeyDown,
}: {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  value: string;
  onValueChange: (value: string) => void;
  onSave: () => void;
  onKeyDown: (event: React.KeyboardEvent) => void;
}) {
  return (
    <div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => {
          onValueChange(event.target.value);
          autoResize(event.target);
        }}
        onBlur={onSave}
        onKeyDown={onKeyDown}
        rows={3}
        className="w-full resize-none rounded-md border border-input bg-background px-3 py-1.5 text-sm text-muted-foreground outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
      />
      <p className="mt-1 text-xs text-muted-foreground">
        Press Ctrl+Enter to save, Escape to cancel
      </p>
    </div>
  );
}

export function InlineEditableDescription({
  value,
}: {
  value: string;
  courseId: number;
}) {
  const fetcher = useFetcher();
  const edit = useInlineEdit<HTMLTextAreaElement>({
    value,
    onSave: (trimmed) =>
      fetcher.submit(
        { intent: "update-description", description: trimmed },
        { method: "post" }
      ),
    isSaveKey: isModifierEnter,
  });
  const textareaRef = edit.ref;

  useEffect(() => {
    if (edit.isEditing && textareaRef.current) {
      // Auto-resize
      autoResize(textareaRef.current);
    }
  }, [edit.isEditing, textareaRef]);

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.success) {
      toast.success("Description saved.");
    }
    if (fetcher.state === "idle" && fetcher.data?.error) {
      toast.error(fetcher.data.error);
    }
  }, [fetcher.state, fetcher.data]);

  if (edit.isEditing) {
    return (
      <DescriptionTextarea
        textareaRef={textareaRef}
        value={edit.editValue}
        onValueChange={edit.setEditValue}
        onSave={edit.handleSave}
        onKeyDown={edit.handleKeyDown}
      />
    );
  }

  return (
    <DescriptionButton value={value} onEdit={() => edit.setIsEditing(true)} />
  );
}

function DescriptionButton({
  value,
  onEdit,
}: {
  value: string;
  onEdit: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onEdit}
      className="group flex w-full items-start gap-2 rounded-md px-3 py-1.5 text-left hover:bg-muted"
    >
      <p className="flex-1 text-sm text-muted-foreground">{value}</p>
      <Pencil className="mt-0.5 size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}

export function InlineEditableModuleTitle({
  value,
  moduleId,
}: {
  value: string;
  moduleId: number;
}) {
  const fetcher = useFetcher();

  return (
    <InlineEditableText
      value={value}
      onSave={(trimmed) =>
        fetcher.submit(
          {
            intent: "rename-module",
            moduleId: String(moduleId),
            title: trimmed,
          },
          { method: "post" }
        )
      }
      inputClassName="w-full rounded-md border border-input bg-background px-2 py-1 text-base font-semibold outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
      buttonClassName="group flex items-center gap-2 rounded-md px-2 py-1 text-left hover:bg-muted"
    >
      <h3 className="font-semibold">{value}</h3>
      <Pencil className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </InlineEditableText>
  );
}

export function InlineEditableLessonTitle({
  value,
  lessonId,
}: {
  value: string;
  lessonId: number;
}) {
  const fetcher = useFetcher();

  return (
    <InlineEditableText
      value={value}
      onSave={(trimmed) =>
        fetcher.submit(
          {
            intent: "rename-lesson",
            lessonId: String(lessonId),
            title: trimmed,
          },
          { method: "post" }
        )
      }
      inputClassName="w-full rounded-md border border-input bg-background px-2 py-1 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
      buttonClassName="group flex items-center gap-1.5 rounded-md px-1 py-0.5 text-left text-sm hover:bg-muted"
    >
      <span className="flex-1">{value}</span>
      <Pencil className="size-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </InlineEditableText>
  );
}
