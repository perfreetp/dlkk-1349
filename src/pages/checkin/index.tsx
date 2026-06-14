import React, { useMemo } from 'react';
import { View, Text, ScrollView, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useUserStore } from '@/store/userStore';
import { mockLocations } from '@/data/mockLocations';
import Empty from '@/components/Empty';
import styles from './index.module.scss';

const CheckinPage: React.FC = () => {
  const checkIns = useUserStore((state) => state.checkIns);

  const allStamps = [
    { id: 'study', name: '自习', icon: '📚' },
    { id: 'food', name: '美食', icon: '🍜' },
    { id: 'activity', name: '活动', icon: '🎉' },
    { id: 'walk', name: '散步', icon: '🚶' },
    { id: 'explore', name: '探索', icon: '🔍' },
    { id: 'early', name: '早起', icon: '🌅' },
    { id: 'night', name: '夜读', icon: '🌙' },
    { id: 'sport', name: '运动', icon: '⚽' },
    { id: 'read', name: '阅读', icon: '📖' },
    { id: 'social', name: '社交', icon: '👥' },
  ];

  const collectedStamps = useMemo(() => {
    const types = new Set(checkIns.map((c) => {
      const loc = mockLocations.find((l) => l.id === c.locationId);
      return loc?.category || 'explore';
    }));
    if (checkIns.length > 0) types.add('explore');
    return types;
  }, [checkIns]);

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.stats}>
        <Text className={styles.statsNumber}>{checkIns.length}</Text>
        <Text className={styles.statsLabel}>累计打卡次数</Text>
      </View>

      <View className={styles.stampSection}>
        <Text className={styles.sectionTitle}>
          🏆 已收集徽章 {collectedStamps.size}/{allStamps.length}
        </Text>
        <View className={styles.stampGrid}>
          {allStamps.map((stamp) => {
            const collected = collectedStamps.has(stamp.id);
            return (
              <View
                key={stamp.id}
                className={classnames(
                  styles.stampItem,
                  collected && styles.stampItemCollected
                )}
              >
                <Text className={styles.stampIcon}>{stamp.icon}</Text>
                <Text
                  className={classnames(
                    styles.stampText,
                    collected && styles.stampTextCollected
                  )}
                >
                  {stamp.name}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      <View className={styles.historySection}>
        <Text className={styles.sectionTitle}>📋 打卡记录</Text>
        {checkIns.length > 0 ? (
          checkIns.map((item) => (
            <View
              key={item.id}
              className={styles.checkinItem}
              onClick={() => Taro.navigateTo({ url: `/pages/detail/index?id=${item.locationId}` })}
            >
              <Image
                className={styles.checkinStamp}
                src={item.stampUrl}
                mode="aspectFill"
                onError={(e) => console.error('[CheckinPage] Stamp error:', e.detail)}
              />
              <View className={styles.checkinInfo}>
                <Text className={styles.checkinName}>{item.locationName}</Text>
                <Text className={styles.checkinTime}>{item.checkInTime}</Text>
              </View>
              <Text className={styles.checkinArrow}>›</Text>
            </View>
          ))
        ) : (
          <Empty text="还没有打卡记录，快去探索吧" icon="📌" />
        )}
      </View>
    </ScrollView>
  );
};

export default CheckinPage;
