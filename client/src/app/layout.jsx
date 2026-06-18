import "@/styles/globals.css";

export const metadata = {
  title: "English ↔ Somali Dictionary",
  description: "A modern English and Somali dictionary platform."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
