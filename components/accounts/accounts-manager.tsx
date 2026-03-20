'use client'

import { useState } from 'react'
import {
  Facebook,
  Instagram,
  Plus,
  RefreshCw,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { cn, formatDate } from '@/lib/utils'
import type { SocialAccount } from '@/types/database'

interface AccountsManagerProps {
  initialAccounts: SocialAccount[]
  userId: string
}

const statusConfig = {
  active: { label: 'Attivo', variant: 'success' as const, icon: CheckCircle2 },
  inactive: { label: 'Inattivo', variant: 'secondary' as const, icon: Clock },
  token_expired: { label: 'Token scaduto', variant: 'destructive' as const, icon: AlertTriangle },
}

export function AccountsManager({ initialAccounts, userId }: AccountsManagerProps) {
  const [accounts, setAccounts] = useState<SocialAccount[]>(initialAccounts)
  const [showAddForm, setShowAddForm] = useState(false)
  const [addPlatform, setAddPlatform] = useState<'facebook' | 'instagram'>('facebook')
  const [formData, setFormData] = useState({ accountName: '', accountId: '', accessToken: '', followersCount: '' })
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.accountName || !formData.accountId || !formData.accessToken) {
      toast.error('Compila tutti i campi obbligatori')
      return
    }

    setSaving(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('social_accounts')
        .insert({
          user_id: userId,
          platform: addPlatform,
          account_name: formData.accountName,
          account_id: formData.accountId,
          access_token: formData.accessToken,
          status: 'active',
          followers_count: formData.followersCount ? parseInt(formData.followersCount) : null,
        })
        .select()
        .single()

      if (error) throw error
      setAccounts((prev) => [data, ...prev])
      setShowAddForm(false)
      setFormData({ accountName: '', accountId: '', accessToken: '', followersCount: '' })
      toast.success('Account aggiunto con successo')
    } catch (err) {
      toast.error('Errore durante il salvataggio')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Eliminare questo account? Verranno eliminati anche tutti i post associati.')) return
    setDeletingId(id)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('social_accounts').delete().eq('id', id)
      if (error) throw error
      setAccounts((prev) => prev.filter((a) => a.id !== id))
      toast.success('Account eliminato')
    } catch {
      toast.error('Errore durante l\'eliminazione')
    } finally {
      setDeletingId(null)
    }
  }

  async function handleRefreshToken(id: string) {
    toast.info('Funzionalità disponibile a breve - richiede integrazione OAuth')
  }

  const facebookAccounts = accounts.filter((a) => a.platform === 'facebook')
  const instagramAccounts = accounts.filter((a) => a.platform === 'instagram')

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Account Social</h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            Collega e gestisci i tuoi account Facebook e Instagram
          </p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="h-4 w-4" />
          Collega Account
        </Button>
      </div>

      {/* Add account form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Aggiungi Nuovo Account</CardTitle>
            <CardDescription>
              Inserisci le credenziali API del tuo account social
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Platform selector */}
            <div className="flex gap-3 mb-4">
              {(['facebook', 'instagram'] as const).map((platform) => (
                <button
                  key={platform}
                  onClick={() => setAddPlatform(platform)}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium transition-all',
                    addPlatform === platform
                      ? platform === 'facebook'
                        ? 'border-blue-600 bg-blue-600/10 text-blue-300'
                        : 'border-pink-600 bg-pink-600/10 text-pink-300'
                      : 'border-zinc-700 text-zinc-400 hover:border-zinc-600'
                  )}
                >
                  {platform === 'facebook'
                    ? <Facebook className="h-4 w-4" />
                    : <Instagram className="h-4 w-4" />
                  }
                  {platform === 'facebook' ? 'Facebook Page' : 'Instagram Business'}
                </button>
              ))}
            </div>

            <form onSubmit={handleAdd} className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="accountName">Nome Account *</Label>
                  <Input
                    id="accountName"
                    placeholder="Es. Vinitaly Official"
                    value={formData.accountName}
                    onChange={(e) => setFormData((f) => ({ ...f, accountName: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="accountId">Page/Account ID *</Label>
                  <Input
                    id="accountId"
                    placeholder="Es. 123456789"
                    value={formData.accountId}
                    onChange={(e) => setFormData((f) => ({ ...f, accountId: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="accessToken">Access Token *</Label>
                <Input
                  id="accessToken"
                  type="password"
                  placeholder="Token di accesso API"
                  value={formData.accessToken}
                  onChange={(e) => setFormData((f) => ({ ...f, accessToken: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="followers">Numero Followers</Label>
                <Input
                  id="followers"
                  type="number"
                  placeholder="Es. 50000"
                  value={formData.followersCount}
                  onChange={(e) => setFormData((f) => ({ ...f, followersCount: e.target.value }))}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" loading={saving}>
                  Salva Account
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  Annulla
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Facebook Accounts */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600/15">
            <Facebook className="h-4 w-4 text-blue-400" />
          </div>
          <h2 className="font-semibold text-white">Facebook Pages</h2>
          <Badge variant="secondary" className="text-xs">{facebookAccounts.length}</Badge>
        </div>

        {facebookAccounts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-800 p-6 text-center">
            <Facebook className="h-8 w-8 text-zinc-700 mx-auto mb-2" />
            <p className="text-sm text-zinc-500">Nessuna Facebook Page collegata</p>
          </div>
        ) : (
          <div className="space-y-2">
            {facebookAccounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                onDelete={handleDelete}
                onRefresh={handleRefreshToken}
                deleting={deletingId === account.id}
              />
            ))}
          </div>
        )}
      </section>

      <Separator />

      {/* Instagram Accounts */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-pink-600/15">
            <Instagram className="h-4 w-4 text-pink-400" />
          </div>
          <h2 className="font-semibold text-white">Instagram Business</h2>
          <Badge variant="secondary" className="text-xs">{instagramAccounts.length}</Badge>
        </div>

        {instagramAccounts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-800 p-6 text-center">
            <Instagram className="h-8 w-8 text-zinc-700 mx-auto mb-2" />
            <p className="text-sm text-zinc-500">Nessun account Instagram Business collegato</p>
          </div>
        ) : (
          <div className="space-y-2">
            {instagramAccounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                onDelete={handleDelete}
                onRefresh={handleRefreshToken}
                deleting={deletingId === account.id}
              />
            ))}
          </div>
        )}
      </section>

      {/* Info box */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
        <div className="flex gap-3">
          <ExternalLink className="h-4 w-4 text-zinc-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-zinc-300 mb-1">Integrazione Meta API</p>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Per collegare gli account è necessario un Access Token dalla Meta Business Suite.
              I token scadono dopo 60 giorni e devono essere rinnovati manualmente o tramite
              il flow OAuth configurato nel backend.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function AccountCard({
  account,
  onDelete,
  onRefresh,
  deleting,
}: {
  account: SocialAccount
  onDelete: (id: string) => void
  onRefresh: (id: string) => void
  deleting: boolean
}) {
  const status = statusConfig[account.status]
  const StatusIcon = status.icon

  return (
    <div className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <div className={cn(
        'flex h-10 w-10 items-center justify-center rounded-xl shrink-0',
        account.platform === 'facebook' ? 'bg-blue-600/15' : 'bg-pink-600/15'
      )}>
        {account.platform === 'facebook'
          ? <Facebook className="h-5 w-5 text-blue-400" />
          : <Instagram className="h-5 w-5 text-pink-400" />
        }
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-zinc-200">{account.account_name}</p>
          <Badge variant={status.variant} className="text-[10px]">
            <StatusIcon className="h-2.5 w-2.5 mr-1" />
            {status.label}
          </Badge>
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-xs text-zinc-500">ID: {account.account_id}</span>
          {account.followers_count && (
            <>
              <span className="text-zinc-700">·</span>
              <span className="flex items-center gap-1 text-xs text-zinc-500">
                <Users className="h-3 w-3" />
                {account.followers_count.toLocaleString('it-IT')}
              </span>
            </>
          )}
          {account.token_expires_at && (
            <>
              <span className="text-zinc-700">·</span>
              <span className="text-xs text-zinc-500">
                Scade: {formatDate(account.token_expires_at, { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {account.status === 'token_expired' && (
          <Button variant="outline" size="sm" onClick={() => onRefresh(account.id)} className="text-xs">
            <RefreshCw className="h-3 w-3" />
            Rinnova
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
          onClick={() => onDelete(account.id)}
          disabled={deleting}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
