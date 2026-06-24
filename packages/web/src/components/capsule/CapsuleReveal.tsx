'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CapsuleRevealProps {
  isOpened: boolean;
  content: string;
  onOpen: () => void;
}

export function CapsuleReveal({ isOpened, content, onOpen }: CapsuleRevealProps) {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (isOpened) {
      setTimeout(() => setShowContent(true), 500);
    }
  }, [isOpened]);

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* 未打开状态 - 胶囊卡片 */}
      {!showContent && (
        <motion.div
          initial={{ scale: 1, opacity: 1 }}
          animate={isOpened ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-3xl p-8 text-center cursor-pointer hover:shadow-lg hover:shadow-yellow-500/20 transition-shadow"
          onClick={onOpen}
        >
          <div className="text-6xl mb-4">💌</div>
          <p className="text-white font-semibold text-lg mb-2">来自过去的信</p>
          <p className="text-gray-400 text-sm">点击打开时间胶囊</p>
        </motion.div>
      )}

      {/* 打开后的效果 */}
      <AnimatePresence>
        {isOpened && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.3 }}
          >
            {/* 光效扩散 */}
            <motion.div
              initial={{ scale: 0, opacity: 0.8 }}
              animate={{ scale: 3, opacity: 0 }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="absolute inset-0 bg-gradient-to-r from-yellow-500/30 to-orange-500/30 rounded-full blur-3xl"
            />
            
            {/* 内容卡片 */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="relative bg-dark-600/50 border border-gray-700/30 rounded-3xl p-8 backdrop-blur-xl"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-2xl flex items-center justify-center">
                  <span className="text-3xl">💌</span>
                </div>
                <p className="text-white font-semibold text-lg">来自过去的信</p>
              </div>
              
              <div className="bg-dark-700/50 rounded-2xl p-6 border-l-4 border-yellow-500">
                <p className="text-gray-200 leading-relaxed">{content}</p>
              </div>
              
              <div className="mt-6 text-center">
                <p className="text-gray-500 text-sm">写于 {new Date().toLocaleDateString()}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
