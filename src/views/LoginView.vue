<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="4">
        <v-card class="pa-6" elevation="2">
          <v-card-title class="text-h5 text-center mb-2">
            Weights &amp; Reps
          </v-card-title>
          <v-card-subtitle class="text-center mb-6">
            Personal training tracker
          </v-card-subtitle>
          <v-card-actions class="justify-center">
            <v-btn
              color="primary"
              size="large"
              block
              :loading="loading"
              :prepend-icon="mdiGoogle"
              @click="handleSignIn"
            >
              Sign in with Google
            </v-btn>
          </v-card-actions>
          <v-alert
            v-if="error"
            type="error"
            class="mt-4"
            density="compact"
          >
            {{ error }}
          </v-alert>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { mdiGoogle } from '@mdi/js'
import { useRouter } from 'vue-router'
import { signInWithGoogle } from '@/services/auth'

const router = useRouter()
const loading = ref(false)
const error = ref<string | null>(null)

async function handleSignIn(): Promise<void> {
  loading.value = true
  error.value = null
  try {
    await signInWithGoogle()
    router.push('/exercises')
  } catch (e) {
    error.value = 'Sign in failed. Please try again.'
    console.error(e)
  } finally {
    loading.value = false
  }
}
</script>
