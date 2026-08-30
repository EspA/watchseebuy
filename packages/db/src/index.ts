export * from "./schema";
export { createDb, getDb, type Database } from "./client";
export {
  deleteWatchForUser,
  getWatchForUser,
  listWatchesForUser,
  saveWatch,
  type SavedWatch,
} from "./watches";
