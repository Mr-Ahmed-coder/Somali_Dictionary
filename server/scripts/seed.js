import "../src/config/env.js";
import { connectDatabase } from "../src/config/db.js";
import { Category } from "../src/models/category.model.js";
import { Word } from "../src/models/word.model.js";

const categories = [
  { name: "Everyday", description: "Common words used in daily conversation." },
  { name: "Education", description: "School, learning, and academic vocabulary." },
  { name: "Health", description: "Healthcare and wellbeing terms." }
];

const words = [
  {
    englishWord: "book",
    somaliWord: "buug",
    partOfSpeech: "noun",
    englishDefinition: "A written or printed work consisting of pages.",
    somaliDefinition: "Qoraal bogag ka kooban oo la akhriyo.",
    englishExample: "I read a book.",
    somaliExample: "Waxaan akhriyey buug.",
    searchKeywords: ["education", "reading"]
  },
  {
    englishWord: "water",
    somaliWord: "biyo",
    partOfSpeech: "noun",
    englishDefinition: "A clear liquid essential for life.",
    somaliDefinition: "Dareere nolosha muhiim u ah.",
    englishExample: "Drink clean water.",
    somaliExample: "Cab biyo nadiif ah.",
    searchKeywords: ["health", "everyday"]
  },
  {
    englishWord: "learn",
    somaliWord: "baro",
    partOfSpeech: "verb",
    englishDefinition: "To gain knowledge or skill.",
    somaliDefinition: "In aqoon ama xirfad la helo.",
    englishExample: "Students learn Somali.",
    somaliExample: "Ardaydu waxay bartaan Af-Soomaali.",
    searchKeywords: ["education"]
  }
];

await connectDatabase();

const createdCategories = await Category.insertMany(categories, { ordered: false }).catch(async () =>
  Category.find({ name: { $in: categories.map((category) => category.name) } })
);

const byName = new Map(createdCategories.map((category) => [category.name, category._id]));
const everyday = byName.get("Everyday");
const education = byName.get("Education");
const health = byName.get("Health");

await Word.deleteMany({});
await Word.insertMany([
  { ...words[0], category: education },
  { ...words[1], category: health || everyday },
  { ...words[2], category: education }
]);

console.info("Seeded dictionary data");
process.exit(0);
