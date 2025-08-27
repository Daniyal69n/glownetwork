import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import { AuthProvider } from "../lib/auth-context"
import { SiteHeader } from "../components/site-header"
import { Toaster } from "../components/ui/toaster"

export const metadata: Metadata = {
  title: "GLOW NETWORK - Beauty & Cosmetics MLM",
  description: "Join GLOW NETWORK - Premium beauty and cosmetics network marketing platform",
  generator: "GLOW NETWORK",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head />
      <body className="min-h-screen bg-background text-foreground font-sans antialiased">
        <AuthProvider>
          <SiteHeader />
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
