'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Facebook,
  Instagram,
  ImageIcon,
  Calendar,
  Send,
  Save,
  Smile,
  Hash,
  X,
  Eye,
} from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { SocialAccount } from '@/types/database'

interface PostComposerProps {
  accounts: Pick<SocialAccount, 'id' | 'account_name' | 'platform' | 'page_picture_url' | 'status'>[]
  userId: string
}

const CHAR_LIMITS = { facebook: 63206, instagram: 2200 }
const COMMON_HASHTAGS = ['#vinitaly', '#wine', '#vino', '#winelover', '#italianwine', '#winelovers', '#winetime', '#veronese']

export function PostComposer({ accounts, userId }: PostComposerProps) {
  const router = useRouter()
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || '')
  const [content, setContent] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit')
  const [showHashtags, setShowHashtags] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId)
  const platform = selectedAccount?.platform || 'instagram'
  const charLimit = CHAR_LIMITS[platform]
  const charCount = content.length
  const charPercent = Math.min((charCount / charLimit) * 100, 100)

  function addHashtag(tag: string) {
    const textarea = textareaRef.current
    if (!textarea) { setContent((c) => c + ' ' + tag); return }
    const start = textarea.selectionStart
    const newContent = content.slice(0, start) + (content[start - 1] === ' ' || start === 0 ? '' : ' ') + tag + ' ' + content.slice(start)
    setContent(newContent)
  }

  async function handleSubmit(status: 'draft' | 'scheduled') {
    if (!content.trim()) { toast.error('Il contenuto del post è obbligatorio'); return }
    if (!selectedAccountId) { toast.error('Seleziona un account social'); return }
    if (status === 'scheduled' && !scheduledAt) { toast.error('Inserisci data e ora di pubblicazione'); return }
    if (charCount > charLimit) { toast.error(`Il testo supera il limite di ${charLimit} caratteri`); return }

    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('posts').insert({
        user_id: userId,
        social_account_id: selectedAccountId,
        content: content.trim(),
        status,
        scheduled_at: status === 'scheduled' ? new Date(scheduledAt).toISOString() : null,
      })

      if (error) throw error
      toast.success(status === 'scheduled' ? 'Post pianificato con successo!' : 'Bozza salvata')
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      toast.error('Errore durante il salvataggio. Riprova.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Crea Nuovo Post</h1>
        <p className="text-sm text-zinc-400 mt-0.5">Componi e pianifica i tuoi contenuti social</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main editor */}
        <div className="lg:col-span-2 space-y-4">
          {/* Account selector */}
          <div className="space-y-2">
            <Label>Account Social</Label>
            {accounts.length === 0 ? (
              <div className="rounded-lg border border-dashed border-zinc-700 p-4 text-center">
                <p className="text-sm text-zinc-500">Nessun account connesso.</p>
                <Button variant="link" size="sm" onClick={() => router.push('/accounts')} className="mt-1">
                  Collega un account →
                </Button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {accounts.map((account) => (
                  <button
                    key={account.id}
                    onClick={() => setSelectedAccountId(account.id)}
                    className={cn(
                      'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all',
                      selectedAccountId === account.id
                        ? 'border-purple-600 bg-purple-600/10 text-purple-300'
                        : 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-600'
                    )}
                  >
                    {account.platform === 'facebook'
                      ? <Facebook className="h-4 w-4 text-blue-400" />
                      : <Instagram className="h-4 w-4 text-pink-400" />
                    }
                    {account.account_name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Editor/Preview tabs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Contenuto</Label>
              <div className="flex rounded-lg border border-zinc-700 overflow-hidden">
                {(['edit', 'preview'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1 text-xs font-medium transition-colors',
                      activeTab === tab ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-200'
                    )}
                  >
                    {tab === 'edit' ? <Hash className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    {tab === 'edit' ? 'Modifica' : 'Anteprima'}
                  </button>
                ))}
              </div>
            </div>

            {activeTab === 'edit' ? (
              <Textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={`Scrivi il contenuto del tuo post ${platform === 'instagram' ? '(max 2.200 caratteri)' : ''}...`}
                className="min-h-[200px] text-sm"
              />
            ) : (
              <div className="min-h-[200px] rounded-md border border-zinc-700 bg-zinc-900 p-3">
                {content ? (
                  <p className="text-sm text-zinc-200 whitespace-pre-wrap">{content}</p>
                ) : (
                  <p className="text-sm text-zinc-600 italic">Il tuo testo apparirà qui...</p>
                )}
              </div>
            )}

            {/* Char counter */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex gap-2">
                <button
                  onClick={() => setShowHashtags(!showHashtags)}
                  className="flex items-center gap-1 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  <Hash className="h-3.5 w-3.5" />
                  Hashtag
                </button>
                <button className="flex items-center gap-1 text-zinc-500 hover:text-zinc-300 transition-colors">
                  <Smile className="h-3.5 w-3.5" />
                  Emoji
                </button>
              </div>
              <span className={cn('tabular-nums', charCount > charLimit ? 'text-red-400' : charCount > charLimit * 0.9 ? 'text-amber-400' : 'text-zinc-500')}>
                {charCount.toLocaleString()} / {charLimit.toLocaleString()}
              </span>
            </div>

            {/* Char progress bar */}
            <div className="h-0.5 w-full rounded-full bg-zinc-800">
              <div
                className={cn('h-full rounded-full transition-all', charCount > charLimit ? 'bg-red-500' : charCount > charLimit * 0.9 ? 'bg-amber-500' : 'bg-purple-500')}
                style={{ width: `${charPercent}%` }}
              />
            </div>

            {/* Hashtag suggestions */}
            {showHashtags && (
              <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-zinc-400">Hashtag suggeriti</p>
                  <button onClick={() => setShowHashtags(false)}>
                    <X className="h-3.5 w-3.5 text-zinc-600 hover:text-zinc-300" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_HASHTAGS.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => addHashtag(tag)}
                      className="rounded-full bg-zinc-800 px-2.5 py-1 text-xs text-purple-400 hover:bg-zinc-700 transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Media upload placeholder */}
          <div>
            <Label className="mb-2 block">Media</Label>
            <div className="rounded-lg border border-dashed border-zinc-700 p-6 text-center hover:border-zinc-600 transition-colors cursor-pointer">
              <ImageIcon className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-sm text-zinc-500">Trascina qui foto o video</p>
              <p className="text-xs text-zinc-600 mt-1">PNG, JPG, MP4 fino a 100MB</p>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Scheduling */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-purple-400" />
              <h3 className="text-sm font-semibold text-white">Pianificazione</h3>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="scheduled" className="text-xs">Data e ora pubblicazione</Label>
              <input
                id="scheduled"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="flex h-9 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1 text-sm text-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-500"
              />
            </div>
          </div>

          {/* Platform info */}
          {selectedAccount && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-2">
              <h3 className="text-sm font-semibold text-white">Account selezionato</h3>
              <div className="flex items-center gap-2">
                {selectedAccount.platform === 'facebook'
                  ? <Facebook className="h-4 w-4 text-blue-400" />
                  : <Instagram className="h-4 w-4 text-pink-400" />
                }
                <span className="text-sm text-zinc-300">{selectedAccount.account_name}</span>
              </div>
              <div className="flex gap-1 flex-wrap">
                <Badge variant="secondary" className="text-[10px]">
                  {selectedAccount.platform === 'facebook' ? 'Facebook Page' : 'Instagram Business'}
                </Badge>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2">
            <Button
              className="w-full"
              onClick={() => handleSubmit('scheduled')}
              disabled={loading || !content || !scheduledAt}
            >
              <Send className="h-4 w-4" />
              Pianifica Post
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleSubmit('draft')}
              disabled={loading || !content}
            >
              <Save className="h-4 w-4" />
              Salva come Bozza
            </Button>
          </div>

          {/* Tips */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Suggerimenti</h3>
            <ul className="space-y-2 text-xs text-zinc-500">
              <li className="flex gap-2">
                <span className="text-purple-500">•</span>
                I post con immagini ottengono più engagement
              </li>
              <li className="flex gap-2">
                <span className="text-purple-500">•</span>
                Gli orari migliori sono 9-11 e 18-20
              </li>
              <li className="flex gap-2">
                <span className="text-purple-500">•</span>
                Usa 3-5 hashtag rilevanti su Instagram
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
