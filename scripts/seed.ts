import path from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";
import { defaultNotifications } from "../app/lib/notifications.server";
import { syncAllUsers } from "../app/lib/notification-preferences.server";
import { seedCategories } from "./seed/categories";
import { seedComments } from "./seed/comments";
import { seedBuildingRestApisWithNodejs } from "./seed/courses/building-rest-apis-with-nodejs";
import { seedDesignSystemsWithTailwind } from "./seed/courses/design-systems-with-tailwind";
import { seedIntroductionToTypeScript } from "./seed/courses/introduction-to-typescript";
import { seedPracticalDataVisualisation } from "./seed/courses/practical-data-visualisation";
import { seedShippingWithDockerAndKubernetes } from "./seed/courses/shipping-with-docker-and-kubernetes";
import { db } from "./seed/db";
import { seedEnrollments, seedRatings } from "./seed/enrollments";
import { seedGeneratedHistory } from "./seed/generated-history";
import { seedNarrativeProgress } from "./seed/progress";
import { seedFirstTeam, seedIndividualPurchases } from "./seed/purchases";
import { seedQuizAttempts } from "./seed/quiz-attempts";
import { seedQuizzes } from "./seed/quizzes";
import { seedLiamRefund, seedMartaRefund } from "./seed/refunds";
import { resetDatabase } from "./seed/reset";
import { printSummary } from "./seed/summary";
import { seedFurtherTeamPurchases } from "./seed/team-purchases";
import { seedUsers } from "./seed/users";
import {
  flushWatchEvents,
  seedNarrativeWatchSessions,
} from "./seed/watch-events";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Runs under tsx, not Vite, so load .env for the Knock keys ourselves.
const envFile = path.resolve(__dirname, "../.env");
if (existsSync(envFile)) process.loadEnvFile(envFile);

// ─── Seed Data ───
//
// Each section lives in its own file under scripts/seed/. They run in the
// order below, which is also the order of the ids they create.

async function seed() {
  console.log("Seeding database...");

  resetDatabase();

  const { admin, instructor1, instructor2, students, bossy, cohort } =
    seedUsers();
  const catBySlug = seedCategories();

  const { course: course1, lessonIds: course1LessonIds } =
    seedIntroductionToTypeScript(instructor1, catBySlug);
  const { course: course2, lessonIds: course2LessonIds } =
    seedBuildingRestApisWithNodejs(instructor2, catBySlug);
  const { course: course3, lessonIds: course3LessonIds } =
    seedDesignSystemsWithTailwind(instructor1, catBySlug);
  seedPracticalDataVisualisation(instructor2, catBySlug);
  seedShippingWithDockerAndKubernetes(instructor2, catBySlug);

  const quizzes = seedQuizzes(course1LessonIds, course2LessonIds);

  seedEnrollments(students, course1, course2);
  seedRatings(students, course1, course2);
  seedComments({
    admin,
    instructor1,
    instructor2,
    students,
    course1LessonIds,
    course2LessonIds,
  });
  seedNarrativeProgress(students, course1LessonIds, course2LessonIds);
  seedQuizAttempts(students, quizzes);
  seedNarrativeWatchSessions(students, course1LessonIds, course2LessonIds);
  seedIndividualPurchases(students, course1, course2);
  seedFirstTeam(bossy, course2);

  seedGeneratedHistory(cohort, {
    course1,
    course1LessonIds,
    course2,
    course2LessonIds,
    course3,
    course3LessonIds,
  });
  const novakLicence = seedFurtherTeamPurchases(course1, course3);

  seedLiamRefund(course1, course1LessonIds);
  seedMartaRefund(novakLicence);

  flushWatchEvents();
  printSummary();

  // ─── Sync users to Knock ───
  // Name, email, avatar, and default preferences for anyone without a set.
  if (process.env.KNOCK_SECRET_API_KEY) {
    const synced = await syncAllUsers(db, await defaultNotifications());
    console.log(`  Synced ${synced} users to Knock.`);
  } else {
    console.log("  Skipped Knock user sync: KNOCK_SECRET_API_KEY is not set.");
  }
}

seed().catch(console.error);
