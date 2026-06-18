"use client";

import Link from "next/link";
import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";

export default function WordDetailError({ reset }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,#e9f7f3_0%,#f8fbfa_44%,#eef4f1_100%)] px-5 text-center text-ink">
      <section className="grid w-full max-w-md gap-4 rounded-[2rem] bg-white p-8 shadow-search ring-1 ring-black/5">
        <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#fff1ee] text-[#b42318]">
          <AlertCircle size={25} />
        </div>
        <div>
          <h1 className="m-0 text-2xl font-black">Word details unavailable</h1>
          <p className="mt-2 font-semibold leading-7 text-muted">
            The dictionary could not load this word. Try again or return to search.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Link
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-[#dce8e3] bg-white px-4 text-sm font-black text-forest"
            href="/search"
          >
            <ArrowLeft size={17} />
            Search
          </Link>
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-forest px-4 text-sm font-black text-white"
            onClick={reset}
            type="button"
          >
            <RefreshCw size={17} />
            Retry
          </button>
        </div>
      </section>
    </main>
  );
}
