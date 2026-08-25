import { HomeHero } from "@/components/HomeHero";
import { WordOfTheDay } from "@/components/WordOfTheDay";

export default function HomePage() {
  return (
    <main className="homePage">
      <HomeHero />
      <WordOfTheDay />
    </main>
  );
}
