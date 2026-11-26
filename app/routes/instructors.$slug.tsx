import { Link, isRouteErrorResponse } from "react-router";
import { AlertTriangle } from "lucide-react";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import type { Route } from "./+types/instructors.$slug";
import { people } from "~/modules/permissions/person.server";
import { instructorProfiles } from "~/modules/instructor-profile/index.server";
import { parseParams } from "~/lib/validation";
import {
  ProfileCourseList,
  ProfileHeader,
} from "~/components/instructor-profile";

const paramsSchema = z.object({ slug: z.string().min(1) });

// A bad or missing page falls back to the first one.
const searchSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
});

export function meta({ loaderData }: Route.MetaArgs) {
  const name = loaderData?.profile.instructor.name ?? "Instructor";
  return [{ title: `${name} — Cadence` }];
}

// Public page: signed-out visitors see a profile once it has a Published or
// Archived course. The module decides who sees what.
export async function loader({ params, request }: Route.LoaderArgs) {
  const { slug } = parseParams(params, paramsSchema);
  const { page } = searchSchema.parse(
    Object.fromEntries(new URL(request.url).searchParams)
  );
  const viewer = await people.getPerson(request);
  const profile = await instructorProfiles.get(slug, viewer, page);
  return { profile };
}

export default function InstructorProfilePage({
  loaderData,
}: Route.ComponentProps) {
  const { profile } = loaderData;
  return (
    <div className="mx-auto max-w-5xl p-6 lg:p-8">
      <ProfileHeader profile={profile} />
      <ProfileCourseList profile={profile} />
    </div>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-6">
      <div className="text-center">
        <AlertTriangle className="mx-auto mb-4 size-12 text-muted-foreground" />
        <h1 className="mb-2 text-2xl font-bold">
          {notFound ? "Instructor not found" : "Something went wrong"}
        </h1>
        <p className="mb-6 text-muted-foreground">
          {notFound
            ? "There is no public profile at this address."
            : "An unexpected error occurred while loading this profile."}
        </p>
        <Link to="/courses">
          <Button variant="outline">Browse Courses</Button>
        </Link>
      </div>
    </div>
  );
}
