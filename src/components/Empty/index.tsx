import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

interface EmptyProps {
  text?: string;
  icon?: string;
}

const Empty: React.FC<EmptyProps> = ({ text = '暂无数据', icon = '📭' }) => {
  return (
    <View className={styles.empty}>
      <View className={styles.emptyIcon}>
        <Text className={styles.emptyIconText}>{icon}</Text>
      </View>
      <Text className={styles.emptyText}>{text}</Text>
    </View>
  );
};

export default Empty;
