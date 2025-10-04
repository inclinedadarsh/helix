import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Helix | L1 Cache for your LLM",
  description:
    "Helix is the L1 cache for your LLMs. Plug it in and your LLM knows everything about you!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${inter.variable} ${spaceGrotesk.variable} font-sans antialiased`}
        >
          <div>{children}</div>
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
