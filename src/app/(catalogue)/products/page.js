// Phase 3: will call catalogue-api.js directly here
export const revalidate = 0

export const metadata = {
  title: 'Products — PCCustomizer Trade Catalogue',
}

export default function ProductsPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Products</h1>
      <p className="text-muted-foreground">Product catalogue coming in Phase 3.</p>
    </main>
  )
}
