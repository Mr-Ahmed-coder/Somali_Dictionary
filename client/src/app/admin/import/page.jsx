import { ImportWords } from "@/components/ImportWords";

export const metadata = {
  title: "Import Dictionary Words",
  description: "Bulk import English and Somali dictionary words from CSV or Excel."
};

export default function AdminImportPage() {
  return <ImportWords />;
}
