import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { PostComposer } from '@/components/compose/post-composer'

export const metadata: Metadata = { title: 'Crea Post' }

export default async function ComposePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: accounts } = await supabase
    .from('social_accounts')
    .select('id, account_name, platform, page_picture_url, status')
    .eq('user_id', user!.id)
    .eq('status', 'active')

  return <PostComposer accounts={accounts || []} userId={user!.id} />
}
