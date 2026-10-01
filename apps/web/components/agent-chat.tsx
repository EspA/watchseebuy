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
import { ArrowUpIcon, TrashIcon } from "@/components/icons";
import {
  useNavigateSearch,
  useSearchPending,
} from "@/components/search-navigation";

const STORAGE_KEY = "wsb.agent.transcript";
const DETACHED_KEY = "wsb.agent.detached";
const MAX_STORED = 24;

type StoredMessage = { role: "user" | "assistant"; content: string };

export function AgentChat({
  site,
  search,
  children,
}: {
  site: string;
  search?: Record<string, string>;
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
    </div>
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
