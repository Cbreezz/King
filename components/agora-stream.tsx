'use client';

import { useEffect, useRef, useState } from 'react';
import AgoraRTC, {
  IAgoraRTCClient,
  ILocalAudioTrack,
  ILocalVideoTrack,
  IAgoraRTCRemoteUser,
  IMicrophoneAudioTrack,
  ICameraVideoTrack,
} from 'agora-rtc-sdk-ng';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSession } from 'next-auth/react';
import { Heart, Send } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '@/contexts/socket-context';

const createAgoraClient = () =>
  AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });

const createLocalTracks = (): Promise<[IMicrophoneAudioTrack, ICameraVideoTrack]> =>
  AgoraRTC.createMicrophoneAndCameraTracks();

const getChannelNameFromDjId = (djId: string) => `channel-${djId}`;

const joinChannel = async (
  client: IAgoraRTCClient,
  channelName: string,
  uid: string | number,
  token: string
) => {
  const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
  if (!appId) {
    throw new Error(
      'Missing NEXT_PUBLIC_AGORA_APP_ID. Please set it in your environment.'
    );
  }
  await client.join(appId, channelName, token, uid);
  return true;
};

interface StreamComment {
  id: string;
  text: string;
  userName: string;
  userImage?: string;
  timestamp: number;
}

interface AgoraStreamProps {
  djId: string;
  isHost?: boolean;
  onStreamStarted?: () => void;
  onStreamEnded?: () => void;
}

export function AgoraStream({
  djId,
  isHost = false,
  onStreamStarted,
  onStreamEnded,
}: AgoraStreamProps) {
  const { data: session } = useSession();
  const { socket } = useSocket();

  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState<StreamComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showHearts, setShowHearts] = useState<{ id: string; x: number }[]>([]);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const tracksRef = useRef<{
    audioTrack?: ILocalAudioTrack;
    videoTrack?: ILocalVideoTrack;
  }>({});

  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);

  // ========== SOCKETS ==========
  useEffect(() => {
    if (!socket || !isStreaming) return;

    const handleLike = () => {
      const id = Math.random().toString();
      const x = Math.random() * 100;
      setLikeCount((prev) => prev + 1);
      setShowHearts((prev) => [...prev, { id, x }]);
      setTimeout(() => {
        setShowHearts((prev) => prev.filter((h) => h.id !== id));
      }, 2000);
    };

    const handleComment = (comment: StreamComment) => {
      setComments((prev) => [...prev, comment]);
    };

    socket.on(`stream:${djId}:like`, handleLike);
    socket.on(`stream:${djId}:comment`, handleComment);

    return () => {
      socket.off(`stream:${djId}:like`, handleLike);
      socket.off(`stream:${djId}:comment`, handleComment);
    };
  }, [socket, djId, isStreaming]);

  // ========== CLIENT INIT ==========
  useEffect(() => {
    clientRef.current = createAgoraClient();

    if (!isHost && clientRef.current) {
      clientRef.current.on(
        'user-published',
        async (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
          await clientRef.current?.subscribe(user, mediaType);

          if (mediaType === 'video' && remoteVideoRef.current) {
            user.videoTrack?.play(remoteVideoRef.current);
          }
          if (mediaType === 'audio') {
            user.audioTrack?.play();
          }
        }
      );
    }

    return () => {
      clientRef.current?.removeAllListeners();
    };
  }, [isHost]);

  // ========== TOKEN FETCH ==========
  async function fetchAgoraToken(
    channelName: string,
    uid: string | number,
    role: 'host' | 'audience'
  ) {
    const url = `/api/agora/token?channelName=${encodeURIComponent(
      channelName
    )}&uid=${uid}&role=${role}`;

    try {
      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        console.error('[Agora] Token error:', data?.error);
        setDebugInfo(data);
        throw new Error(data.error || 'Token error');
      }

      setDebugInfo(data.debug);
      return data.token;
    } catch (err: any) {
      console.error('[Agora] Failed to fetch token:', err);
      const message =
        typeof err?.message === 'string' ? err.message : 'Failed to fetch Agora token';
      toast.error(message);
      throw err;
    }
  }

  // ========== START ==========
  const startStream = async () => {
    if (!clientRef.current) return;

    try {
      setIsLoading(true);

      const [audioTrack, videoTrack] = await createLocalTracks();
      tracksRef.current = { audioTrack, videoTrack };

      const channelName = getChannelNameFromDjId(djId);
      // Ensure Agora receives a numeric UID to avoid SDK warnings
      const parsedUserId = Number(session?.user?.id);
      const uid = !Number.isNaN(parsedUserId)
        ? parsedUserId
        : Math.floor(Math.random() * 10_000_000);
      const role = isHost ? 'host' : 'audience';

      const token = await fetchAgoraToken(channelName, uid, role);
      await joinChannel(clientRef.current, channelName, uid, token);

      // Set client role explicitly for live mode (required by Agora)
      await clientRef.current.setClientRole(role === 'host' ? 'host' : 'audience');

      // Hosts: enable dual-stream so viewers on poor networks get a low-res feed automatically
      if (isHost) {
        await clientRef.current.enableDualStream();
        await clientRef.current.setLowStreamParameter({
          width: 640,
          height: 360,
          framerate: 15,
          bitrate: 400,
        });
      }

      if (isHost && localVideoRef.current) {
        // Increase video quality before publishing (720p, 30fps, higher bitrate)
        await videoTrack.setEncoderConfiguration({
          width: 1280,
          height: 720,
          frameRate: 30,
          bitrateMax: 2000,
        });
        await clientRef.current.publish([audioTrack, videoTrack]);
        videoTrack.play(localVideoRef.current);
      }

      setIsStreaming(true);
      onStreamStarted?.();
      toast.success(isHost ? 'Stream started!' : 'Joined stream!');
    } catch (err: any) {
      console.error('[Agora] Error starting stream:', err);

      // Clean up any created tracks if we failed after creating them
      if (tracksRef.current.audioTrack) {
        tracksRef.current.audioTrack.close();
      }
      if (tracksRef.current.videoTrack) {
        tracksRef.current.videoTrack.close();
      }
      tracksRef.current = {};

      try {
        await clientRef.current?.leave();
      } catch {}

      const message =
        typeof err?.message === 'string'
          ? err.message
          : 'Error starting stream. Please check camera/mic permissions and try again.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // ========== STOP ==========
  const stopStream = async () => {
    if (!clientRef.current) return;

    try {
      setIsLoading(true);

      if (isHost && tracksRef.current.audioTrack && tracksRef.current.videoTrack) {
        await clientRef.current.unpublish([
          tracksRef.current.audioTrack,
          tracksRef.current.videoTrack,
        ]);
      }

      tracksRef.current.audioTrack?.close();
      tracksRef.current.videoTrack?.close();
      tracksRef.current = {};

      await clientRef.current.leave();

      setIsStreaming(false);
      onStreamEnded?.();
      toast.success(isHost ? 'Stream ended' : 'Left stream');
    } catch {
      toast.error('Failed to stop stream');
    } finally {
      setIsLoading(false);
    }
  };

  // ========== UI EVENTS ==========
  const handleSendLike = () => {
    if (!socket || !session?.user) return;
    socket.emit('stream:like', { djId });
  };

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !session?.user || !newComment.trim()) return;

    const comment: StreamComment = {
      id: Math.random().toString(),
      text: newComment.trim(),
      userName: session.user.name || 'Anonymous',
      userImage: session.user.image || undefined,
      timestamp: Date.now(),
    };

    socket.emit('stream:comment', { djId, comment });
    setNewComment('');
  };

  return (
    <div className="space-y-4">
      {process.env.NODE_ENV === 'development' && debugInfo && (
        <div className="bg-gray-100 p-4 rounded-lg text-sm">
          <h3 className="font-semibold mb-2">Debug Info:</h3>
          <pre className="text-xs">{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
      )}

      <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-900">
        <div ref={isHost ? localVideoRef : remoteVideoRef} className="absolute inset-0">
          {!isStreaming && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-white text-lg">
                {isHost ? 'Start streaming to go live' : 'Waiting for stream...'}
              </p>
            </div>
          )}
        </div>

        <AnimatePresence>
          {showHearts.map((heart) => (
            <motion.div
              key={heart.id}
              initial={{ opacity: 1, scale: 1, y: 0, x: heart.x + '%' }}
              animate={{ y: -100, scale: 1.5 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: 2, ease: 'easeOut' }}
              className="absolute bottom-4"
            >
              <Heart className="w-6 h-6 text-red-500 fill-current" />
            </motion.div>
          ))}
        </AnimatePresence>

        {isStreaming && !isHost && (
          <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2">
            <Button variant="secondary" size="icon" onClick={handleSendLike}>
              <Heart className="w-5 h-5 text-red-500" />
            </Button>
            <span className="text-white text-sm bg-black/50 px-2 py-1 rounded">
              {likeCount} likes
            </span>
          </div>
        )}
      </div>

      {isHost ? (
        <div className="flex justify-center">
          <Button
            onClick={isStreaming ? stopStream : startStream}
            disabled={isLoading}
            variant={isStreaming ? 'destructive' : 'default'}
            className="w-40"
          >
            {isLoading ? 'Loading...' : isStreaming ? 'Stop Stream' : 'Start Stream'}
          </Button>
        </div>
      ) : (
        isStreaming && (
          <div className="space-y-4">
            <ScrollArea className="h-[200px] rounded-md border p-4">
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex items-start gap-3">
                    <Avatar className="w-8 h-8">
                      {comment.userImage && <AvatarImage src={comment.userImage} />}
                      <AvatarFallback>{comment.userName[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-semibold text-sm">{comment.userName}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(comment.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm">{comment.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <form onSubmit={handleSendComment} className="flex gap-2">
              <Input
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" size="icon">
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        )
      )}
    </div>
  );
}
