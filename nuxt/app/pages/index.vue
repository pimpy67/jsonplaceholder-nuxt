<script setup lang="ts">
// Redirect automatico: / → /utenti (se loggato) o /login (gestito dal middleware)
await navigateTo('/utenti', { replace: true })
</script>
