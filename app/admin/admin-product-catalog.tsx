'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Product } from '@/lib/types'

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
    setMsg({ type: 'success', text: 'Produkt został usunięty.' })
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
                          <div className="w-12 h-12 bg-white/5 rounded-lg border border-white/10 flex items-center justify-center shrink-0 text-xs">
                            —
                          </div>
                        )}
                        <div>
                          <div className="text-white font-bold">{product.name}</div>
                          {product.featured && (
                            <span className="inline-block mt-1 text-xs bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded">
                              Wyróżniony
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-amber-500 font-bold whitespace-nowrap">
                      {Number(product.price).toFixed(2)} zł
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
                          {editingId === product.id ? 'Zwiń' : 'Edytuj'}
                        </button>
                        <button
                          type="button"
                          disabled={busyId === product.id}
                          onClick={() => handleDelete(product.id)}
                          className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-bold hover:bg-red-500/20 disabled:opacity-50"
                        >
                          {busyId === product.id ? '…' : 'Usuń'}
                        </button>
                      </div>
                      {editingId === product.id && (
                        <ProductInlineEditor
                          product={product}
                          onCancel={() => setEditingId(null)}
                          onSaved={() => {
                            setEditingId(null)
                            setMsg({ type: 'success', text: 'Zapisano zmiany produktu.' })
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
  const [image, setImage] = useState(product.image_url || '')
  const [featured, setFeatured] = useState(product.featured)
  const [loading, setLoading] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('products')
      .update({
        name,
        description: desc,
        price: parseFloat(price),
        stock: parseInt(stock, 10),
        category: category || 'miód',
        image_url: image || '',
        featured,
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
          <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1">Cena (zł)</label>
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
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1">Kategoria</label>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1">URL zdjęcia</label>
          <input
            value={image}
            onChange={(e) => setImage(e.target.value)}
            className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-xs text-gray-300">
        <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="accent-amber-500" />
        Wyróżnij na stronie głównej
      </label>
      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 rounded-lg text-sm disabled:opacity-50"
        >
          {loading ? 'Zapisywanie…' : 'Zapisz'}
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg bg-white/10 text-sm font-bold text-white">
          Anuluj
        </button>
      </div>
    </form>
  )
}
