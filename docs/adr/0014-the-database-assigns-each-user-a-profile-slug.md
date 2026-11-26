# The database assigns each user a profile slug

An Instructor profile lives at `/instructors/:slug`, like `/courses/:slug`, so `users` has a unique `slug` column. Two triggers in migration `0013` fill it in: one after every insert, and one when the slug is set back to `NULL`. The slug comes from the user's name: lowercase, with punctuation dropped and spaces turned into hyphens. When that slug is taken, the newer user gets their id on the end (`sarah-chen-45`). A name with nothing usable in it becomes `user`. The slug does not change when the name changes, so a link people have saved keeps working.

## Considered Options

- **Set the slug in TypeScript wherever a user is created.** Rejected: users are created in signup, in `scripts/seed.ts` and in the fixtures of more than a dozen test files. Each of those would need the call, and a missed one would leave a user with no profile URL.
- **Use the id in the URL (`/instructors/12`).** Rejected by the product owner: public pages are addressed by slug.
- **Work the slug out from the name on every read.** Rejected: you can't look a user up by slug without a slug function in SQL, and the URL would change whenever the user's name changed.

## Consequences

The slugging rule is SQL, in the migration, not TypeScript. To change it, write a new migration that replaces the triggers. `drizzle-kit` doesn't track triggers, so it won't drop them, but it won't regenerate them either. `RETURNING` on an insert into `users` runs before the trigger, so the row it returns has a `NULL` slug: read the row back when you need the slug. SQLite's `lower()` only lowercases ASCII, so accented letters keep their case.
