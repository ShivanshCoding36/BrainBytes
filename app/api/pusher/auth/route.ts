import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import Pusher from 'pusher'

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
})

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const body = await req.formData()
  const socketId = body.get('socket_id') as string
  const channel = body.get('channel_name') as string

  if (!channel.includes(userId)) {
     return new NextResponse('Forbidden', { status: 403 })
  }

  const userData = {
    user_id: userId,
  }

  const authResponse = pusher.authorizeChannel(socketId, channel, userData)
  return NextResponse.json(authResponse)
}