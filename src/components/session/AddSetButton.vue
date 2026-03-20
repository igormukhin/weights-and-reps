<template>
  <v-btn
    variant="outlined"
    block
    prepend-icon="mdi-plus"
    class="mt-2"
    @click="$emit('add-set')"
  >
    Add set
  </v-btn>
</template>

<script setup lang="ts">
defineEmits<{
  'add-set': []
}>()
</script>
