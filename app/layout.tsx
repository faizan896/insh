import type { Metadata, Viewport } from "next";
import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/400-italic.css";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Insha’s Little World — The Brightest Star",
  description: "A living illustrated village in loving memory of Insha, with warm windows and a sky that follow the real time in Pakistan.",
  robots: { index: false, follow: false },
};
export const viewport: Viewport = { themeColor: "#142439" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
