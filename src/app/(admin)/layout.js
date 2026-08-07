import { redirect } from 'next/navigation'
import { isCurrentUserAdmin } from '@/lib/auth-helpers'

export default async function AdminLayout({ children }) {
  const isAdmin = await isCurrentUserAdmin()
  if (!isAdmin) redirect('/')

  return <>{children}</>
}
