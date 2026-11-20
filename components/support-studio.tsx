"use client";

import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Download,
  FileText,
  Headphones,
  Info,
  KeyRound,
  LoaderCircle,
  MessageCircle,
  Plus,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  SquareArrowOutUpRight,
  Users,
  X,
} from "lucide-react";
import { articles, type Article } from "@/lib/knowledge";
import type { ChatMessage, ChatResponse } from "@/lib/contracts";

type DisplayMessage = ChatMessage & { id: string; answer?: ChatResponse };
const welcome: DisplayMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi there. I’m Relay, your Northstar support assistant. I can help with account access, billing, and your workspace.\n\nWhat can I help you with today?",
};
const scenarios = [
  {
    id: "invoice",
    icon: FileText,
    title: "Find an invoice",
    detail: "An answer with a source",
    prompt: "How do I download an invoice?",
  },
  {
    id: "login",
    icon: KeyRound,
    title: "Get back into your account",
    detail: "Troubleshooting that follows along",
    prompt: "I can’t log in to my account.",
  },
  {
    id: "unknown",
    icon: CircleHelp,
    title: "Ask something unexpected",
    detail: "See how uncertainty is handled",
    prompt:
      "Can you guarantee Northstar works with our custom internal identity system?",
  },
];

export default function SupportStudio() {
  const [messages, setMessages] = useState<DisplayMessage[]>([welcome]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [scenario, setScenario] = useState("");
  const [panel, setPanel] = useState<"knowledge" | "handoff">("knowledge");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [articleSearch, setArticleSearch] = useState("");
  const [view, setView] = useState<"studio" | "library" | "about">("studio");
  const [handoffReady, setHandoffReady] = useState(false);
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const requestLock = useRef(false);
  const latestAnswer = [...messages].reverse().find((m) => m.answer)?.answer;
  const allCitations = messages.flatMap((m) => m.answer?.citations ?? []);
  const citedIds = [...new Set(allCitations.map((c) => c.articleId))];
  const userMessages = messages.filter((m) => m.role === "user");
  const hasConversation = userMessages.length > 0;

  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then((d) => setConfigured(d.configured))
      .catch(() => setConfigured(false));
  }, []);
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading, error]);
  useEffect(() => {
    if (selectedArticle) dialogRef.current?.showModal();
    else dialogRef.current?.close();
  }, [selectedArticle]);

  function reset() {
    if (requestLock.current) return;
    setMessages([welcome]);
    setInput("");
    setError("");
    setScenario("");
    setHandoffReady(false);
    setPanel("knowledge");
  }
  async function send(text: string, nextScenario?: string, retry = false) {
    if (requestLock.current || !text.trim()) return;
    requestLock.current = true;
    if (nextScenario) {
      setScenario(nextScenario);
      setHandoffReady(false);
      setPanel("knowledge");
    }
    const base = nextScenario
      ? [welcome]
      : retry
        ? messages.slice(0, -1)
        : messages;
    const updated: DisplayMessage[] = [
      ...base,
      { id: crypto.randomUUID(), role: "user", content: text.trim() },
    ];
    setMessages(updated);
    setInput("");
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updated
            .filter((m) => m.id !== "welcome")
            .map(({ role, content }) => ({ role, content })),
        }),
        signal: AbortSignal.timeout(55_000),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          data.error || "Something went wrong. Please try again.",
        );
      const answer = data as ChatResponse;
      setConfigured(true);
      setMessages([
        ...updated,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: answer.reply,
          answer,
        },
      ]);
    } catch (e) {
      setError(
        e instanceof Error && e.name !== "TimeoutError"
          ? e.message
          : "The assistant took too long to respond. Please try again.",
      );
    } finally {
      requestLock.current = false;
      setLoading(false);
      inputRef.current?.focus();
    }
  }
  function handoff() {
    setPanel("handoff");
    setHandoffReady(true);
  }
  const handoffText = () =>
    [
      "RELAY — HANDOFF PREVIEW (not submitted)",
      `Topic: ${latestAnswer?.topic || userMessages[0]?.content || "General support"}`,
      "\nCustomer statements (verbatim):",
      ...(latestAnswer?.customerEvidence.length
        ? latestAnswer.customerEvidence
        : userMessages.map((m) => m.content)
      ).map((q) => `- ${q}`),
      "\nSuggested next step:",
      latestAnswer?.nextStep ||
        "Review the conversation and clarify what help the customer needs.",
      "\nReferenced sample articles:",
      ...citedIds.map((id) => articles.find((a) => a.id === id)?.title || id),
      "\nFull transcript:",
      ...messages.map(
        (m) => `${m.role === "user" ? "CUSTOMER" : "RELAY"}: ${m.content}`,
      ),
      "\nThis is a fictional demo. No ticket was submitted and no support agent was notified.",
    ].join("\n");
  function download() {
    const url = URL.createObjectURL(
      new Blob([handoffText()], { type: "text/plain;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "relay-handoff-preview.txt";
    link.click();
    URL.revokeObjectURL(url);
  }
  async function copyHandoff() {
    try {
      await navigator.clipboard.writeText(handoffText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Clipboard is unavailable. Use Download summary instead.");
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button
          className="brand"
          onClick={() => setView("studio")}
          aria-label="Relay home"
        >
          <span className="brand-mark">
            r<span>•</span>
          </span>
          <span>
            relay<span className="brand-period">.</span>
          </span>
        </button>
        <nav aria-label="Main navigation">
          <button
            className={view === "studio" ? "nav-active" : ""}
            onClick={() => setView("studio")}
          >
            Live playground
          </button>
          <button
            className={view === "library" ? "nav-active" : ""}
            onClick={() => setView("library")}
          >
            Knowledge library
          </button>
          <button
            className={view === "about" ? "nav-active" : ""}
            onClick={() => setView("about")}
          >
            How it works
          </button>
        </nav>
        <span className="demo-badge">
          <span /> Interactive demo
        </span>
      </header>

      <main>
        <section className="intro">
          <div>
            <p className="eyebrow">A LITTLE LESS FRICTION. A LOT MORE HELP.</p>
            <h1>
              Good support keeps
              <br className="desktop-break" /> the conversation{" "}
              <span>moving.</span>
            </h1>
          </div>
          <div className="intro-note">
            <span className="little-spark">
              <Sparkles size={21} strokeWidth={1.6} />
            </span>
            <p>
              Answers with context.
              <br />A clear next step.
              <br />A human when it matters.
            </p>
            <span className="intro-caption">
              Meet your next support experience.
            </span>
          </div>
        </section>

        {view === "studio" && (
          <>
            <div className="workspace-heading">
              <div>
                <span className="workspace-dot" />
                <span>THE SUPPORT PLAYGROUND</span>
              </div>
              <span>
                Fictional Northstar workspace{" "}
                <span className="dot-divider">·</span> Real conversations
              </span>
            </div>
            <section className="studio" aria-label="Support playground">
              <aside className="scenario-panel">
                <div className="section-heading">
                  <span className="mini-label">START A CONVERSATION</span>
                  <span className="small-pill">~ 60 sec</span>
                </div>
                <h2>Take it for a spin.</h2>
                <p className="muted scenario-intro">
                  Choose a scenario, or ask a question in your own words.
                </p>
                <div className="scenario-list">
                  {scenarios.map((s) => (
                    <button
                      key={s.id}
                      disabled={loading}
                      className={`scenario ${scenario === s.id ? "selected" : ""}`}
                      onClick={() => send(s.prompt, s.id)}
                    >
                      <span className="scenario-icon">
                        <s.icon size={19} strokeWidth={1.65} />
                      </span>
                      <span>
                        <strong>{s.title}</strong>
                        <small>{s.detail}</small>
                      </span>
                      <ChevronRight size={16} />
                    </button>
                  ))}
                </div>
                <div className="try-followup">
                  <span className="tiny-label">THEN, TRY A FOLLOW-UP</span>
                  <p>“I already tried that.”</p>
                  <span>
                    The assistant keeps the context, so you don’t have to repeat
                    yourself.
                  </span>
                </div>
                <div className="scenario-bottom">
                  <ShieldCheck size={18} />
                  <p>
                    Sample business. Sample policies.
                    <br />
                    <strong>Try it without an account.</strong>
                  </p>
                </div>
              </aside>

              <div className="chat-panel">
                <div className="chat-header">
                  <div className="assistant-avatar">
                    <Sparkles size={23} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h2>Northstar support</h2>
                    <p>
                      {latestAnswer ? (
                        <>
                          <span className="live-dot" /> Live AI connected
                        </>
                      ) : configured === false ? (
                        "AI connection unavailable locally"
                      ) : (
                        "Your AI support assistant"
                      )}
                    </p>
                  </div>
                  <button
                    className="icon-button"
                    aria-label="Start a new conversation"
                    title="Start a new conversation"
                    disabled={loading}
                    onClick={reset}
                  >
                    <RotateCcw size={17} />
                  </button>
                </div>
                <div
                  className="conversation"
                  ref={scrollRef}
                  role="log"
                  aria-label="Conversation"
                  aria-live="polite"
                  aria-relevant="additions"
                >
                  <div className="conversation-date">
                    YOUR CONVERSATION STARTS HERE
                  </div>
                  {messages.map((m) => (
                    <div key={m.id} className={`message ${m.role}`}>
                      {m.role === "assistant" && (
                        <span className="message-avatar">
                          <Sparkles size={15} />
                        </span>
                      )}
                      <div className="message-content">
                        <span className="message-author">
                          {m.role === "assistant" ? "Relay" : "You"}
                          {m.answer && <span className="ai-label">AI</span>}
                        </span>
                        <div className="bubble">
                          {m.content
                            .split("\n")
                            .filter(Boolean)
                            .map((line, i) => (
                              <p key={i}>{line}</p>
                            ))}
                        </div>
                        {!!m.answer?.citations.length && (
                          <div className="citations">
                            {m.answer.citations.map((c, i) => {
                              const article = articles.find(
                                (a) => a.id === c.articleId,
                              );
                              return (
                                article && (
                                  <button
                                    key={`${c.articleId}-${i}`}
                                    onClick={() => {
                                      setSelectedArticle(article);
                                      setPanel("knowledge");
                                    }}
                                  >
                                    <BookOpen size={13} />
                                    <span>{article.title}</span>
                                    <SquareArrowOutUpRight size={12} />
                                  </button>
                                )
                              );
                            })}
                          </div>
                        )}
                        {m.answer?.needsHuman && (
                          <button
                            className="handoff-inline"
                            disabled={loading}
                            onClick={handoff}
                          >
                            <Headphones size={15} /> Preview a human handoff
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="message assistant">
                      <span className="message-avatar">
                        <Sparkles size={15} />
                      </span>
                      <div className="thinking">
                        <span />
                        <span />
                        <span />
                        <small>Reading the context</small>
                      </div>
                    </div>
                  )}
                  {error && (
                    <div className="error-box" role="alert">
                      <Info size={17} />
                      <div>
                        {error}
                        <button
                          disabled={loading}
                          onClick={() => {
                            const last = messages.at(-1);
                            if (last?.role === "user")
                              void send(last.content, undefined, true);
                          }}
                        >
                          Try again
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="composer-area">
                  {!loading && !error && (
                    <div className="suggestions">
                      {(
                        latestAnswer?.suggestions ?? [
                          "How do I download an invoice?",
                          "I can’t log in.",
                        ]
                      ).map((s) => (
                        <button key={s} onClick={() => send(s)}>
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                  <form
                    className="composer"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void send(input);
                    }}
                  >
                    <textarea
                      ref={inputRef}
                      aria-label="Message Northstar support"
                      placeholder="Ask a question. We’ll take it from here."
                      value={input}
                      maxLength={3000}
                      rows={1}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (
                          e.key === "Enter" &&
                          !e.shiftKey &&
                          !e.nativeEvent.isComposing
                        ) {
                          e.preventDefault();
                          void send(input);
                        }
                      }}
                      disabled={loading}
                    />
                    <button
                      type="submit"
                      aria-label="Send message"
                      disabled={loading || !input.trim()}
                    >
                      {loading ? (
                        <LoaderCircle className="spin" size={18} />
                      ) : (
                        <Send size={18} />
                      )}
                    </button>
                  </form>
                  <div className="composer-footer">
                    <span>
                      Sample content · Please don’t enter personal data
                    </span>
                    <button
                      disabled={!hasConversation || loading}
                      onClick={handoff}
                    >
                      <Headphones size={13} /> Human handoff
                    </button>
                  </div>
                </div>
              </div>

              <aside className="context-panel">
                <div
                  className="context-tabs"
                  role="tablist"
                  aria-label="Conversation context"
                >
                  <button
                    role="tab"
                    aria-selected={panel === "knowledge"}
                    className={panel === "knowledge" ? "active" : ""}
                    onClick={() => setPanel("knowledge")}
                  >
                    <BookOpen size={15} /> Knowledge
                  </button>
                  <button
                    role="tab"
                    aria-selected={panel === "handoff"}
                    className={panel === "handoff" ? "active" : ""}
                    onClick={() => setPanel("handoff")}
                  >
                    <Users size={15} /> Handoff{" "}
                    {handoffReady && <span className="count-badge">1</span>}
                  </button>
                </div>
                {panel === "knowledge" ? (
                  <div className="context-body">
                    <div className="context-title">
                      <span className="outline-icon">
                        <BookOpen size={19} />
                      </span>
                      <h2>
                        A source behind
                        <br />
                        the answer.
                      </h2>
                    </div>
                    <p className="muted">
                      Relay answers from these approved sample articles. Open
                      one to see what it knows.
                    </p>
                    <div className="knowledge-meta">
                      <span>{articles.length} sample articles</span>
                      <span>READ ONLY</span>
                    </div>
                    <div className="article-list">
                      {articles.map((a) => (
                        <button
                          key={a.id}
                          className={citedIds.includes(a.id) ? "cited" : ""}
                          onClick={() => setSelectedArticle(a)}
                        >
                          <FileText size={16} />
                          <span>
                            <strong>{a.title}</strong>
                            <small>
                              {a.category}
                              {citedIds.includes(a.id) && (
                                <em> · Referenced</em>
                              )}
                            </small>
                          </span>
                          <ChevronRight size={14} />
                        </button>
                      ))}
                    </div>
                    <div className="context-tip">
                      <Info size={16} />
                      <p>
                        Missing an answer? Relay can say so and prepare the
                        context for a person.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="context-body handoff-body">
                    <div className="context-title">
                      <span className="outline-icon">
                        <Headphones size={19} />
                      </span>
                      <h2>
                        A warm handoff.
                        <br />
                        Nothing lost.
                      </h2>
                    </div>
                    <p className="muted">
                      A concise preview for a support teammate, with the
                      conversation attached.
                    </p>
                    {!handoffReady ? (
                      <div className="empty-handoff">
                        <div className="empty-art">
                          <MessageCircle size={28} />
                          <Plus size={15} />
                        </div>
                        <h3>Context comes with you.</h3>
                        <p>
                          Start a conversation, then create a handoff preview.
                        </p>
                        <button
                          className="dark-button"
                          disabled={!hasConversation || loading}
                          onClick={handoff}
                        >
                          Create handoff preview
                        </button>
                      </div>
                    ) : (
                      <div className="handoff-detail">
                        <span className="preview-badge">
                          PREVIEW ONLY · NOT SUBMITTED
                        </span>
                        <h3>
                          {latestAnswer?.topic ||
                            userMessages[0]?.content ||
                            "Support request"}
                        </h3>
                        <span className="tiny-label">CUSTOMER STATEMENTS</span>
                        <p className="evidence-note">
                          Verbatim, not assumed completed steps.
                        </p>
                        <ul>
                          {(latestAnswer?.customerEvidence.length
                            ? latestAnswer.customerEvidence
                            : userMessages.map((m) => m.content)
                          ).map((q, i) => (
                            <li key={i}>“{q}”</li>
                          ))}
                        </ul>
                        <span className="tiny-label">SUGGESTED NEXT STEP</span>
                        <p>
                          {latestAnswer?.nextStep ||
                            "Review the conversation and clarify the customer’s issue."}
                        </p>
                        <div className="transcript-count">
                          <MessageCircle size={15} /> {messages.length} messages
                          included
                        </div>
                        <button className="dark-button" onClick={download}>
                          <Download size={15} /> Download summary
                        </button>
                        <button className="text-button" onClick={copyHandoff}>
                          {copied
                            ? "Copied to clipboard"
                            : "Copy full transcript"}
                        </button>
                        <p className="handoff-disclaimer">
                          Saved only in this page session. No ticket is created
                          and no one is notified.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </aside>
            </section>
            <div className="under-studio">
              <span>
                <Check size={15} /> Grounded in sample documentation
              </span>
              <span>
                <Check size={15} /> Context across follow-ups
              </span>
              <span>
                <Check size={15} /> Human handoff preview
              </span>
              <button onClick={() => setView("about")}>
                A look under the hood <ChevronDown size={14} />
              </button>
            </div>
          </>
        )}

        {view === "library" && (
          <section className="library-page">
            <div className="page-title">
              <div>
                <p className="eyebrow">THE KNOWLEDGE BEHIND THE CONVERSATION</p>
                <h2>Small library. Clear answers.</h2>
                <p>
                  These are the complete fictional policies available to the
                  assistant.
                </p>
              </div>
              <input
                aria-label="Search articles"
                placeholder="Search the library…"
                value={articleSearch}
                onChange={(e) => setArticleSearch(e.target.value)}
              />
            </div>
            <div className="library-grid">
              {articles
                .filter((a) =>
                  `${a.title} ${a.content}`
                    .toLowerCase()
                    .includes(articleSearch.toLowerCase()),
                )
                .map((a) => (
                  <button key={a.id} onClick={() => setSelectedArticle(a)}>
                    <BookOpen size={23} />
                    <span className="tiny-label">{a.category}</span>
                    <h3>{a.title}</h3>
                    <p>{a.content.slice(0, 140)}…</p>
                    <span className="read-article">
                      Read sample article <Plus size={16} />
                    </span>
                  </button>
                ))}
            </div>
            {!articles.some((a) =>
              `${a.title} ${a.content}`
                .toLowerCase()
                .includes(articleSearch.toLowerCase()),
            ) && (
              <p className="no-results">
                No matching articles. Try “billing” or “password”.
              </p>
            )}
          </section>
        )}

        {view === "about" && (
          <section className="about-page">
            <div className="page-title">
              <div>
                <p className="eyebrow">BUILT AROUND THE SUPPORT EXPERIENCE</p>
                <h2>Useful answers. Honest boundaries.</h2>
                <p>A working concept for a website support assistant.</p>
              </div>
              <button className="dark-button" onClick={() => setView("studio")}>
                Try the playground
              </button>
            </div>
            <div className="about-grid">
              <article>
                <BookOpen />
                <h3>Start with trusted content.</h3>
                <p>
                  A live language model receives the six approved sample
                  articles with each conversation. Responses include clickable
                  passages; the server checks that each quoted passage exists in
                  its source.
                </p>
              </article>
              <article>
                <MessageCircle />
                <h3>Keep the conversation.</h3>
                <p>
                  Follow-ups include the conversation so the assistant can ask
                  useful questions and work through common problems. An offered
                  troubleshooting step is never automatically recorded as
                  completed.
                </p>
              </article>
              <article>
                <Headphones />
                <h3>Make room for a human.</h3>
                <p>
                  A handoff preview includes the topic, exact customer
                  statements, suggested next step, referenced articles, and
                  transcript. Download it to inspect what a teammate would
                  receive.
                </p>
              </article>
            </div>
            <div className="scope-note">
              <ShieldCheck size={27} />
              <div>
                <h3>What this demo does — and what comes next.</h3>
                <p>
                  Northstar and its policies are fictional. The chat uses a live
                  language model through a server-side connection. Conversations
                  remain in browser memory and are sent to the model to generate
                  replies; this demo does not persist tickets or connect to
                  customer accounts. Refreshing clears the session. A production
                  build would add your content, an agreed website widget,
                  durable conversation storage, access controls, evaluation
                  cases, and your chosen support integration. Citations help
                  review an answer; they do not guarantee that every answer is
                  correct.
                </p>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer>
        <span className="footer-brand">relay.</span>
        <span>Thoughtful support, demonstrated.</span>
        <span className="footer-disclosure">
          Fictional brand & content · Handoff is simulated
        </span>
      </footer>
      <dialog
        ref={dialogRef}
        onCancel={() => setSelectedArticle(null)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setSelectedArticle(null);
        }}
        aria-labelledby="article-title"
      >
        <div className="article-modal">
          <div className="modal-top">
            <span className="mini-label">NORTHSTAR · SAMPLE HELP CENTER</span>
            <button
              className="icon-button"
              aria-label="Close article"
              onClick={() => setSelectedArticle(null)}
            >
              <X size={20} />
            </button>
          </div>
          {selectedArticle && (
            <>
              <span className="article-category">
                {selectedArticle.category}
              </span>
              <h2 id="article-title">{selectedArticle.title}</h2>
              <p className="article-content">{selectedArticle.content}</p>
              {allCitations.some((c) => c.articleId === selectedArticle.id) && (
                <div className="quoted-passage">
                  <span className="tiny-label">
                    PASSAGE REFERENCED IN THIS CONVERSATION
                  </span>
                  {[
                    ...new Set(
                      allCitations
                        .filter((c) => c.articleId === selectedArticle.id)
                        .map((c) => c.quote),
                    ),
                  ].map((q) => (
                    <blockquote key={q}>{q}</blockquote>
                  ))}
                </div>
              )}
              <div className="modal-note">
                <Info size={16} /> Fictional policy for demonstration purposes.
              </div>
            </>
          )}
        </div>
      </dialog>
    </div>
  );
}
