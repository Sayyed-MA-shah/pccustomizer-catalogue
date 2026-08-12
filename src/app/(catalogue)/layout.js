import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { getCustomerProfile } from '@/lib/auth-helpers'
import CatalogueHeader from '@/components/catalogue/CatalogueHeader'
import { CartProvider } from '@/lib/cart-context'

export default async function CatalogueLayout({ children }) {
  const profile = await getCustomerProfile()

  if (!profile) redirect('/login')
  if (profile.status !== 'approved') {
    redirect(
      profile.status === 'rejected' || profile.status === 'revoked'
        ? '/rejected'
        : '/pending'
    )
  }

  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || ''

  return (
    <CartProvider userId={profile.id}>
      <div className="min-h-screen bg-background flex flex-col">
        <CatalogueHeader profile={profile} currentPath={pathname} />
        <div className="flex-1 flex flex-col">
          {children}
        </div>
      </div>
    </CartProvider>
  )
}
