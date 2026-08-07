import Image from "next/image";
import { BookOpen, FolderTree, Languages, LibraryBig, Search, Sparkles, Zap } from "lucide-react";
import { DictionarySearch } from "@/components/DictionarySearch";

const actionLinks = [
  { label: "Browse A-Z", href: "/words" },
  { label: "Categories", href: "/categories" },
  { label: "About Us", href: "/about" }
];

const stats = [
  { label: "Total Words", value: "\uD83D\uDCD6", icon: BookOpen },
  { label: "English \u2194 Somali", value: "\uD83D\uDD24", icon: Languages },
  { label: "Categories", value: "\uD83D\uDCDA", icon: FolderTree },
  { label: "Fast Search", value: "\u26A1", icon: Zap }
];

export function HomeHero() {
  return (
    <section className="homeHero" aria-label="English Somali Dictionary search">
      <Image
        className="homeHeroImage"
        src="/backgroudimage.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        aria-hidden="true"
      />
      <div className="homeHeroOverlay" aria-hidden="true" />

      <div className="homeHeroContent">
        <div className="homeLogo fadeInUp">
          <span>
            <LibraryBig size={28} />
          </span>
          <strong>Somali Dictionary</strong>
        </div>

        <h1 className="fadeInUp fadeDelay1">English {"\u2194"} Somali Dictionary</h1>
        <p className="fadeInUp fadeDelay2">Search thousands of English and Somali words instantly.</p>

        <div className="homeSearchShell fadeInUp fadeDelay3">
          <DictionarySearch variant="home" />
        </div>

        <nav className="homeActionGrid fadeInUp fadeDelay4" aria-label="Homepage quick links">
          {actionLinks.map((link) => (
            <a href={link.href} key={link.href}>
              <Sparkles size={16} />
              {link.label}
            </a>
          ))}
        </nav>

        <div className="homeStatsGrid fadeInUp fadeDelay5" aria-label="Dictionary highlights">
          {stats.map(({ label, value, icon: Icon }) => (
            <article className="homeStatCard" key={label}>
              <span className="homeStatEmoji" aria-hidden="true">
                {value}
              </span>
              <Icon size={18} aria-hidden="true" />
              <strong>{label}</strong>
            </article>
          ))}
        </div>
      </div>

      <div className="homeScrollCue" aria-hidden="true">
        <Search size={18} />
      </div>
    </section>
  );
}
