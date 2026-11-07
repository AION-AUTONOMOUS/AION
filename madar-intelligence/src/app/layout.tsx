import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MADAR Intelligence — مدار للذكاء والبحث",
  description: "اكتشف العالم. افهم ما وراءه. — The World, Better Understood.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ar" dir="rtl"><body>{children}</body></html>;
}
