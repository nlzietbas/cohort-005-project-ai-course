import { useEffect } from "react";
import { useFetcher } from "react-router";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  formatWeeklyCommitment,
  hoursForInput,
  type WeeklyCommitment,
} from "~/modules/course-time";

export function WeeklyCommitmentCard({
  courseId,
  commitment,
}: {
  courseId: number;
  commitment: WeeklyCommitment;
}) {
  const fetcher = useFetcher();

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.success) {
      toast.success("Weekly commitment updated.");
    }
    if (fetcher.state === "idle" && fetcher.data?.error) {
      toast.error(fetcher.data.error);
    }
  }, [fetcher.state, fetcher.data]);

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">Weekly Commitment</h2>
        <p className="text-sm text-muted-foreground">
          How many hours a week a Student should set aside, and for how many
          weeks. Count everything: video, exercises, quizzes and rewatching.
          Students see this on the course page.
        </p>
      </CardHeader>
      <CardContent>
        <fetcher.Form
          method="post"
          key={courseId}
          className="flex flex-wrap items-end gap-4"
        >
          <input type="hidden" name="intent" value="update-weekly-commitment" />
          <WeeklyCommitmentInputs commitment={commitment} />
          <Button type="submit" disabled={fetcher.state !== "idle"}>
            {fetcher.state !== "idle" ? "Saving..." : "Save"}
          </Button>
        </fetcher.Form>
        <p className="mt-3 text-sm text-muted-foreground">
          Students see: {formatWeeklyCommitment(commitment)}
        </p>
      </CardContent>
    </Card>
  );
}

export function WeeklyCommitmentInputs({
  commitment,
}: {
  commitment?: WeeklyCommitment;
}) {
  return (
    <>
      <NumberField
        name="weeklyMinHours"
        label="Hours per week, from"
        defaultValue={commitment && hoursForInput(commitment.minMinutes)}
      />
      <NumberField
        name="weeklyMaxHours"
        label="to"
        defaultValue={commitment && hoursForInput(commitment.maxMinutes)}
      />
      <NumberField
        name="durationWeeks"
        label="Weeks"
        defaultValue={commitment?.weeks}
        whole
      />
    </>
  );
}

function NumberField({
  name,
  label,
  defaultValue,
  whole = false,
}: {
  name: string;
  label: string;
  defaultValue: string | number | undefined;
  whole?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type="number"
        min={whole ? "1" : "0.1"}
        max={whole ? "520" : "168"}
        step={whole ? "1" : "any"}
        required
        defaultValue={defaultValue}
        className="w-28"
      />
    </div>
  );
}
