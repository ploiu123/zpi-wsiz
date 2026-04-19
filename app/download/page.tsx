import { Monitor, Download } from 'lucide-react'

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
        
        {/* Windows */}
        <div className="bg-[#111] border border-white/10 rounded-3xl p-10 hover:border-amber-500/50 transition-colors group">
          <h2 className="text-2xl font-bold text-white mb-2">Dla Windows</h2>
          <p className="text-gray-400 text-sm mb-8">Wspierane wersje: Windows 10, Windows 11 (64-bit)</p>
          <a
            href="/releases/ZloteMiody-Windows.zip"
            download="ZloteMiody-Windows.zip"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-full font-bold hover:shadow-lg hover:shadow-amber-500/30 transition-all hover:-translate-y-0.5"
            id="windows"
          >
            <Download className="w-5 h-5" /> Pobierz (.zip)
          </a>
        </div>

        {/* macOS */}
        <div className="bg-[#111] border border-white/10 rounded-3xl p-10 hover:border-amber-500/50 transition-colors group">
          <h2 className="text-2xl font-bold text-white mb-2">Dla macOS</h2>
          <p className="text-gray-400 text-sm mb-8">Wspierane procesory: Intel oraz Apple Silicon (M1/M2/M3)</p>
          <a
            href="/releases/ZloteMiody-macOS.zip"
            download="ZloteMiody-macOS.zip"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-full font-bold hover:shadow-lg hover:shadow-amber-500/30 transition-all hover:-translate-y-0.5"
          >
            <Download className="w-5 h-5" /> Pobierz (archiwum .zip)
          </a>
        </div>

      </div>
    </div>
  )
}
