import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import { eq } from 'drizzle-orm'

import * as schema from '@/db/schema'

const sqlClient = neon(process.env.DATABASE_URL!)
const db = drizzle(sqlClient, { schema })

const testSeed = async () => {
  try {
    console.log('🧪 [TEST]: Starting seed verification...\n')

    // Test 1: Verify Courses
    console.log('📚 Checking Courses...')
    const courses = await db.query.courses.findMany({
      limit: 10,
    })
    console.log(`✅ Found ${courses.length} courses`)
    courses.forEach(c => console.log(`   - ID: ${c.id}, Title: ${c.title}`))

    // Test 2: Verify Units
    console.log('\n📦 Checking Units...')
    const units = await db.query.units.findMany({
      limit: 10,
    })
    console.log(`✅ Found ${units.length} units`)
    units.forEach(u => console.log(`   - ID: ${u.id}, Title: ${u.title}`))

    // Test 3: Verify Lessons
    console.log('\n📖 Checking Lessons...')
    const lessons = await db.query.lessons.findMany({
      limit: 10,
    })
    console.log(`✅ Found ${lessons.length} lessons`)
    lessons.forEach(l => console.log(`   - ID: ${l.id}, Title: ${l.title}`))

    // Test 4: Verify Challenges
    console.log('\n🎯 Checking Challenges...')
    const challenges = await db.query.challenges.findMany({
      limit: 10,
    })
    console.log(`✅ Found ${challenges.length} challenges`)
    challenges.forEach(c => console.log(`   - ID: ${c.id}, Question: ${c.question?.substring(0, 50)}...`))

    // Test 5: Verify Challenge Options
    console.log('\n⚙️ Checking Challenge Options...')
    const options = await db.query.challengeOptions.findMany({
      limit: 10,
    })
    console.log(`✅ Found ${options.length} challenge options`)
    options.forEach(o => console.log(`   - ID: ${o.id}, Option: ${o.option}`))

    // Test 6: Verify Quests
    console.log('\n🎁 Checking Quests...')
    const quests = await db.query.quests.findMany({
      limit: 10,
    })
    console.log(`✅ Found ${quests.length} quests`)
    quests.forEach(q => console.log(`   - ID: ${q.id}, Title: ${q.title}`))

    // Test 7: Verify a specific course wasn't deleted
    console.log('\n🔍 Verifying Upsert (not delete)...')
    const pythonCourse = await db.query.courses.findFirst({
      where: eq(schema.courses.id, 1),
    })
    if (pythonCourse) {
      console.log(`✅ Course ID 1 exists: ${pythonCourse.title}`)
    } else {
      console.log(`❌ Course ID 1 NOT FOUND - Seed may have failed!`)
    }

    console.log('\n✨ [TEST]: All verifications complete!')
  } catch (error) {
    console.error('❌ [TEST]: Error during verification:', error)
    throw new Error('Test failed')
  }
}

testSeed()
