import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { AssetLibrary } from '@/components/assets/asset-library'

export const metadata: Metadata = { title: 'Asset Library' }

export default async function AssetsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: assets } = await supabase
    .from('assets')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  return <AssetLibrary initialAssets={assets || []} userId={user!.id} />
}
