import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import { eq, sql } from 'drizzle-orm'

import * as schema from '@/db/schema'

const sqlClient = neon(process.env.DATABASE_URL!)
const db = drizzle(sqlClient, { schema })

const advancedSeedTest = async () => {
  try {
    console.log('🔬 [ADVANCED TEST]: Testing Upsert Behavior\n')

    // Step 1: Insert a custom course before seed
    console.log('1️⃣ Creating test data before seed...')
    const customCourse = await db.insert(schema.courses).values({
      id: 999,
      title: 'Test Course - DO NOT DELETE',
      altCode: 'test',
    }).returning()
    console.log(`   ✅ Created custom course: ${customCourse[0]?.title}\n`)

    // Step 2: Run seed (user should run: pnpm db:seed)
    console.log('2️⃣ Please run: pnpm db:seed')
    console.log('   (This will upsert the curriculum data)\n')

    // Step 3: Verify the custom course still exists
    console.log('3️⃣ Verifying custom data survived...')
    const testCourse = await db.query.courses.findFirst({
      where: eq(schema.courses.id, 999),
    })

    if (testCourse) {
      console.log(`   ✅ UPSERT WORKS! Custom course still exists: ${testCourse.title}`)
    } else {
      console.log(`   ❌ PROBLEM: Custom course was DELETED! Upsert may not be working.`)
    }

    // Step 4: Verify standard curriculum exists
    console.log('\n4️⃣ Verifying standard curriculum...')
    const pythonCourse = await db.query.courses.findFirst({
      where: eq(schema.courses.id, 1),
    })
    if (pythonCourse) {
      console.log(`   ✅ Python course exists: ${pythonCourse.title}`)
    }

    const pythonUnit = await db.query.units.findFirst({
      where: eq(schema.units.id, 1),
    })
    if (pythonUnit) {
      console.log(`   ✅ First unit exists: ${pythonUnit.title}`)
    }

    // Step 5: Summary
    console.log('\n📊 Summary:')
    const courseCount = await db.query.courses.findMany()
    const unitCount = await db.query.units.findMany()
    const lessonCount = await db.query.lessons.findMany()
    console.log(`   - Total Courses: ${courseCount.length}`)
    console.log(`   - Total Units: ${unitCount.length}`)
    console.log(`   - Total Lessons: ${lessonCount.length}`)

    if (testCourse && pythonCourse && pythonUnit) {
      console.log('\n✨ All tests PASSED! Upsert is working correctly.')
    }

  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  }
}

advancedSeedTest()
