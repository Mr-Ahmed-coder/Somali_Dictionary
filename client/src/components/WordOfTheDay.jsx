"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, RefreshCw, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { FavoriteButton } from "@/components/FavoriteButton";
import { WordShareActions } from "@/components/WordShareActions";
import { getWordOfTheDay } from "@/lib/api";
import { getLocalDateKey, millisecondsUntilNextLocalDay } from "@/lib/localDate";

const DAILY_WORD_CACHE_KEY = "dictionary_word_of_the_day";

export function WordOfTheDay() {
  const [dateKey, setDateKey] = useState("");
  const [word, setWord] = useState(null);
  const [status, setStatus] = useState("loading");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let midnightTimer;

    function syncLocalDate() {
      const now = new Date();
      setDateKey(getLocalDateKey(now));
      midnightTimer = window.setTimeout(syncLocalDate, millisecondsUntilNextLocalDay(now));
    }

    syncLocalDate();
    return () => window.clearTimeout(midnightTimer);
  }, []);

  useEffect(() => {
    if (!dateKey) return undefined;

    const cachedWord = readCachedDailyWord(dateKey);
    if (cachedWord) {
      setWord(cachedWord);
      setStatus("success");
      return undefined;
    }

    const controller = new AbortController();
    setWord(null);
    setStatus("loading");

    getWordOfTheDay({ date: dateKey, signal: controller.signal })
      .then((result) => {
        const dailyWord = normalizeDailyWord(result.word);

        if (!dailyWord) {
          setStatus("empty");
          return;
        }

        cacheDailyWord(dateKey, dailyWord);
        setWord(dailyWord);
        setStatus("success");
      })
      .catch((error) => {
        if (error.name !== "AbortError") setStatus("error");
      });

    return () => controller.abort();
  }, [dateKey, retryCount]);

  if (status === "empty") return null;

  return (
    <section className="wordOfDaySection" aria-labelledby="word-of-day-title">
      <div className="wordOfDayInner">
        <div className="wordOfDayHeading">
          <span>
            <CalendarDays size={19} aria-hidden="true" />
            Daily discovery
          </span>
          <h2 id="word-of-day-title">Word of the Day</h2>
        </div>

        {status === "loading" && <WordOfTheDaySkeleton />}

        {status === "error" && (
          <div className="wordOfDayError" role="status">
            <div>
              <strong>Today&apos;s word is taking a little longer.</strong>
              <p>Your dictionary search is still available.</p>
            </div>
            <button onClick={() => setRetryCount((count) => count + 1)} type="button">
              <RefreshCw size={17} aria-hidden="true" />
              Retry
            </button>
          </div>
        )}

        {status === "success" && word && (
          <article className="wordOfDayCard">
            <div className="wordOfDayCopy">
              <div className="wordOfDayBadges">
                <span>{word.type || "word"}</span>
                <span>{word.category || "General"}</span>
              </div>
              <h3>{word.english}</h3>
              <p>{word.somali}</p>
              <div className="wordOfDayMeta">
                <Sparkles size={16} aria-hidden="true" />
                A new English and Somali word selected for {formatLocalDate(dateKey)}.
              </div>
            </div>

            <div className="wordOfDayActions">
              <Link className="wordOfDayDetailsButton" href={`/word/${word._id}`}>
                View Details
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <FavoriteButton word={word} />
              <WordShareActions compact url={`/word/${word._id}`} word={word} />
            </div>
          </article>
        )}
      </div>
    </section>
  );
}

function WordOfTheDaySkeleton() {
  return (
    <div className="wordOfDaySkeleton" aria-label="Loading Word of the Day" role="status">
      <span />
      <strong />
      <p />
      <div />
    </div>
  );
}

function formatLocalDate(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Intl.DateTimeFormat(undefined, { month: "long", day: "numeric" }).format(
    new Date(year, month - 1, day)
  );
}

function readCachedDailyWord(dateKey) {
  if (typeof window === "undefined") return null;

  try {
    const cached = JSON.parse(window.localStorage.getItem(DAILY_WORD_CACHE_KEY) || "null");
    if (cached?.date !== dateKey) return null;
    return normalizeDailyWord(cached.word);
  } catch {
    return null;
  }
}

function cacheDailyWord(dateKey, word) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DAILY_WORD_CACHE_KEY, JSON.stringify({ date: dateKey, word }));
}

function normalizeDailyWord(word) {
  if (!word || typeof word !== "object" || !word._id) return null;

  return {
    _id: String(word._id),
    english: String(word.english || word.englishWord || "").trim(),
    somali: String(word.somali || word.somaliWord || "").trim(),
    category: String(word.category?.name || word.category || "General").trim(),
    type: String(word.type || word.partOfSpeech || "word").trim()
  };
}
