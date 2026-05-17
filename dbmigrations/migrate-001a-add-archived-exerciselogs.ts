/**
 * Migration 001a — ADDITIVE (safe to run, nothing is deleted)
 *
 * What it does:
 *   1. Backs up all exercise + session documents to _mig001/{uid}/...
 *   2. Adds the `archived` field to every exercise document (copies value from `hidden`)
 *      — `hidden` is left in place; it will be removed by migrate-001b
 *   3. Copies every sessions/{date} document to exerciseLogs/{date}
 *      — original sessions/{date} documents are left in place; they will be removed by migrate-001b
 *
 * Run:
 *   npx tsx dbmigrations/migrate-001a-add-archived-exerciselogs.ts
 *
 * After running, verify in the Firebase console that:
 *   - Exercise documents have both `hidden` and `archived` fields with matching values
 *   - exerciseLogs subcollection exists alongside sessions with identical documents
 * Then run migrate-001b to remove the old fields and collection.
 */

import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
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
  console.log('=== Migration 001a: add archived + exerciseLogs (additive only) ===\n')

  const { users } = await getAuth().listUsers()
  console.log(`Found ${users.length} user(s)\n`)

  for (const user of users) {
    await migrateUser(user.uid)
  }

  console.log('\n=== Done. Verify in Firebase console, then run migrate-001b. ===')
}

async function migrateUser(uid: string) {
  console.log(`User: ${uid}`)

  const exercisesSnap = await db.collection('users').doc(uid).collection('exercises').get()
  console.log(`  ${exercisesSnap.size} exercise(s) found`)

  // -------------------------------------------------------------------------
  // Step 1: collect all sessions per exercise up front
  // -------------------------------------------------------------------------
  const sessionsByExercise: Map<string, FirebaseFirestore.QuerySnapshot> = new Map()
  for (const exDoc of exercisesSnap.docs) {
    const sessSnap = await db
      .collection('users').doc(uid)
      .collection('exercises').doc(exDoc.id)
      .collection('sessions')
      .get()
    sessionsByExercise.set(exDoc.id, sessSnap)
  }

  // -------------------------------------------------------------------------
  // Step 2: backup exercises + sessions
  // -------------------------------------------------------------------------
  console.log('  [1/3] Writing backup to _mig001/...')
  const backupBatch = db.batch()

  for (const exDoc of exercisesSnap.docs) {
    const backupExRef = db
      .collection('_mig001').doc(uid)
      .collection('exercises').doc(exDoc.id)
    backupBatch.set(backupExRef, exDoc.data())

    for (const sessDoc of sessionsByExercise.get(exDoc.id)!.docs) {
      backupBatch.set(backupExRef.collection('sessions').doc(sessDoc.id), sessDoc.data())
    }
  }

  await backupBatch.commit()
  console.log('  Backup written.')

  // -------------------------------------------------------------------------
  // Step 3: add `archived` field alongside existing `hidden`
  // -------------------------------------------------------------------------
  console.log('  [2/3] Adding `archived` field to exercises...')
  const exerciseBatch = db.batch()

  for (const exDoc of exercisesSnap.docs) {
    exerciseBatch.update(exDoc.ref, { archived: exDoc.data()['hidden'] ?? false })
  }

  await exerciseBatch.commit()
  console.log('  `archived` field added.')

  // -------------------------------------------------------------------------
  // Step 4: copy sessions → exerciseLogs (originals untouched)
  // -------------------------------------------------------------------------
  console.log('  [3/3] Copying sessions → exerciseLogs...')
  let totalSessions = 0

  for (const exDoc of exercisesSnap.docs) {
    const sessSnap = sessionsByExercise.get(exDoc.id)!
    if (sessSnap.empty) continue

    const copyBatch = db.batch()
    for (const sessDoc of sessSnap.docs) {
      const newRef = db
        .collection('users').doc(uid)
        .collection('exercises').doc(exDoc.id)
        .collection('exerciseLogs').doc(sessDoc.id)
      copyBatch.set(newRef, sessDoc.data())
    }
    await copyBatch.commit()
    totalSessions += sessSnap.size
  }

  console.log(`  ${totalSessions} session(s) copied to exerciseLogs.`)
}

main().catch((err: unknown) => {
  console.error('\nMigration FAILED:', err)
  process.exit(1)
})
