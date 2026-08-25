"use client";

import { Copy, FileText, Languages, Link2, Loader2, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
  copyFullEntry,
  copyLink,
  copyTranslation,
  copyWord,
  shareWord
} from "@/lib/wordShare";

const fullActions = [
  { key: "word", label: "Copy Word", icon: Copy },
  { key: "translation", label: "Copy Translation", icon: Languages },
  { key: "entry", label: "Copy Full Entry", icon: FileText },
  { key: "link", label: "Copy Link", icon: Link2 },
  { key: "share", label: "Share", icon: Share2, primary: true }
];

export function WordShareActions({ word, url = "", compact = false }) {
  const [busyAction, setBusyAction] = useState("");
  const [feedback, setFeedback] = useState("");
  const [feedbackTone, setFeedbackTone] = useState("success");
  const actions = compact ? fullActions.slice(-1) : fullActions;

  useEffect(() => {
    if (!feedback) return undefined;

    const timeout = window.setTimeout(() => setFeedback(""), 2200);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  async function handleAction(action) {
    setBusyAction(action);
    setFeedback("");

    try {
      const pageUrl = resolvePublicUrl(url);
      let message = "Copied";

      if (action === "word") {
        await copyWord(word);
        message = "Word copied";
      } else if (action === "translation") {
        await copyTranslation(word);
        message = "Translation copied";
      } else if (action === "entry") {
        await copyFullEntry(word);
        message = "Full entry copied";
      } else if (action === "link") {
        await copyLink(pageUrl);
        message = "Link copied";
      } else if (action === "share") {
        const result = await shareWord(word, pageUrl);
        if (result.status === "cancelled") return;
        message = result.method === "native" ? "Shared" : "Entry and link copied";
      }

      setFeedbackTone("success");
      setFeedback(message);
    } catch {
      setFeedbackTone("error");
      setFeedback(action === "share" ? "Unable to share or copy this word" : "Copy failed. Check browser permissions");
    } finally {
      setBusyAction("");
    }
  }

  return (
    <div className={`wordShareControls ${compact ? "wordShareCompact" : ""}`}>
      <div className="wordShareButtons">
        {actions.map(({ key, label, icon: Icon, primary }) => (
          <button
            className={`wordShareButton ${primary ? "wordShareButtonPrimary" : ""}`}
            disabled={Boolean(busyAction)}
            key={key}
            onClick={() => handleAction(key)}
            type="button"
            aria-label={compact ? "Share Word of the Day" : label}
          >
            {busyAction === key ? (
              <Loader2 className="spin" size={17} aria-hidden="true" />
            ) : (
              <Icon size={17} aria-hidden="true" />
            )}
            {label}
          </button>
        ))}
      </div>

      {feedback && (
        <span
          className={`wordShareFeedback ${feedbackTone === "error" ? "wordShareFeedbackError" : ""}`}
          role={feedbackTone === "error" ? "alert" : "status"}
        >
          {feedback}
        </span>
      )}
    </div>
  );
}

function resolvePublicUrl(url) {
  if (typeof window === "undefined") return url;

  try {
    return new URL(url || window.location.href, window.location.origin).toString();
  } catch {
    return window.location.href;
  }
}
