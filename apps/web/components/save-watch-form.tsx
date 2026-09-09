import Link from "next/link";
import {
  AVAILABLE_TO_FILTERS,
  CONDITION_FILTERS,
  CONDITION_GROUPS,
  CONFIDENCE_FILTERS,
  PRICE_SCORE_FILTERS,
  ITEM_LOCATION_FILTERS,
  LISTING_TYPE_FILTERS,
  LOCATION_GROUPS,
  excludeWordsField,
  isEbayConditionId,
  type FilterGroupId,
  type WatchCriteria,
  FREE_WATCH_LIMIT,
} from "@waitseebuy/domain";
import { AutoSelect, AutoText } from "@/components/auto-search";
import { BuildingBricksFilters } from "@/components/building-bricks-filters";
import { CardFilters } from "@/components/card-filters";
import { ClearFiltersLink } from "@/components/clear-filters";
import { ExcludeUnofficialFilter } from "@/components/exclude-unofficial";
import { FilterAccordion } from "@/components/filter-accordion";
import { FiguresFilters } from "@/components/figures-filters";
import { HotWheelsFilters } from "@/components/hot-wheels-filters";
import { dollarsField, searchParamsFromIntent } from "@/lib/search-params";

const SEARCH_FORM = "search-form";

export function SaveWatchForm({
  q,
  intent,
  signedIn,
  watchId,
  settingsPostal,
  suggestedGroup,
  atWatchLimit,
}: {
  q: string;
  intent: WatchCriteria;
  signedIn: boolean;
  watchId?: string;
  settingsPostal?: string;
  suggestedGroup?: FilterGroupId;
  atWatchLimit?: boolean;
}) {
  if (!q.trim()) return null;

  const next = `/search?${searchParamsFromIntent(q, intent, watchId)}`;
  const excluded = excludeWordsField(intent.excludeKeywords);
  const clearFilters = new URLSearchParams({
    q: intent.query.trim() || q,
    ...(watchId ? { watch: watchId } : {}),
    ...(excluded ? { exclude: excluded } : {}),
    ...(intent.shipToPostal ? { zip: intent.shipToPostal } : {}),
    ...(intent.ebaySite && intent.ebaySite !== "EBAY_US"
      ? { site: intent.ebaySite }
      : {}),
  });
  const listingValue =
    intent.listingType === "auction_below" ? "auction" : intent.listingType;
  const moreFiltersOpen =
    listingValue !== "all" ||
    Boolean(intent.itemLocation && intent.itemLocation !== "any") ||
    Boolean(
      intent.shipToCountry &&
        !(intent.shipToPostal && intent.shipToCountry === "US"),
    );
  const cardsOpen = Boolean(
    intent.cardCategory ||
      intent.cardGame ||
      intent.cardSet ||
      intent.rarity ||
      intent.printing ||
      intent.language ||
      intent.grader ||
      intent.cardNoReprints === false ||
      intent.cardNoProxy === false,
  );
  const figuresOpen = Boolean(
    intent.figureCategory ||
      intent.figureScale ||
      intent.figurePackaging ||
      intent.figureCompleteness ||
      intent.figurePunch,
  );
  const vehiclesOpen = Boolean(
    intent.wheelsCategory || intent.wheelsScale || intent.wheelsPackaging,
  );
  const bricksOpen = Boolean(
    intent.brickCategory || intent.brickType || intent.brickStatus,
  );
  const specializedOpen = cardsOpen
    ? "cards"
    : figuresOpen
      ? "figures"
      : vehiclesOpen
        ? "vehicles"
        : bricksOpen
          ? "bricks"
          : suggestedGroup;

  return (
    <div className="watch-save">
      {signedIn && atWatchLimit ? (
        <>
          <button className="btn" type="button" disabled>
            Watch this
          </button>
          <p className="watch-note">
            You can watch {FREE_WATCH_LIMIT} pieces at a time.{" "}
            <Link href="/watches">Stop one</Link> to add another.
          </p>
        </>
      ) : signedIn ? (
        <button
          className="btn"
          type="submit"
          form={SEARCH_FORM}
          formAction="/api/watches"
          formMethod="post"
        >
          Watch this
        </button>
      ) : (
        <Link className="btn" href={`/sign-in?next=${encodeURIComponent(next)}`}>
          Watch this
        </Link>
      )}
      <div className="filter-heading">
        <ClearFiltersLink
          href={`/search?${clearFilters}`}
          query={intent.query.trim() || q}
        />
      </div>
      <div className="watch-price-row">
        <label>
          Min price
          <AutoText
            form={SEARCH_FORM}
            name="min"
            type="text"
            inputMode="decimal"
            placeholder="optional"
            defaultValue={dollarsField(intent.minLandedCents)}
          />
        </label>
        <label>
          Max price
          <AutoText
            form={SEARCH_FORM}
            name="max"
            type="text"
            inputMode="decimal"
            placeholder="optional"
            defaultValue={dollarsField(intent.maxLandedCents)}
          />
        </label>
      </div>
      {settingsPostal?.trim() ? (
        <details className="filter-group">
          <summary>
            Ship-to ZIP
            {intent.shipToPostal ? ` · ${intent.shipToPostal}` : ""}
          </summary>
          <label>
            ZIP
            <AutoText
              form={SEARCH_FORM}
              name="zip"
              type="text"
              placeholder="optional"
              autoComplete="postal-code"
              defaultValue={intent.shipToPostal ?? ""}
            />
          </label>
        </details>
      ) : (
        <label>
          <span className="filter-label-line">
            Ship-to ZIP
            <span className="watch-note">(fill for better price filtering)</span>
          </span>
          <AutoText
            form={SEARCH_FORM}
            name="zip"
            type="text"
            placeholder="optional"
            autoComplete="postal-code"
            defaultValue={intent.shipToPostal ?? ""}
          />
        </label>
      )}
      <label>
        Condition
        <AutoSelect
          form={SEARCH_FORM}
          name="condition"
          defaultValue={
            isEbayConditionId(intent.condition) ? intent.condition : "any"
          }
        >
          <option value="any">Any</option>
          {CONDITION_GROUPS.map((group) => (
            <optgroup key={group} label={group}>
              {CONDITION_FILTERS.filter((option) => option.group === group).map(
                (option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ),
              )}
            </optgroup>
          ))}
        </AutoSelect>
      </label>
      <div className="watch-price-row">
        <label>
          Price score
          <AutoSelect
            form={SEARCH_FORM}
            name="score"
            defaultValue={
              intent.minPriceScore !== undefined
                ? String(intent.minPriceScore)
                : ""
            }
          >
            {PRICE_SCORE_FILTERS.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </AutoSelect>
        </label>
        <label>
          Seller score
          <AutoSelect
            form={SEARCH_FORM}
            name="confidence"
            defaultValue={
              intent.minConfidence !== undefined
                ? String(intent.minConfidence)
                : ""
            }
          >
            {CONFIDENCE_FILTERS.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </AutoSelect>
        </label>
      </div>
      <ExcludeUnofficialFilter checked={intent.excludeUnofficial !== false} />
      <FilterAccordion
        {...(specializedOpen ? { initialOpen: specializedOpen } : {})}
      >
      <BuildingBricksFilters
        {...(intent.brickCategory
          ? { brickCategory: intent.brickCategory }
          : {})}
        {...(intent.brickType ? { brickType: intent.brickType } : {})}
        {...(intent.brickStatus ? { brickStatus: intent.brickStatus } : {})}
      />
      <CardFilters
        {...(intent.cardCategory ? { cardCategory: intent.cardCategory } : {})}
        {...(intent.cardGame ? { cardGame: intent.cardGame } : {})}
        {...(intent.cardSet ? { cardSet: intent.cardSet } : {})}
        {...(intent.rarity ? { rarity: intent.rarity } : {})}
        {...(intent.printing ? { printing: intent.printing } : {})}
        {...(intent.language ? { language: intent.language } : {})}
        {...(intent.grader ? { grader: intent.grader } : {})}
        {...(intent.cardGrade ? { cardGrade: intent.cardGrade } : {})}
        {...(intent.cardNoReprints === false ? { cardNoReprints: false } : {})}
        {...(intent.cardNoProxy === false ? { cardNoProxy: false } : {})}
      />
      <FiguresFilters
        {...(intent.figureCategory
          ? { figureCategory: intent.figureCategory }
          : {})}
        {...(intent.figureScale ? { figureScale: intent.figureScale } : {})}
        {...(intent.figurePackaging
          ? { figurePackaging: intent.figurePackaging }
          : {})}
        {...(intent.figureCompleteness
          ? { figureCompleteness: intent.figureCompleteness }
          : {})}
        {...(intent.figurePunch ? { figurePunch: intent.figurePunch } : {})}
      />
      <HotWheelsFilters
        {...(intent.wheelsCategory
          ? { wheelsCategory: intent.wheelsCategory }
          : {})}
        {...(intent.wheelsScale ? { wheelsScale: intent.wheelsScale } : {})}
        {...(intent.wheelsPackaging
          ? { wheelsPackaging: intent.wheelsPackaging }
          : {})}
      />
      </FilterAccordion>
      <details
        className="filter-group"
        {...(moreFiltersOpen ? { open: true } : {})}
      >
        <summary>More</summary>
        <label>
          Listing type
          <AutoSelect
            form={SEARCH_FORM}
            name="listing"
            defaultValue={
              LISTING_TYPE_FILTERS.some((option) => option.value === listingValue)
                ? listingValue
                : "all"
            }
          >
            {LISTING_TYPE_FILTERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </AutoSelect>
        </label>
        <div className="watch-fields">
          <label>
            Located in
            <AutoSelect
              form={SEARCH_FORM}
              name="located"
              defaultValue={intent.itemLocation ?? "any"}
            >
              <option value="any">Any</option>
              {LOCATION_GROUPS.map((group) => (
                <optgroup key={group} label={group}>
                  {ITEM_LOCATION_FILTERS.filter(
                    (option) => option.group === group,
                  ).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </AutoSelect>
          </label>
          <label>
            Available to
            <AutoSelect
              form={SEARCH_FORM}
              name="to"
              defaultValue={intent.shipToCountry ?? "any"}
            >
              {AVAILABLE_TO_FILTERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </AutoSelect>
          </label>
        </div>
      </details>
    </div>
  );
}
