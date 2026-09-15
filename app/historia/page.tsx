import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Historia sklepu â€” ZĹ‚ote Miody',
  description:
    'Od rodzinnej pasieki po sklep internetowy: trzy pokolenia pszczelarzy, lasy, rzemiosĹ‚o i nowoczesna obsĹ‚uga zamĂłwieĹ„.',
}

const milestones = [
  {
    year: '1960â€“1980',
    emoji: '',
    title: 'PoczÄ…tek â€” ule dziadka na skraju lasu',
    text: 'Wszystko zaczÄ™Ĺ‚o siÄ™ od piÄ™ciu drewnianych uli w maĹ‚ej wsi pod Bieszczadami. Dziadek StanisĹ‚aw uczyĹ‚ nas cierpliwoĹ›ci i szacunku do pszczĂłĹ‚. RÄ™czne wirowanie, gliniane garnki i smak, ktĂłry zapamiÄ™taliĹ›my na caĹ‚e ĹĽycie.',
  },
  {
    year: '1990â€“2010',
    emoji: '',
    title: 'Pasieka roĹ›nie z drugim pokoleniem',
    text: 'Tata rozbudowaĹ‚ pasiekÄ™ do 60 rodzin pszczelich, wprowadziĹ‚ nowoczesne ramki i higienÄ™ zbioru, ale zostawiĹ‚ najwaĹĽniejsze â€” krĂłtki Ĺ‚aĹ„cuch dostaw, lokalne poĹĽytki kwiatowe i zasadÄ™ â€žnie dokĹ‚adamy do miodu niczego, co nie jest potrzebne". Pierwsze nagrody na targach regionalnych.',
  },
  {
    year: '2020â€“dziĹ›',
    emoji: '',
    title: 'ZĹ‚ote Miody wchodzÄ… do sieci',
    text: 'Trzecia generacja poĹ‚Ä…czyĹ‚a tradycjÄ™ z technologiÄ…. Sklep internetowy, aplikacja desktopowa, ekologiczne pakowanie i wysyĹ‚ka w 24 godziny. Ale filozofia ta sama â€” od ula do sĹ‚oika, bez poĹ›rednikĂłw, z peĹ‚nÄ… kontrolÄ… jakoĹ›ci.',
  },
]

const values = [
  {
    emoji: '',
    title: 'KrĂłtka droga od ula do sĹ‚oika',
    text: 'Wiemy, ktĂłra ramka trafiĹ‚a do ktĂłrego sĹ‚oika â€” bo sami prowadzimy rejestr zbiorĂłw i przechowywania. Zero poĹ›rednikĂłw.',
  },
  {
    emoji: '',
    title: 'Lasy i Ĺ‚Ä…ki, nie monokultura',
    text: 'Nasze pszczoĹ‚y zbierajÄ… nektar tam, gdzie jest rĂłĹĽnorodnoĹ›Ä‡ roĹ›lin â€” bieszczadzkie lasy, Ĺ‚Ä…ki gĂłrskie. To daje gĹ‚Ä™biÄ™ aromatu.',
  },
  {
    emoji: '',
    title: 'Rzetelna kontrola jakoĹ›ci',
    text: 'KaĹĽda partia jest badana. JeĹ›li miĂłd jest jasny albo gÄ™sty â€” to dlatego, ĹĽe taki byĹ‚ sezon, a nie efekt obrĂłbki chemicznej.',
  },
  {
    emoji: '',
    title: 'Ludzie, nie korporacja',
    text: 'Za zamĂłwieniami stoi nasza rodzina i maĹ‚y zespĂłĹ‚. Gdy coĹ› siÄ™ opĂłĹşni, dostaniesz szczery komunikat â€” tak jak u siebie w domu.',
  },
]

export default function HistoriaPage() {
  return (
    <div className="pt-28 pb-20 px-4 md:px-8 max-w-4xl mx-auto">
      <p className="text-amber-500/90 text-sm font-semibold tracking-wide uppercase mb-3"> Historia sklepu</p>
      <h1 className="font-serif text-4xl md:text-5xl font-bold text-white mb-6">
        Rodzinna pasieka z sercem i tradycjÄ… â€” od 1960 roku
      </h1>
      <p className="text-gray-400 text-lg leading-relaxed mb-14">
        â€žZĹ‚ote Miody" to nie marka wymyĹ›lona w agencji reklamowej. To nasza codziennoĹ›Ä‡ â€” wczesne 
        wstawanie, zapach wosku i propolisu, bzyczenie uli po deszczu i satysfakcja, gdy ktoĹ› pierwszy 
        raz otwiera nasz sĹ‚oik i mĂłwi:{' '}
        <span className="text-gray-200 italic">â€žTak pamiÄ™tam miĂłd od mojej babci."</span>
      </p>

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

      <section className="bg-[#111] border border-white/10 rounded-3xl p-8 md:p-10 mb-12">
        <h2 className="font-serif text-2xl font-bold text-amber-500 mb-6"> Dlaczego nasz miĂłd?</h2>
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

      <section className="rounded-3xl border border-amber-500/25 bg-amber-500/5 p-8 text-center">
        <h2 className="font-serif text-2xl font-bold text-white mb-3"> SprĂłbuj naszego miodu</h2>
        <p className="text-gray-400 mb-6 max-w-xl mx-auto">
          KaĹĽdy sĹ‚oik ma swojÄ… historiÄ™ â€” od pasieki po TwojÄ… kuchniÄ™. Zacznij od bestsellerĂłw albo odkryj sezonowe smaki.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/products"
            className="inline-flex items-center justify-center px-8 py-3 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold hover:shadow-lg hover:shadow-amber-500/25 transition-all"
          >
            PrzejdĹş do produktĂłw
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-8 py-3 rounded-full bg-white/10 text-white font-semibold hover:bg-white/15 transition-colors"
          >
            Strona gĹ‚Ăłwna
          </Link>
        </div>
      </section>
    </div>
  )
}
