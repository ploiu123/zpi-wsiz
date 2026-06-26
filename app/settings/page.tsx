'use client'

import { useState, useEffect } from 'react'
import { Settings, Moon, Sun, Monitor, Globe, Info, Mail } from 'lucide-react'

export default function SettingsPage() {
  const [theme, setTheme] = useState('system')

  useEffect(() => {
    const saved = localStorage.getItem('theme') || 'system'
    setTheme(saved)
  }, [])

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    const root = document.documentElement
    if (newTheme === 'dark') {
      root.classList.add('dark')
      root.classList.remove('light')
    } else if (newTheme === 'light') {
      root.classList.add('light')
      root.classList.remove('dark')
    } else {
      root.classList.remove('light', 'dark')
    }
  }

  return (
    <div className="pt-32 pb-24 px-4 md:px-8 max-w-4xl mx-auto min-h-[80vh] page-enter">
      <h1 className="font-serif text-4xl font-bold text-amber-500 mb-8 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
          <Settings className="w-6 h-6 text-amber-500" />
        </div>
        Ustawienia
      </h1>

      <div className="space-y-8">
        <section className="bg-[#111] border border-white/10 rounded-3xl p-8">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Monitor className="w-5 h-5 text-amber-500" />
            Wygląd
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button onClick={() => handleThemeChange('light')} className={`p-4 rounded-2xl border ${theme === 'light' ? 'border-amber-500 bg-amber-500/10 text-amber-500' : 'border-white/10 text-gray-400 hover:border-white/20'} flex flex-col items-center gap-3 transition-colors`}>
              <Sun className="w-6 h-6" />
              <span className="font-bold">Jasny</span>
            </button>
            <button onClick={() => handleThemeChange('dark')} className={`p-4 rounded-2xl border ${theme === 'dark' ? 'border-amber-500 bg-amber-500/10 text-amber-500' : 'border-white/10 text-gray-400 hover:border-white/20'} flex flex-col items-center gap-3 transition-colors`}>
              <Moon className="w-6 h-6" />
              <span className="font-bold">Ciemny</span>
            </button>
            <button onClick={() => handleThemeChange('system')} className={`p-4 rounded-2xl border ${theme === 'system' ? 'border-amber-500 bg-amber-500/10 text-amber-500' : 'border-white/10 text-gray-400 hover:border-white/20'} flex flex-col items-center gap-3 transition-colors`}>
              <Monitor className="w-6 h-6" />
              <span className="font-bold">Systemowy</span>
            </button>
          </div>
        </section>

        <section className="bg-[#111] border border-white/10 rounded-3xl p-8">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Globe className="w-5 h-5 text-amber-500" />
            Język i Region
          </h2>
          <div className="p-4 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-between">
            <div>
              <p className="text-white font-bold">Język interfejsu</p>
              <p className="text-gray-400 text-sm">Polski (PL)</p>
            </div>
            <div className="text-gray-500 text-sm">Domyślny</div>
          </div>
        </section>

        <section className="bg-[#111] border border-white/10 rounded-3xl p-8">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Info className="w-5 h-5 text-amber-500" />
            O Aplikacji
          </h2>
          <div className="space-y-4 text-gray-400">
            <p className="flex justify-between items-center py-2 border-b border-white/5">
              <span>Wersja</span>
              <span className="text-white font-bold">1.0.0</span>
            </p>
            <p className="flex justify-between items-center py-2 border-b border-white/5">
              <span>Kontakt</span>
              <a href="mailto:kontakt@zlote-miody.pl" className="text-amber-500 hover:underline flex items-center gap-2">
                <Mail className="w-4 h-4" /> kontakt@zlote-miody.pl
              </a>
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}