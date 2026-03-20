'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Wine,
  LayoutDashboard,
  Calendar,
  PenSquare,
  ImageIcon,
  Share2,
  Settings,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/calendar', label: 'Calendario', icon: Calendar },
  { href: '/compose', label: 'Crea Post', icon: PenSquare },
  { href: '/assets', label: 'Asset Library', icon: ImageIcon },
  { href: '/accounts', label: 'Account Social', icon: Share2 },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-full w-60 flex-col border-r border-zinc-800 bg-zinc-950">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-4 border-b border-zinc-800">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600 shadow-sm shadow-purple-600/50">
          <Wine className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Vinitaly Social</p>
          <p className="text-xs text-zinc-500">v1.0</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
          Menu
        </p>
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-purple-600/15 text-purple-400'
                  : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {isActive && <ChevronRight className="h-3 w-3 opacity-60" />}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-zinc-800">
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
            pathname.startsWith('/settings')
              ? 'bg-purple-600/15 text-purple-400'
              : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100'
          )}
        >
          <Settings className="h-4 w-4 shrink-0" />
          <span>Impostazioni</span>
        </Link>
      </div>
    </aside>
  )
}
