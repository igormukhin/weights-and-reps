<template>
  <v-app>
    <router-view />
  </v-app>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

// Keep Firebase auth state synced into Pinia while the app is mounted.
useAuthStore()
</script>
