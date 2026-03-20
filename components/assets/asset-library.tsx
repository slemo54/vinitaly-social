'use client'

import { useState, useCallback } from 'react'
import {
  Upload,
  Search,
  ImageIcon,
  Film,
  Grid3X3,
  List,
  Download,
  Trash2,
  Tag,
  FileIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn, formatDate } from '@/lib/utils'
import type { Asset } from '@/types/database'

interface AssetLibraryProps {
  initialAssets: Asset[]
  userId: string
}

type ViewMode = 'grid' | 'list'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function AssetPreview({ asset }: { asset: Asset }) {
  const isImage = asset.file_type.startsWith('image/')
  const isVideo = asset.file_type.startsWith('video/')

  if (isImage && asset.public_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={asset.public_url}
        alt={asset.file_name}
        className="h-full w-full object-cover"
        loading="lazy"
      />
    )
  }
  if (isVideo) return <Film className="h-8 w-8 text-zinc-500" />
  return <FileIcon className="h-8 w-8 text-zinc-500" />
}

export function AssetLibrary({ initialAssets, userId }: AssetLibraryProps) {
  const [assets, setAssets] = useState<Asset[]>(initialAssets)
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [uploading, setUploading] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video'>('all')

  const filtered = assets.filter((a) => {
    const matchesSearch = a.file_name.toLowerCase().includes(search.toLowerCase()) ||
      a.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
    const matchesType = filterType === 'all' ||
      (filterType === 'image' && a.file_type.startsWith('image/')) ||
      (filterType === 'video' && a.file_type.startsWith('video/'))
    return matchesSearch && matchesType
  })

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    const supabase = createClient()
    const newAssets: Asset[] = []

    for (const file of Array.from(files)) {
      try {
        const ext = file.name.split('.').pop()
        const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

        const { error: uploadError } = await supabase.storage.from('assets').upload(path, file)
        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage.from('assets').getPublicUrl(path)

        const { data: asset, error: dbError } = await supabase
          .from('assets')
          .insert({
            user_id: userId,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            storage_path: path,
            public_url: urlData.publicUrl,
          })
          .select()
          .single()

        if (dbError) throw dbError
        if (asset) newAssets.push(asset)
      } catch (err) {
        toast.error(`Errore upload ${file.name}`)
        console.error(err)
      }
    }

    if (newAssets.length > 0) {
      setAssets((prev) => [...newAssets, ...prev])
      toast.success(`${newAssets.length} file caricati con successo`)
    }
    setUploading(false)
  }, [userId])

  async function handleDelete(ids: string[]) {
    if (!confirm(`Eliminare ${ids.length} file?`)) return
    const supabase = createClient()

    const toDelete = assets.filter((a) => ids.includes(a.id))
    for (const asset of toDelete) {
      await supabase.storage.from('assets').remove([asset.storage_path])
      await supabase.from('assets').delete().eq('id', asset.id)
    }

    setAssets((prev) => prev.filter((a) => !ids.includes(a.id)))
    setSelectedIds(new Set())
    toast.success('File eliminati')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Asset Library</h1>
          <p className="text-sm text-zinc-400 mt-0.5">{assets.length} file totali</p>
        </div>
        <label className="cursor-pointer">
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
            disabled={uploading}
          />
          <Button loading={uploading}>
            <Upload className="h-4 w-4" />
            {uploading ? 'Caricamento...' : 'Carica File'}
          </Button>
        </label>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Cerca per nome o tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'image', 'video'] as const).map((type) => (
            <Button
              key={type}
              variant={filterType === type ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType(type)}
            >
              {type === 'all' ? 'Tutti' : type === 'image' ? 'Immagini' : 'Video'}
            </Button>
          ))}
        </div>
        <div className="flex rounded-lg border border-zinc-700 overflow-hidden">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('grid')}
            className="rounded-none"
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('list')}
            className="rounded-none"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5">
          <span className="text-sm text-zinc-300">{selectedIds.size} selezionati</span>
          <div className="flex gap-2 ml-auto">
            <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
              Deseleziona
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDelete(Array.from(selectedIds))}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Elimina
            </Button>
          </div>
        </div>
      )}

      {/* Upload drop zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleUpload(e.dataTransfer.files) }}
        className="rounded-xl border-2 border-dashed border-zinc-800 p-8 text-center hover:border-zinc-600 transition-colors cursor-pointer"
      >
        <Upload className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
        <p className="text-sm text-zinc-500">Trascina file qui per caricarli</p>
        <p className="text-xs text-zinc-600 mt-1">Supportati: PNG, JPG, GIF, MP4, MOV</p>
      </div>

      {/* Assets grid/list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ImageIcon className="h-14 w-14 text-zinc-700 mb-4" />
          <p className="text-zinc-400 font-medium">Nessun asset trovato</p>
          <p className="text-sm text-zinc-600 mt-1">
            {search ? 'Prova con un termine diverso' : 'Carica il tuo primo file'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filtered.map((asset) => (
            <div
              key={asset.id}
              onClick={() => toggleSelect(asset.id)}
              className={cn(
                'group relative aspect-square rounded-lg border overflow-hidden cursor-pointer transition-all',
                selectedIds.has(asset.id)
                  ? 'border-purple-500 ring-2 ring-purple-500/30'
                  : 'border-zinc-800 hover:border-zinc-600'
              )}
            >
              <div className="flex h-full w-full items-center justify-center bg-zinc-900">
                <AssetPreview asset={asset} />
              </div>
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                <p className="text-xs text-white font-medium truncate">{asset.file_name}</p>
                <p className="text-[10px] text-zinc-400">{formatBytes(asset.file_size)}</p>
              </div>
              {selectedIds.has(asset.id) && (
                <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-purple-600 flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-800 overflow-hidden divide-y divide-zinc-800">
          {filtered.map((asset) => (
            <div
              key={asset.id}
              onClick={() => toggleSelect(asset.id)}
              className={cn(
                'flex items-center gap-4 p-3 cursor-pointer hover:bg-zinc-800/40 transition-colors',
                selectedIds.has(asset.id) && 'bg-purple-600/5'
              )}
            >
              <div className="h-12 w-12 rounded-lg border border-zinc-700 overflow-hidden bg-zinc-900 flex items-center justify-center shrink-0">
                <AssetPreview asset={asset} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-200 truncate">{asset.file_name}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-zinc-500">{formatBytes(asset.file_size)}</span>
                  {asset.width && asset.height && (
                    <span className="text-xs text-zinc-600">{asset.width}×{asset.height}</span>
                  )}
                  <span className="text-xs text-zinc-600">{formatDate(asset.created_at, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
              {asset.tags.length > 0 && (
                <div className="flex gap-1">
                  {asset.tags.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-[10px]">
                      <Tag className="h-2.5 w-2.5 mr-1" />{tag}
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                {asset.public_url && (
                  <a href={asset.public_url} download onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
