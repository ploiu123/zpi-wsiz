'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function AddProductForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('')
  const [category, setCategory] = useState('')
  const [image, setImage] = useState('')
  const [featured, setFeatured] = useState(false)
  
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{type: 'error' | 'success', text: string} | null>(null)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    const supabase = createClient()

    const { error } = await supabase.from('products').insert({
      name,
      description: desc,
      price: parseFloat(price),
      stock: parseInt(stock),
      category: category || 'miód',
      image_url: image || '',
      featured
    })

    if (error) {
      setMsg({ type: 'error', text: error.message })
    } else {
      setMsg({ type: 'success', text: 'Produkt został dodany pomyślnie!' })
      setName(''); setDesc(''); setPrice(''); setStock(''); setCategory(''); setImage(''); setFeatured(false);
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="bg-[#111] border border-white/10 rounded-3xl p-6">
      <h2 className="text-xl font-bold text-white mb-6">Dodaj nowy produkt</h2>
      
      {msg && (
        <div className={`p-4 rounded-xl mb-6 text-sm ${msg.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
          {msg.text}
        </div>
      )}

      <form onSubmit={handleAdd} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">Nazwa produktu *</label>
          <input required value={name} onChange={e => setName(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-amber-500" />
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">Opis produktu</label>
          <textarea rows={8} value={desc} onChange={e => setDesc(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-amber-500 min-h-[180px]" placeholder="Dłuższy opis: skład smaku, pożytkowa, sposób krystalizacji, porady kulinarne…" />
        </div>

        <div className="grid grid-cols-2 gap-4">
           <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Cena (zł) *</label>
            <input type="number" step="0.01" required value={price} onChange={e => setPrice(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-amber-500" />
           </div>
           <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Ilość w magazynie *</label>
            <input type="number" required value={stock} onChange={e => setStock(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-amber-500" />
           </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
           <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Kategoria</label>
            <input placeholder="np. miód" value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-amber-500" />
           </div>
           <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">URL Zdjęcia</label>
            <input placeholder="/products/miod.jpg lub https://..." value={image} onChange={e => setImage(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-amber-500" />
           </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
           <input type="checkbox" id="featured" checked={featured} onChange={e => setFeatured(e.target.checked)} className="w-4 h-4 accent-amber-500 bg-black/50 border-white/10 rounded" />
           <label htmlFor="featured" className="text-sm text-gray-300 cursor-pointer">Wyróżnij produkt na stronie głównej</label>
        </div>

        <button disabled={loading} type="submit" className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold py-3 mt-4 rounded-xl transition-all">
          {loading ? 'Dodawanie...' : 'Zapisz produkt w bazie'}
        </button>
      </form>
    </div>
  )
}
