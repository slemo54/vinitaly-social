import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { CalendarView } from '@/components/calendar/calendar-view'

export const metadata: Metadata = { title: 'Calendario' }

export default async function CalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const { data: posts } = await supabase
    .from('posts')
    .select('*, social_accounts(account_name, platform, page_picture_url)')
    .eq('user_id', user!.id)
    .gte('scheduled_at', startOfMonth.toISOString())
    .lte('scheduled_at', endOfMonth.toISOString())
    .order('scheduled_at', { ascending: true })

  return <CalendarView initialPosts={posts || []} />
}
