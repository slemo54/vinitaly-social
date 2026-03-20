'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, LogOut, User } from 'lucide-react'
import { toast } from 'sonner'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import type { Profile } from '@/types/database'

interface TopBarProps {
  user: SupabaseUser
  profile: Profile | null
}

export function TopBar({ user, profile }: TopBarProps) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Disconnesso')
    router.push('/login')
    router.refresh()
  }

  const initials = (profile?.full_name || user.email || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <header className="flex h-16 items-center justify-between border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm px-6">
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
        <span className="text-xs text-zinc-500">Sistema online</span>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="relative text-zinc-400">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-purple-500" />
        </Button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-zinc-800/60 transition-colors"
          >
            <Avatar className="h-7 w-7">
              <AvatarImage src={profile?.avatar_url ?? undefined} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-zinc-200 leading-none">
                {profile?.full_name || 'Utente'}
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">{user.email}</p>
            </div>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-zinc-700 bg-zinc-900 shadow-xl z-50 overflow-hidden">
              <div className="p-3 border-b border-zinc-800">
                <p className="text-xs font-medium text-zinc-300">{profile?.full_name || user.email}</p>
                <p className="text-xs text-zinc-500 capitalize">{profile?.role || 'editor'}</p>
              </div>
              <div className="p-1">
                <button
                  onClick={() => { setMenuOpen(false); router.push('/settings') }}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
                >
                  <User className="h-3.5 w-3.5" />
                  Profilo
                </button>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Disconnetti
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
