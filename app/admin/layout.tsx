import type { Metadata, Viewport } from "next";
import "@fontsource/syne/600.css";
import "@fontsource/syne/700.css";
import "@fontsource/syne/800.css";
import "@fontsource-variable/manrope";
import "./globals.css";
import { getPublicSiteData } from "@/lib/content/public";
import { mediaUrl, siteUrl } from "@/lib/utils";

export const viewport: Viewport = {
  themeColor: "#030712",
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getPublicSiteData();
  const { title, description, ogImage } = settings.seo;
  const og = mediaUrl(ogImage) ?? "/og-default.png";

  return {
    metadataBase: new URL(siteUrl()),
    title: { default: title, template: "%s | SAIM DESIGNER" },
    description,
    applicationName: "SAIM DESIGNER",
    authors: [{ name: "Saim Sajjad" }],
    creator: "Saim Sajjad",
    keywords: [
      "Saim Sajjad Graphic Designer",
      "Saim Designer",
      "Professional Graphic Designer Pakistan",
      "Logo Designer",
      "YouTube Thumbnail Designer",
      "Banner Designer",
      "Brand Identity Designer",
      "Graphic Design Portfolio",
    ],
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      url: "/",
      siteName: "SAIM DESIGNER",
      title,
      description,
      locale: "en_US",
      images: [{ url: og, width: 1200, height: 630, alt: "SAIM DESIGNER — Saim Sajjad, Graphic Designer" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [og],
    },
    robots: { index: true, follow: true },
    icons: { icon: "/icon.svg" },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
