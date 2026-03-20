'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Plus, Facebook, Instagram } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { PostWithAccount } from '@/types/database'

interface CalendarViewProps {
  initialPosts: PostWithAccount[]
}

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']
const MONTHS = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
]

const statusColors: Record<string, string> = {
  draft: 'bg-zinc-600',
  scheduled: 'bg-purple-600',
  published: 'bg-emerald-600',
  failed: 'bg-red-600',
  pending_approval: 'bg-amber-600',
}

export function CalendarView({ initialPosts }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDayOfMonth = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  // Monday-based: getDay() returns 0=Sun, so we adjust
  const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))
  const goToday = () => { setCurrentDate(new Date()); setSelectedDay(null) }

  const getPostsForDay = (day: number) => {
    return initialPosts.filter((post) => {
      if (!post.scheduled_at) return false
      const d = new Date(post.scheduled_at)
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day
    })
  }

  const selectedPosts = selectedDay ? getPostsForDay(selectedDay) : []
  const today = new Date()
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month

  // Build grid: fill leading empty days + actual days
  const totalCells = Math.ceil((startDayOfWeek + daysInMonth) / 7) * 7
  const cells: (number | null)[] = [
    ...Array(startDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ...Array(totalCells - startDayOfWeek - daysInMonth).fill(null),
  ]

  return (
    <div className="flex h-full gap-4">
      {/* Calendar */}
      <div className="flex-1 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Calendario Editoriale</h1>
            <p className="text-sm text-zinc-400 mt-0.5">
              {MONTHS[month]} {year}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToday}>Oggi</Button>
            <div className="flex rounded-lg border border-zinc-700 overflow-hidden">
              <Button variant="ghost" size="icon" onClick={prevMonth} className="rounded-none border-r border-zinc-700">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={nextMonth} className="rounded-none">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Link href="/compose">
              <Button size="sm">
                <Plus className="h-4 w-4" />
                Nuovo Post
              </Button>
            </Link>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-zinc-800">
            {WEEKDAYS.map((day) => (
              <div key={day} className="py-3 text-center text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              const dayPosts = day ? getPostsForDay(day) : []
              const isToday = isCurrentMonth && day === today.getDate()
              const isSelected = day === selectedDay

              return (
                <div
                  key={i}
                  onClick={() => day && setSelectedDay(day === selectedDay ? null : day)}
                  className={cn(
                    'min-h-[90px] border-b border-r border-zinc-800 p-1.5 transition-colors',
                    day ? 'cursor-pointer hover:bg-zinc-800/40' : 'bg-zinc-900/20',
                    isSelected && 'bg-purple-600/10',
                    // Remove right border from last column
                    (i + 1) % 7 === 0 && 'border-r-0',
                    // Remove bottom border from last row
                    i >= cells.length - 7 && 'border-b-0'
                  )}
                >
                  {day && (
                    <>
                      <div className={cn(
                        'flex h-6 w-6 items-center justify-center rounded-full text-sm font-medium mb-1',
                        isToday ? 'bg-purple-600 text-white' : 'text-zinc-400'
                      )}>
                        {day}
                      </div>
                      <div className="space-y-0.5">
                        {dayPosts.slice(0, 3).map((post) => (
                          <div
                            key={post.id}
                            className={cn(
                              'flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-white truncate',
                              statusColors[post.status]
                            )}
                          >
                            {post.social_accounts?.platform === 'facebook'
                              ? <Facebook className="h-2.5 w-2.5 shrink-0" />
                              : <Instagram className="h-2.5 w-2.5 shrink-0" />
                            }
                            <span className="truncate">{post.content.slice(0, 20)}</span>
                          </div>
                        ))}
                        {dayPosts.length > 3 && (
                          <p className="text-xs text-zinc-500 px-1">+{dayPosts.length - 3} altri</p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4">
          {Object.entries({ scheduled: 'Pianificato', published: 'Pubblicato', draft: 'Bozza', failed: 'Errore' }).map(([k, label]) => (
            <div key={k} className="flex items-center gap-1.5">
              <div className={cn('h-2.5 w-2.5 rounded-full', statusColors[k])} />
              <span className="text-xs text-zinc-500">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Side panel - selected day posts */}
      {selectedDay && (
        <div className="w-72 shrink-0">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
            <div className="p-4 border-b border-zinc-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-white">
                    {selectedDay} {MONTHS[month]}
                  </p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {selectedPosts.length} post
                  </p>
                </div>
                <Link href={`/compose?date=${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`}>
                  <Button size="sm" variant="outline">
                    <Plus className="h-3.5 w-3.5" />
                    Aggiungi
                  </Button>
                </Link>
              </div>
            </div>
            <div className="p-3 space-y-2 max-h-[500px] overflow-y-auto">
              {selectedPosts.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-6">Nessun post per questo giorno</p>
              ) : (
                selectedPosts.map((post) => (
                  <div key={post.id} className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      {post.social_accounts?.platform === 'facebook'
                        ? <Facebook className="h-3.5 w-3.5 text-blue-400" />
                        : <Instagram className="h-3.5 w-3.5 text-pink-400" />
                      }
                      <span className="text-xs text-zinc-400">{post.social_accounts?.account_name}</span>
                      <Badge variant={post.status === 'published' ? 'success' : post.status === 'scheduled' ? 'default' : 'secondary'} className="ml-auto text-[10px]">
                        {post.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-zinc-300 line-clamp-3">{post.content}</p>
                    {post.scheduled_at && (
                      <p className="text-[10px] text-zinc-600 mt-2">
                        {new Date(post.scheduled_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
