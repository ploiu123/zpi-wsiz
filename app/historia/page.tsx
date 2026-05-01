import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Historia sklepu — Złote Miody',
  description:
    'Od rodzinnej pasieki po sklep internetowy: trzy pokolenia pszczelarzy, lasy, rzemiosło i nowoczesna obsługa zamówień.',
}

const milestones = [
  {
    year: '1960–1980',
    emoji: '🏡',
    title: 'Początek — ule dziadka na skraju lasu',
    text: 'Wszystko zaczęło się od pięciu drewnianych uli w małej wsi pod Bieszczadami. Dziadek Stanisław uczył nas cierpliwości i szacunku do pszczół. Ręczne wirowanie, gliniane garnki i smak, który zapamiętaliśmy na całe życie.',
  },
  {
    year: '1990–2010',
    emoji: '🐝',
    title: 'Pasieka rośnie z drugim pokoleniem',
    text: 'Tata rozbudował pasiekę do 60 rodzin pszczelich, wprowadził nowoczesne ramki i higienę zbioru, ale zostawił najważniejsze — krótki łańcuch dostaw, lokalne pożytki kwiatowe i zasadę „nie dokładamy do miodu niczego, co nie jest potrzebne". Pierwsze nagrody na targach regionalnych.',
  },
  {
    year: '2020–dziś',
    emoji: '🌐',
    title: 'Złote Miody wchodzą do sieci',
    text: 'Trzecia generacja połączyła tradycję z technologią. Sklep internetowy, aplikacja desktopowa, ekologiczne pakowanie i wysyłka w 24 godziny. Ale filozofia ta sama — od ula do słoika, bez pośredników, z pełną kontrolą jakości.',
  },
]

const values = [
  {
    emoji: '🌻',
    title: 'Krótka droga od ula do słoika',
    text: 'Wiemy, która ramka trafiła do którego słoika — bo sami prowadzimy rejestr zbiorów i przechowywania. Zero pośredników.',
  },
  {
    emoji: '🌲',
    title: 'Lasy i łąki, nie monokultura',
    text: 'Nasze pszczoły zbierają nektar tam, gdzie jest różnorodność roślin — bieszczadzkie lasy, łąki górskie. To daje głębię aromatu.',
  },
  {
    emoji: '🔬',
    title: 'Rzetelna kontrola jakości',
    text: 'Każda partia jest badana. Jeśli miód jest jasny albo gęsty — to dlatego, że taki był sezon, a nie efekt obróbki chemicznej.',
  },
  {
    emoji: '👨‍👩‍👧‍👦',
    title: 'Ludzie, nie korporacja',
    text: 'Za zamówieniami stoi nasza rodzina i mały zespół. Gdy coś się opóźni, dostaniesz szczery komunikat — tak jak u siebie w domu.',
  },
]

export default function HistoriaPage() {
  return (
    <div className="pt-28 pb-20 px-4 md:px-8 max-w-4xl mx-auto">
      {/* Header */}
      <p className="text-amber-500/90 text-sm font-semibold tracking-wide uppercase mb-3">📖 Historia sklepu</p>
      <h1 className="font-serif text-4xl md:text-5xl font-bold text-white mb-6">
        Rodzinna pasieka z sercem i tradycją — od 1960 roku
      </h1>
      <p className="text-gray-400 text-lg leading-relaxed mb-14">
        „Złote Miody" to nie marka wymyślona w agencji reklamowej. To nasza codzienność — wczesne 
        wstawanie, zapach wosku i propolisu, bzyczenie uli po deszczu i satysfakcja, gdy ktoś pierwszy 
        raz otwiera nasz słoik i mówi:{' '}
        <span className="text-gray-200 italic">„Tak pamiętam miód od mojej babci."</span>
      </p>

      {/* Timeline */}
      <div className="space-y-10 mb-16">
        {milestones.map((m) => (
          <article key={m.year} className="border-l-2 border-amber-500/40 pl-6 md:pl-8 hover:border-amber-500/70 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{m.emoji}</span>
              <span className="text-xs font-bold uppercase tracking-widest text-amber-500">{m.year}</span>
            </div>
            <h2 className="font-serif text-2xl font-bold text-white mb-3">{m.title}</h2>
            <p className="text-gray-400 leading-relaxed">{m.text}</p>
          </article>
        ))}
      </div>

      {/* Why us */}
      <section className="bg-[#111] border border-white/10 rounded-3xl p-8 md:p-10 mb-12">
        <h2 className="font-serif text-2xl font-bold text-amber-500 mb-6">🏆 Dlaczego nasz miód?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {values.map((v) => (
            <div key={v.title} className="flex gap-4">
              <span className="text-2xl shrink-0 mt-0.5">{v.emoji}</span>
              <div>
                <h3 className="text-white font-semibold mb-1">{v.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{v.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-3xl border border-amber-500/25 bg-amber-500/5 p-8 text-center">
        <h2 className="font-serif text-2xl font-bold text-white mb-3">🍯 Spróbuj naszego miodu</h2>
        <p className="text-gray-400 mb-6 max-w-xl mx-auto">
          Każdy słoik ma swoją historię — od pasieki po Twoją kuchnię. Zacznij od bestsellerów albo odkryj sezonowe smaki.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/products"
            className="inline-flex items-center justify-center px-8 py-3 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold hover:shadow-lg hover:shadow-amber-500/25 transition-all"
          >
            Przejdź do produktów
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-8 py-3 rounded-full bg-white/10 text-white font-semibold hover:bg-white/15 transition-colors"
          >
            Strona główna
          </Link>
        </div>
      </section>
    </div>
  )
}
