import Link from "next/link";
import { getTranslations } from "next-intl/server";
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
} from "@watchseebuy/domain";
import { AutoSelect, AutoText } from "@/components/auto-search";
import { BuildingBricksFilters } from "@/components/building-bricks-filters";
import { CardFilters } from "@/components/card-filters";
import { ClearFiltersLink } from "@/components/clear-filters";
import { ExcludeUnofficialFilter } from "@/components/exclude-unofficial";
import { FilterAccordion } from "@/components/filter-accordion";
import { FiguresFilters } from "@/components/figures-filters";
import { HotWheelsFilters } from "@/components/hot-wheels-filters";
import { MoreFilters } from "@/components/more-filters";
import { dollarsField, searchParamsFromIntent } from "@/lib/search-params";

const SEARCH_FORM = "search-form";

export async function SaveWatchForm({
  q,
  intent,
  signedIn,
  watchId,
  settingsPostal,
  suggestedGroup,
  atWatchLimit,
  agentMode,
}: {
  q: string;
  intent: WatchCriteria;
  signedIn: boolean;
  watchId?: string;
  settingsPostal?: string;
  suggestedGroup?: FilterGroupId;
  atWatchLimit?: boolean;
  agentMode?: boolean;
}) {
  if (!q.trim()) return null;

  const t = await getTranslations("search");
  const tf = await getTranslations("filters");
  const tl = await getTranslations("listing");
  const listingLabel: Record<string, string> = {
    all: tf("listingAll"),
    bin: tf("listingBin"),
    auction: tf("listingAuction"),
    best_offer: tf("listingBestOffer"),
  };
  const conditionGroupLabel: Record<string, string> = {
    New: tf("conditionNew"),
    Used: tf("conditionUsed"),
  };
  const locationGroupLabel: Record<string, string> = {
    Region: tf("region"),
    Country: tf("country"),
  };

  const searchPath = `/search?${searchParamsFromIntent(q, intent, watchId)}`;
  const next = `${searchPath}&mode=${agentMode ? "agent" : "classic"}`;
  const excluded = excludeWordsField(intent.excludeKeywords);
  const clearFilters = new URLSearchParams({
    q: intent.query.trim() || q,
    ...(watchId ? { watch: watchId } : {}),
    ...(excluded ? { exclude: excluded } : {}),
    ...(intent.shipToPostal ? { zip: intent.shipToPostal } : {}),
    ...(intent.ebaySite && intent.ebaySite !== "EBAY_US"
      ? { site: intent.ebaySite }
      : {}),
    mode: agentMode ? "agent" : "classic",
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
  const moreFiltersActive =
    Boolean(intent.minLandedCents) ||
    moreFiltersOpen ||
    cardsOpen ||
    figuresOpen ||
    vehiclesOpen ||
    bricksOpen ||
    intent.minPriceScore !== undefined ||
    intent.minConfidence !== undefined ||
    intent.excludeUnofficial === false;

  const watchThis =
    signedIn && atWatchLimit ? (
      <button className="btn watch-this" type="button" disabled>
        {t("watchThis")}
      </button>
    ) : signedIn ? (
      <button
        className="btn watch-this"
        type="submit"
        form={SEARCH_FORM}
        formAction="/api/watches"
        formMethod="post"
      >
        {t("watchThis")}
      </button>
    ) : (
      <Link
        className="btn watch-this"
        href={`/sign-in?next=${encodeURIComponent(next)}`}
      >
        {t("watchThis")}
      </Link>
    );

  return (
    <div className="watch-save">
      {signedIn && atWatchLimit ? (
        <p className="watch-note watch-limit-note">
          {t.rich("watchLimit", {
            limit: FREE_WATCH_LIMIT,
            watches: (chunks) => <Link href="/watches">{chunks}</Link>,
          })}
        </p>
      ) : null}
      <MoreFilters
        defaultOpen={moreFiltersActive}
        extras={
          <>
      {settingsPostal?.trim() ? (
        <details className="filter-group">
          <summary>
            {tf("shipTo")}
            {intent.shipToPostal ? ` · ${intent.shipToPostal}` : ""}
          </summary>
          <label>
            {tf("zip")}
            <AutoText
              form={SEARCH_FORM}
              name="zip"
              type="text"
              placeholder={tf("optional")}
              autoComplete="postal-code"
              defaultValue={intent.shipToPostal ?? ""}
            />
          </label>
        </details>
      ) : (
        <label>
          <span className="filter-label-line">
            {tf("shipTo")}
            <span className="watch-note">{tf("shipToHint")}</span>
          </span>
          <AutoText
            form={SEARCH_FORM}
            name="zip"
            type="text"
            placeholder={tf("optional")}
            autoComplete="postal-code"
            defaultValue={intent.shipToPostal ?? ""}
          />
        </label>
      )}
      <div className="watch-price-row">
        <label>
          {tl("priceScore")}
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
                {option.value === "" ? tf("any") : option.label}
              </option>
            ))}
          </AutoSelect>
        </label>
        <label>
          {tl("sellerScore")}
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
                {option.value === "" ? tf("any") : option.label}
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
        <summary>{tf("more")}</summary>
        <label>
          {tf("listingType")}
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
                {listingLabel[option.value] ?? option.label}
              </option>
            ))}
          </AutoSelect>
        </label>
        <div className="watch-fields">
          <label>
            {tf("locatedIn")}
            <AutoSelect
              form={SEARCH_FORM}
              name="located"
              defaultValue={intent.itemLocation ?? "any"}
            >
              <option value="any">{tf("any")}</option>
              {LOCATION_GROUPS.map((group) => (
                <optgroup key={group} label={locationGroupLabel[group] ?? group}>
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
            {tf("availableTo")}
            <AutoSelect
              form={SEARCH_FORM}
              name="to"
              defaultValue={intent.shipToCountry ?? "any"}
            >
              {AVAILABLE_TO_FILTERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.value === "any" ? tf("any") : option.label}
                </option>
              ))}
            </AutoSelect>
          </label>
        </div>
      </details>
          </>
        }
      >
        <div className="filter-heading">
          {watchThis}
          <ClearFiltersLink
            href={`/search?${clearFilters}`}
            query={intent.query.trim() || q}
          />
        </div>
        <div className="watch-price-row">
          <label className="filter-secondary">
            {tf("minPrice")}
            <AutoText
              form={SEARCH_FORM}
              name="min"
              type="text"
              inputMode="decimal"
              placeholder={tf("optional")}
              defaultValue={dollarsField(intent.minLandedCents)}
            />
          </label>
          <label className="filter-max">
            {tf("maxPrice")}
            <AutoText
              form={SEARCH_FORM}
              name="max"
              type="text"
              inputMode="decimal"
              placeholder={tf("optional")}
              defaultValue={dollarsField(intent.maxLandedCents)}
            />
          </label>
        </div>
        <label className="filter-condition">
          {tf("condition")}
          <AutoSelect
            form={SEARCH_FORM}
            name="condition"
            defaultValue={
              isEbayConditionId(intent.condition) ? intent.condition : "any"
            }
          >
            <option value="any">{tf("any")}</option>
            {CONDITION_GROUPS.map((group) => (
              <optgroup key={group} label={conditionGroupLabel[group] ?? group}>
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
      </MoreFilters>
    </div>
  );
}
