"use client";

import { useTranslations } from "next-intl";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { ArrowUpIcon, TrashIcon } from "@/components/icons";
import {
  useNavigateSearch,
  useSearchPending,
} from "@/components/search-navigation";

const STORAGE_KEY = "wsb.agent.transcript";
const DETACHED_KEY = "wsb.agent.detached";
const LIMIT_KEY = "wsb.agent.limit";
const MAX_STORED = 24;

type StoredMessage = { role: "user" | "assistant"; content: string };

export function AgentChat({
  site,
  search,
  signedIn = false,
  children,
}: {
  site: string;
  search?: Record<string, string>;
  signedIn?: boolean;
  children?: ReactNode;
}) {
  const t = useTranslations("agent");
  const navigateSearch = useNavigateSearch();
  const searchPending = useSearchPending();
  const [messages, setMessages] = useState<StoredMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [catalogWait, setCatalogWait] = useState(false);
  const [ready, setReady] = useState(false);
  const [limitOpen, setLimitOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const submitTipId = useId();
  const clearTipId = useId();
  const sawCatalogPending = useRef(false);
  const detachedRef = useRef(false);
  const requestRef = useRef(0);

  useEffect(() => {
    setMessages(loadTranscript());
    detachedRef.current = readDetached() !== null;
    setReady(true);
  }, []);

  useEffect(() => {
    if (signedIn) {
      clearLimitFlag();
      setLimitOpen(false);
      return;
    }
    if (readLimitFlag()) setLimitOpen(true);
  }, [signedIn]);

  useEffect(() => {
    const stored = readDetached();
    if (stored === null) {
      detachedRef.current = false;
      return;
    }
    if (stored !== searchFingerprint(search)) {
      detachedRef.current = false;
      clearDetached();
      return;
    }
    detachedRef.current = true;
  }, [search]);

  useEffect(() => {
    if (!ready) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // Private browsing can reject storage. The thread still lives in memory.
    }
  }, [messages, ready]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages, pending, catalogWait]);

  useEffect(() => {
    if (!catalogWait) {
      sawCatalogPending.current = false;
      return;
    }
    if (searchPending) {
      sawCatalogPending.current = true;
      return;
    }
    if (!sawCatalogPending.current) return;
    sawCatalogPending.current = false;
    setCatalogWait(false);
  }, [catalogWait, searchPending]);

  function clearHistory() {
    requestRef.current += 1;
    detachedRef.current = false;
    clearDetached();
    setCatalogWait(false);
    setPending(false);
    setMessages([]);
    remember([]);
  }

  async function send() {
    const content = draft.trim();
    if (!content || pending) return;
    const request = ++requestRef.current;
    const next = [...messages, { role: "user" as const, content }].slice(
      -MAX_STORED,
    );
    setMessages(next);
    remember(next);
    setDraft("");
    setPending(true);
    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: next,
          site,
          ...(detachedRef.current || !search ? {} : { search }),
        }),
      });
      const body: unknown = await response.json().catch(() => null);
      if (requestRef.current !== request) return;
      if (isSignInRequired(body)) {
        setMessages(messages);
        remember(messages);
        setDraft(content);
        openLimit();
        return;
      }
      if (isUpgradeRequired(body)) {
        setMessages(messages);
        remember(messages);
        setDraft(content);
        setUpgradeOpen(true);
        return;
      }
      const reply: StoredMessage = {
        role: "assistant",
        content: assistantText(body, t),
      };
      const fresh = isFreshTurn(body);
      const kept = fresh ? [{ role: "user" as const, content }] : next;
      const withReply = [...kept, reply].slice(-MAX_STORED);
      setMessages(withReply);
      remember(withReply);
      if (fresh) {
        detachedRef.current = true;
        writeDetached(searchFingerprint(search));
      }
      if (isLimitReached(body)) openLimit();
      if (isSearch(body)) {
        const href = withAgentMode(body.href, window.location.search, fresh);
        if (!sameResults(href)) {
          setCatalogWait(true);
          navigateSearch(href);
        } else if (fresh) {
          detachedRef.current = false;
          clearDetached();
        }
      }
    } catch {
      if (requestRef.current !== request) return;
      const reply: StoredMessage = {
        role: "assistant",
        content: t("unavailable"),
      };
      const withReply = [...next, reply].slice(-MAX_STORED);
      setMessages(withReply);
      remember(withReply);
    } finally {
      if (requestRef.current === request) setPending(false);
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    void send();
  }

  return (
    <div className="agent-panel">
      <div className="agent-log" role="log" aria-live="polite">
          {messages.length === 0 && !pending ? (
            <p className="agent-line agent-greeting">{t("greeting")}</p>
          ) : null}
          {messages.map((message, index) => (
            <p
              key={`${index}-${message.role}`}
              className={
                message.role === "user" ? "agent-line is-user" : "agent-line"
              }
            >
              {message.content}
            </p>
          ))}
          {pending || catalogWait ? (
            <p className="agent-line is-pending">{t("thinking")}</p>
          ) : null}
          <div ref={endRef} />
        </div>
      <div className="agent-compose-wrap">
        <div className="agent-compose">
        {children}
        <div className="agent-field">
          <textarea
            value={draft}
            rows={1}
            aria-label={t("composerLabel")}
            disabled={pending}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={onKeyDown}
          />
          <div className="agent-field-actions">
            <span className="agent-tip filter-tip">
              <button
                type="button"
                className="agent-send"
                aria-label={t("submit")}
                aria-describedby={submitTipId}
                disabled={pending || !draft.trim()}
                onClick={() => void send()}
              >
                <ArrowUpIcon />
              </button>
              <span id={submitTipId} role="tooltip" className="filter-tip-bubble">
                {t("submit")}
              </span>
            </span>
            {messages.length > 0 ? (
              <span className="agent-tip filter-tip">
                <button
                  type="button"
                  className="agent-clear"
                  aria-label={t("clear")}
                  aria-describedby={clearTipId}
                  onClick={clearHistory}
                >
                  <TrashIcon />
                </button>
                <span id={clearTipId} role="tooltip" className="filter-tip-bubble">
                  {t("clear")}
                </span>
              </span>
            ) : null}
          </div>
        </div>
        </div>
      </div>
      {limitOpen ? (
        <AgentLimitDialog
          kind="sign_in"
          onClose={dismissLimit}
          onClassic={() => {
            dismissLimit();
            navigateSearch(classicSearchHref());
          }}
        />
      ) : null}
      {upgradeOpen ? (
        <AgentLimitDialog
          kind="upgrade"
          onClose={() => setUpgradeOpen(false)}
          onClassic={() => {
            setUpgradeOpen(false);
            navigateSearch(classicSearchHref());
          }}
        />
      ) : null}
    </div>
  );

  function openLimit() {
    writeLimitFlag();
    setLimitOpen(true);
  }

  function dismissLimit() {
    clearLimitFlag();
    setLimitOpen(false);
  }
}

function AgentLimitDialog({
  kind,
  onClose,
  onClassic,
}: {
  kind: "sign_in" | "upgrade";
  onClose: () => void;
  onClassic: () => void;
}) {
  const t = useTranslations("agent");
  const titleId = useId();
  const signInRef = useRef<HTMLAnchorElement>(null);
  const onCloseRef = useRef(onClose);
  const [signInHref, setSignInHref] = useState("/sign-in");
  onCloseRef.current = onClose;

  useEffect(() => {
    const next = `${window.location.pathname}${window.location.search}`;
    setSignInHref(`/sign-in?next=${encodeURIComponent(next)}`);
    signInRef.current?.focus();
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const title = kind === "upgrade" ? t("upgradeTitle") : t("limitTitle");
  const body = kind === "upgrade" ? t("upgradeBody") : t("limitBody");
  const actionHref = kind === "upgrade" ? "/pricing" : signInHref;
  const actionLabel = kind === "upgrade" ? t("upgradePlans") : t("limitSignIn");

  return createPortal(
    <div className="agent-limit" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <button
        type="button"
        className="agent-limit-backdrop"
        aria-label={t("limitDismiss")}
        onClick={onClose}
      />
      <div className="agent-limit-card">
        <h2 id={titleId}>{title}</h2>
        <p>{body}</p>
        <div className="agent-limit-actions">
          <a ref={signInRef} className="btn" href={actionHref}>
            {actionLabel}
          </a>
          <button type="button" className="btn secondary" onClick={onClassic}>
            {t("limitClassic")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function assistantText(
  body: unknown,
  t: ReturnType<typeof useTranslations<"agent">>,
): string {
  if (!isRecord(body)) return t("unavailable");
  if (body.action === "out_of_scope") return t("outOfScope");
  if (body.action === "unavailable") return t("unavailable");
  if (
    (body.action === "clarify" || body.action === "search") &&
    typeof body.reply === "string" &&
    body.reply.trim()
  ) {
    return body.reply.trim();
  }
  if (body.action === "clarify" || body.action === "search") {
    return t("emptyReply");
  }
  return t("unavailable");
}

function isSignInRequired(body: unknown): boolean {
  return isRecord(body) && body.action === "sign_in_required";
}

function isUpgradeRequired(body: unknown): boolean {
  return isRecord(body) && body.action === "upgrade_required";
}

function isLimitReached(body: unknown): boolean {
  return isRecord(body) && body.limitReached === true;
}

function isSearch(body: unknown): body is { action: "search"; href: string } {
  return (
    isRecord(body) &&
    body.action === "search" &&
    typeof body.href === "string" &&
    body.href.startsWith("/search?")
  );
}

function isFreshTurn(body: unknown): boolean {
  return (
    isRecord(body) &&
    body.fresh === true &&
    (body.action === "search" || body.action === "clarify")
  );
}

function withAgentMode(
  href: string,
  currentSearch: string,
  fresh: boolean,
): string {
  const next = new URL(href, window.location.origin);
  next.searchParams.set("mode", "agent");
  const current = new URLSearchParams(currentSearch);
  const kept = fresh ? ["sort"] : ["sort", "watch"];
  for (const key of kept) {
    const value = current.get(key);
    if (value && !next.searchParams.has(key)) next.searchParams.set(key, value);
  }
  return `${next.pathname}?${next.searchParams.toString()}`;
}

function sameResults(href: string): boolean {
  const next = new URL(href, window.location.origin);
  const current = new URL(window.location.href);
  next.searchParams.delete("mode");
  current.searchParams.delete("mode");
  next.searchParams.sort();
  current.searchParams.sort();
  return (
    next.pathname === current.pathname &&
    next.searchParams.toString() === current.searchParams.toString()
  );
}

function searchFingerprint(search: Record<string, string> | undefined): string {
  if (!search) return "";
  const entries = Object.entries(search).sort(([a], [b]) => a.localeCompare(b));
  return JSON.stringify(entries);
}

function readDetached(): string | null {
  try {
    return sessionStorage.getItem(DETACHED_KEY);
  } catch {
    return null;
  }
}

function writeDetached(fingerprint: string) {
  try {
    sessionStorage.setItem(DETACHED_KEY, fingerprint);
  } catch {
    // Private browsing can reject storage. The next turn still omits the old search.
  }
}

function clearDetached() {
  try {
    sessionStorage.removeItem(DETACHED_KEY);
  } catch {
    // The in-memory flag is cleared by the caller.
  }
}

function classicSearchHref(): string {
  const url = new URL(window.location.href);
  url.searchParams.set("mode", "classic");
  return `${url.pathname}?${url.searchParams.toString()}`;
}

function readLimitFlag(): boolean {
  try {
    return sessionStorage.getItem(LIMIT_KEY) === "1";
  } catch {
    return false;
  }
}

function writeLimitFlag() {
  try {
    sessionStorage.setItem(LIMIT_KEY, "1");
  } catch {
    // The dialog still opens for this page.
  }
}

function clearLimitFlag() {
  try {
    sessionStorage.removeItem(LIMIT_KEY);
  } catch {
    // The in-memory dialog is closed by the caller.
  }
}

function remember(messages: StoredMessage[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch {
    // Private browsing can reject storage. The thread still lives in memory.
  }
}

function loadTranscript(): StoredMessage[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isStoredMessage).slice(-MAX_STORED);
  } catch {
    return [];
  }
}

function isStoredMessage(value: unknown): value is StoredMessage {
  return (
    isRecord(value) &&
    (value.role === "user" || value.role === "assistant") &&
    typeof value.content === "string" &&
    Boolean(value.content.trim())
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
