import Link from "next/link";
import { BookOpen, Brain, GraduationCap, Languages, Mail, MessageSquareText, Mic, Smartphone } from "lucide-react";

export const metadata = {
  title: "About Us - English Somali Dictionary",
  description: "Ku saabsan barnaamijka English Somali Dictionary iyo himilada mustaqbalka."
};

const goals = [
  "Barashada luuqadaha qalaad",
  "Fahamka erayada iyo macnahooda",
  "Horumarinta xirfadaha Ingiriisiga",
  "Diyaargarowga imtixaannada sida IELTS",
  "Helitaanka ilo waxbarasho oo tayo leh"
];

const futurePlans = [
  { icon: Languages, text: "Turjumaadda jumladaha oo dhan" },
  { icon: BookOpen, text: "Hagaajinta naxwaha (Grammar Correction)" },
  { icon: Brain, text: "Turjumaad ku shaqeysa AI" },
  { icon: Mic, text: "Cod-ka-qoraal (Speech to Text)" },
  { icon: Smartphone, text: "Barnaamij Mobile ah" },
  { icon: GraduationCap, text: "Qalab waxbarasho oo ka caawiya ardayda luuqadda Ingiriisiga" }
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#e9f7f3_0%,#f8fbfa_44%,#eef4f1_100%)] text-ink">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:px-10">
        <Link className="flex items-center gap-2 text-sm font-black text-forest sm:text-base" href="/">
          <span className="grid size-10 place-items-center rounded-2xl bg-white text-ocean shadow-sm ring-1 ring-black/5">
            <Languages size={21} />
          </span>
          <span>English Somali</span>
        </Link>

        <nav className="flex flex-wrap items-center justify-end gap-3 text-sm font-bold text-muted sm:gap-6">
          <Link className="transition hover:text-forest" href="/search">
            Search
          </Link>
          <Link className="transition hover:text-forest" href="/categories">
            Categories
          </Link>
          <Link className="transition hover:text-forest" href="/admin">
            Admin
          </Link>
        </nav>
      </header>

      <section className="mx-auto w-full max-w-5xl px-5 pb-16 pt-8 sm:px-8 lg:pt-14">
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-extrabold text-forest shadow-sm ring-1 ring-black/5">
          <MessageSquareText size={16} />
          Beta Version
        </div>

        <div className="rounded-[2rem] bg-white p-6 shadow-search ring-1 ring-black/5 sm:p-9 lg:p-11">
          <div className="max-w-3xl">
            <p className="m-0 text-sm font-black uppercase text-ocean">About Us</p>
            <h1 className="mt-3 text-4xl font-black leading-tight text-ink sm:text-6xl">
              Ku Saabsan Barnaamijka
            </h1>
            <p className="mt-5 text-lg font-semibold leading-8 text-muted">
              Barnaamijkan wuxuu wali ku jiraa marxalad tijaabo ah (Beta Version), waxaana si joogto ah loogu sameynayaa horumarin iyo hagaajin.
            </p>
            <p className="mt-4 text-lg font-semibold leading-8 text-muted">
              Waxaan rajeynaynaa in mustaqbalka uu noqdo barnaamij faa'iido badan u leh bulshada Soomaaliyeed, isla markaana aanu ku koobnaan oo keliya turjumaadda ereyada.
            </p>
          </div>

          <section className="mt-10 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-3xl bg-[#f0faf7] p-6">
              <h2 className="m-0 text-2xl font-black text-forest">Himiladeena</h2>
              <p className="mt-3 font-semibold leading-7 text-muted">
                Himiladeenu waa in aan dhisno barnaamij u fududeeya dhalinyarada Soomaaliyeed:
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {goals.map((goal) => (
                <div className="rounded-2xl border border-[#dce8e3] bg-[#fbfdfc] p-4" key={goal}>
                  <span className="text-sm font-black text-ink">{goal}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-10">
            <h2 className="m-0 text-2xl font-black text-ink">Aragtideena Mustaqbalka</h2>
            <p className="mt-3 max-w-3xl font-semibold leading-7 text-muted">
              Mustaqbalka waxaan qorsheynaynaa in aan ku darno:
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {futurePlans.map(({ icon: Icon, text }) => (
                <article className="rounded-3xl border border-[#dce8e3] bg-white p-5 shadow-sm" key={text}>
                  <span className="mb-4 grid size-11 place-items-center rounded-2xl bg-[#e7f4f1] text-forest">
                    <Icon size={20} />
                  </span>
                  <strong className="block text-base font-black leading-6 text-ink">{text}</strong>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-10 grid gap-5 lg:grid-cols-2">
            <article className="rounded-3xl border border-[#dce8e3] bg-[#fbfdfc] p-6">
              <h2 className="m-0 text-2xl font-black text-ink">La-tashiga Khubarada</h2>
              <p className="mt-3 font-semibold leading-8 text-muted">
                Waxaan la shaqeyn doonnaa macallimiin, turjubaano, iyo khubaro Soomaaliyeed si aan u hubinno in xogta iyo turjumaaduhu noqdaan kuwo sax ah, faa'iido leh, oo la isku halayn karo.
              </p>
            </article>

            <article className="rounded-3xl border border-[#dce8e3] bg-[#fffaf3] p-6">
              <h2 className="m-0 text-2xl font-black text-ink">Fikradaada Waa Muhiim</h2>
              <p className="mt-3 font-semibold leading-8 text-muted">
                Waxaan soo dhoweyneynaa talo kasta, sixid kasta, iyo aragti kasta oo naga caawin karta horumarinta barnaamijkan.
              </p>
              <a
                className="mt-5 inline-flex min-h-11 max-w-full items-center gap-2 rounded-2xl bg-forest px-4 text-sm font-black text-white transition hover:bg-ocean"
                href="mailto:engahmedmohamedali24@gmail.com"
              >
                <Mail className="shrink-0" size={17} />
                <span className="break-all">engahmedmohamedali24@gmail.com</span>
              </a>
            </article>
          </section>

          <p className="mt-10 rounded-3xl bg-[#f7fbfa] p-5 text-center font-black leading-7 text-forest">
            Mahadsanid booqashadaada iyo taageeradaada.
          </p>
        </div>
      </section>
    </main>
  );
}
