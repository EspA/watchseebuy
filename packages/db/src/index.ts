export * from "./schema";
export { createDb, getDb, type Database } from "./client";
export {
  getUserAuthSummary,
  getUserSettings,
  updateUserSettings,
  type UserAuthSummary,
  type UserSettings,
} from "./users";
export {
  countWatchesForUser,
  deleteWatchForUser,
  getWatchForUser,
  listWatchesForUser,
  saveWatch,
  updateWatchSettings,
  type SavedWatch,
  type SaveWatchResult,
} from "./watches";
export {
  getAlertClick,
  insertMatchIfNew,
  listAlertableWatches,
  listCoverageDueForPoll,
  listUnsentMatchesForWatch,
  listWatchesForCoverage,
  listWatchIdsWithUnsentMatches,
  markCoveragePolled,
  recordAlerts,
  upsertListings,
  type CoverageToPoll,
  type StoredListing,
  type UnsentMatch,
  type WatchForAlert,
} from "./alerts";
export {
  recordConsumerLogin,
  recordEbayApiCall,
  recordEmailSend,
  recordUserEvent,
  type EbayApiName,
  type EbayApiSource,
  type EmailKind,
  type EmailSendStatus,
  type UserEventKind,
} from "./telemetry";
export {
  countUsers,
  ebayApiBreakdown,
  ebayApiWindowStats,
  emailBreakdown,
  emailWindowStats,
  getAdminUserDetail,
  listAdminUsers,
  type AdminUserDetail,
  type AdminUserListRow,
  type EbayApiBreakdownRow,
  type EbayApiWindowStats,
  type EmailBreakdownRow,
  type EmailWindowStats,
} from "./admin";
