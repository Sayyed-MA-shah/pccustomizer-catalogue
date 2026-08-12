import CartContents from '@/components/catalogue/CartContents'

export const metadata = { title: 'Cart — PCCustomizer Catalogue' }

export default function CartPage() {
  return (
    <div className="flex-1">
      <CartContents />
    </div>
  )
}
