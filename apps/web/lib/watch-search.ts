import type { WatchCriteria } from "@waitseebuy/domain";
import { searchPathForWatch } from "@waitseebuy/domain";

export function searchHrefForWatch(input: {
  label: string;
  criteria: WatchCriteria | null;
  watchId: string;
}): string {
  return searchPathForWatch(input);
}
