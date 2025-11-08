import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/db/drizzle'
import { challenges } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { Button } from '@/components/ui/button'

export default async function CompeteListPage() {
  const { userId } = await auth()
  if (!userId) redirect('/')

  const codeChallenges = await db.query.challenges.findMany({
    where: eq(challenges.type, 'CODE'), //
    orderBy: (challenges, { asc }) => [asc(challenges.order)],
  })

  return (
    <div className="w-full max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Coding Challenges (PvP)
      </h1>
      <div className="space-y-4">
        {codeChallenges.length === 0 ? (
          <p className="text-center text-muted-foreground">
            No coding challenges available for competition right now.
          </p>
        ) : (
          codeChallenges.map((challenge) => (
            <Link
              href={`/compete/${challenge.id}`}
              key={challenge.id}
              className="block"
            >
              <Button
                variant="highlight"
                className="w-full h-auto py-4 flex justify-between items-center"
              >
                <span className="text-lg font-semibold">{challenge.question}</span>
              </Button>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}