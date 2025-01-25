'use client';
import { SessionProvider } from 'next-auth/react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <title>Meteor</title>
      <meta property="og:title" content="Meteor" />
      <meta name="description" content="Your anywhere videocalling sollution!" />
      <meta property="og:image" content="http://example.com/image.jpg" />
      <meta property="og:type" content="website" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="author" content="Your Name" />
      <body><SessionProvider>{children}</SessionProvider></body>
    </html>
  )
}
