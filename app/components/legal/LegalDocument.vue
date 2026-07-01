<script setup lang="ts">
const props = defineProps<{
  baseKey: string
  sectionIds: string[]
}>()

const { t } = useAppI18n()
const { has } = useI18n()

function sectionKey(sectionId: string, suffix: string) {
  return `${props.baseKey}.sections.${sectionId}.${suffix}`
}

function sectionExists(sectionId: string) {
  return has(sectionKey(sectionId, 'title'))
}

function paragraphKeys(sectionId: string): string[] {
  const keys: string[] = []
  for (let i = 1; i <= 12; i++) {
    const key = sectionKey(sectionId, `p${i}`)
    if (!has(key)) break
    keys.push(key)
  }
  return keys
}

function listItems(sectionId: string): string[] {
  const items: string[] = []
  const base = sectionKey(sectionId, 'items')
  for (let i = 0; i < 24; i++) {
    const key = `${base}.${i}`
    if (!has(key)) break
    items.push(t(key))
  }
  return items
}

function tableRows(sectionId: string): Array<{ name: string, purpose: string, location: string }> {
  const rows: Array<{ name: string, purpose: string, location: string }> = []
  const base = sectionKey(sectionId, 'table')
  for (let i = 0; i < 12; i++) {
    const nameKey = `${base}.${i}.name`
    if (!has(nameKey)) break
    rows.push({
      name: t(nameKey),
      purpose: t(`${base}.${i}.purpose`),
      location: t(`${base}.${i}.location`)
    })
  }
  return rows
}
</script>

<template>
  <div class="space-y-10">
    <section
      v-for="sectionId in sectionIds"
      v-show="sectionExists(sectionId)"
      :key="sectionId"
      class="space-y-4"
    >
      <h2 class="text-xl font-semibold text-default">
        {{ t(sectionKey(sectionId, 'title')) }}
      </h2>

      <p class="legal-beta-section-notice">
        {{ t('legal.betaSectionNotice') }}
      </p>

      <p
        v-for="key in paragraphKeys(sectionId)"
        :key="key"
        class="text-muted leading-relaxed"
      >
        {{ t(key) }}
      </p>

      <ul
        v-if="listItems(sectionId).length"
        class="list-disc pl-6 space-y-2 text-muted leading-relaxed"
      >
        <li
          v-for="(item, index) in listItems(sectionId)"
          :key="index"
        >
          {{ item }}
        </li>
      </ul>

      <div
        v-if="tableRows(sectionId).length"
        class="overflow-x-auto rounded-lg border border-default/60"
      >
        <table class="min-w-full text-sm text-left">
          <thead class="bg-elevated/60 text-default">
            <tr>
              <th class="px-4 py-3 font-medium">
                {{ t(`${baseKey}.table.provider`) }}
              </th>
              <th class="px-4 py-3 font-medium">
                {{ t(`${baseKey}.table.purpose`) }}
              </th>
              <th class="px-4 py-3 font-medium">
                {{ t(`${baseKey}.table.location`) }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-default/40 text-muted">
            <tr
              v-for="(row, index) in tableRows(sectionId)"
              :key="index"
            >
              <td class="px-4 py-3 font-medium text-default">
                {{ row.name }}
              </td>
              <td class="px-4 py-3">
                {{ row.purpose }}
              </td>
              <td class="px-4 py-3">
                {{ row.location }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
