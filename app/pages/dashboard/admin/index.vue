<script setup lang="ts">
// ANCHOR: Admin index — redirects to usage screen
definePageMeta({ middleware: 'auth' })

await navigateTo('/dashboard/admin/usage', { replace: true })
</script>
