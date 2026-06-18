import { Loader2 } from "lucide-react";

export default function WordDetailLoading() {
  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,#e9f7f3_0%,#f8fbfa_44%,#eef4f1_100%)] px-5 text-center text-ink">
      <section className="grid w-full max-w-md place-items-center gap-3 rounded-[2rem] bg-white p-8 shadow-search ring-1 ring-black/5">
        <Loader2 className="spin text-ocean" size={34} />
        <h1 className="m-0 text-2xl font-black">Loading word details</h1>
        <p className="m-0 font-semibold text-muted">Fetching the English and Somali entry.</p>
      </section>
    </main>
  );
}
