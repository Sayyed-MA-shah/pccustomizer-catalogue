'use client'

import Link from 'next/link'
import { ChevronDown, LogOut, MapPin, User } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const SEGMENT_LABELS = { retail: 'Retail', wholesale: 'Wholesale', trade: 'Trade' }

export default function UserMenuButton({ name, company, segment }) {
  const initials = name
    ? name.split(' ').filter(Boolean).map(p => p[0]).slice(0, 2).join('').toUpperCase()
    : 'U'
  const segmentLabel = segment ? (SEGMENT_LABELS[segment] ?? segment) : null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted transition-colors outline-none">
        {/* Desktop: text block */}
        <div className="hidden md:flex flex-col items-end">
          {segmentLabel && (
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide leading-tight">
              {segmentLabel} Account
            </span>
          )}
          <span className="text-sm font-medium text-foreground max-w-[140px] truncate leading-tight">
            {company || name}
          </span>
        </div>
        <ChevronDown className="hidden md:block w-3.5 h-3.5 text-muted-foreground shrink-0" />
        {/* Mobile: avatar only */}
        <Avatar className="w-7 h-7 md:hidden">
          <AvatarFallback className="text-xs bg-primary text-primary-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-52">
        <div className="px-2 py-2">
          <p className="text-xs font-semibold text-foreground truncate">{name}</p>
          {company && <p className="text-xs text-muted-foreground truncate">{company}</p>}
          {segmentLabel && (
            <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wide font-medium">
              {segmentLabel} Account
            </p>
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/account" className="flex items-center gap-2 cursor-pointer">
            <User className="w-4 h-4" />
            My Account
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account" className="flex items-center gap-2 cursor-pointer">
            <MapPin className="w-4 h-4" />
            Addresses
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <form action="/api/auth/signout" method="POST">
          <DropdownMenuItem asChild>
            <button
              type="submit"
              className="flex items-center gap-2 w-full text-destructive focus:text-destructive cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
