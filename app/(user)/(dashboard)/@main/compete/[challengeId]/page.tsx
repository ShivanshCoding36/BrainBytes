import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/db/drizzle'
import { challenges } from '@/db/schema'
import { and, eq } from 'drizzle-orm'
import { CompetitionRoom } from '@/components/user/compete/CompetitionRoom'

type Props = {
  params: {
    challengeId: number
  }
}

export default async function CompetePage({ params }: Props) {
  const { userId } = await auth()
  if (!userId) redirect('/')

  const challenge = await db.query.challenges.findFirst({
    where: and(
      eq(challenges.id, params.challengeId),
      eq(challenges.type, 'CODE')
    )
  })

  if (!challenge) {
    return <div>Coding challenge not found.</div>
  }

  return (
    <div className="w-full">
      <h1 className="text-3xl font-bold mb-4">{challenge.question}</h1>
      <CompetitionRoom challenge={challenge} />
    </div>
  )
}