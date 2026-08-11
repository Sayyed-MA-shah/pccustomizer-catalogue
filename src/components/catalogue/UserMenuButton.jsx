'use client'

import Link from 'next/link'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { LogOut, User } from 'lucide-react'

const SEGMENT_LABELS = { retail: 'Retail', wholesale: 'Wholesale', trade: 'Trade' }

export default function UserMenuButton({ name, company, segment }) {
  const initials = name
    ? name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
    : 'U'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted transition-colors outline-none">
        <Avatar className="w-7 h-7">
          <AvatarFallback className="text-xs bg-primary text-primary-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
        <span className="hidden md:block text-sm font-medium text-foreground max-w-[140px] truncate">
          {company || name}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="px-2 py-1.5">
          <p className="text-xs font-medium text-foreground truncate">{name}</p>
          {company && <p className="text-xs text-muted-foreground truncate">{company}</p>}
          {segment && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {SEGMENT_LABELS[segment] ?? segment} account
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
        <DropdownMenuSeparator />
        <form action="/api/auth/signout" method="POST">
          <DropdownMenuItem asChild>
            <button type="submit" className="flex items-center gap-2 w-full text-destructive focus:text-destructive cursor-pointer">
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
