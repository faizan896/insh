import type { Metadata, Viewport } from "next";
import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/400-italic.css";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Insha — The Brightest Star",
  description: "A quiet meadow. A sky full of memories. A living tribute to Insha, the brightest star in our sky.",
  robots: { index: false, follow: false },
};
export const viewport: Viewport = { themeColor: "#17252d" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
