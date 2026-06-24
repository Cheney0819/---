'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { messageApi, pairApi, keysApi } from '@/lib/api';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useEncryption } from '@/contexts/EncryptionContext';
import { FadeIn } from '@/components/motion';
import { BackIcon, ShieldIcon, MoreIcon } from '@/components/icons';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SkeletonMessage } from '@/components/ui/Skeleton';
import { ChatBubble } from '@/components/chat/ChatBubble';
import { ChatInput } from '@/components/chat/ChatInput';

export default function ChatPage() {
  const { user, token, isAuthenticated } = useAuthStore();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [partner, setPartner] = useState<any>(null);
  const [partnerOnline, setPartnerOnline] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [partnerPublicKey, setPartnerPublicKey] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const params = useParams();
  const pairId = (params?.pairId as string) || "";

  // WebSocket 消息处理
  const handleWebSocketMessage = useCallback((data: any) => {
    switch (data.type) {
      case 'new_message':
        if (data.pairId === pairId && data.message) {
          setMessages(prev => [...prev, data.message]);
        }
        break;
      case 'user_online':
        setPartnerOnline(true);
        break;
      case 'user_offline':
        setPartnerOnline(false);
        break;
      case 'typing':
        setPartnerTyping(data.isTyping);
        break;
      case 'message_read':
        setMessages(prev => prev.map(msg => 
          msg.id === data.messageId ? { ...msg, readAt: new Date() } : msg
        ));
        break;
    }
  }, [pairId]);

  const { sendMessage: sendWsMessage } = useWebSocket(handleWebSocketMessage);
  const { encrypt } = useEncryption();

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    loadData();
  }, [isAuthenticated, pairId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadData = async () => {
    try {
      const [pairData, msgData] = await Promise.all([
        pairApi.list(token!),
        messageApi.list(pairId, token!),
      ]);
      
      const pair = pairData.pairs.find((p: any) => p.id === pairId);
      if (pair) {
        const p = pair.userA.id === user?.id ? pair.userB : pair.userA;
        setPartner(p);
        
        try {
          const { publicKey } = await keysApi.getPublicKey(p.id, token!);
          setPartnerPublicKey(publicKey);
        } catch (err) {
          console.log('Partner public key not found');
        }
      }
      
      setMessages(msgData.messages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (message: string) => {
    try {
      let encryptedContent = message;
      if (partnerPublicKey) {
        try {
          encryptedContent = await encrypt(message, partnerPublicKey);
        } catch (err) {
          console.error('Encryption failed:', err);
        }
      }
      
      const { message: newMsg } = await messageApi.send(pairId, encryptedContent, token!);
      setMessages(prev => [...prev, newMsg]);

      // 通过 WebSocket 通知对方，发送加密内容而非明文
      sendWsMessage({
        type: 'message',
        pairId,
        message: newMsg,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleTyping = (isTyping: boolean) => {
    sendWsMessage({ type: 'typing', pairId, isTyping });
  };

  if (!isAuthenticated) return null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-700 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-dark-800/90 backdrop-blur-xl border-b border-gray-800/50">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-dark-600 transition-colors text-gray-400 hover:text-white btn-tap">
            <BackIcon size={20} />
          </button>
          
          <div className="flex items-center gap-3 flex-1">
            <div className="relative">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-teal to-primary-pink flex items-center justify-center text-dark-900 font-bold shadow-lg shadow-primary-teal/20">
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto max-w-lg mx-auto w-full px-4 py-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonMessage key={i} isMe={i % 2 === 0} />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-24 h-24 bg-dark-600/30 rounded-3xl flex items-center justify-center mb-6 border border-gray-700/30">
              <ShieldIcon size={40} color="#a8edea" />
            </div>
            <p className="text-gray-300 font-medium text-lg mb-2">开始你们的加密对话</p>
            <p className="text-gray-500 text-sm">消息端到端加密，只有你们能看到</p>
          </div>
        ) : (
          <>
            {/* 加密提示 */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-dark-600/30 rounded-full text-gray-500 text-xs">
                <ShieldIcon size={12} color="#4ade80" />
                <span>消息已加密保护</span>
              </div>
            </div>
            
            {messages.map((msg, index) => (
              <ChatBubble
                key={msg.id}
                content={msg.content}
                isMe={msg.senderId === user?.id}
                timestamp={msg.createdAt}
                readAt={msg.readAt}
                index={index}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}

        {/* 正在输入指示器 */}
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

      {/* Input */}
      <ChatInput onSend={handleSend} onTyping={handleTyping} />
    </main>
  );
}
