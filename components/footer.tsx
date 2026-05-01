import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-[#0a0a0a] relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[300px] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-6 group">
              {/* Logo — prostokątne zaokrąglone, nie okrągłe */}
              <div className="relative w-14 h-11 rounded-xl overflow-hidden border-2 border-amber-500/20 group-hover:border-amber-500/50 transition-colors shadow-lg shadow-amber-500/10">
                <img src="/logo.jpg" alt="Złote Miody" className="w-full h-full object-cover" />
              </div>
              <span className="font-serif text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500 tracking-wide">
                Złote Miody
              </span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-sm font-light">
              Naturalne miody prosto z pasieki. Zdrowie, smak i tradycja zamknięte w luksusowym, złocistym nektarze.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-serif text-sm font-semibold text-amber-400 mb-4">Sklep</h4>
            <ul className="space-y-2">
              <li><Link href="/products" className="text-gray-500 hover:text-amber-400 text-sm transition-colors">Wszystkie produkty</Link></li>
              <li><Link href="/cart" className="text-gray-500 hover:text-amber-400 text-sm transition-colors">Koszyk</Link></li>
              <li><Link href="/historia" className="text-gray-500 hover:text-amber-400 text-sm transition-colors">Historia sklepu</Link></li>
              <li><Link href="/download" className="text-gray-500 hover:text-amber-400 text-sm transition-colors">Aplikacja</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-serif text-sm font-semibold text-amber-400 mb-4">Kontakt</h4>
            <ul className="space-y-2 text-gray-500 text-sm">
              <li>📞 987-654-321</li>
              <li>✉️ info@zlote-miody.pl</li>
              <li>📍 Ul. Miodowa 1, 12-345</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/5 text-center">
          <p className="text-gray-600 text-sm">&copy; 2026 Złote Miody. Wszystkie prawa zastrzeżone.</p>
        </div>
      </div>
    </footer>
  )
}
