import { notFound } from "next/navigation";
import { headers } from "next/headers";
import {
  ALERT_EMAIL_TITLES,
  renderAlertEmail,
  sampleAlertEmailInput,
} from "@waitseebuy/notify";
import {
  parseWatchFrequency,
  type WatchFrequency,
} from "@waitseebuy/domain";

function requestOrigin(headerList: Headers): string {
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  if (!host) return "http://localhost:3000";
  const proto = headerList.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export default async function AlertEmailPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ frequency?: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();

  const query = await searchParams;
  const frequency = parseWatchFrequency(query.frequency);
  const origin = requestOrigin(await headers());
  const email = renderAlertEmail(sampleAlertEmailInput(frequency, origin));

  return (
    <main className="email-preview">
      <header className="email-preview-bar">
        <p className="email-preview-kicker">Alert email draft</p>
        <nav className="email-preview-tabs">
          {(Object.keys(ALERT_EMAIL_TITLES) as WatchFrequency[]).map((value) => (
            <a
              key={value}
              href={`/dev/alert-email?frequency=${value}`}
              className={value === frequency ? "is-current" : undefined}
            >
              {ALERT_EMAIL_TITLES[value]}
            </a>
          ))}
        </nav>
      </header>
      <section className="email-preview-meta">
        <p>
          <span>From</span> WaitSeeBuy &lt;alerts@waitseebuy.com&gt;
        </p>
        <p>
          <span>Subject</span> {email.subject}
        </p>
      </section>
      <iframe
        className="email-preview-frame"
        title={email.subject}
        srcDoc={email.html}
      />
    </main>
  );
}
