import Image from "next/image";
import Link from "next/link";
import {
  Bookmark,
  BookOpen,
  ChevronDown,
  FolderTree,
  History,
  Info,
  Languages,
  LibraryBig,
  SearchCheck,
  Sparkles
} from "lucide-react";
import { DictionarySearch } from "@/components/DictionarySearch";

const navigationLinks = [
  { label: "Home", href: "/" },
  { label: "Browse A-Z", href: "/words" },
  { label: "Categories", href: "/categories" },
  { label: "Favorites", href: "/favorites", icon: Bookmark },
  { label: "Recent", href: "/recent", icon: History },
  { label: "About Us", href: "/about" }
];

const actionLinks = [
  { label: "Browse A-Z", href: "/words", icon: LibraryBig },
  { label: "Categories", href: "/categories", icon: FolderTree },
  { label: "About Us", href: "/about", icon: Info }
];

const highlights = [
  { label: "Browse the library", value: "A-Z", icon: BookOpen },
  { label: "English and Somali", value: "2-way", icon: Languages },
  { label: "Saved in your browser", value: "Private", icon: Bookmark },
  { label: "Helpful suggestions", value: "Instant", icon: SearchCheck }
];

export function HomeHero() {
  return (
    <section className="homeHero" aria-label="English Somali Dictionary search">
      <Image
        className="homeHeroImage"
        src="/homepage-study-bg.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        aria-hidden="true"
      />
      <div className="homeHeroOverlay" aria-hidden="true" />

      <header className="homeNavbar fadeInUp">
        <Link className="homeBrand" href="/" aria-label="Somali Dictionary home">
          <Image className="homeBrandLogo" src="/Logo.png" alt="" width={52} height={52} priority />
          <span>
            <strong>Somali Dictionary</strong>
            <small>English {"\u2194"} Somali</small>
          </span>
        </Link>

        <nav className="homeNavLinks" aria-label="Public navigation">
          {navigationLinks.map(({ label, href, icon: Icon }) => (
            <Link className={href === "/" ? "active" : ""} href={href} key={href}>
              {Icon && <Icon size={15} aria-hidden="true" />}
              {label}
            </Link>
          ))}
        </nav>
      </header>

      <div className="homeHeroContent">
        <div className="homeWelcomeBadge fadeInUp fadeDelay1">
          <Sparkles size={16} aria-hidden="true" />
          Built for English and Somali learners
        </div>

        <Image
          className="homeHeroLogo fadeInUp fadeDelay1"
          src="/Logo.png"
          alt="English Somali Dictionary logo"
          width={88}
          height={88}
          priority
        />

        <div className="homeHeroHeading fadeInUp fadeDelay2">
          <h1>
            English {"\u2194"} Somali <span>Dictionary</span>
          </h1>
          <p className="homeHeroSubtitle">Search thousands of English and Somali words instantly.</p>
        </div>

        <div className="homeSearchShell fadeInUp fadeDelay3">
          <DictionarySearch variant="home" />
        </div>

        <nav className="homeActionGrid fadeInUp fadeDelay4" aria-label="Homepage quick links">
          {actionLinks.map(({ label, href, icon: Icon }) => (
            <Link href={href} key={href}>
              <Icon size={18} aria-hidden="true" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="homeStatsGrid fadeInUp fadeDelay5" aria-label="Dictionary highlights">
          {highlights.map(({ label, value, icon: Icon }) => (
            <article className="homeStatCard" key={label}>
              <span className="homeStatIcon" aria-hidden="true">
                <Icon size={22} />
              </span>
              <span>
                <strong>{value}</strong>
                <small>{label}</small>
              </span>
            </article>
          ))}
        </div>
      </div>

      <a className="homeScrollCue" href="#word-of-day-title" aria-label="Go to Word of the Day">
        <ChevronDown size={20} aria-hidden="true" />
      </a>
    </section>
  );
}
