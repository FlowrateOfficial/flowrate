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
  metric: string
  metricLabel: string
  shape: 'circle' | 'triangle' | 'semicircle' | 'square'
  sparkline: number[]
}

export interface Testimonial {
  quote: string
  author: string
  role: string
  initials: string
}

export const useLandingStore = defineStore('landing', () => {
  const { t } = useAppI18n()

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

  const pricingPlans = computed<LandingPlan[]>(() => {
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
      price: t('landing.pricing.pro.price'),
      period: t('landing.pricing.pro.period'),
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
      to: '/auth/register?plan=pro',
      highlight: true
    },
    {
      key: 'enterprise',
      name: t('landing.pricing.enterprise.name'),
      price: t('landing.pricing.enterprise.price'),
      period: t('landing.pricing.enterprise.period'),
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
      to: 'mailto:mathieu.lievre.pro@outlook.com',
      highlight: false
    }
    ]

    for (const stripe of billingStore.plans) {
      const idx = plans.findIndex(p => p.key === stripe.key)
      if (idx >= 0) {
        plans[idx] = {
          ...plans[idx],
          name: stripe.name || plans[idx].name,
          price: stripe.formattedPrice,
          period: stripe.formattedPeriod ?? plans[idx].period
        }
      }
    }

    return plans
  })

  const heroSpaceCards = computed<HeroSpaceCard[]>(() => [
    {
      type: 'INDEPENDENT',
      name: t('spaceTypes.INDEPENDENT'),
      metric: t('landing.heroCards.independent.metric'),
      metricLabel: t('landing.heroCards.balance'),
      shape: 'circle',
      sparkline: [12, 14, 13, 16, 15, 18, 17, 19]
    },
    {
      type: 'HOUSEHOLD',
      name: t('spaceTypes.HOUSEHOLD'),
      metric: t('landing.heroCards.household.metric'),
      metricLabel: t('landing.heroCards.shared'),
      shape: 'triangle',
      sparkline: [8, 9, 11, 10, 12, 13, 12, 14]
    },
    {
      type: 'FAMILY',
      name: t('spaceTypes.FAMILY'),
      metric: t('landing.heroCards.family.metric'),
      metricLabel: t('landing.heroCards.allowance'),
      shape: 'semicircle',
      sparkline: [5, 6, 5, 7, 8, 7, 9, 8]
    },
    {
      type: 'COMPANY',
      name: t('spaceTypes.COMPANY'),
      metric: t('landing.heroCards.company.metric'),
      metricLabel: t('landing.heroCards.runway'),
      shape: 'square',
      sparkline: [20, 19, 18, 17, 16, 15, 14, 13]
    }
  ])

  const testimonials = computed<Testimonial[]>(() => [
    {
      quote: t('landing.testimonials.one.quote'),
      author: t('landing.testimonials.one.author'),
      role: t('landing.testimonials.one.role'),
      initials: 'EL'
    },
    {
      quote: t('landing.testimonials.two.quote'),
      author: t('landing.testimonials.two.author'),
      role: t('landing.testimonials.two.role'),
      initials: 'MR'
    },
    {
      quote: t('landing.testimonials.three.quote'),
      author: t('landing.testimonials.three.author'),
      role: t('landing.testimonials.three.role'),
      initials: 'SC'
    }
  ])

  return {
    heroLinks,
    ctaLinks,
    howItWorks,
    audiences,
    features,
    pricingPlans,
    heroSpaceCards,
    testimonials
  }
})
