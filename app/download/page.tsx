import { Monitor, Download, Apple, AlertTriangle } from 'lucide-react'

export const metadata = {
  title: 'Pobierz aplikację desktopową | Złote Miody'
}

export default function DownloadPage() {
  return (
    <div className="pt-32 pb-24 px-4 md:px-8 max-w-5xl mx-auto min-h-[80vh]">
      <div className="text-center mb-16">
        <div className="w-20 h-20 bg-amber-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
           <Monitor className="w-10 h-10 text-amber-500" />
        </div>
        <h1 className="font-serif text-4xl md:text-6xl font-bold text-amber-500 mb-6">
          Kupuj miody z poziomu Twojego pulpitu
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Dla największych smakoszy miodu przygotowaliśmy wyjątkową, bezpieczną aplikację, która pozwala zapisać historię i ułatwia szybkie powtórne zamówienia.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-center" id="download-links">
        
        {/* macOS */}
        <div className="bg-[#111] border border-white/10 rounded-3xl p-10 hover:border-amber-500/50 transition-colors group">
          <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Apple className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Dla macOS</h2>
          <p className="text-gray-400 text-sm mb-2">Wspierane procesory: Apple Silicon (M1/M2/M3/M4)</p>
          <p className="text-gray-500 text-xs mb-8">Format: DMG • ~100 MB</p>
          <a
            href="https://github.com/ploiu123/zpi-wsiz/releases/download/v1.0.0/ZloteMiody-macOS.dmg"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-full font-bold hover:shadow-lg hover:shadow-amber-500/30 transition-all hover:-translate-y-0.5"
            id="macos"
          >
            <Download className="w-5 h-5" /> Pobierz (.dmg)
          </a>
        </div>

        {/* Windows — brak buildu */}
        <div className="bg-[#111] border border-white/10 rounded-3xl p-10 opacity-60">
          <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Monitor className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Dla Windows</h2>
          <p className="text-gray-400 text-sm mb-2">Windows 10 / 11 (64-bit)</p>
          <p className="text-gray-500 text-xs mb-8">Wersja będzie dostępna wkrótce</p>
          <span
            className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 text-gray-400 rounded-full font-bold cursor-not-allowed"
          >
            <AlertTriangle className="w-5 h-5" /> Wkrótce
          </span>
        </div>

      </div>
    </div>
  )
}
