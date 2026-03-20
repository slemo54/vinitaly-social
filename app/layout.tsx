import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Vinitaly Social',
  description: 'Tool interno gestione social media - Calendar, Scheduling, Approvazioni',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  )
}
