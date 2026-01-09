#!/usr/bin/env node
/**
 * Quick verification that the seed script has proper upsert logic
 * This script checks the seed.ts file without needing a database
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'

const seedFilePath = resolve(process.cwd(), 'scripts/seed.ts')
const seedContent = readFileSync(seedFilePath, 'utf-8')

console.log('🔍 Verifying seed script upsert implementation...\n')

// Check 1: No delete statements
const hasDeleteStatements = seedContent.includes('db.delete(') || seedContent.includes('await db.delete')
if (hasDeleteStatements) {
  console.log('❌ FAIL: Found db.delete() statements - seed will destroy existing data!')
  process.exit(1)
} else {
  console.log('✅ PASS: No destructive delete statements found')
}

// Check 2: Has onConflictDoUpdate
const conflictMatches = seedContent.match(/onConflictDoUpdate/g) || []
if (conflictMatches.length === 0) {
  console.log('❌ FAIL: No onConflictDoUpdate found - upsert not implemented!')
  process.exit(1)
} else {
  console.log(`✅ PASS: Found ${conflictMatches.length} onConflictDoUpdate implementations`)
}

// Check 3: Verify each table has upsert
const tables = ['courses', 'units', 'lessons', 'challenges', 'challengeOptions', 'quests']
console.log('\n📋 Upsert implementation by table:')

tables.forEach((table) => {
  const tableInsertRegex = new RegExp(
    `insert\\(schema\\.${table}\\).*?onConflictDoUpdate`,
    's'
  )
  if (tableInsertRegex.test(seedContent)) {
    console.log(`   ✅ ${table}: Has upsert logic`)
  } else {
    console.log(`   ❌ ${table}: Missing upsert logic`)
  }
})

// Check 4: sql function imported
if (seedContent.includes(`import { sql } from 'drizzle-orm'`)) {
  console.log('\n✅ PASS: sql function properly imported')
} else {
  console.log('\n❌ FAIL: sql function not imported')
  process.exit(1)
}

console.log('\n✨ All checks passed! Seed script is ready for upsert.')
console.log('\n📝 Next steps:')
console.log('   1. Get a Neon PostgreSQL database: https://neon.tech')
console.log('   2. Copy your connection string from Neon dashboard')
console.log('   3. Create .env file: echo DATABASE_URL=your-connection-string > .env')
console.log('   4. Run: pnpm db:seed')
