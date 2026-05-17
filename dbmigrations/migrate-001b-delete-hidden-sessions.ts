/**
 * Migration 001b — DESTRUCTIVE (run only after verifying migrate-001a output)
 *
 * Prerequisites:
 *   - migrate-001a has been run and verified in the Firebase console
 *   - Every exercise document has both `hidden` and `archived` with matching values
 *   - Every exerciseLogs subcollection matches the corresponding sessions subcollection
 *
 * What it does:
 *   1. Removes the `hidden` field from every exercise document
 *   2. Deletes every sessions/{date} document (exerciseLogs copies are kept)
 *
 * Run:
 *   npx tsx dbmigrations/migrate-001b-delete-hidden-sessions.ts
 *
 * The backup at _mig001/ in Firestore can be deleted manually once you are satisfied.
 */

import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, '../.private/firebase-service-account.json'), 'utf-8'),
) as ServiceAccount

initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

// ---------------------------------------------------------------------------

async function main() {
  console.log('=== Migration 001b: delete `hidden` field + sessions subcollection ===\n')

  const { users } = await getAuth().listUsers()
  console.log(`Found ${users.length} user(s)\n`)

  for (const user of users) {
    await cleanupUser(user.uid)
  }

  console.log('\n=== Done. You may now delete the _mig001/ backup collection manually. ===')
}

async function cleanupUser(uid: string) {
  console.log(`User: ${uid}`)

  const exercisesSnap = await db.collection('users').doc(uid).collection('exercises').get()
  console.log(`  ${exercisesSnap.size} exercise(s) found`)

  // -------------------------------------------------------------------------
  // Step 1: remove `hidden` field from exercise documents
  // -------------------------------------------------------------------------
  console.log('  [1/2] Removing `hidden` field from exercises...')
  const exerciseBatch = db.batch()

  for (const exDoc of exercisesSnap.docs) {
    exerciseBatch.update(exDoc.ref, { hidden: FieldValue.delete() })
  }

  await exerciseBatch.commit()
  console.log('  `hidden` field removed.')

  // -------------------------------------------------------------------------
  // Step 2: delete all sessions/{date} documents
  // -------------------------------------------------------------------------
  console.log('  [2/2] Deleting sessions subcollection...')
  let totalDeleted = 0

  for (const exDoc of exercisesSnap.docs) {
    const sessSnap = await db
      .collection('users').doc(uid)
      .collection('exercises').doc(exDoc.id)
      .collection('sessions')
      .get()

    if (sessSnap.empty) continue

    const deleteBatch = db.batch()
    for (const sessDoc of sessSnap.docs) {
      deleteBatch.delete(sessDoc.ref)
    }
    await deleteBatch.commit()
    totalDeleted += sessSnap.size
  }

  console.log(`  ${totalDeleted} session document(s) deleted.`)
}

main().catch((err: unknown) => {
  console.error('\nCleanup FAILED:', err)
  process.exit(1)
})
