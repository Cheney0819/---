'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { messageApi, pairApi, uploadApi } from '@/lib/api';
import { useWebSocket } from '@/hooks/useWebSocket';
import { FadeIn, SlideIn } from '@/components/motion';
import { BackIcon, SendIcon, ShieldIcon, ImageIcon, MicIcon, PhotoIcon } from '@/components/icons';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SkeletonMessage } from '@/components/ui/Skeleton';
import { NotificationBanner } from '@/components/ui/NotificationBanner';
import { UPLOAD_CONSTANTS } from '@/lib/constants';

export default function ChatPage() {
  const { user, token, isAuthenticated } = useAuthStore();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [partner, setPartner] = useState<any>(null);
  const [partnerOnline, setPartnerOnline] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const router = useRouter();
  const params = useParams();
  const pairId = (params?.pairId as string) || "";

  const handleWebSocketMessage = (data: any) => {
    console.log('WebSocket message received:', data);
    
    switch (data.type) {
      case 'new_message':
        // 收到新消息通知，重新拉取消息列表（不直接追加，避免重复）
        if (data.pairId === pairId) {
          loadMessages();
          if (data.message?.senderId !== user?.id) {
            setNotification(`收到来自 ${partner?.displayName || 'ta'} 的新消息`);
          }
        }
        break;
      case 'user_online':
        if (data.userId !== user?.id) {
          setPartnerOnline(true);
        }
        break;
      case 'user_offline':
        if (data.userId !== user?.id) {
          setPartnerOnline(false);
        }
        break;
      case 'partner_status':
        if (data.partnerId === partner?.id) {
          setPartnerOnline(data.online);
        }
        break;
      case 'typing':
        if (data.userId !== user?.id) {
          setPartnerTyping(data.isTyping);
        }
        break;
    }
  };

  const { sendMessage: sendWsMessage } = useWebSocket(handleWebSocketMessage);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    loadData();
  }, [isAuthenticated, pairId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 清理录音资源
  useEffect(() => {
    return () => {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const loadMessages = async () => {
    try {
      const msgData = await messageApi.list(pairId, token!);
      setMessages(msgData.messages);
    } catch (err) {
      console.error(err);
    }
  };

  const loadData = async () => {
    try {
      const [pairData, msgData] = await Promise.all([
        pairApi.list(token!),
        messageApi.list(pairId, token!),
      ]);
      const pair = pairData.pairs.find((p: any) => p.id === pairId);
      if (pair) {
        setPartner(pair.userA.id === user?.id ? pair.userB : pair.userA);
      }
      setMessages(msgData.messages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      const { message } = await messageApi.send(pairId, input.trim(), token!, 'text', []);
      setMessages(prev => [...prev, message]);
      // WebSocket 只发 typing 通知，不发完整消息，避免重复
      sendWsMessage({ type: 'message', pairId, message: input.trim() });
      setInput('');
    } catch (err: any) {
      const msg = err.message;
      const displayMsg = (/^[\x00-\x7F]+$/.test(msg) || msg.includes("database") || msg.includes("connection")
        ? "发送失败，请稍后重试" : msg) || '发送失败';
      setNotification(displayMsg);
    } finally {
      setSending(false);
    }
  };

  // 上传图片
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    if (!(UPLOAD_CONSTANTS.ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
      setNotification('只支持 JPG/PNG/GIF/WebP 格式的图片');
      return;
    }

    setUploading(true);
    try {
      const result = await uploadApi.file(file, token);
      const { message } = await messageApi.send(pairId, '', token!, 'image', [result.url]);
      setMessages(prev => [...prev, message]);
      sendWsMessage({ 
        type: 'message', 
        pairId, 
        message: '[图片]', 
        contentType: 'image', 
        mediaUrls: [result.url] 
      });
    } catch (err: any) {
      console.error('Upload error:', err);
      setNotification(err.message || '图片上传失败');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  // 开始录音
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        // 60秒限制：在 onstop 前检查，避免无效录音
        if (recordTime > 60) {
          setNotification('语音最长 60 秒');
          stream.getTracks().forEach(t => t.stop());
          audioChunksRef.current = []; // 丢弃无效录音
          return;
        }

        // 录音太短（< 0.5秒）视为误触
        if (recordTime < 1 && audioChunksRef.current.length > 0) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
        
        setUploading(true);
        try {
          const result = await uploadApi.file(audioFile, token!);
          const { message } = await messageApi.send(pairId, '', token!, 'voice', [result.url]);
          setMessages(prev => [...prev, message]);
          sendWsMessage({ 
            type: 'message', 
            pairId, 
            message: '[语音]', 
            contentType: 'voice', 
            mediaUrls: [result.url] 
          });
        } catch (err: any) {
          console.error('Voice upload error:', err);
          setNotification(err.message || '语音上传失败');
        } finally {
          setUploading(false);
          stream.getTracks().forEach(t => t.stop());
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordTime(0);
      
      recordTimerRef.current = setInterval(() => {
        setRecordTime(prev => {
          if (prev >= 59) {
            // 到达 59 秒时自动停止录音
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
              mediaRecorderRef.current.stop();
            }
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: any) {
      setNotification('无法访问麦克风，请检查权限');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    setIsRecording(false);
    setRecordTime(0);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  if (!isAuthenticated) return null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-700 flex flex-col">
      {notification && (
        <NotificationBanner message={notification} type="info" onClose={() => setNotification(null)} />
      )}

      <header className="sticky top-0 z-10 glass-strong">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-dark-600 transition-colors text-gray-400 hover:text-white btn-tap">
            <BackIcon size={20} />
          </button>
          <div className="flex items-center gap-3 flex-1">
            <div className="relative">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-teal to-primary-pink flex items-center justify-center text-dark-900 font-bold">
                {partner ? (partner.displayName || partner.username)[0].toUpperCase() : '?'}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5">
                <StatusBadge status={partnerOnline ? 'online' : 'offline'} size="sm" />
              </div>
            </div>
            <div>
              <p className="text-white font-semibold">{partner?.displayName || partner?.username || '加载中...'}</p>
              <p className="text-gray-500 text-xs">{partnerOnline ? '在线' : '离线'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 rounded-full">
            <ShieldIcon size={14} color="#4ade80" />
            <span className="text-xs text-green-400 font-medium">E2E</span>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto max-w-lg mx-auto w-full px-4 py-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => <SkeletonMessage key={i} isMe={i % 2 === 0} />)}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-24 h-24 bg-dark-600/30 rounded-2xl flex items-center justify-center mb-6 border border-gray-700/30">
              <ShieldIcon size={40} color="#a8edea" />
            </div>
            <p className="text-gray-300 font-medium text-lg mb-2">开始你们的加密对话</p>
            <p className="text-gray-500 text-sm">消息端到端加密，只有你们能看到</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-dark-600/30 rounded-full text-gray-500 text-xs">
                <ShieldIcon size={12} color="#4ade80" />
                <span>消息已加密保护</span>
              </div>
            </div>
            
            {messages.map((msg, index) => {
              const isImage = msg.contentType === 'image' && msg.mediaUrls?.length > 0;
              const isVoice = msg.contentType === 'voice' && msg.mediaUrls?.length > 0;
              
              return (
                <SlideIn key={msg.id} direction={msg.senderId === user?.id ? 'right' : 'left'} delay={index < 10 ? index * 50 : 0}>
                  <div className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'} mb-3`}>
                    <div className={`max-w-[75%]`}>
                      {isImage ? (
                        <div className={`rounded-2xl overflow-hidden ${
                          msg.senderId === user?.id 
                            ? 'rounded-tr-md shadow-lg shadow-primary-teal/10' 
                            : 'rounded-tl-md border border-gray-700/30'
                        }`}>
                          <img 
                            src={msg.mediaUrls[0]} 
                            alt="图片" 
                            className="max-w-full max-h-64 object-cover"
                            loading="lazy"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      ) : isVoice ? (
                        <div className={`px-4 py-3 rounded-2xl ${
                          msg.senderId === user?.id 
                            ? 'bg-gradient-to-br from-primary-teal to-primary-teal/80 text-dark-900 rounded-tr-md shadow-lg shadow-primary-teal/10' 
                            : 'bg-dark-600/80 text-white rounded-tl-md border border-gray-700/30'
                        }`}>
                          <div className="flex items-center gap-2">
                            <button 
                              className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                              onClick={() => {
                                const audio = new Audio(msg.mediaUrls[0]);
                                audio.play();
                              }}
                            >
                              ▶
                            </button>
                            <span className="text-sm">语音消息</span>
                          </div>
                        </div>
                      ) : (
                        <div className={`px-4 py-3 rounded-2xl ${
                          msg.senderId === user?.id 
                            ? 'bg-gradient-to-br from-primary-teal to-primary-teal/80 text-dark-900 rounded-tr-md shadow-lg shadow-primary-teal/10' 
                            : 'bg-dark-600/80 text-white rounded-tl-md border border-gray-700/30'
                        }`}>
                          <p className="text-sm leading-relaxed">{msg.content}</p>
                        </div>
                      )}
                      <div className={`flex items-center gap-1 mt-1 ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-gray-600 text-xs">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {msg.senderId === user?.id && (
                          <span className={`text-xs ${msg.readAt ? 'text-primary-teal' : 'text-gray-500'}`}>
                            {msg.readAt ? '✓✓' : '✓'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </SlideIn>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}

        {partnerTyping && (
          <div className="flex items-center gap-2 text-gray-500 text-sm py-2 px-4">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-primary-teal/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-primary-teal/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-primary-teal/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span>{partner?.displayName || '对方'} 正在输入...</span>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 glass-strong">
        <form onSubmit={handleSend} className="max-w-lg mx-auto px-4 py-3 flex gap-2 items-center">
          <input
            ref={fileInputRef}
            type="file"
            accept={UPLOAD_CONSTANTS.ALLOWED_IMAGE_TYPES.join(',')}
            onChange={handleImageUpload}
            className="hidden"
          />
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-11 h-11 flex items-center justify-center rounded-xl bg-dark-600/50 border border-gray-700/50 text-gray-400 hover:text-white hover:bg-dark-600 transition-all disabled:opacity-50 btn-tap"
            title="发送图片"
          >
            <PhotoIcon size={18} color={uploading ? '#ef4444' : '#9ca3af'} />
          </button>
          
          {isRecording ? (
            <button
              type="button"
              onClick={stopRecording}
              className="h-11 px-4 flex items-center gap-2 rounded-xl bg-red-500/20 border border-red-500/50 text-red-400 animate-pulse btn-tap"
            >
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              <span className="text-sm font-mono">{formatTime(recordTime)}</span>
            </button>
          ) : (
            <button
              type="button"
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              className="w-11 h-11 flex items-center justify-center rounded-xl bg-dark-600/50 border border-gray-700/50 text-gray-400 hover:text-white hover:bg-dark-600 transition-all btn-tap"
              title="按住说话"
            >
              <MicIcon size={18} color="#9ca3af" />
            </button>
          )}
          
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入消息..."
            className="flex-1 px-5 py-3 bg-dark-600/50 border border-gray-700/50 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-teal/50 transition-all duration-300"
            disabled={sending || uploading}
          />
          
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="w-12 h-12 bg-gradient-to-r from-primary-teal to-primary-teal/80 text-dark-900 rounded-xl flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg hover:shadow-primary-teal/25 active:scale-95 btn-tap"
          >
            <SendIcon size={20} />
          </button>
        </form>
      </div>
    </main>
  );
}
