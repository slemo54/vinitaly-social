import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { AccountsManager } from '@/components/accounts/accounts-manager'

export const metadata: Metadata = { title: 'Account Social' }

export default async function AccountsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: accounts } = await supabase
    .from('social_accounts')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  return <AccountsManager initialAccounts={accounts || []} userId={user!.id} />
}
