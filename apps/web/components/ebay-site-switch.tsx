import {
  DEFAULT_EBAY_SITE,
  ebaySiteInPhrase,
  ebaySitesWithLead,
} from "@waitseebuy/domain";

export function EbaySiteSwitch({
  site,
  form,
  hrefFor,
  formAction,
  leadSite = DEFAULT_EBAY_SITE,
}: {
  site: string;
  form?: string;
  hrefFor?: (siteId: string) => string;
  formAction?: string;
  leadSite?: string;
}) {
  const sites = ebaySitesWithLead(leadSite);
  return (
    <div className="ebay-sites">
      <p>
        Not shopping in {ebaySiteInPhrase(site)}? Choose your eBay site:
      </p>
      <div className="ebay-site-flags" role="group" aria-label="eBay site">
        {sites.map((option) => {
          const selected = option.value === site;
          const className = selected
            ? "ebay-site-flag is-selected"
            : "ebay-site-flag";
          if (hrefFor) {
            return (
              <a
                key={option.value}
                className={className}
                href={hrefFor(option.value)}
                title={option.label}
                aria-label={option.label}
                aria-current={selected ? "true" : undefined}
              >
                <span aria-hidden="true">{option.flag}</span>
              </a>
            );
          }
          return (
            <button
              key={option.value}
              className={className}
              type="submit"
              {...(form ? { form } : {})}
              {...(formAction ? { formAction } : {})}
              name="site"
              value={option.value}
              title={option.label}
              aria-label={option.label}
              aria-pressed={selected}
            >
              <span aria-hidden="true">{option.flag}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
