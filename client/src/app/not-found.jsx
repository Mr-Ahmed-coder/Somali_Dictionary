import Link from "next/link";
import { BookOpen, Home, Search } from "lucide-react";

export const metadata = {
  title: "Page Not Found",
  robots: { index: false, follow: false }
};

export default function NotFound() {
  return (
    <main className="pageShell">
      <header className="pageHeader">
        <BookOpen aria-hidden="true" size={36} />
        <p className="eyebrow">404</p>
        <h1>Page not found</h1>
        <p>The dictionary page you requested does not exist or is no longer available.</p>
        <nav className="mt-6 flex flex-wrap gap-3" aria-label="Not found page links">
          <Link className="primaryButton" href="/">
            <Home size={17} aria-hidden="true" />
            Home
          </Link>
          <Link className="ghostButton" href="/search">
            <Search size={17} aria-hidden="true" />
            Search dictionary
          </Link>
        </nav>
      </header>
    </main>
  );
}
