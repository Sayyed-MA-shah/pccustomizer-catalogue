import { createClient } from '@/lib/supabase/server'
import CartContents from '@/components/catalogue/CartContents'

export const metadata = { title: 'Cart — PCCustomizer' }

export default async function CartPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let isAuthenticated = false
  if (user) {
    const { data: profile } = await supabase
      .from('customer_profiles')
      .select('status')
      .eq('id', user.id)
      .single()
    isAuthenticated = profile?.status === 'approved'
  }

  return (
    <div className="flex-1">
      <CartContents isAuthenticated={isAuthenticated} />
    </div>
  )
}
