import * as schema from "../../app/db/schema";
import { LessonProgressStatus, RefundStatus } from "../../app/db/schema";
import { db, type Course, type User } from "./db";
import { daysAgo } from "./helpers";
import type { seedFurtherTeamPurchases } from "./team-purchases";
import { studentByEmail } from "./users";

// ─── Liam's Refund Request ───
// One learner with an Open Refund Request. The dates count back from
// today, so the fourteen-day refund window is still open whenever you seed.

export function seedLiamRefund(course1: Course, course1LessonIds: number[]) {
  const liam = studentByEmail("liam@example.com");
  const [liamPurchase] = db
    .insert(schema.purchases)
    .values({
      userId: liam.id,
      courseId: course1.id,
      amountPaid: 7900,
      country: null,
      createdAt: daysAgo(9),
    })
    .returning()
    .all();
  db.insert(schema.enrollments)
    .values({
      userId: liam.id,
      courseId: course1.id,
      enrolledAt: daysAgo(9),
    })
    .run();
  addLiamProgressAndRating(liam, course1, course1LessonIds);
  db.insert(schema.refunds)
    .values({
      purchaseId: liamPurchase.id,
      status: RefundStatus.Open,
      reason: "Bought the wrong one, I meant the advanced course.",
      requestedAt: daysAgo(4),
    })
    .run();

  console.log("Created Liam's Refund Request.");
}

function addLiamProgressAndRating(
  liam: User,
  course1: Course,
  course1LessonIds: number[]
) {
  db.insert(schema.lessonProgress)
    .values([
      ...course1LessonIds.slice(0, 3).map((lessonId, i) => ({
        userId: liam.id,
        lessonId,
        status: LessonProgressStatus.Completed,
        completedAt: daysAgo(8 - i),
      })),
      {
        userId: liam.id,
        lessonId: course1LessonIds[3],
        status: LessonProgressStatus.InProgress,
        completedAt: null,
      },
    ])
    .run();
  db.insert(schema.courseRatings)
    .values({
      userId: liam.id,
      courseId: course1.id,
      rating: 4,
      createdAt: daysAgo(6),
      updatedAt: daysAgo(6),
    })
    .run();
}

// ─── Marta's Refund Request ───
// A Team Licence with no Claimed Seats, so a Platform Admin can approve it.
// Its Seats are on hold while the request is open.

export function seedMartaRefund(
  novakLicence: ReturnType<typeof seedFurtherTeamPurchases>
) {
  db.insert(schema.refunds)
    .values({
      purchaseId: novakLicence.purchase.id,
      status: RefundStatus.Open,
      reason:
        "Our design team was reorganised and nobody needs these seats now.",
      requestedAt: daysAgo(1),
    })
    .run();

  console.log("Created Marta's Refund Request on her Team Licence.");
}
