export interface LandingFeature {
  icon: string
  title: string
  description: string
}

export interface LandingPlan {
  key: 'free' | 'pro' | 'enterprise'
  name: string
  price: string
  period?: string
  yearlyNote?: string
  target: string
  targetDetail: string
  bestFor: string[]
  features: string[]
  cta: string
  to: string
  highlight: boolean
}

export interface HeroSpaceCard {
  type: string
  name: string
  metric: number
  metricLabel: string
  metricSuffix?: string
  shape: 'circle' | 'triangle' | 'semicircle' | 'square'
  sparkline: number[]
}

export interface DemoStatCard {
  key: string
  title: string
  amount?: number
  displayValue?: string
  change?: string | null
  changePositive?: boolean
  icon: string
}

export interface DemoScene {
  type: string
  title: string
  hint: string
  shape: 'circle' | 'triangle' | 'semicircle' | 'square'
  currency: string
  statCards: DemoStatCard[]
  transactions: import('~/types/financial').TransactionRow[]
  subscription?: import('~/types/financial').SubscriptionItem
  saasChart?: { labels: string[], values: number[], centerValue: string }
}

export interface ProofItem {
  value: string
  label: string
}

export const useLandingStore = defineStore('landing', () => {
  const { t, displayCurrency, formatCurrency } = useAppI18n()
  const currency = computed(() => displayCurrency.value)

  const heroLinks = computed(() => [
    { label: t('common.getStartedFree'), to: '/auth/register', size: 'xl' as const, trailingIcon: 'i-lucide-arrow-right' },
    { label: t('landing.seeHow'), to: '/#how-it-works', size: 'xl' as const, color: 'neutral' as const, variant: 'subtle' as const, icon: 'i-lucide-play' }
  ])

  const ctaLinks = computed(() => [
    { label: t('landing.ctaButton'), to: '/auth/register', size: 'xl' as const, trailingIcon: 'i-lucide-arrow-right' }
  ])

  const howItWorks = computed<LandingFeature[]>(() => [
    { icon: 'i-lucide-landmark', title: t('landing.howItWorks.steps.connect.title'), description: t('landing.howItWorks.steps.connect.description') },
    { icon: 'i-lucide-layers', title: t('landing.howItWorks.steps.organize.title'), description: t('landing.howItWorks.steps.organize.description') },
    { icon: 'i-lucide-trending-up', title: t('landing.howItWorks.steps.act.title'), description: t('landing.howItWorks.steps.act.description') }
  ])

  const audiences = computed<LandingFeature[]>(() => [
    { icon: 'i-lucide-user', title: t('landing.audiences.independent.title'), description: t('landing.audiences.independent.description') },
    { icon: 'i-lucide-heart-handshake', title: t('landing.audiences.household.title'), description: t('landing.audiences.household.description') },
    { icon: 'i-lucide-users', title: t('landing.audiences.family.title'), description: t('landing.audiences.family.description') },
    { icon: 'i-lucide-building-2', title: t('landing.audiences.company.title'), description: t('landing.audiences.company.description') }
  ])

  const features = computed<LandingFeature[]>(() => [
    { icon: 'i-lucide-layers', title: t('landing.features.spaces.title'), description: t('landing.features.spaces.description') },
    { icon: 'i-lucide-landmark', title: t('landing.features.accounts.title'), description: t('landing.features.accounts.description') },
    { icon: 'i-lucide-shield-check', title: t('landing.features.saasShield.title'), description: t('landing.features.saasShield.description') },
    { icon: 'i-lucide-flame', title: t('landing.features.burnRate.title'), description: t('landing.features.burnRate.description') },
    { icon: 'i-lucide-user-round', title: t('landing.features.teen.title'), description: t('landing.features.teen.description') },
    { icon: 'i-lucide-sparkles', title: t('landing.features.ai.title'), description: t('landing.features.ai.description') }
  ])

  const billingStore = useBillingStore()
  const { pricingCadence } = storeToRefs(billingStore)

  function stripePlanPrice(key: 'pro' | 'enterprise', fallbackPrice: string, fallbackPeriod: string) {
    const stripe = billingStore.planForKey(key)
    if (stripe) {
      return {
        price: stripe.formattedPrice,
        period: stripe.formattedPeriod ?? fallbackPeriod,
        yearlyNote: pricingCadence.value === 'yearly' && stripe.interval === 'year'
          ? t('landing.pricing.billedAnnually')
          : undefined
      }
    }

    if (pricingCadence.value === 'yearly') {
      const yearlyFallback = key === 'pro'
        ? { price: t('landing.pricing.pro.yearlyPrice'), period: t('landing.pricing.pro.yearlyPeriod') }
        : { price: t('landing.pricing.enterprise.yearlyPrice'), period: t('landing.pricing.enterprise.yearlyPeriod') }
      return { ...yearlyFallback, yearlyNote: t('landing.pricing.billedAnnually') }
    }

    return { price: fallbackPrice, period: fallbackPeriod, yearlyNote: undefined }
  }

  const pricingPlans = computed<LandingPlan[]>(() => {
    const proPricing = stripePlanPrice('pro', t('landing.pricing.pro.price'), t('landing.pricing.pro.period'))
    const enterprisePricing = stripePlanPrice(
      'enterprise',
      t('landing.pricing.enterprise.price'),
      t('landing.pricing.enterprise.period')
    )

    const cadence = pricingCadence.value === 'yearly' ? 'yearly' : 'monthly'
    const plans: LandingPlan[] = [
    {
      key: 'free',
      name: t('landing.pricing.free.name'),
      price: t('landing.pricing.free.price'),
      target: t('landing.pricing.free.target'),
      targetDetail: t('landing.pricing.free.targetDetail'),
      bestFor: [
        t('landing.pricing.free.bestFor.personal'),
        t('landing.pricing.free.bestFor.starter'),
        t('landing.pricing.free.bestFor.student')
      ],
      features: [
        t('landing.pricing.free.features.space'),
        t('landing.pricing.free.features.bank'),
        t('landing.pricing.free.features.dashboard'),
        t('landing.pricing.free.features.export')
      ],
      cta: t('landing.pricing.free.cta'),
      to: '/auth/register',
      highlight: false
    },
    {
      key: 'pro',
      name: t('landing.pricing.pro.name'),
      price: proPricing.price,
      period: proPricing.period,
      yearlyNote: proPricing.yearlyNote,
      target: t('landing.pricing.pro.target'),
      targetDetail: t('landing.pricing.pro.targetDetail'),
      bestFor: [
        t('landing.pricing.pro.bestFor.freelancer'),
        t('landing.pricing.pro.bestFor.founder'),
        t('landing.pricing.pro.bestFor.couple')
      ],
      features: [
        t('landing.pricing.pro.features.spaces'),
        t('landing.pricing.pro.features.banks'),
        t('landing.pricing.pro.features.shield'),
        t('landing.pricing.pro.features.ai'),
        t('landing.pricing.pro.features.teen'),
        t('landing.pricing.pro.features.cloud')
      ],
      cta: t('landing.pricing.pro.cta'),
      to: `/auth/register?plan=pro&billing=${cadence}`,
      highlight: true
    },
    {
      key: 'enterprise',
      name: t('landing.pricing.enterprise.name'),
      price: enterprisePricing.price,
      period: enterprisePricing.period,
      yearlyNote: enterprisePricing.yearlyNote,
      target: t('landing.pricing.enterprise.target'),
      targetDetail: t('landing.pricing.enterprise.targetDetail'),
      bestFor: [
        t('landing.pricing.enterprise.bestFor.team'),
        t('landing.pricing.enterprise.bestFor.agency'),
        t('landing.pricing.enterprise.bestFor.growing')
      ],
      features: [
        t('landing.pricing.enterprise.features.pro'),
        t('landing.pricing.enterprise.features.members'),
        t('landing.pricing.enterprise.features.roles'),
        t('landing.pricing.enterprise.features.audit'),
        t('landing.pricing.enterprise.features.support')
      ],
      cta: t('landing.pricing.enterprise.cta'),
      to: `/auth/register?plan=enterprise&billing=${cadence}`,
      highlight: false
    }
    ]

    return plans
  })

  const morphPhrases = computed(() => [
    t('landing.morph.independent'),
    t('landing.morph.household'),
    t('landing.morph.family'),
    t('landing.morph.company')
  ])

  const demoActiveIndex = ref(0)

  const heroSpaceCards = computed<HeroSpaceCard[]>(() => [
    {
      type: 'INDEPENDENT',
      name: t('spaceTypes.INDEPENDENT'),
      metric: 12480,
      metricLabel: t('landing.heroCards.balance'),
      shape: 'circle',
      sparkline: [12, 14, 13, 16, 15, 18, 17, 19]
    },
    {
      type: 'HOUSEHOLD',
      name: t('spaceTypes.HOUSEHOLD'),
      metric: 28340,
      metricLabel: t('landing.heroCards.shared'),
      shape: 'triangle',
      sparkline: [8, 9, 11, 10, 12, 13, 12, 14]
    },
    {
      type: 'FAMILY',
      name: t('spaceTypes.FAMILY'),
      metric: 420,
      metricLabel: t('landing.heroCards.allowance'),
      shape: 'semicircle',
      sparkline: [5, 6, 5, 7, 8, 7, 9, 8],
      metricSuffix: t('landing.heroCards.perMonth')
    },
    {
      type: 'COMPANY',
      name: t('spaceTypes.COMPANY'),
      metric: 14,
      metricLabel: t('landing.heroCards.runway'),
      shape: 'square',
      sparkline: [20, 19, 18, 17, 16, 15, 14, 13],
      metricSuffix: t('landing.heroCards.months')
    }
  ])

  const demoScenes = computed<DemoScene[]>(() => {
    const cur = currency.value
    const txDate = (daysAgo: number) => {
      const d = new Date()
      d.setDate(d.getDate() - daysAgo)
      return d.toISOString()
    }

    return [
      {
        type: 'INDEPENDENT',
        title: t('spaceTypes.INDEPENDENT'),
        hint: t('landing.demo.scenes.independent.hint'),
        shape: 'circle',
        currency: cur,
        statCards: [
          {
            key: 'balance',
            title: t('dashboard.overview.stats.totalBalance'),
            amount: 12480,
            change: t('landing.demo.scenes.independent.delta'),
            changePositive: true,
            icon: 'i-lucide-wallet'
          },
          {
            key: 'savings',
            title: t('dashboard.overview.stats.netSavings'),
            amount: 840,
            change: t('landing.demo.scenes.independent.cashDelta'),
            changePositive: true,
            icon: 'i-lucide-arrow-left-right'
          }
        ],
        transactions: [
          {
            id: 'd1',
            description: t('landing.demo.scenes.independent.row1'),
            merchant: t('landing.demo.scenes.independent.row1'),
            amount: -4.8,
            currency: cur,
            category: 'FOOD',
            date: txDate(1),
            pending: false,
            account: { id: 'a1', name: 'Current' }
          },
          {
            id: 'd2',
            description: t('landing.demo.scenes.independent.row2'),
            merchant: t('landing.demo.scenes.independent.row2'),
            amount: 3200,
            currency: cur,
            category: 'INCOME',
            date: txDate(3),
            pending: false,
            account: { id: 'a1', name: 'Current' }
          },
          {
            id: 'd3',
            description: t('landing.demo.scenes.independent.row3'),
            merchant: t('landing.demo.scenes.independent.row3'),
            amount: -14.99,
            currency: cur,
            category: 'ENTERTAINMENT',
            date: txDate(5),
            pending: true,
            account: { id: 'a1', name: 'Current' }
          }
        ]
      },
      {
        type: 'HOUSEHOLD',
        title: t('spaceTypes.HOUSEHOLD'),
        hint: t('landing.demo.scenes.household.hint'),
        shape: 'triangle',
        currency: cur,
        statCards: [
          {
            key: 'shared',
            title: t('dashboard.overview.sharedAccounts'),
            amount: 28340,
            icon: 'i-lucide-heart-handshake'
          },
          {
            key: 'personal',
            title: t('dashboard.overview.yourPersonal'),
            amount: 9120,
            icon: 'i-lucide-user'
          }
        ],
        transactions: [
          {
            id: 'd4',
            description: t('landing.demo.scenes.household.row1'),
            merchant: t('landing.demo.scenes.household.row1'),
            amount: -186,
            currency: cur,
            category: 'FOOD',
            date: txDate(2),
            pending: false,
            account: { id: 'a2', name: 'Joint' }
          },
          {
            id: 'd5',
            description: t('landing.demo.scenes.household.row2'),
            merchant: t('landing.demo.scenes.household.row2'),
            amount: -62,
            currency: cur,
            category: 'UTILITIES',
            date: txDate(4),
            pending: false,
            account: { id: 'a2', name: 'Joint' }
          },
          {
            id: 'd6',
            description: t('landing.demo.scenes.household.row3'),
            merchant: t('landing.demo.scenes.household.row3'),
            amount: -124,
            currency: cur,
            category: 'OTHER',
            date: txDate(6),
            pending: false,
            account: { id: 'a3', name: 'Personal' }
          }
        ]
      },
      {
        type: 'FAMILY',
        title: t('spaceTypes.FAMILY'),
        hint: t('landing.demo.scenes.family.hint'),
        shape: 'semicircle',
        currency: cur,
        statCards: [
          {
            key: 'allowance',
            title: t('landing.demo.stats.allowance'),
            amount: 420,
            displayValue: `${formatCurrency(420, cur)}/${t('landing.heroCards.perMonthShort')}`,
            icon: 'i-lucide-piggy-bank'
          },
          {
            key: 'jars',
            title: t('landing.demo.stats.jars'),
            displayValue: t('landing.demo.scenes.family.jars'),
            icon: 'i-lucide-layers'
          }
        ],
        transactions: [
          {
            id: 'd7',
            description: t('landing.demo.scenes.family.row1'),
            merchant: t('landing.demo.scenes.family.row1'),
            amount: -12.4,
            currency: cur,
            category: 'FOOD',
            date: txDate(1),
            pending: false,
            account: { id: 'a4', name: 'Teen' }
          },
          {
            id: 'd8',
            description: t('landing.demo.scenes.family.row2'),
            merchant: t('landing.demo.scenes.family.row2'),
            amount: 40,
            currency: cur,
            category: 'INCOME',
            date: txDate(7),
            pending: false,
            account: { id: 'a4', name: 'Teen' }
          },
          {
            id: 'd9',
            description: t('landing.demo.scenes.family.row3'),
            merchant: t('landing.demo.scenes.family.row3'),
            amount: 40,
            currency: cur,
            category: 'OTHER',
            date: txDate(2),
            pending: false,
            account: { id: 'a5', name: 'College jar' }
          }
        ]
      },
      {
        type: 'COMPANY',
        title: t('spaceTypes.COMPANY'),
        hint: t('landing.demo.scenes.company.hint'),
        shape: 'square',
        currency: cur,
        statCards: [
          {
            key: 'burn',
            title: t('dashboard.overview.stats.burnRate'),
            displayValue: `${formatCurrency(8420, cur)}/mo`,
            change: t('landing.demo.scenes.company.burnDelta'),
            changePositive: false,
            icon: 'i-lucide-flame'
          },
          {
            key: 'runway',
            title: t('dashboard.overview.stats.runway'),
            displayValue: t('landing.demo.scenes.company.runwayLabel'),
            icon: 'i-lucide-hourglass'
          }
        ],
        transactions: [
          {
            id: 'd10',
            description: t('landing.demo.scenes.company.row1'),
            merchant: t('landing.demo.scenes.company.row1'),
            amount: -89,
            currency: cur,
            category: 'OTHER',
            date: txDate(3),
            pending: false,
            account: { id: 'a6', name: 'Business' }
          },
          {
            id: 'd11',
            description: t('landing.demo.scenes.company.row2'),
            merchant: t('landing.demo.scenes.company.row2'),
            amount: -240,
            currency: cur,
            category: 'OTHER',
            date: txDate(8),
            pending: false,
            account: { id: 'a6', name: 'Business' }
          },
          {
            id: 'd12',
            description: t('landing.demo.scenes.company.row3'),
            merchant: t('landing.demo.scenes.company.row3'),
            amount: -1840,
            currency: cur,
            category: 'OTHER',
            date: txDate(12),
            pending: false,
            account: { id: 'a6', name: 'Business' }
          }
        ],
        subscription: {
          id: 's1',
          name: 'Figma',
          amount: 240,
          currency: cur,
          frequency: 'MONTHLY',
          status: 'PRICE_CHANGED',
          icon: null,
          lastCharge: txDate(30),
          nextCharge: txDate(-15),
          alert: true,
          isDuplicate: false
        },
        saasChart: {
          labels: [
            t('landing.demo.scenes.company.row1'),
            t('landing.demo.scenes.company.row2'),
            t('landing.demo.scenes.company.row3')
          ],
          values: [89, 240, 1840],
          centerValue: '2'
        }
      }
    ]
  })

  const proofItems = computed<ProofItem[]>(() => [
    { value: t('landing.proof.spaces.value'), label: t('landing.proof.spaces.label') },
    { value: t('landing.proof.bank.value'), label: t('landing.proof.bank.label') },
    { value: t('landing.proof.shield.value'), label: t('landing.proof.shield.label') },
    { value: t('landing.proof.export.value'), label: t('landing.proof.export.label') }
  ])

  return {
    morphPhrases,
    demoActiveIndex,
    heroLinks,
    ctaLinks,
    howItWorks,
    audiences,
    features,
    pricingPlans,
    heroSpaceCards,
    demoScenes,
    proofItems
  }
})
