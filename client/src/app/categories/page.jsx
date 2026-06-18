import Link from "next/link";
import { BookOpen, Languages } from "lucide-react";
import { CategoryBrowser } from "@/components/CategoryBrowser";
import { getCategories, getCategoryBySlug } from "@/lib/api";

export const metadata = {
  title: "Browse Categories - English Somali Dictionary",
  description: "Browse English and Somali dictionary words by category."
};

export const dynamic = "force-dynamic";

const browseOrder = [
  "Education",
  "Medical",
  "Technology",
  "Food",
  "Animals",
  "Family",
  "Business",
  "Travel",
  "Sports",
  "General"
];

export default async function CategoriesPage() {
  const result = await getCategories().catch(() => ({ items: [] }));
  const categories = normalizeCategories(result.items || []);
  const categoryResults = await Promise.all(
    categories.map((category) =>
      getCategoryBySlug(category.slug)
        .then((data) => [category.slug, data])
        .catch(() => [category.slug, { item: category, words: [] }])
    )
  );
  const initialCategoryData = Object.fromEntries(categoryResults);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#e9f7f3_0%,#f8fbfa_44%,#eef4f1_100%)] text-ink">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:px-10">
        <Link className="flex items-center gap-2 text-sm font-black text-forest sm:text-base" href="/">
          <span className="grid size-10 place-items-center rounded-2xl bg-white text-ocean shadow-sm ring-1 ring-black/5">
            <Languages size={21} />
          </span>
          <span>English Somali</span>
        </Link>

        <nav className="flex items-center gap-4 text-sm font-bold text-muted sm:gap-6">
          <Link className="transition hover:text-forest" href="/search">
            Search
          </Link>
          <Link className="transition hover:text-forest" href="/words">
            Words
          </Link>
          <Link className="transition hover:text-forest" href="/about">
            About
          </Link>
          <Link className="transition hover:text-forest" href="/admin">
            Admin
          </Link>
        </nav>
      </header>

      <section className="mx-auto w-full max-w-6xl px-5 pb-8 pt-8 text-center sm:px-8 lg:px-10 lg:pt-14">
        <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-extrabold text-forest shadow-sm ring-1 ring-black/5">
          <BookOpen size={16} />
          Browse by category
        </div>
        <h1 className="mx-auto max-w-4xl text-4xl font-black leading-[1.04] text-ink sm:text-6xl">
          Learn words by topic.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base font-semibold leading-7 text-muted sm:text-lg">
          Choose a category, filter inside it, and open any word for full English and Somali details.
        </p>
      </section>

      <CategoryBrowser categories={categories} initialCategoryData={initialCategoryData} />
    </main>
  );
}

function normalizeCategories(items) {
  const byName = new Map(items.map((item) => [item.name.toLowerCase(), item]));

  return browseOrder.map((name) => {
    const item = byName.get(name.toLowerCase());
    return (
      item || {
        _id: `virtual-${slugifyName(name)}`,
        name,
        slug: slugifyName(name),
        description: "",
        wordCount: 0,
        virtual: true
      }
    );
  });
}

function slugifyName(name) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
