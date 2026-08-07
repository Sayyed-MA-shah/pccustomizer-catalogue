import { Geist } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-sans',
  subsets: ['latin'],
})

export const metadata = {
  title: 'PCCustomizer — Trade Catalogue',
  description: 'Exclusive B2B product catalogue for approved trade customers.',
  robots: { index: false, follow: false },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={geistSans.variable}>
      <body>{children}</body>
    </html>
  )
}
