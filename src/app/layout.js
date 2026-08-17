import { Geist } from 'next/font/google'
import './globals.css'
import { createClient } from '@/lib/supabase/server'
import { CartProvider } from '@/lib/cart-context'

const geistSans = Geist({
  variable: '--font-sans',
  subsets: ['latin'],
})

export const metadata = {
  title: 'PCCustomizer — Business Technology',
  description: 'Professional IT hardware and technology for businesses. Apply for a trade account to access exclusive pricing.',
  robots: { index: false, follow: false },
}

export default async function RootLayout({ children }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <html lang="en" className={geistSans.variable}>
      <body>
        <CartProvider userId={user?.id ?? null}>
          {children}
        </CartProvider>
      </body>
    </html>
  )
}
