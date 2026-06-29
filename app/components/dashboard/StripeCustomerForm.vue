<script setup lang="ts">
import { autofill, getFormAutofillValues } from '@mapbox/search-js-web'
import type { BillingAddress } from '#shared/billing-address'
import type { StripeCustomerInvoiceSummary, StripeCustomerProfile } from '#shared/stripe-customer-profile'
import { apiRoutes } from '~/lib/api/endpoints'
import { useApi } from '~/lib/api/useApi'

const { t, getLocale } = useAppI18n()
const appToast = useAppToast()
const config = useRuntimeConfig()
const { api } = useApi()

const formRef = useTemplateRef<HTMLFormElement>('formRef')

const timezone = ref('')
const line1 = ref('')
const line2 = ref('')
const city = ref('')
const state = ref('')
const postalCode = ref('')
const country = ref('')

const profileMeta = ref<Pick<StripeCustomerProfile, 'customerId' | 'name' | 'email' | 'phone' | 'phoneVerified' | 'invoiceTemplateConfigured'>>({
  customerId: null,
  name: null,
  email: null,
  phone: null,
  phoneVerified: false,
  invoiceTemplateConfigured: false
})

const invoices = ref<StripeCustomerInvoiceSummary[]>([])
const loading = ref(true)
const saving = ref(false)
const generatingInvoice = ref(false)
let autofillCollection: ReturnType<typeof autofill> | null = null

const timezoneOptions = computed(() => {
  try {
    return Intl.supportedValuesOf('timeZone').map(value => ({ label: value, value }))
  } catch {
    return [
      'America/New_York',
      'America/Chicago',
      'America/Los_Angeles',
      'Europe/London',
      'Europe/Paris',
      'Europe/Berlin',
      'Asia/Tokyo',
      'Australia/Sydney'
    ].map(value => ({ label: value, value }))
  }
})

const suggestedTimezone = computed(() => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return 'UTC'
  }
})

function applyProfile(profile: StripeCustomerProfile) {
  profileMeta.value = {
    customerId: profile.customerId,
    name: profile.name,
    email: profile.email,
    phone: profile.phone,
    phoneVerified: profile.phoneVerified,
    invoiceTemplateConfigured: profile.invoiceTemplateConfigured
  }
  timezone.value = profile.timezone ?? ''
  line1.value = profile.address?.line1 ?? ''
  line2.value = profile.address?.line2 ?? ''
  city.value = profile.address?.city ?? ''
  state.value = profile.address?.state ?? ''
  postalCode.value = profile.address?.postalCode ?? ''
  country.value = profile.address?.country ?? ''
}

function primaryLineInput(): HTMLInputElement | null {
  return formRef.value?.querySelector<HTMLInputElement>('input[autocomplete="billing address-line1"]') ?? null
}

function readAddress(): BillingAddress | null {
  const form = formRef.value
  const line1Input = primaryLineInput()
  if (!form || !line1Input) return null

  const values = getFormAutofillValues(form, line1Input)

  const parsed: BillingAddress = {
    line1: values['address-line1'] ?? values['street-address'] ?? line1.value.trim(),
    line2: values['address-line2'] ?? (line2.value.trim() || null),
    city: values['address-level2'] ?? city.value.trim(),
    state: values['address-level1'] ?? (state.value.trim() || null),
    postalCode: values['postal-code'] ?? postalCode.value.trim(),
    country: (values.country ?? country.value.trim()).toUpperCase()
  }

  if (!parsed.line1 || !parsed.city || !parsed.postalCode || parsed.country.length !== 2) {
    return null
  }

  return parsed
}

async function loadProfile() {
  loading.value = true
  try {
    const data = await api<{ profile: StripeCustomerProfile, configured: boolean }>(
      apiRoutes.user.stripeCustomer
    )
    applyProfile(data.profile)
  } catch {
    appToast.errorMessage(t('dashboard.settings.stripeCustomerLoadFailed'))
  } finally {
    loading.value = false
  }
}

async function loadInvoices() {
  try {
    const data = await api<{ invoices: StripeCustomerInvoiceSummary[] }>(
      apiRoutes.user.stripeInvoices
    )
    invoices.value = data.invoices
  } catch {
    invoices.value = []
  }
}

async function saveProfile() {
  const address = readAddress()
  if (!address) {
    appToast.errorMessage(t('dashboard.settings.taxAddressInvalid'))
    return
  }

  saving.value = true
  try {
    const data = await api<{ profile: StripeCustomerProfile }>(apiRoutes.user.stripeCustomer, {
      method: 'PATCH',
      body: {
        timezone: timezone.value || null,
        address
      }
    })
    applyProfile(data.profile)
    appToast.success(t('dashboard.settings.stripeCustomerSaved'))
    await loadInvoices()
  } catch {
    appToast.errorMessage(t('dashboard.settings.stripeCustomerSaveFailed'))
  } finally {
    saving.value = false
  }
}

async function generateInvoice() {
  generatingInvoice.value = true
  try {
    const data = await api<{ invoice: StripeCustomerInvoiceSummary }>(
      apiRoutes.user.stripeInvoices,
      { method: 'POST' }
    )
    invoices.value = [data.invoice, ...invoices.value.filter(item => item.id !== data.invoice.id)]
    appToast.success(t('dashboard.settings.stripeCustomerInvoicesGenerated'))
  } catch (err: unknown) {
    const message = err && typeof err === 'object' && 'data' in err
      && typeof (err as { data?: { message?: string } }).data?.message === 'string'
      ? (err as { data: { message: string } }).data.message
      : t('dashboard.settings.stripeCustomerInvoicesGenerateFailed')
    appToast.errorMessage(message)
  } finally {
    generatingInvoice.value = false
  }
}

function formatInvoiceAmount(invoice: StripeCustomerInvoiceSummary) {
  return new Intl.NumberFormat(getLocale(), {
    style: 'currency',
    currency: invoice.currency
  }).format(invoice.amountDue / 100)
}

function formatInvoiceDate(iso: string) {
  return new Intl.DateTimeFormat(getLocale(), { dateStyle: 'medium' }).format(new Date(iso))
}

onMounted(async () => {
  await Promise.all([loadProfile(), loadInvoices()])

  const token = config.public.mapboxAccessToken as string
  if (!token || !formRef.value) return

  autofillCollection = autofill({
    accessToken: token,
    options: { language: getLocale().startsWith('fr') ? 'fr' : 'en' }
  })
})

onBeforeUnmount(() => {
  autofillCollection?.remove()
  autofillCollection = null
})
</script>

<template>
  <div class="space-y-6">
    <p class="text-sm text-muted leading-relaxed">
      {{ t('dashboard.settings.stripeCustomerDescription') }}
    </p>

    <UAlert
      v-if="!config.public.mapboxAccessToken"
      color="warning"
      variant="subtle"
      :title="t('dashboard.settings.taxAddressUnavailable')"
    />

    <div v-if="loading" class="space-y-3">
      <USkeleton class="h-10 w-full" />
      <USkeleton class="h-10 w-full" />
      <div class="grid gap-3 sm:grid-cols-2">
        <USkeleton class="h-10 w-full" />
        <USkeleton class="h-10 w-full" />
      </div>
    </div>

    <template v-else>
      <div
        v-if="profileMeta.customerId"
        class="rounded-lg border border-default bg-elevated/30 p-3 text-sm space-y-1"
      >
        <p v-if="profileMeta.name" class="font-medium">{{ profileMeta.name }}</p>
        <p v-if="profileMeta.email" class="text-muted">{{ profileMeta.email }}</p>
        <p v-if="profileMeta.phone" class="text-muted">
          {{ profileMeta.phone }}
          <UBadge
            v-if="profileMeta.phoneVerified"
            :label="t('dashboard.settings.phoneVerified')"
            color="success"
            variant="subtle"
            size="xs"
            icon="i-lucide-check"
            class="ml-1.5"
          />
        </p>
        <p v-else class="text-xs text-muted">
          {{ t('dashboard.settings.stripeCustomerPhoneNote') }}
        </p>
        <p class="text-xs text-muted font-mono">
          {{ t('dashboard.settings.stripeCustomerCustomerId') }}: {{ profileMeta.customerId }}
        </p>
      </div>

      <form
        ref="formRef"
        class="space-y-4"
        @submit.prevent="saveProfile"
      >
        <UFormField :label="t('dashboard.settings.stripeCustomerTimezone')">
          <USelectMenu
            v-model="timezone"
            :items="timezoneOptions"
            value-key="value"
            searchable
            class="w-full"
            :placeholder="suggestedTimezone"
          />
          <template #help>
            {{ t('dashboard.settings.stripeCustomerTimezoneHelp') }}
          </template>
        </UFormField>

        <UFormField :label="t('dashboard.settings.taxAddressLine1')">
          <UInput
            v-model="line1"
            name="line1"
            autocomplete="billing address-line1"
            class="w-full"
            :placeholder="t('dashboard.settings.taxAddressLine1Placeholder')"
            :disabled="!config.public.mapboxAccessToken"
          />
        </UFormField>

        <UFormField :label="t('dashboard.settings.taxAddressLine2')">
          <UInput
            v-model="line2"
            name="line2"
            autocomplete="billing address-line2"
            class="w-full"
            :placeholder="t('dashboard.settings.taxAddressLine2Placeholder')"
            :disabled="!config.public.mapboxAccessToken"
          />
        </UFormField>

        <div class="grid gap-3 sm:grid-cols-2">
          <UFormField :label="t('dashboard.settings.taxAddressCity')">
            <UInput
              v-model="city"
              name="city"
              autocomplete="billing address-level2"
              class="w-full"
              :disabled="!config.public.mapboxAccessToken"
            />
          </UFormField>

          <UFormField :label="t('dashboard.settings.taxAddressState')">
            <UInput
              v-model="state"
              name="state"
              autocomplete="billing address-level1"
              class="w-full"
              :disabled="!config.public.mapboxAccessToken"
            />
          </UFormField>
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          <UFormField :label="t('dashboard.settings.taxAddressPostal')">
            <UInput
              v-model="postalCode"
              name="postalCode"
              autocomplete="billing postal-code"
              class="w-full"
              :disabled="!config.public.mapboxAccessToken"
            />
          </UFormField>

          <UFormField :label="t('dashboard.settings.taxAddressCountry')">
            <UInput
              v-model="country"
              name="country"
              autocomplete="billing country"
              maxlength="2"
              class="w-full uppercase"
              :placeholder="t('dashboard.settings.taxAddressCountryPlaceholder')"
              :disabled="!config.public.mapboxAccessToken"
            />
          </UFormField>
        </div>

        <p class="text-xs text-muted leading-relaxed">
          {{ t('dashboard.settings.taxAddressMapboxNote') }}
          <NuxtLink to="/privacy#subprocessors" class="text-primary hover:underline">
            {{ t('common.privacy') }}
          </NuxtLink>
        </p>

        <div class="flex justify-end">
          <UButton
            type="submit"
            :label="t('dashboard.settings.stripeCustomerSave')"
            icon="i-lucide-save"
            :loading="saving"
          />
        </div>
      </form>

      <div class="border-t border-default pt-5 space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h3 class="text-sm font-semibold">
            {{ t('dashboard.settings.stripeCustomerInvoicesTitle') }}
          </h3>
          <UButton
            :label="t('dashboard.settings.stripeCustomerInvoicesGenerate')"
            icon="i-lucide-file-text"
            color="neutral"
            variant="outline"
            size="sm"
            :loading="generatingInvoice"
            :disabled="!profileMeta.customerId"
            @click="generateInvoice"
          />
        </div>

        <p v-if="profileMeta.invoiceTemplateConfigured" class="text-xs text-muted">
          {{ t('dashboard.settings.stripeCustomerInvoiceTemplateNote') }}
        </p>

        <p v-if="!invoices.length" class="text-sm text-muted">
          {{ t('dashboard.settings.stripeCustomerInvoicesEmpty') }}
        </p>

        <ul v-else class="divide-y divide-default rounded-lg border border-default">
          <li
            v-for="invoice in invoices"
            :key="invoice.id"
            class="flex flex-wrap items-center justify-between gap-3 px-3 py-3 text-sm"
          >
            <div>
              <p class="font-medium">
                {{ invoice.number ?? invoice.id }}
              </p>
              <p class="text-xs text-muted">
                {{ formatInvoiceDate(invoice.created) }} · {{ invoice.status }}
              </p>
            </div>
            <div class="flex items-center gap-2">
              <span class="font-medium tabular-nums">{{ formatInvoiceAmount(invoice) }}</span>
              <UButton
                v-if="invoice.hostedInvoiceUrl"
                :label="t('dashboard.settings.stripeCustomerViewInvoice')"
                :to="invoice.hostedInvoiceUrl"
                target="_blank"
                color="neutral"
                variant="ghost"
                size="xs"
                icon="i-lucide-external-link"
              />
              <UButton
                v-if="invoice.invoicePdf"
                :label="t('dashboard.settings.stripeCustomerDownloadPdf')"
                :to="invoice.invoicePdf"
                target="_blank"
                color="neutral"
                variant="ghost"
                size="xs"
                icon="i-lucide-download"
              />
            </div>
          </li>
        </ul>
      </div>
    </template>
  </div>
</template>
