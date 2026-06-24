import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Message } from '@shiguangjian/shared/types';

const { width } = Dimensions.get('window');

interface MessageBubbleProps {
  message: Message;
  isMe: boolean;
  isDecrypting?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  message, 
  isMe, 
  isDecrypting = false 
}) => {
  return (
    <View style={[styles.container, isMe ? styles.myContainer : styles.partnerContainer]}>
      <View style={[
        styles.bubble,
        isMe ? styles.myBubble : styles.partnerBubble,
        message.contentType === 'image' && styles.imageBubble
      ]}>
        {isDecrypting ? (
          <Text style={styles.decryptingText}>🔒 正在安全解密...</Text>
        ) : (
          <Text style={isMe ? styles.myText : styles.partnerText}>
            {message.content}
          </Text>
        )}
        
        {/* 已读状态微型回执 */}
        {isMe && (
          <Text style={styles.readStatus}>
            {message.readAt ? '已阅' : '送达'}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
    flexDirection: 'row',
    width: '100%',
  },
  myContainer: {
    justifyContent: 'flex-end',
    paddingRight: 12,
  },
  partnerContainer: {
    justifyContent: 'flex-start',
    paddingLeft: 12,
  },
  bubble: {
    maxWidth: width * 0.7,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  myBubble: {
    backgroundColor: '#fed6e3', 
    borderTopRightRadius: 4,
  },
  partnerBubble: {
    backgroundColor: '#222733', 
    borderTopLeftRadius: 4,
  },
  imageBubble: {
    padding: 0,
    overflow: 'hidden',
  },
  myText: {
    color: '#0d1117',
    fontSize: 16,
    lineHeight: 22,
  },
  partnerText: {
    color: '#ffffff',
    fontSize: 16,
    lineHeight: 22,
  },
  decryptingText: {
    color: '#888',
    fontStyle: 'italic',
    fontSize: 14,
  },
  readStatus: {
    position: 'absolute',
    bottom: -16,
    right: 4,
    fontSize: 10,
    color: '#586069',
  }
});
