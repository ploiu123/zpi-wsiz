'use client'

import { useEffect, useState } from 'react'
import { Monitor, Download, Apple, Shield, Zap, HardDrive, RefreshCw, ArrowRight, Check, Laptop } from 'lucide-react'
import Link from 'next/link'

export default function DownloadPage() {
  const [detectedOS, setDetectedOS] = useState<'mac' | 'win' | 'other'>('other')
  const [isElectron, setIsElectron] = useState(false)
  
  useEffect(() => {
    document.title = 'Pobierz aplikację desktopową | Złote Miody'
    const ua = navigator.userAgent.toLowerCase()
    if (ua.includes('mac')) setDetectedOS('mac')
    else if (ua.includes('win')) setDetectedOS('win')
    if (ua.includes('electron')) setIsElectron(true)
  }, [])

  if (isElectron) {
    return (
      <div className="pt-32 pb-24 px-4 md:px-8 max-w-md mx-auto min-h-[85vh] flex items-center justify-center">
        <div className="bg-[#111] border border-white/10 rounded-3xl p-8 w-full text-center shadow-2xl">
          <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-amber-500" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-white mb-3">
            Aplikacja uruchomiona
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed mb-8">
            Korzystasz już z oficjalnej aplikacji desktopowej Złote Miody. Masz zainstalowaną najnowszą wersję.
          </p>
          <Link href="/" className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-full font-bold hover:shadow-lg hover:shadow-amber-500/30 transition-all hover:-translate-y-0.5 w-full justify-center">
            Przejdź do sklepu
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-32 pb-24 px-4 md:px-8 max-w-5xl mx-auto min-h-[80vh]">
      <div className="text-center mb-16">
        <div className="w-20 h-20 bg-amber-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
           <Laptop className="w-10 h-10 text-amber-500" />
        </div>
        <h1 className="font-serif text-4xl md:text-6xl font-bold text-amber-500 mb-6">
          Miody na wyciągnięcie ręki
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Aplikacja desktopowa dla miłośników naszego miodu — szybkie powtórne zamówienia, 
          historia zakupów i pełny sklep bez otwierania przeglądarki.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-center" id="download-links">
        
        {/* macOS */}
        <div className={`bg-[#111] border ${detectedOS === 'mac' ? 'border-amber-500' : 'border-white/10'} rounded-3xl p-10 hover:border-amber-500/50 transition-colors group relative`}>
          {detectedOS === 'mac' && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-black text-xs font-bold px-4 py-1 rounded-full">
              Zalecane dla Ciebie
            </div>
          )}
          <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Apple className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Dla macOS</h2>
          <p className="text-gray-400 text-sm mb-2">Apple Silicon (M1 / M2 / M3 / M4)</p>
          <p className="text-gray-500 text-xs mb-8">Format: DMG • ~100 MB • v1.0.0</p>
          <a
            href="/ZloteMiody-macOS.dmg"
            download="ZloteMiody-macOS.dmg"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-full font-bold hover:shadow-lg hover:shadow-amber-500/30 transition-all hover:-translate-y-0.5 w-full justify-center"
            id="macos"
          >
            <Download className="w-5 h-5" /> Pobierz (.dmg)
          </a>
        </div>

        {/* Windows */}
        <div className={`bg-[#111] border ${detectedOS === 'win' ? 'border-amber-500' : 'border-white/10'} rounded-3xl p-10 hover:border-amber-500/50 transition-colors group relative`}>
          {detectedOS === 'win' && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-black text-xs font-bold px-4 py-1 rounded-full">
              Zalecane dla Ciebie
            </div>
          )}
          <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Monitor className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Dla Windows</h2>
          <p className="text-gray-400 text-sm mb-2">Windows 10 / 11 (64-bit)</p>
          <p className="text-gray-500 text-xs mb-8">Format: EXE • ~82 MB • v1.0.0</p>
          <a
            href="/ZloteMiody-Windows.exe"
            download="ZloteMiody-Windows.exe"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-full font-bold hover:shadow-lg hover:shadow-amber-500/30 transition-all hover:-translate-y-0.5 w-full justify-center"
            id="windows"
          >
            <Download className="w-5 h-5" /> Pobierz (.exe)
          </a>
        </div>

      </div>

      {/* macOS / Windows Gatekeeper Instructions */}
      <div className="mt-12 bg-amber-500/5 border border-amber-500/10 rounded-2xl p-6 md:p-8 text-left max-w-3xl mx-auto shadow-xl">
        <h3 className="text-amber-500 font-bold text-lg mb-3 flex items-center gap-2">
          💡 Ważna informacja przed instalacją
        </h3>
        <p className="text-gray-400 text-sm mb-6 leading-relaxed">
          Ponieważ aplikacja nie przechodzi procesu płatnej notyfikacji w sklepach Apple/Microsoft (jest to niekomercyjny projekt akademicki), system operacyjny może wyświetlić ostrzeżenie przed jej uruchomieniem.
        </p>
        <div className="space-y-4">
          <div className="text-sm">
            <span className="font-semibold text-white block mb-1">🍎 Dla macOS (komunikat o „uszkodzonej” aplikacji):</span>
            <p className="text-gray-500 leading-relaxed">
              Jeśli system macOS wyświetli komunikat o uszkodzeniu pliku i braku możliwości jego otwarcia, oznacza to, że aplikacja nie jest podpisana cyfrowo. Otwórz systemowy <strong>Terminal</strong> i uruchom następującą komendę, aby zdjąć blokadę:
              <code className="block bg-black/40 text-amber-400 p-3 rounded-lg mt-2 font-mono text-xs select-all border border-white/5">
                xattr -cr /Applications/Złote\ Miody.app
              </code>
            </p>
          </div>
          <div className="text-sm border-t border-white/5 pt-4">
            <span className="font-semibold text-white block mb-1">💻 Dla Windows (SmartScreen):</span>
            <p className="text-gray-500 leading-relaxed">
              Gdy system Windows wyświetli niebieski filtr SmartScreen z informacją o ochronieniu komputera przed nieznaną aplikacją, kliknij odnośnik <strong>„Więcej informacji”</strong>, a następnie wybierz przycisk <strong>„Uruchom mimo to”</strong>.
            </p>
          </div>
        </div>
      </div>
      
      {/* Features */}
      <div className="mt-24 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#111] border border-white/5 rounded-2xl p-6 text-center">
          <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Zap className="w-6 h-6 text-amber-500" />
          </div>
          <h3 className="text-white font-bold mb-2">Szybkie zamawianie</h3>
          <p className="text-gray-500 text-sm">Miody na wyciągnięcie ręki bez otwierania przeglądarki</p>
        </div>
        <div className="bg-[#111] border border-white/5 rounded-2xl p-6 text-center">
          <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-6 h-6 text-amber-500" />
          </div>
          <h3 className="text-white font-bold mb-2">Bezpieczeństwo</h3>
          <p className="text-gray-500 text-sm">W pełni szyfrowane połączenie i autoryzacja OAuth</p>
        </div>
        <div className="bg-[#111] border border-white/5 rounded-2xl p-6 text-center">
          <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
            <HardDrive className="w-6 h-6 text-amber-500" />
          </div>
          <h3 className="text-white font-bold mb-2">Lekka aplikacja</h3>
          <p className="text-gray-500 text-sm">Zoptymalizowana, zajmuje tylko ~100MB na dysku</p>
        </div>
        <div className="bg-[#111] border border-white/5 rounded-2xl p-6 text-center">
          <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
            <RefreshCw className="w-6 h-6 text-amber-500" />
          </div>
          <h3 className="text-white font-bold mb-2">Auto aktualizacje</h3>
          <p className="text-gray-500 text-sm">Zawsze najnowsza wersja bez ponownego pobierania</p>
        </div>
      </div>
    </div>
  )
}
