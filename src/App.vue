<template>
  <v-app>
    <router-view />
  </v-app>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

// Instantiating the store here starts the Firebase auth state listener
// immediately, ensuring it's active before any route guard runs.
useAuthStore()
</script>
