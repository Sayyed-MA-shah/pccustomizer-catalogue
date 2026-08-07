import { redirect } from 'next/navigation'
import { getCustomerProfile } from '@/lib/auth-helpers'

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

  return <>{children}</>
}
