# The Instructor sets a Weekly Commitment; Video Time is shown beside it

A Student asked what the "4h 37m total" on a course page meant and how much time to set aside. That number was only the lessons' video added up, and a lesson with no length counted as 0. Now every course has a Weekly Commitment that the Instructor sets: a range of hours per week (stored as whole minutes in `courses.weekly_commitment_min_minutes` and `courses.weekly_commitment_max_minutes`) for `courses.duration_weeks` weeks. The course, module and purchase pages show it next to the Video Time, which is now labelled "of video". A lesson's `duration_minutes` is its Video Length. It is `NOT NULL`, and the app refuses anything below 1 minute: when a lesson is added, when it is edited, and when a Weekly Commitment is saved.

Courses that existed before this change got an estimate based on their Video Time, because there is no real usage data to base it on (the seed's watch events are random). The estimate assumes 2 minutes of study per minute of video, in weeks of 3 hours. That gives `weeks = ceil(video × 2 / 180)`, with a range of 1.5× to 2.5× the video, spread across those weeks. `estimateWeeklyCommitment` in `app/modules/course-time` and migration `0013` both use this formula. The Instructor replaces the estimate under Settings → Weekly Commitment.

## Considered Options

- **Only relabel the total ("of video") and explain it.** Rejected: it doesn't answer "how much time should I expect to spend?".
- **One number of hours per week.** Rejected: a range is more honest about how much Students differ.
- **Free text set by the Instructor.** Rejected: it can't be checked, compared or formatted the same way on every page.
- **A `CHECK (duration_minutes > 0)` in the database.** Not added: Cadence has no CHECK constraints yet, and the app checks the value where it is written. `NOT NULL` stops a missing value.

## Consequences

A new course must have a Weekly Commitment from the start, so the new-course form asks for it. Any new place that creates a lesson must ask for a Video Length of at least 1 minute. Code that adds up lesson durations no longer needs a `?? 0` or `?? 1` fallback.
