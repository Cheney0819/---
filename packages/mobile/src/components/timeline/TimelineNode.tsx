import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface TimelineItem {
  id: string;
  type: 'message' | 'capsule' | 'shared_media' | 'milestone';
  timestamp: string;
  content: string;
  title?: string;
}

interface TimelineNodeProps {
  item: TimelineItem;
  isLast: boolean;
}

export const TimelineNode: React.FC<TimelineNodeProps> = ({ item, isLast }) => {
  const getIcon = () => {
    switch (item.type) {
      case 'capsule': return '💌';
      case 'shared_media': return '📷';
      case 'milestone': return '🎉';
      default: return '💬';
    }
  };

  const getIconColor = () => {
    switch (item.type) {
      case 'capsule': return '#ffd700';
      case 'shared_media': return '#4ade80';
      case 'milestone': return '#fed6e3';
      default: return '#a8edea';
    }
  };

  return (
    <View style={styles.nodeContainer}>
      {/* 左侧时间线逻辑 */}
      <View style={styles.leftLineContainer}>
        <View style={[styles.dot, { borderColor: getIconColor() }]}>
          <Text style={styles.dotIcon}>{getIcon()}</Text>
        </View>
        {!isLast && <View style={styles.verticalLine} />}
      </View>

      {/* 右侧卡片内容 */}
      <View style={styles.rightContentCard}>
        <Text style={styles.timeText}>
          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
        {item.title && <Text style={styles.nodeTitle}>{item.title}</Text>}
        <Text style={styles.nodeBody} numberOfLines={3}>{item.content}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  nodeContainer: {
    flexDirection: 'row',
    minHeight: 90,
    paddingHorizontal: 16,
  },
  leftLineContainer: {
    alignItems: 'center',
    marginRight: 14,
  },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#222733',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    borderWidth: 2,
    borderColor: '#30363d',
  },
  dotIcon: {
    fontSize: 14,
  },
  verticalLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#30363d',
    marginVertical: 4,
  },
  rightContentCard: {
    flex: 1,
    backgroundColor: '#161b22',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  timeText: {
    color: '#888',
    fontSize: 11,
    marginBottom: 4,
  },
  nodeTitle: {
    color: '#ffd700', 
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  nodeBody: {
    color: '#e6edf3',
    fontSize: 14,
    lineHeight: 20,
  },
});
