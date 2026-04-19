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
    title: 'Początek w ulu dziadka',
    text: 'Wszystko zaczęło się od kilku rodzinnych uli i ręcznego wirowania miodu w małej chacie na skraju lasu. Dziadek uczył cierpliwości: pszczoła nie znosi pośpiechu, a miód nagradza tych, którzy szanują rytm natury.',
  },
  {
    year: '1990–2010',
    title: 'Pasieka rośnie z pokoleniem',
    text: 'Druga generacja rozbudowała pasiekę, dołożyła nowoczesne ramki i higienę zbioru, ale zostawiła najważniejsze: krótkie łańcuchy dostaw, lokalne pożytki i zasadę „nie dokładamy do miodu nic, co nie jest potrzebne”.',
  },
  {
    year: 'dziś',
    title: 'Złote Miody w sieci',
    text: 'Sklep internetowy łączy tradycję z wygodą: wybierasz smak, my pakujemy z dbałością o szkło i papier, a Ty masz pewność, że dostajesz to, co sami zbieramy i wirowaliśmy w swojej pracowni.',
  },
]

export default function HistoriaPage() {
  return (
    <div className="pt-28 pb-20 px-4 md:px-8 max-w-4xl mx-auto">
      <p className="text-amber-500/90 text-sm font-semibold tracking-wide uppercase mb-3">Historia sklepu</p>
      <h1 className="font-serif text-4xl md:text-5xl font-bold text-white mb-6">
        Rodzinna pasieka, której smak pamiętają sąsiedzi — i klienci z całej Polski
      </h1>
      <p className="text-gray-400 text-lg leading-relaxed mb-12">
        „Złote Miody” to nie marka wymyślona w agencji. To skrót naszej codzienności: wczesne wstawania, zapach wosku i propolisu, dźwięk ulu po deszczu i satysfakcja, gdy ktoś pierwszy raz otwiera słoik i mówi:{' '}
        <span className="text-gray-200">„Tak pamiętałem miód u babci.”</span>
      </p>

      <div className="space-y-10 mb-16">
        {milestones.map((m) => (
          <article key={m.year} className="border-l-2 border-amber-500/40 pl-6 md:pl-8">
            <div className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-2">{m.year}</div>
            <h2 className="font-serif text-2xl font-bold text-white mb-3">{m.title}</h2>
            <p className="text-gray-400 leading-relaxed">{m.text}</p>
          </article>
        ))}
      </div>

      <section className="bg-[#111] border border-white/10 rounded-3xl p-8 md:p-10 mb-12">
        <h2 className="font-serif text-2xl font-bold text-amber-500 mb-4">Dlaczego właśnie nasz miód?</h2>
        <ul className="space-y-4 text-gray-400 leading-relaxed">
          <li>
            <span className="text-white font-semibold">Krótka droga od ula do słoika.</span> Wiemy, która ramka trafiła do którego partii — bo sami prowadzimy rejestr zbiorów i przechowywania.
          </li>
          <li>
            <span className="text-white font-semibold">Lasy, łąki, nie „wielka pustka”.</span> Pszczoły zbierają nektar tam, gdzie jest różnorodność roślin, a to przekłada się na głębię aromatu.
          </li>
          <li>
            <span className="text-white font-semibold">Rzetelna kontrola jakości.</span> Nie „ładujemy barwą”: jeśli miód jest jasny albo gęsty — to dlatego, że taki był rok i taka była pożytkowa, a nie efekt obróbki chemicznej.
          </li>
          <li>
            <span className="text-white font-semibold">Ludzie, nie algorytmy.</span> Za zamówieniami stoi nasza rodzina i mały zespół. Gdy coś się opóźni, dostaniesz od nas szczery komunikat — tak, jak robilibyśmy to u siebie w domu.
          </li>
        </ul>
      </section>

      <section className="rounded-3xl border border-amber-500/25 bg-amber-500/5 p-8 text-center">
        <h2 className="font-serif text-2xl font-bold text-white mb-3">Zobacz, co mamy na półce</h2>
        <p className="text-gray-400 mb-6 max-w-xl mx-auto">
          Każdy słoik ma swoją historię — od pasieki po Twoją kuchnię. Zacznij od bestsellerów lub odkryj mniej oczywiste smaki sezonu.
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
