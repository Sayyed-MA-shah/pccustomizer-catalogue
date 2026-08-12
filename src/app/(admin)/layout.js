import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminSidebar from '@/components/admin/AdminSidebar'

export default async function AdminLayout({ children }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/admin/login')

  const { data: adminRow } = await supabase
    .from('catalogue_admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!adminRow) redirect('/')

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar email={user.email} />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-4 pt-[4.5rem] lg:pt-4 lg:p-8 max-w-6xl">
          {children}
        </main>
      </div>
    </div>
  )
}
