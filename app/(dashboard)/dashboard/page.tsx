import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import {
  FileText,
  Clock,
  CheckCircle2,
  TrendingUp,
  Facebook,
  Instagram,
  AlertCircle,
  PenSquare,
  Calendar,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate, formatRelativeTime } from '@/lib/utils'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Dashboard' }

const platformIcon = (platform: string) => {
  if (platform === 'facebook') return <Facebook className="h-3.5 w-3.5 text-blue-400" />
  return <Instagram className="h-3.5 w-3.5 text-pink-400" />
}

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'destructive' | 'secondary'> = {
  draft: 'secondary',
  scheduled: 'default',
  published: 'success',
  failed: 'destructive',
  pending_approval: 'warning',
}

const statusLabel: Record<string, string> = {
  draft: 'Bozza',
  scheduled: 'Pianificato',
  published: 'Pubblicato',
  failed: 'Errore',
  pending_approval: 'In attesa',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch stats in parallel
  const [postsResult, accountsResult, recentPostsResult] = await Promise.all([
    supabase.from('posts').select('status').eq('user_id', user!.id),
    supabase.from('social_accounts').select('id, platform, account_name, status, followers_count').eq('user_id', user!.id),
    supabase
      .from('posts')
      .select('*, social_accounts(account_name, platform)')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const posts = postsResult.data || []
  const accounts = accountsResult.data || []
  const recentPosts = recentPostsResult.data || []

  const stats = {
    total: posts.length,
    scheduled: posts.filter((p) => p.status === 'scheduled').length,
    published: posts.filter((p) => p.status === 'published').length,
    drafts: posts.filter((p) => p.status === 'draft').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            {formatDate(new Date(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <Link href="/compose">
          <Button>
            <PenSquare className="h-4 w-4" />
            Crea Post
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Post Totali', value: stats.total, icon: FileText, color: 'text-zinc-300', bg: 'bg-zinc-800' },
          { label: 'Pianificati', value: stats.scheduled, icon: Clock, color: 'text-purple-400', bg: 'bg-purple-600/10' },
          { label: 'Pubblicati', value: stats.published, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Bozze', value: stats.drafts, icon: TrendingUp, color: 'text-amber-400', bg: 'bg-amber-500/10' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-zinc-400">{label}</p>
                  <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
                </div>
                <div className={`rounded-lg p-2 ${bg}`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Recent Posts */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Post Recenti</CardTitle>
                <Link href="/calendar">
                  <Button variant="ghost" size="sm" className="text-xs text-zinc-400 hover:text-white">
                    <Calendar className="h-3.5 w-3.5 mr-1" />
                    Vedi Calendario
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentPosts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <FileText className="h-10 w-10 text-zinc-700 mb-3" />
                  <p className="text-sm text-zinc-500">Nessun post ancora</p>
                  <Link href="/compose" className="mt-3">
                    <Button size="sm" variant="outline">Crea il primo post</Button>
                  </Link>
                </div>
              ) : (
                recentPosts.map((post) => {
                  const account = post.social_accounts as { account_name: string; platform: string } | null
                  return (
                    <div
                      key={post.id}
                      className="flex items-start gap-3 rounded-lg p-3 hover:bg-zinc-800/50 transition-colors"
                    >
                      <div className="mt-0.5">
                        {account && platformIcon(account.platform)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-200 truncate">{post.content}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-zinc-500">{account?.account_name}</span>
                          <span className="text-zinc-700">·</span>
                          <span className="text-xs text-zinc-500">
                            {formatRelativeTime(post.created_at)}
                          </span>
                        </div>
                      </div>
                      <Badge variant={statusVariant[post.status]}>
                        {statusLabel[post.status]}
                      </Badge>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* Connected Accounts */}
        <div>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Account Connessi</CardTitle>
                <Link href="/accounts">
                  <Button variant="ghost" size="sm" className="text-xs text-zinc-400 hover:text-white">
                    Gestisci
                  </Button>
                </Link>
              </div>
              <CardDescription>
                {accounts.filter((a) => a.status === 'active').length} di {accounts.length} attivi
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {accounts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <AlertCircle className="h-8 w-8 text-zinc-700 mb-2" />
                  <p className="text-xs text-zinc-500">Nessun account collegato</p>
                  <Link href="/accounts" className="mt-2">
                    <Button size="sm" variant="outline" className="text-xs">Collega account</Button>
                  </Link>
                </div>
              ) : (
                accounts.map((account) => (
                  <div key={account.id} className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-zinc-800/50 transition-colors">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${account.platform === 'facebook' ? 'bg-blue-600/15' : 'bg-pink-600/15'}`}>
                      {account.platform === 'facebook'
                        ? <Facebook className="h-4 w-4 text-blue-400" />
                        : <Instagram className="h-4 w-4 text-pink-400" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-200 truncate">{account.account_name}</p>
                      {account.followers_count && (
                        <p className="text-xs text-zinc-500">
                          {account.followers_count.toLocaleString('it-IT')} followers
                        </p>
                      )}
                    </div>
                    <div className={`h-2 w-2 rounded-full ${account.status === 'active' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
