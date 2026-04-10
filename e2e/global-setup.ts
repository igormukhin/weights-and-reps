const FIRESTORE_URL =
  'http://localhost:8080/emulator/v1/projects/demo-test/databases/(default)/documents'
const AUTH_ACCOUNTS_URL =
  'http://localhost:9099/emulator/v1/projects/demo-test/accounts'
const AUTH_SIGNUP_URL =
  'http://localhost:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key'

async function del(url: string, label: string): Promise<void> {
  const res = await fetch(url, { method: 'DELETE' })
  if (!res.ok) {
    throw new Error(
      `[global-setup] Failed to reset ${label}: ${res.status} ${res.statusText}. ` +
        'Is the Firebase emulator running? Run: npx firebase emulators:start --only auth,firestore',
    )
  }
}

async function createTestUser(): Promise<void> {
  const res = await fetch(AUTH_SIGNUP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'test@example.com',
      password: 'testpassword123',
      returnSecureToken: false,
    }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const message = (body as { error?: { message?: string } }).error?.message ?? ''
    // If the user already exists the credentials are correct and tests can proceed.
    // This happens when the auth emulator was started with a different project ID
    // than the one used by global-setup's delete endpoint.
    if (message === 'EMAIL_EXISTS') return
    throw new Error(
      `[global-setup] Failed to create test user: ${res.status} ${res.statusText}`,
    )
  }
}

export default async function globalSetup(): Promise<void> {
  console.log('[global-setup] Resetting Firebase emulator state...')
  await del(FIRESTORE_URL, 'Firestore')
  await del(AUTH_ACCOUNTS_URL, 'Auth')
  await createTestUser()
  console.log('[global-setup] Emulator reset complete. Test user created.')
}
