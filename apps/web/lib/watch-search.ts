import type { WatchCriteria } from "@watchseebuy/domain";
import { searchPathForWatch } from "@watchseebuy/domain";

export function searchHrefForWatch(input: {
  label: string;
  criteria: WatchCriteria | null;
  watchId: string;
}): string {
  return searchPathForWatch(input);
}
