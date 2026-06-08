import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "NeuroNotes",
  description: "Приложение для заметок",
  manifest: "/manifest.json",
};

export default function RootLayout({
                                     children,
                                   }: {
  children: React.ReactNode;
}) {
  return (
      <html lang="ru">
      <body>{children}</body>
      </html>
  );
}