<template>
  <div class="breadcrumb">
    <span v-for="(voce, i) in voci" :key="i">
      <button v-if="voce.onClick" @click="voce.onClick">{{ voce.label }}</button>
      <span v-else>{{ voce.label }}</span>
      <span v-if="i < voci.length - 1"> → </span>
    </span>
  </div>
</template>

<script setup lang="ts">
defineProps<{ voci: { label: string, onClick?: () => void }[] }>()
</script>
