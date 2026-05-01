'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ImageIcon, X } from 'lucide-react'

interface LocalImage {
  filename: string
  url: string
}

export function AddProductForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('')
  const [category, setCategory] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [image, setImage] = useState('')
  const [featured, setFeatured] = useState(false)
  
  // Promotion
  const [isOnSale, setIsOnSale] = useState(false)
  const [oldPrice, setOldPrice] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{type: 'error' | 'success', text: string} | null>(null)

  // Local images from public/products/
  const [localImages, setLocalImages] = useState<LocalImage[]>([])
  const [showImagePicker, setShowImagePicker] = useState(false)

  // Existing categories from DB
  const [existingCategories, setExistingCategories] = useState<string[]>([])
  const [showNewCategory, setShowNewCategory] = useState(false)

  useEffect(() => {
    // Load local images
    fetch('/api/product-images')
      .then(r => r.json())
      .then(data => setLocalImages(data.images || []))
      .catch(() => {})
    
    // Load existing categories
    const supabase = createClient()
    supabase
      .from('products')
      .select('category')
      .then(({ data }) => {
        if (data) {
          const cats = [...new Set(data.map(p => p.category).filter(Boolean))]
          setExistingCategories(cats.sort())
        }
      })
  }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    const supabase = createClient()

    const finalCategory = showNewCategory ? newCategory : category

    const insertData: Record<string, any> = {
      name,
      description: desc,
      price: parseFloat(price),
      stock: parseInt(stock),
      category: finalCategory || 'miód',
      image_url: image || '',
      featured,
      old_price: isOnSale && oldPrice ? parseFloat(oldPrice) : null,
    }

    const { error } = await supabase.from('products').insert(insertData)

    if (error) {
      setMsg({ type: 'error', text: error.message })
    } else {
      setMsg({ type: 'success', text: '✅ Produkt dodany pomyślnie!' })
      setName(''); setDesc(''); setPrice(''); setStock(''); setCategory(''); setNewCategory(''); setImage(''); setFeatured(false); setIsOnSale(false); setOldPrice(''); setShowNewCategory(false);
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="bg-[#111] border border-white/10 rounded-3xl p-6">
      <h2 className="text-xl font-bold text-white mb-6">➕ Dodaj nowy produkt</h2>
      
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

        {/* Price & Stock */}
        <div className="grid grid-cols-2 gap-4">
           <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">
              {isOnSale ? 'Cena promocyjna (zł) *' : 'Cena (zł) *'}
            </label>
            <input type="number" step="0.01" required value={price} onChange={e => setPrice(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-amber-500" />
           </div>
           <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Ilość w magazynie *</label>
            <input type="number" required value={stock} onChange={e => setStock(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-amber-500" />
           </div>
        </div>

        {/* Promotion toggle */}
        <div className="p-4 rounded-xl border border-white/10 bg-black/20 space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isOnSale} onChange={e => setIsOnSale(e.target.checked)} className="w-4 h-4 accent-amber-500" />
            <span className="text-sm text-amber-400 font-semibold">🏷️ Produkt w promocji</span>
          </label>
          {isOnSale && (
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Cena przed promocją (zł) *</label>
              <input type="number" step="0.01" required={isOnSale} value={oldPrice} onChange={e => setOldPrice(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-amber-500" placeholder="np. 45.00" />
              <p className="text-xs text-gray-500 mt-1">Wyświetli się jako przekreślona cena + informacja Omnibus o najniższej cenie z 30 dni.</p>
            </div>
          )}
        </div>

        {/* Category selector */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">Kategoria</label>
          {!showNewCategory ? (
            <div className="flex gap-2">
              <select 
                value={category} 
                onChange={e => setCategory(e.target.value)} 
                className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-amber-500"
              >
                <option value="">— Wybierz kategorię —</option>
                {existingCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <button 
                type="button" 
                onClick={() => setShowNewCategory(true)} 
                className="px-3 py-2 bg-amber-500/10 text-amber-500 rounded-xl text-xs font-bold hover:bg-amber-500/20 transition-colors whitespace-nowrap"
              >
                + Nowa
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input 
                value={newCategory} 
                onChange={e => setNewCategory(e.target.value)} 
                placeholder="np. pyłek pszczeli" 
                className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-amber-500" 
              />
              <button 
                type="button" 
                onClick={() => { setShowNewCategory(false); setNewCategory('') }} 
                className="px-3 py-2 bg-white/10 text-gray-300 rounded-xl text-xs font-bold hover:bg-white/20 transition-colors"
              >
                Anuluj
              </button>
            </div>
          )}
        </div>

        {/* Image picker */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">Zdjęcie produktu</label>
          
          {/* Current selection */}
          {image && (
            <div className="flex items-center gap-2 mb-2 p-2 bg-black/30 rounded-lg border border-white/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt="" className="w-10 h-10 rounded-lg object-cover" />
              <span className="text-sm text-gray-300 truncate flex-1">{image}</span>
              <button type="button" onClick={() => setImage('')} className="p-1 hover:text-red-400 text-gray-500">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex gap-2">
            <input 
              placeholder="URL zdjęcia lub wybierz z folderu →" 
              value={image} 
              onChange={e => setImage(e.target.value)} 
              className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-amber-500 text-sm" 
            />
            <button 
              type="button" 
              onClick={() => setShowImagePicker(!showImagePicker)} 
              className="px-3 py-2 bg-amber-500/10 text-amber-500 rounded-xl text-xs font-bold hover:bg-amber-500/20 transition-colors flex items-center gap-1"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              Folder
            </button>
          </div>

          {/* Image picker dropdown */}
          {showImagePicker && (
            <div className="mt-2 p-3 bg-black/40 border border-white/10 rounded-xl max-h-[250px] overflow-y-auto">
              {localImages.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-2">Brak zdjęć w folderze /public/products/</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {localImages.map(img => (
                    <button
                      key={img.filename}
                      type="button"
                      onClick={() => { setImage(img.url); setShowImagePicker(false) }}
                      className={`rounded-lg overflow-hidden border-2 transition-all hover:border-amber-500/50 ${image === img.url ? 'border-amber-500' : 'border-white/10'}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt={img.filename} className="w-full aspect-square object-cover" />
                      <div className="text-[10px] text-gray-400 truncate px-1 py-0.5 bg-black/50">{img.filename}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 pt-2">
           <input type="checkbox" id="featured" checked={featured} onChange={e => setFeatured(e.target.checked)} className="w-4 h-4 accent-amber-500 bg-black/50 border-white/10 rounded" />
           <label htmlFor="featured" className="text-sm text-gray-300 cursor-pointer">⭐ Wyróżnij produkt na stronie głównej</label>
        </div>

        <button disabled={loading} type="submit" className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold py-3 mt-4 rounded-xl transition-all">
          {loading ? '⏳ Dodawanie...' : '💾 Zapisz produkt w bazie'}
        </button>
      </form>
    </div>
  )
}
