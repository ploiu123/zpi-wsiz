'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Product } from '@/lib/types'
import { ImageIcon, X } from 'lucide-react'

interface LocalImage {
  filename: string
  url: string
}

export function AdminProductCatalog({ initialProducts }: { initialProducts: Product[] }) {
  const router = useRouter()
  const [products, setProducts] = useState(initialProducts)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    setProducts(initialProducts)
  }, [initialProducts])

  const handleDelete = async (id: string) => {
    if (!confirm('Na pewno usunąć ten produkt z bazy?')) return
    setBusyId(id)
    setMsg(null)
    const supabase = createClient()
    const { error } = await supabase.from('products').delete().eq('id', id)
    setBusyId(null)
    if (error) {
      setMsg({ type: 'error', text: error.message })
      return
    }
    setProducts((prev) => prev.filter((p) => p.id !== id))
    setMsg({ type: 'success', text: '🗑️ Produkt został usunięty.' })
    router.refresh()
  }

  return (
    <div>
      {msg && (
        <div
          className={`p-4 rounded-xl mb-4 text-sm ${
            msg.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
          }`}
        >
          {msg.text}
        </div>
      )}

      <div className="bg-[#111] border border-white/10 rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="bg-white/5 text-gray-200">
              <tr>
                <th className="px-6 py-4 font-medium">Zdjęcie / Nazwa</th>
                <th className="px-6 py-4 font-medium">Cena</th>
                <th className="px-6 py-4 font-medium">Stan</th>
                <th className="px-6 py-4 font-medium min-w-[220px]">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center border-t border-white/5">
                    Brak produktów. Dodaj pierwszy formularzem obok.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="border-t border-white/5 hover:bg-white/5 transition-colors align-top">
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        {product.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={product.image_url}
                            alt=""
                            className="w-12 h-12 object-cover rounded-lg border border-white/10 shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-white/5 rounded-lg border border-white/10 flex items-center justify-center shrink-0 text-lg">
                            🍯
                          </div>
                        )}
                        <div>
                          <div className="text-white font-bold">{product.name}</div>
                          {product.featured && (
                            <span className="inline-block mt-1 text-xs bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded">
                              ⭐ Wyróżniony
                            </span>
                          )}
                          {product.old_price && (
                            <span className="inline-block mt-1 ml-1 text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">
                              🏷️ Promocja
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.old_price ? (
                        <div>
                          <div className="text-red-400 line-through text-xs">{Number(product.old_price).toFixed(2)} zł</div>
                          <div className="text-amber-500 font-bold">{Number(product.price).toFixed(2)} zł</div>
                        </div>
                      ) : (
                        <div className="text-amber-500 font-bold">{Number(product.price).toFixed(2)} zł</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-bold ${
                          product.stock > 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                        }`}
                      >
                        {product.stock > 0 ? `${product.stock} szt.` : 'Wyprzedane'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingId((id) => (id === product.id ? null : product.id))}
                          className="px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs font-bold hover:bg-amber-500/20"
                        >
                          {editingId === product.id ? 'Zwiń' : '✏️ Edytuj'}
                        </button>
                        <button
                          type="button"
                          disabled={busyId === product.id}
                          onClick={() => handleDelete(product.id)}
                          className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-bold hover:bg-red-500/20 disabled:opacity-50"
                        >
                          {busyId === product.id ? '…' : '🗑️ Usuń'}
                        </button>
                      </div>
                      {editingId === product.id && (
                        <ProductInlineEditor
                          product={product}
                          onCancel={() => setEditingId(null)}
                          onSaved={() => {
                            setEditingId(null)
                            setMsg({ type: 'success', text: '✅ Zapisano zmiany produktu.' })
                            router.refresh()
                          }}
                          onError={(text) => setMsg({ type: 'error', text })}
                        />
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function ProductInlineEditor({
  product,
  onCancel,
  onSaved,
  onError,
}: {
  product: Product
  onCancel: () => void
  onSaved: () => void
  onError: (msg: string) => void
}) {
  const [name, setName] = useState(product.name)
  const [desc, setDesc] = useState(product.description)
  const [price, setPrice] = useState(String(product.price))
  const [stock, setStock] = useState(String(product.stock))
  const [category, setCategory] = useState(product.category || '')
  const [newCategory, setNewCategory] = useState('')
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [image, setImage] = useState(product.image_url || '')
  const [featured, setFeatured] = useState(product.featured)
  const [loading, setLoading] = useState(false)

  // Promotion
  const [isOnSale, setIsOnSale] = useState(!!product.old_price)
  const [oldPrice, setOldPrice] = useState(product.old_price ? String(product.old_price) : '')

  // Local images & categories
  const [localImages, setLocalImages] = useState<LocalImage[]>([])
  const [showImagePicker, setShowImagePicker] = useState(false)
  const [existingCategories, setExistingCategories] = useState<string[]>([])

  useEffect(() => {
    fetch('/api/product-images')
      .then(r => r.json())
      .then(data => setLocalImages(data.images || []))
      .catch(() => {})

    const supabase = createClient()
    supabase.from('products').select('category').then(({ data }) => {
      if (data) {
        const cats = [...new Set(data.map(p => p.category).filter(Boolean))]
        setExistingCategories(cats.sort())
      }
    })
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const finalCategory = showNewCategory ? newCategory : category

    const { error } = await supabase
      .from('products')
      .update({
        name,
        description: desc,
        price: parseFloat(price),
        stock: parseInt(stock, 10),
        category: finalCategory || 'miód',
        image_url: image || '',
        featured,
        old_price: isOnSale && oldPrice ? parseFloat(oldPrice) : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', product.id)

    setLoading(false)
    if (error) {
      onError(error.message)
      return
    }
    onSaved()
  }

  return (
    <form onSubmit={handleSave} className="mt-4 space-y-3 p-4 rounded-xl bg-black/40 border border-white/10">
      <div>
        <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1">Nazwa</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
        />
      </div>
      <div>
        <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1">Opis</label>
        <textarea
          rows={5}
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1">
            {isOnSale ? 'Cena promo (zł)' : 'Cena (zł)'}
          </label>
          <input
            type="number"
            step="0.01"
            required
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1">Stan</label>
          <input
            type="number"
            required
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
          />
        </div>
      </div>

      {/* Promotion */}
      <div className="p-3 rounded-lg border border-white/10 bg-black/20 space-y-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={isOnSale} onChange={e => setIsOnSale(e.target.checked)} className="accent-amber-500" />
          <span className="text-xs text-amber-400 font-semibold">🏷️ Promocja</span>
        </label>
        {isOnSale && (
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1">Cena przed promocją</label>
            <input
              type="number" step="0.01" required={isOnSale}
              value={oldPrice} onChange={e => setOldPrice(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
            />
          </div>
        )}
      </div>

      {/* Category */}
      <div>
        <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1">Kategoria</label>
        {!showNewCategory ? (
          <div className="flex gap-2">
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="">— Wybierz —</option>
              {existingCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <button type="button" onClick={() => setShowNewCategory(true)} className="px-2 py-1 bg-amber-500/10 text-amber-500 rounded-lg text-[10px] font-bold">
              + Nowa
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
              placeholder="Nowa kategoria"
            />
            <button type="button" onClick={() => { setShowNewCategory(false); setNewCategory('') }} className="px-2 py-1 bg-white/10 text-gray-300 rounded-lg text-[10px] font-bold">
              Anuluj
            </button>
          </div>
        )}
      </div>

      {/* Image */}
      <div>
        <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1">Zdjęcie</label>
        {image && (
          <div className="flex items-center gap-2 mb-2 p-1.5 bg-black/30 rounded-lg border border-white/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt="" className="w-8 h-8 rounded object-cover" />
            <span className="text-xs text-gray-400 truncate flex-1">{image}</span>
            <button type="button" onClick={() => setImage('')} className="p-0.5 hover:text-red-400 text-gray-500">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <input
            value={image}
            onChange={(e) => setImage(e.target.value)}
            className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
            placeholder="URL lub wybierz z folderu"
          />
          <button type="button" onClick={() => setShowImagePicker(!showImagePicker)} className="px-2 py-1 bg-amber-500/10 text-amber-500 rounded-lg text-[10px] font-bold flex items-center gap-1">
            <ImageIcon className="w-3 h-3" />
          </button>
        </div>
        {showImagePicker && (
          <div className="mt-2 p-2 bg-black/40 border border-white/10 rounded-lg max-h-[200px] overflow-y-auto">
            {localImages.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-2">Brak zdjęć w folderze</p>
            ) : (
              <div className="grid grid-cols-4 gap-1.5">
                {localImages.map(img => (
                  <button
                    key={img.filename}
                    type="button"
                    onClick={() => { setImage(img.url); setShowImagePicker(false) }}
                    className={`rounded overflow-hidden border transition-all hover:border-amber-500/50 ${image === img.url ? 'border-amber-500' : 'border-white/10'}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt={img.filename} className="w-full aspect-square object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <label className="flex items-center gap-2 text-xs text-gray-300">
        <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="accent-amber-500" />
        ⭐ Wyróżnij na stronie głównej
      </label>
      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 rounded-lg text-sm disabled:opacity-50"
        >
          {loading ? '⏳ Zapisywanie…' : '💾 Zapisz'}
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg bg-white/10 text-sm font-bold text-white">
          Anuluj
        </button>
      </div>
    </form>
  )
}
