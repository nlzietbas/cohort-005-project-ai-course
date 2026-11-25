import { db } from "~/db";
import {
  exactFigures,
  readCatalogOverview,
  topicsInWords,
  type Db,
} from "./lib/catalog-overview";

export type { CatalogOverview } from "./lib/catalog-overview";

/**
 * What the catalog holds, in words. The app uses `catalogOverview`, which
 * reads the app database; tests build their own against a test database.
 */
export function createCatalogOverview(database: Db) {
  return {
    /**
     * Counts only published courses, with no cap, and names only the
     * categories that have at least one published course.
     *
     * `topics` is those category names in plain words ("Design, Data and
     * Programming"); `exactFigures` is the same catalog as counts ("4
     * published courses in 3 topics") for readers who want the numbers.
     */
    get() {
      const overview = readCatalogOverview(database);
      return {
        topics: topicsInWords(overview.topics),
        exactFigures: exactFigures(overview),
      };
    },
  };
}

// Pure so a route importing this only for its loader doesn't pull the
// database into the client bundle (see `~/db`).
export const catalogOverview = /* @__PURE__ */ createCatalogOverview(db);
