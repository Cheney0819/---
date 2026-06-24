import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming, 
  withSequence,
  runOnJS 
} from 'react-native-reanimated';
import { TimeCapsule } from '@shiguangjian/shared/types';

const { width } = Dimensions.get('window');

interface CapsuleRevealProps {
  capsule: TimeCapsule;
  onOpenComplete: () => void;
}

export const CapsuleReveal: React.FC<CapsuleRevealProps> = ({ capsule, onOpenComplete }) => {
  const [isOpened, setIsOpened] = useState(capsule.status === 'read');
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const contentAlpha = useSharedValue(capsule.status === 'read' ? 1 : 0);

  const handleOpen = () => {
    if (isOpened || capsule.status === 'pending') return;

    // 触发震动或微光动画
    scale.value = withSequence(
      withSpring(1.15),
      withTiming(0, { duration: 400 }, (finished) => {
        if (finished) {
          runOnJS(setIsOpened)(true);
          contentAlpha.value = withTiming(1, { duration: 500 });
          runOnJS(onOpenComplete)();
        }
      })
    );
    opacity.value = withTiming(0, { duration: 350 });
  };

  const coverAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentAlpha.value,
  }));

  // 计算倒计时
  const getCountdown = () => {
    if (capsule.status !== 'pending') return null;
    const triggerTime = new Date(capsule.triggerTime).getTime();
    const now = Date.now();
    const diff = triggerTime - now;
    
    if (diff <= 0) return '即将送达';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}天 ${hours}小时后送达`;
    return `${hours}小时后送达`;
  };

  return (
    <View style={styles.container}>
      {!isOpened && (
        <Animated.View style={[styles.cardCover, coverAnimatedStyle]}>
          <TouchableOpacity 
            style={styles.touchArea} 
            onPress={handleOpen}
            disabled={capsule.status === 'pending'}
          >
            <Text style={styles.icon}>💌</Text>
            <Text style={styles.title}>
              {capsule.status === 'pending' ? '过去寄来的秘密胶囊' : '点开 ta 给你的未来回响'}
            </Text>
            {capsule.status === 'pending' && (
              <View style={styles.lockBadge}>
                <Text style={styles.lockText}>🔒 {getCountdown()}</Text>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
      )}

      {isOpened && (
        <Animated.View style={[styles.contentCard, contentAnimatedStyle]}>
          <Text style={styles.meta}>来自过去的声音：</Text>
          <Text style={styles.contentText}>{capsule.content}</Text>
          <Text style={styles.dateStamp}>
            写入于: {new Date(capsule.createdAt).toLocaleDateString()}
          </Text>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 250,
    width: '100%',
    padding: 16,
  },
  cardCover: {
    width: width * 0.85,
    height: 200,
    backgroundColor: '#161b22',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ffd700', 
    justifyContent: 'center',
    alignItems: 'center',
  },
  touchArea: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  icon: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  lockBadge: {
    marginTop: 12,
    backgroundColor: '#222733',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  lockText: {
    color: '#888',
    fontSize: 12,
  },
  contentCard: {
    width: width * 0.85,
    backgroundColor: '#1a1a2e', 
    borderRadius: 20,
    padding: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#fed6e3',
  },
  meta: {
    color: '#a8edea',
    fontSize: 12,
    marginBottom: 8,
  },
  contentText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 26,
  },
  dateStamp: {
    color: '#586069',
    fontSize: 11,
    textAlign: 'right',
    marginTop: 16,
  },
});
