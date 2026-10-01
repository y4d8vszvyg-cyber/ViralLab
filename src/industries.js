// Industry profiles for the offline engine. Each profile carries hand-written,
// grammatically correct building blocks so generated hooks read naturally.

export const INDUSTRIES = {
  fashion: {
    label: 'Mode & Fashion',
    match: /\b(mode|fashion|kleidung|klamotten|outfit|streetwear|boutique|label|jacke|shirt|hoodie|sneaker|schmuck|accessoire)/i,
    audience: 'Modebewusste 18–34-Jährige, die sich besser kleiden wollen, ohne ein Vermögen auszugeben',
    product: 'diese Jacke', products: ['diese Jacke', 'dieser Hoodie', 'dieses Kleid', 'diese Hose'],
    result: 'deine Outfits', pain: 'deine Outfits billig aussehen lassen',
    mistakeList: ['Falsche Passform an den Schultern', 'Zu viele Logos auf einmal', 'Ungepflegte Schuhe ruinieren jeden Look'],
    tipList: ['Die 3-Farben-Regel', 'Ein Statement-Piece pro Outfit', 'Ärmel hochkrempeln für bessere Proportionen'],
    myth: 'Teure Kleidung sieht automatisch hochwertig aus',
    behind: 'wie ein Teil von der Skizze bis ins Paket entsteht',
    transformation: 'Basic-Look → Styling-Upgrade mit nur einem Teil',
    hashtags: ['#mode', '#fashion', '#outfitinspo', '#ootd', '#streetstyle', '#styletips', '#fashiontiktok', '#outfitideen', '#modeblogger', '#capsulewardrobe'],
  },
  fitness: {
    label: 'Fitness & Sport',
    match: /\b(fitness|gym|personal ?trainer|sport|workout|abnehmen|muskel|yoga|pilates|crossfit|ernährungsberat)/i,
    audience: 'Berufstätige 20–40-Jährige, die fitter werden wollen, aber wenig Zeit haben',
    product: 'dieses Programm', products: ['dieses Programm', 'dieses 20-Minuten-Workout', 'dieser Trainingsplan'],
    result: 'deine Fortschritte', pain: 'deine Fortschritte im Gym sabotieren',
    mistakeList: ['Ohne Plan trainieren', 'Zu wenig Protein', 'Jeden Tag bis zur Erschöpfung'],
    tipList: ['Progressive Overload', '8.000 Schritte als Basis', 'Schlaf ist dein bestes Supplement'],
    myth: 'Man muss jeden Tag trainieren, um Ergebnisse zu sehen',
    behind: 'wie ein Trainingstag mit einem Kunden wirklich abläuft',
    transformation: '12 Wochen Kunden-Transformation',
    hashtags: ['#fitness', '#gym', '#workout', '#fitnessmotivation', '#abnehmen', '#gymtok', '#training', '#personaltrainer', '#homeworkout', '#gesundleben'],
  },
  food: {
    label: 'Gastronomie & Food',
    match: /\b(restaurant|café|cafe|bäckerei|bar|food|essen|küche|koch|pizza|burger|imbiss|catering|konditorei|eis)/i,
    audience: 'Foodies und Locals aus der Umgebung, die neue Lieblingsorte suchen',
    product: 'dieses Gericht', products: ['dieses Gericht', 'unser Signature-Burger', 'dieser Kuchen'],
    result: 'dein Essen', pain: 'dein Essen zu Hause langweilig schmecken lassen',
    mistakeList: ['Zu früh salzen', 'Pfanne nicht heiß genug', 'Kräuter zu früh zugeben'],
    tipList: ['Säure macht jedes Gericht frischer', 'Ruhen lassen nach dem Braten', 'Brot immer anrösten'],
    myth: 'Gutes Essen muss teuer sein',
    behind: 'was um 6 Uhr morgens in unserer Küche passiert',
    transformation: 'Rohe Zutaten → fertiger Teller in 30 Sekunden',
    hashtags: ['#foodtok', '#foodie', '#essen', '#restaurant', '#lecker', '#foodporn', '#streetfood', '#rezept', '#kochen', '#geheimtipp'],
  },
  beauty: {
    label: 'Beauty & Kosmetik',
    match: /\b(beauty|kosmetik|make-?up|skincare|hautpflege|friseur|salon|nägel|nail|wimpern|lash|barber)/i,
    audience: 'Beauty-interessierte Frauen und Männer 18–40, die echte Ergebnisse statt Werbeversprechen wollen',
    product: 'dieses Serum', products: ['dieses Serum', 'diese Behandlung', 'dieser Look'],
    result: 'deine Haut', pain: 'deine Haut älter aussehen lassen',
    mistakeList: ['Kein Sonnenschutz im Winter', 'Zu viele Wirkstoffe gleichzeitig', 'Abends nicht doppelt reinigen'],
    tipList: ['Pflege in der richtigen Reihenfolge', 'Weniger ist mehr', 'Kissenbezug aus Seide'],
    myth: 'Teure Cremes wirken besser',
    behind: 'eine komplette Behandlung im Zeitraffer',
    transformation: 'Vorher/Nachher nach einer Behandlung',
    hashtags: ['#beauty', '#skincare', '#hautpflege', '#makeup', '#beautytok', '#skincareroutine', '#glowup', '#beautytipps', '#selfcare', '#kosmetik'],
  },
  coaching: {
    label: 'Coaching & Beratung',
    match: /\b(coach|coaching|berater|beratung|consult|mentor|kurs|onlinekurs|trainer|agentur|marketing)/i,
    audience: 'Selbstständige und Angestellte, die beruflich den nächsten Schritt machen wollen',
    product: 'diese Methode', products: ['diese Methode', 'dieses Framework', 'mein Programm'],
    result: 'dein Business', pain: 'dein Business klein halten',
    mistakeList: ['Alles selbst machen wollen', 'Keine klare Zielgruppe', 'Preise zu niedrig ansetzen'],
    tipList: ['Die 80/20-Regel für deine Woche', 'Ein Angebot, eine Zielgruppe', 'Jeden Tag eine Sache, die Umsatz bringt'],
    myth: 'Mehr Arbeit bringt automatisch mehr Erfolg',
    behind: 'wie ein Coaching-Call wirklich abläuft',
    transformation: 'Wie ein Kunde in 90 Tagen seinen Umsatz verdoppelt hat',
    hashtags: ['#coaching', '#business', '#selbstständig', '#mindset', '#erfolg', '#unternehmer', '#karriere', '#businesstipps', '#motivation', '#produktivität'],
  },
  tech: {
    label: 'Tech, SaaS & Apps',
    match: /\b(app|software|saas|tool|startup|plattform|tech|ki|ai|website|shopify)/i,
    audience: 'Digital-affine Profis, die Zeit sparen und produktiver arbeiten wollen',
    product: 'dieses Tool', products: ['dieses Tool', 'diese Funktion', 'unsere App'],
    result: 'deinen Arbeitstag', pain: 'dir jeden Tag eine Stunde klauen',
    mistakeList: ['Alles manuell erledigen', 'Zu viele Tools parallel', 'Keine Automatisierung für Routinen'],
    tipList: ['Ein Shortcut, der 10 Minuten spart', 'Vorlagen statt Neuanfang', 'Automatisiere alles, was du 3× gemacht hast'],
    myth: 'Produktivität heißt, mehr Stunden zu arbeiten',
    behind: 'wie wir ein neues Feature in einer Woche bauen',
    transformation: '2 Stunden Arbeit → 5 Minuten mit dem richtigen Tool',
    hashtags: ['#tech', '#productivity', '#techtok', '#apps', '#software', '#startup', '#ki', '#produktivität', '#lifehack', '#tools'],
  },
  realestate: {
    label: 'Immobilien & Interior',
    match: /\b(immobilie|makler|wohnung|haus|interior|einrichtung|möbel|deko|architekt)/i,
    audience: 'Käufer, Mieter und Einrichtungs-Fans, die ihr Zuhause aufwerten wollen',
    product: 'diese Wohnung', products: ['diese Wohnung', 'dieses Möbelstück', 'dieser Raum'],
    result: 'deine Wohnung', pain: 'deine Wohnung kleiner wirken lassen',
    mistakeList: ['Zu kleine Teppiche', 'Nur eine Lichtquelle', 'Möbel direkt an die Wand stellen'],
    tipList: ['Vorhänge höher hängen', 'Spiegel gegenüber vom Fenster', 'Drei Lichtquellen pro Raum'],
    myth: 'Schöne Einrichtung ist teuer',
    behind: 'eine Besichtigung aus Sicht des Maklers',
    transformation: 'Leerer Raum → Home-Staging in 60 Sekunden',
    hashtags: ['#immobilien', '#interior', '#einrichtung', '#roomtour', '#homedecor', '#wohnen', '#interiordesign', '#makler', '#hometok', '#wohnideen'],
  },
  generic: {
    label: 'Business',
    match: /.*/,
    audience: 'Menschen, die genau das Problem haben, das dein Angebot löst',
    product: 'dieses Produkt', products: ['dieses Produkt', 'unser Bestseller', 'unser Angebot'],
    result: 'dein Ergebnis', pain: 'dich unnötig Zeit und Geld kosten',
    mistakeList: ['Auf den falschen Anbieter setzen', 'Nur auf den Preis achten', 'Zu lange warten'],
    tipList: ['Achte auf dieses eine Qualitätsmerkmal', 'Frag nach dieser Garantie', 'So erkennst du Profis'],
    myth: 'Qualität kann man sich nicht leisten',
    behind: 'wie unser Arbeitstag wirklich aussieht',
    transformation: 'Problem → Lösung in 30 Sekunden',
    hashtags: ['#business', '#smallbusiness', '#kleinunternehmen', '#tipps', '#fyp', '#viral', '#behindthescenes', '#lernenmittiktok', '#unternehmen', '#qualität'],
  },
};

export function detectIndustry(text) {
  for (const [key, profile] of Object.entries(INDUSTRIES)) {
    if (key !== 'generic' && profile.match.test(text)) return key;
  }
  return 'generic';
}

export function detectGoal(text) {
  const t = text.toLowerCase();
  if (/(verk[aä]uf|umsatz|sales|kunden gewinnen|bestellung|shop|conversion|kaufen)/.test(t)) return 'sales';
  if (/(lead|termin|buchung|anfrage|bewerb)/.test(t)) return 'leads';
  if (/(follower|reichweite|bekannt|wachsen|viral|community)/.test(t)) return 'reach';
  if (/(vertrauen|marke|brand|image|positionier)/.test(t)) return 'brand';
  return 'sales';
}

export const GOALS = {
  sales: { label: 'Mehr Verkäufe', cta: 'Link in Bio – jetzt shoppen', mix: ['Reichweite', 'Verkauf', 'Vertrauen', 'Reichweite', 'Verkauf', 'Community', 'Verkauf'] },
  leads: { label: 'Mehr Anfragen', cta: 'Schreib mir „START“ per DM', mix: ['Reichweite', 'Vertrauen', 'Verkauf', 'Reichweite', 'Vertrauen', 'Community', 'Verkauf'] },
  reach: { label: 'Mehr Reichweite', cta: 'Folge für Teil 2', mix: ['Reichweite', 'Reichweite', 'Community', 'Reichweite', 'Vertrauen', 'Reichweite', 'Community'] },
  brand: { label: 'Stärkere Marke', cta: 'Speichern & mit jemandem teilen, der das braucht', mix: ['Vertrauen', 'Reichweite', 'Community', 'Vertrauen', 'Reichweite', 'Vertrauen', 'Verkauf'] },
};
