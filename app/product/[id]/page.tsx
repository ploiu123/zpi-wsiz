import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { ShoppingCart } from 'lucide-react'
import { AddToCartButton } from './add-to-cart-button'

export default async function ProductDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const supabase = await createClient()

  // Pobierz produkt
  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!product) {
    notFound()
  }

  // Pobierz podobne produkty
  const { data: similar } = await supabase
    .from('products')
    .select('id, name, image_url, price')
    .neq('id', product.id)
    .limit(3)

  return (
    <div className="pt-32 pb-16 px-4 md:px-8 max-w-6xl mx-auto">
      <div className="bg-[#111] border border-white/10 rounded-3xl overflow-hidden flex flex-col md:flex-row">
        
        {/* Lewa strona - Obraz */}
        <div className="md:w-1/2 relative bg-white/5 aspect-square md:aspect-auto md:min-h-[500px]">
          {product.image_url ? (
            <Image 
              src={product.image_url} 
              alt={product.name} 
              fill 
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-amber-500 font-bold text-4xl">
              🍯
            </div>
          )}
        </div>
        
        {/* Prawa strona - Opis */}
        <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
           <div className="inline-block px-3 py-1 bg-amber-500/10 text-amber-500 text-xs font-bold rounded-full mb-4 uppercase tracking-wider w-max border border-amber-500/20">
             {product.category || '🐝 Miód'}
           </div>
           
           <h1 className="font-serif text-4xl md:text-5xl font-bold text-white mb-4">
             {product.name}
           </h1>
           
           <div className="text-3xl font-bold text-amber-400 mb-6">
             {product.old_price ? (
               <div className="flex items-center gap-3 flex-wrap">
                 <span>{product.price.toFixed(2)} zł</span>
                 <span className="text-red-400/70 line-through text-xl">{product.old_price.toFixed(2)} zł</span>
                 <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full font-semibold">🏷️ Promocja</span>
               </div>
             ) : (
               <span>{product.price.toFixed(2)} zł</span>
             )}
           </div>
           
           <p className="text-gray-400 text-lg mb-8 leading-relaxed whitespace-pre-line">
             {product.description || 'Naturalny miód z naszej rodzinnej pasieki — bez dodatków, bez chemii, pełen smaku.'}
           </p>
           
           <div className="pt-8 border-t border-white/10 text-sm text-gray-500 mb-8 space-y-2">
             <p>📦 Wysyłka zapakowana ekologicznie w 24h</p>
             <p>
               {product.stock > 0 
                 ? <span>✅ Dostępność: <span className="text-green-500 font-bold ml-1">W magazynie ({product.stock} szt.)</span></span> 
                 : <span>❌ Dostępność: <span className="text-red-500 font-bold ml-1">Brak na magazynie</span></span>
               }
             </p>
             {product.old_price && (
               <p>ℹ️ Najniższa cena z ostatnich 30 dni: <span className="text-amber-400 font-semibold">{product.price.toFixed(2)} zł</span></p>
             )}
           </div>
           
           <AddToCartButton product={product} />
        </div>
      </div>
    </div>
  )
}
