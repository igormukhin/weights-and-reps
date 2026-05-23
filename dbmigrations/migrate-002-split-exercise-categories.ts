/**
 * Migration 002 — ADDITIVE, HIGH RELIABILITY & SAFE
 *
 * What it does:
 *   1. Iterates through all users in pages of 1000.
 *   2. For each user, fetches exercises and filters those requiring migration (name contains `:`).
 *   3. Backs up target exercises to `_mig002/{uid}/exercises/{id}` using `batch.create()` to prevent overwriting existing backups.
 *   4. Splits exercise names (e.g. "Chest: Bench Press" -> name: "Bench Press", category: "Chest").
 *   5. Updates the exercise documents with the split name and category.
 *   6. Safely handles Firestore batch operations in chunks of 400.
 *   7. Continues past individual user migration failures, reporting final counts at the end.
 *
 * Run:
 *   npx tsx dbmigrations/migrate-002-split-exercise-categories.ts
 *
 * Dry Run:
 *   npx tsx dbmigrations/migrate-002-split-exercise-categories.ts --dry-run
 */

import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, WriteBatch } from 'firebase-admin/firestore'
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

// Check for dry-run mode
const DRY_RUN = process.argv.includes('--dry-run') || process.env.DRY_RUN === 'true'

// Helper function to commit writes in chunk sizes of 400
async function commitInChunks(operations: Array<(batch: WriteBatch) => void>) {
  const CHUNK_SIZE = 400
  for (let i = 0; i < operations.length; i += CHUNK_SIZE) {
    const chunk = operations.slice(i, i + CHUNK_SIZE)
    const batch = db.batch()
    for (const op of chunk) {
      op(batch)
    }
    if (!DRY_RUN) {
      await batch.commit()
    }
  }
}

async function main() {
  console.log('=== Migration 002: Split Exercise Categories ===')
  if (DRY_RUN) {
    console.log('⚠️  DRY RUN MODE ENABLED - No changes will be written to Firestore\n')
  }

  let nextPageToken: string | undefined = undefined
  let totalUsersProcessed = 0
  const failures: Array<{ uid: string; error: any }> = []

  do {
    // Safely paginate through users (1000 per page limit)
    const result = await getAuth().listUsers(1000, nextPageToken)
    console.log(`Retrieved page of ${result.users.length} user(s)`)

    for (const user of result.users) {
      try {
        await migrateUser(user.uid)
        totalUsersProcessed++
      } catch (error) {
        console.error(`\n❌ Failed to migrate user ${user.uid}:`, error)
        failures.push({ uid: user.uid, error })
      }
    }

    nextPageToken = result.pageToken
  } while (nextPageToken)

  console.log('\n=== Migration Report ===')
  console.log(`Total users successfully processed: ${totalUsersProcessed}`)
  console.log(`Failed user migrations: ${failures.length}`)

  if (failures.length > 0) {
    console.error('\n🔴 Some migrations FAILED. Please review the errors above.')
    process.exit(1)
  } else {
    console.log('\n=== Done. All users migrated successfully. ===')
  }
}

async function migrateUser(uid: string) {
  const exercisesSnap = await db.collection('users').doc(uid).collection('exercises').get()
  
  if (exercisesSnap.empty) {
    return
  }

  const exercisesToMigrate = exercisesSnap.docs.filter(exDoc => {
    const data = exDoc.data()
    const rawName = data.name || ''
    return rawName.includes(':')
  })

  if (exercisesToMigrate.length === 0) {
    return
  }

  console.log(`User: ${uid} | Found ${exercisesToMigrate.length} exercise(s) requiring migration`)

  // Step 1: Check existing backups to prevent overwrite of original data
  const backupOps: Array<(batch: WriteBatch) => void> = []
  
  for (const exDoc of exercisesToMigrate) {
    const backupExRef = db
      .collection('_mig002').doc(uid)
      .collection('exercises').doc(exDoc.id)

    // Using batch.create() will throw an error if the document already exists,
    // which protects any original pre-migration backups from being overwritten.
    backupOps.push((batch) => {
      batch.create(backupExRef, exDoc.data())
    })
  }

  if (backupOps.length > 0) {
    if (DRY_RUN) {
      console.log(`  [DRY RUN] Would write backups for ${backupOps.length} exercises.`)
    } else {
      console.log(`  [1/2] Writing backup for ${backupOps.length} exercises (preventing overwrites)...`)
      try {
        await commitInChunks(backupOps)
        console.log('  Backup completed.')
      } catch (err: any) {
        if (err.code === 6 || err.message?.includes('ALREADY_EXISTS')) {
          console.log('  ⚠️ Backup already exists for some exercises. Skipping backup write to protect original data.')
        } else {
          throw err
        }
      }
    }
  }

  // Step 2: Migrate exercise documents
  const migrateOps: Array<(batch: WriteBatch) => void> = []

  for (const exDoc of exercisesToMigrate) {
    const data = exDoc.data()
    const rawName = data.name || ''
    const colonIndex = rawName.indexOf(':')

    const category = rawName.slice(0, colonIndex).trim()
    const shortName = rawName.slice(colonIndex + 1).trim()

    migrateOps.push((batch) => {
      batch.update(exDoc.ref, {
        name: shortName,
        category: category,
      })
    })
  }

  if (migrateOps.length > 0) {
    if (DRY_RUN) {
      console.log(`  [DRY RUN] Would migrate ${migrateOps.length} exercises:`)
      for (const exDoc of exercisesToMigrate) {
        const rawName = exDoc.data().name || ''
        const colonIndex = rawName.indexOf(':')
        const category = rawName.slice(0, colonIndex).trim()
        const shortName = rawName.slice(colonIndex + 1).trim()
        console.log(`    - "${rawName}" -> Name: "${shortName}" | Category: "${category}"`)
      }
    } else {
      console.log(`  [2/2] Migrating ${migrateOps.length} exercise documents...`)
      await commitInChunks(migrateOps)
      console.log(`  ${migrateOps.length} exercise(s) migrated successfully.`)
    }
  }
}

main().catch((err: unknown) => {
  console.error('\nFatal migration crash:', err)
  process.exit(1)
})
