'use client'

import { useState, useEffect, useTransition } from 'react'
import { ChallengeType, ChallengeMatchType } from '@/db/schema'
import { findOrJoinMatch, submitP2PChallenge, sendProgressUpdate } from '@/actions/challengeMatch'
import Editor from '@monaco-editor/react'
import Pusher from 'pusher-js'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useUser } from '@clerk/nextjs'

type Props = {
  challenge: ChallengeType
}

export function CompetitionRoom({ challenge }: Props) {
  const [match, setMatch] = useState<ChallengeMatchType | null>(null)
  const [status, setStatus] = useState<'idle' | 'waiting' | 'in_progress' | 'completed'>('idle')
  const [code, setCode] = useState(challenge.stubCodeJs || '// Start coding here')
  const [opponentCodeLength, setOpponentCodeLength] = useState(0)
  const [winnerId, setWinnerId] = useState<string | null>(null)
  const [isSubmitting, startSubmission] = useTransition()

  const { user } = useUser(); 
  const userId = user?.id;

  useEffect(() => {
    if (!match || !userId) return;

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_APP_KEY!, {
      cluster: process.env.PUSHER_CLUSTER!,
      authEndpoint: '/api/pusher/auth',
      auth: {
        params: { userId }
      }
    });

    const matchChannel = pusher.subscribe(`private-match-${match.id}`);

    const userChannel = pusher.subscribe(`private-match-${match.id}-user-${userId}`);

    matchChannel.bind('match-start', (data: { match: ChallengeMatchType }) => {
      setMatch(data.match);
      setStatus('in_progress');
      toast.success('Opponent found! The match has started.');
    });

    matchChannel.bind('match-over', (data: { winnerId: string }) => {
      setWinnerId(data.winnerId);
      setStatus('completed');
      toast.info(data.winnerId === userId ? 'You won!' : 'You lost!');
    });

    matchChannel.bind('opponent-progress', (data: { senderId: string, codeLength: number }) => {
      if (data.senderId !== userId) {
        setOpponentCodeLength(data.codeLength);
      }
    });

    userChannel.bind('submission-failed', (data: { results: any[] }) => {
       toast.error('Submission failed. Check your code and try again.');
    });

    return () => {
      pusher.unsubscribe(`private-match-${match.id}`);
      pusher.unsubscribe(`private-match-${match.id}-user-${userId}`);
      pusher.disconnect();
    }
  }, [match, userId]);

  useEffect(() => {
    if (status === 'idle' && challenge.id) {
      setStatus('waiting');
      toast.loading('Finding an opponent...');
      findOrJoinMatch(challenge.id)
        .then((result:any) => {
          setMatch(result.match);
          if (result.status === 'joined') {
            setStatus('in_progress');
            toast.success('Opponent found! The match has started.');
          } else {
            setStatus('waiting');
            toast.dismiss();
            toast('Waiting for an opponent to join...');
          }
        })
        .catch((err:any) => {
          toast.error(err.message);
          setStatus('idle');
        });
    }
  }, [status, challenge.id]);

  const handleCodeChange = (value: string | undefined) => {
    if (value === undefined) return;
    setCode(value);
    if (match && status === 'in_progress') {
      sendProgressUpdate(match.id, value);
    }
  }

  const handleSubmit = () => {
    if (!match) return;
    startSubmission(() => {
      toast.loading('Submitting and testing your solution...');
      submitP2PChallenge(match.id, code, 'javascript') // TODO: Remove the hardcoded language
        .then((res:any) => {
          toast.dismiss();
          if(res.error) toast.error(res.error);
        })
        .catch((err:any) => {
          toast.dismiss();
          toast.error(err.message)
        });
    });
  }

  if (status === 'waiting' || status === 'idle') {
    return (
      <div className="text-center p-10">
        <div className="text-2xl font-bold">Waiting for opponent...</div>
        <p className="text-muted-foreground">This may take a moment.</p>
        {/* TODO: Add a loading spinner here */}
      </div>
    )
  }

  if (status === 'completed' && winnerId) {
     return (
      <div className="text-center p-10">
        <div className="text-4xl font-bold mb-4">
          {winnerId === userId ? '🎉 You Won! 🎉' : '😥 You Lost 😥'}
        </div>
        <p>You gained 25 XP and 1 Gem!</p>
        {/* TODO: Link back to /learn or /compete */}
      </div>
     )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-card border rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-2">Problem</h2>
        {/* TODO: Use a markdown renderer for challenge.problemDescription */}
        <p className="text-muted-foreground">{challenge.problemDescription}</p>
      </div>

      <div className="space-y-4">
        <div className="bg-card border rounded-lg p-4">
            <h3 className="text-lg font-semibold">Opponent Status</h3>
            <p className="text-sm text-muted-foreground">Progress: {opponentCodeLength} characters</p>
        </div>

        <div className="h-[400px] border rounded-lg overflow-hidden">
          <Editor
            height="400px"
            language="javascript"
            theme={document.documentElement.classList.contains('dark') ? 'vs-dark' : 'light'}
            value={code}
            onChange={handleCodeChange}
            options={{ minimap: { enabled: false } }}
          />
        </div>

        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting || status !== 'in_progress'}
          variant="primary" 
          size="lg" 
          className="w-full"
        >
          {isSubmitting ? 'Testing...' : 'Submit Solution'}
        </Button>
      </div>
    </div>
  )
}