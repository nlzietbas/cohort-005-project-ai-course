import { db } from "~/db";
import {
  exactFigures,
  readCatalogOverview,
  topicsInWords,
  type Db,
} from "./lib/catalog-overview";

/**
 * What the catalog holds, in words. The app uses `catalogOverview`, which
 * reads the app database; tests build their own against a test database.
 */
export function createCatalogOverview(database: Db) {
  return {
    /**
     * `topics` names the published topics in words; `exactFigures` counts
     * published courses and topics. See
     * docs/adr/0014-the-home-page-describes-the-catalog-in-words.md.
     */
    get() {
      const overview = readCatalogOverview(database);
      return {
        topics: topicsInWords(overview.firstTopics),
        exactFigures: exactFigures(overview),
      };
    },
  };
}

// Pure so a route importing this only for its loader doesn't pull the
// database into the client bundle (see `~/db`).
export const catalogOverview = /* @__PURE__ */ createCatalogOverview(db);
