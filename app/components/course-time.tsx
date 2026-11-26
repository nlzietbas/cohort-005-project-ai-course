import { CalendarClock, Clock } from "lucide-react";
import { formatDuration } from "~/lib/utils";
import {
  formatWeeklyCommitment,
  type WeeklyCommitment,
} from "~/modules/course-time";

const COMMITMENT_HINT =
  "The Instructor's estimate of the time to set aside each week: video, exercises, quizzes and rewatching.";

const VIDEO_HINT = "Every lesson video in the course, added up.";

export function WeeklyCommitmentLabel({
  commitment,
  className = "flex items-center gap-1",
}: {
  commitment: WeeklyCommitment;
  className?: string;
}) {
  return (
    <span className={className} title={COMMITMENT_HINT}>
      <CalendarClock className="size-4 shrink-0" />
      <span>{formatWeeklyCommitment(commitment)}</span>
    </span>
  );
}

export function VideoTimeLabel({
  minutes,
  className = "flex items-center gap-1",
}: {
  minutes: number;
  className?: string;
}) {
  return (
    <span className={className} title={VIDEO_HINT}>
      <Clock className="size-4 shrink-0" />
      <span>{formatDuration(minutes, true, false, false)} of video</span>
    </span>
  );
}

export function CourseTimeExplainer() {
  return (
    <p className="text-xs leading-relaxed">
      <strong className="font-medium">Course time.</strong> The weekly hours are
      the Instructor's estimate of everything the course asks of you: watching,
      exercises, quizzes and rewatching. The video time is every lesson video
      added up, so it is the least time the course takes.
    </p>
  );
}
