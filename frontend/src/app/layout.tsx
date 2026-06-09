import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import './globals.css';
import { Providers } from './providers';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Dtailwash | Mobile Car Detailing Miami",
    template: "%s | Dtailwash",
  },
  description: "Professional mobile car detailing service in Miami. We come to you — book online in minutes.",
  keywords: ["mobile car detailing", "car detailing Miami", "detailing a domicilio Miami", "mobile detailing near me"],
  openGraph: {
    title: "Dtailwash | Mobile Car Detailing Miami",
    description: "Professional mobile car detailing service in Miami. We come to you.",
    url: "https://dtailwash.com",
    siteName: "Dtailwash",
    locale: "en_US",
    type: "website",
  },
  metadataBase: new URL("https://dtailwash.com"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              "name": "Dtailwash",
              "description": "Professional mobile car detailing service in Miami",
              "url": "https://dtailwash.com",
              "telephone": "+1-305-000-0000",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Miami",
                "addressRegion": "FL",
                "addressCountry": "US"
              },
              "priceRange": "$$"
            })
          }}
        />
      </head>
      <body className={`${inter.variable} ${playfair.variable} antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
