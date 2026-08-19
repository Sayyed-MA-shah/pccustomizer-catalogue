import { createClient } from '@/lib/supabase/server'
import { getCategories } from '@/lib/catalogue-api'
import CatalogueHeader from '@/components/catalogue/CatalogueHeader'

export default async function CatalogueLayout({ children }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase
      .from('customer_profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    if (data?.status === 'approved') profile = data
  }

  const categories = await getCategories()

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <CatalogueHeader profile={profile} categories={categories} />
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </div>
  )
}
