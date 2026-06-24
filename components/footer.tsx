import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-[#0a0a0a] relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[300px] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center justify-between">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4 group">
              <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-amber-500/20 group-hover:border-amber-500/50 transition-colors shadow-lg shadow-amber-500/10">
                <img src="/logo.png" alt="Złote Miody" className="w-full h-full object-contain bg-black/10" />
              </div>
              <span className="font-serif text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500 tracking-wide">
                Złote Miody
              </span>
            </div>
            <p className="text-gray-400 text-xs leading-relaxed max-w-xs font-light">
              Naturalne miody prosto z pasieki. Zdrowie, smak i tradycja zamknięte w każdym słoiku.
            </p>
          </div>

          {/* Links */}
          <div className="flex md:justify-center gap-6">
            <Link href="/products" className="text-gray-500 hover:text-amber-400 text-sm transition-colors">Produkty</Link>
            <Link href="/cart" className="text-gray-500 hover:text-amber-400 text-sm transition-colors">Koszyk</Link>
            <Link href="/dashboard" className="text-gray-500 hover:text-amber-400 text-sm transition-colors">Moje konto</Link>
          </div>

          {/* Contact */}
          <div className="text-left md:text-right">
            <h4 className="font-serif text-xs font-semibold text-amber-400 mb-2">Kontakt</h4>
            <ul className="space-y-1 text-gray-500 text-xs">
              <li>Telefon: 987 654 321</li>
              <li>E-mail: kontakt@zlote-miody.pl</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/5 text-center">
          <p className="text-gray-600 text-xs">&copy; 2026 Złote Miody. Wszystkie prawa zastrzeżone.</p>
        </div>
      </div>
    </footer>
  )
}
