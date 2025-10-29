import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import Image from "next/image";
import { ConnectWalletTopRight } from "@/components/ConnectWalletTopRight";

export const metadata: Metadata = {
  title: "Cipher Wealth",
  description: "Private wealth management on FHEVM",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground antialiased">
        <main className="min-h-screen">
          <Providers>
            <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
              <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Image
                      src="/cipher-logo.svg"
                      alt="Cipher Wealth"
                      width={40}
                      height={40}
                      style={{ width: "40px", height: "40px" }}
                      priority
                    />
                    <div>
                      <h1 className="text-xl font-bold text-foreground">Cipher Wealth</h1>
                      <p className="text-xs text-muted-foreground">Private Wealth Management</p>
                    </div>
                  </div>
                  <ConnectWalletTopRight />
                </div>
              </div>
            </header>
            <div className="container mx-auto px-4 py-8">
              {children}
            </div>
          </Providers>
        </main>
      </body>
    </html>
  );
}
