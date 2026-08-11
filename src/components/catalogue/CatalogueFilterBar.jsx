'use client'

import { useCallback, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { SlidersHorizontal, X } from 'lucide-react'

const ALL_SORT_OPTIONS = [
  { value: 'newest',     label: 'Newest',              priceSort: false },
  { value: 'price_asc',  label: 'Price: Low to High',  priceSort: true },
  { value: 'price_desc', label: 'Price: High to Low',  priceSort: true },
  { value: 'title_asc',  label: 'Name: A–Z',           priceSort: false },
  { value: 'title_desc', label: 'Name: Z–A',           priceSort: false },
]

const FILTER_PARAMS = ['category', 'brand', 'condition', 'in_stock']

export default function CatalogueFilterBar({ options = {}, canPriceSort = true }) {
  const { categories = [], brands = [], conditions = [] } = options
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [sheetOpen, setSheetOpen] = useState(false)

  const get = (key) => searchParams.get(key) ?? 'all'
  const rawSort = searchParams.get('sort') || 'newest'
  const sort = (!canPriceSort && (rawSort === 'price_asc' || rawSort === 'price_desc')) ? 'newest' : rawSort
  const hasFilters = FILTER_PARAMS.some(k => searchParams.has(k))
  const activeFilterCount = FILTER_PARAMS.filter(k => searchParams.has(k)).length

  const setParam = useCallback((key, value) => {
    const params = new URLSearchParams(searchParams.toString())
    value && value !== 'all' ? params.set(key, value) : params.delete(key)
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }, [router, searchParams, pathname])

  function clearAll() {
    const params = new URLSearchParams()
    const q = searchParams.get('q')
    if (q) params.set('q', q)
    router.push(`${pathname}?${params.toString()}`)
  }

  // Filter selects — rendered in both desktop bar and mobile sheet
  const filterSelects = (mobile = false) => (
    <>
      {categories.length > 0 && (
        <FilterSelect
          label="Category"
          allLabel="All categories"
          value={get('category')}
          options={categories}
          onChange={v => { setParam('category', v); if (mobile) setSheetOpen(false) }}
          mobile={mobile}
        />
      )}
      {brands.length > 0 && (
        <FilterSelect
          label="Brand"
          allLabel="All brands"
          value={get('brand')}
          options={brands}
          onChange={v => { setParam('brand', v); if (mobile) setSheetOpen(false) }}
          mobile={mobile}
        />
      )}
      {conditions.length > 0 && (
        <FilterSelect
          label="Condition"
          allLabel="All conditions"
          value={get('condition')}
          options={conditions}
          onChange={v => { setParam('condition', v); if (mobile) setSheetOpen(false) }}
          mobile={mobile}
        />
      )}
      <FilterSelect
        label="Availability"
        allLabel="All products"
        value={searchParams.get('in_stock') === 'true' ? 'in_stock' : 'all'}
        options={[{ value: 'in_stock', label: 'In stock only' }]}
        onChange={v => { setParam('in_stock', v === 'in_stock' ? 'true' : ''); if (mobile) setSheetOpen(false) }}
        mobile={mobile}
      />
    </>
  )

  return (
    <div className="flex flex-col gap-2">
      {/* ── Desktop filter row ── */}
      <div className="hidden md:flex items-center gap-2 flex-wrap">
        {filterSelects(false)}

        <div className="ml-auto flex items-center gap-3">
          {hasFilters && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3 h-3" />
              Clear filters
            </button>
          )}
          <SortSelect value={sort} onChange={v => setParam('sort', v)} canPriceSort={canPriceSort} />
        </div>
      </div>

      {/* ── Mobile row: [Filters] [Sort] ── */}
      <div className="flex md:hidden items-center gap-2">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-2 h-9">
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex w-72 flex-col p-0">
            <SheetHeader className="shrink-0 border-b px-5 py-4">
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
              {filterSelects(true)}
            </div>
            {hasFilters && (
              <div className="shrink-0 border-t px-5 py-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground"
                  onClick={() => { clearAll(); setSheetOpen(false) }}
                >
                  <X className="mr-2 h-4 w-4" />
                  Clear all filters
                </Button>
              </div>
            )}
          </SheetContent>
        </Sheet>

        <div className="ml-auto">
          <SortSelect value={sort} onChange={v => setParam('sort', v)} canPriceSort={canPriceSort} />
        </div>
      </div>
    </div>
  )
}

function FilterSelect({ label, allLabel, value, options, onChange, mobile }) {
  return mobile ? (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9 text-sm w-full">
          <SelectValue placeholder={allLabel} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{allLabel}</SelectItem>
          {options.map(o => (
            <SelectItem key={typeof o === 'string' ? o : o.value} value={typeof o === 'string' ? o : o.value}>
              {typeof o === 'string' ? o : o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  ) : (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-8 text-sm w-auto min-w-[110px]">
        <SelectValue placeholder={allLabel} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{allLabel}</SelectItem>
        {options.map(o => (
          <SelectItem key={typeof o === 'string' ? o : o.value} value={typeof o === 'string' ? o : o.value}>
            {typeof o === 'string' ? o : o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function SortSelect({ value, onChange, canPriceSort = true }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-8 text-sm w-[170px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {ALL_SORT_OPTIONS.map(o => (
          <SelectItem
            key={o.value}
            value={o.value}
            disabled={o.priceSort && !canPriceSort}
            className={o.priceSort && !canPriceSort ? 'opacity-40' : ''}
          >
            {o.label}
            {o.priceSort && !canPriceSort ? ' (retail only)' : ''}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
