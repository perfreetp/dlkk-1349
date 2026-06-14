import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Image, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useUserStore } from '@/store/userStore';
import { mockLocations, mockCheckIns, mockCourseGaps } from '@/data/mockLocations';
import { formatCategory } from '@/utils/distance';
import Empty from '@/components/Empty';
import styles from './index.module.scss';

const MinePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'favorite' | 'checkin'>('favorite');
  const favorites = useUserStore((state) => state.favorites);
  const checkIns = useUserStore((state) => state.checkIns);

  const favoriteLocations = useMemo(() => {
    return mockLocations.filter((loc) =>
      favorites.some((f) => f.locationId === loc.id)
    );
  }, [favorites]);

  const todayGap = useMemo(() => {
    const today = new Date().getDay();
    return mockCourseGaps.find((g) => g.weekday === today);
  }, []);

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

  const handleGapRecommend = () => {
    Taro.showModal({
      title: '课程空档推荐',
      content: '根据你今天的课程空档，为你推荐附近的短途路线：后山环湖步道散步（预计30分钟）',
      confirmText: '去看看',
      success: (res) => {
        if (res.confirm) {
          const walkLoc = mockLocations.find((l) => l.category === 'walk');
          if (walkLoc) {
            Taro.navigateTo({ url: `/pages/detail/index?id=${walkLoc.id}` });
          }
        }
      },
    });
    console.log('[MinePage] Course gap recommend clicked');
  };

  const handleMenuItemClick = (key: string) => {
    console.log('[MinePage] Menu item clicked:', key);
    switch (key) {
      case 'checkin':
        Taro.navigateTo({ url: '/pages/checkin/index' });
        break;
      case 'comment':
        Taro.navigateTo({ url: '/pages/comment/index?mode=list' });
        break;
      case 'report':
        Taro.showToast({ title: '失效报错功能', icon: 'none' });
        break;
      case 'settings':
        Taro.showToast({ title: '设置功能开发中', icon: 'none' });
        break;
      default:
        Taro.showToast({ title: '功能开发中', icon: 'none' });
    }
  };

  const menuItems = [
    { key: 'checkin', name: '打卡记录', desc: '查看你的打卡足迹', icon: '📌' },
    { key: 'comment', name: '我的评价', desc: '管理你的评论', icon: '💬' },
    { key: 'report', name: '失效报错', desc: '反馈地点信息错误', icon: '⚠️' },
    { key: 'settings', name: '设置', desc: '隐私与通知设置', icon: '⚙️' },
  ];

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.header}>
        <View className={styles.userInfo}>
          <View className={styles.avatar}>
            <Text>🎓</Text>
          </View>
          <View>
            <Text className={styles.userName}>同学你好</Text>
            <Text className={styles.userDesc}>已发现 {favorites.length} 个宝藏地点</Text>
          </View>
        </View>
        <View className={styles.stats}>
          <View className={styles.statItem}>
            <Text className={styles.statNumber}>{favorites.length}</Text>
            <Text className={styles.statLabel}>收藏</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statNumber}>{checkIns.length}</Text>
            <Text className={styles.statLabel}>打卡</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statNumber}>{collectedStamps.size}</Text>
            <Text className={styles.statLabel}>徽章</Text>
          </View>
        </View>
      </View>

      <View className={styles.content}>
        {todayGap && (
          <View className={styles.courseGapCard}>
            <Text className={styles.courseGapTitle}>⏰ 今日课程空档</Text>
            <Text className={styles.courseGapDesc}>
              {todayGap.startTime} - {todayGap.endTime}，共 {todayGap.duration} 分钟
              {'\n'}适合去附近转一转！
            </Text>
            <Button className={styles.courseGapBtn} onClick={handleGapRecommend}>
              生成短途推荐 →
            </Button>
          </View>
        )}

        <View className={styles.section}>
          <View className={styles.sectionTitle}>
            <Text className={styles.titleText}>🏆 徽章收集</Text>
            <Text className={styles.moreText}>{collectedStamps.size}/{allStamps.length}</Text>
          </View>
          <View className={styles.stampCollection}>
            <Text className={styles.stampTitle}>点击徽章查看打卡记录</Text>
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
                    onClick={() => collected && Taro.navigateTo({ url: '/pages/checkin/index' })}
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
        </View>

        <View className={styles.section}>
          <View className={styles.sectionTitle}>
            <View style={{ display: 'flex', gap: 16 }}>
              <Text
                className={classnames(
                  styles.titleText,
                  activeTab !== 'favorite' && { color: '#86909C', fontWeight: 400 }
                )}
                onClick={() => setActiveTab('favorite')}
              >
                ❤️ 我的收藏
              </Text>
              <Text
                className={classnames(
                  styles.titleText,
                  activeTab !== 'checkin' && { color: '#86909C', fontWeight: 400 }
                )}
                onClick={() => setActiveTab('checkin')}
              >
                📌 最近打卡
              </Text>
            </View>
          </View>

          {activeTab === 'favorite' && (
            <View className={styles.favoriteList}>
              {favoriteLocations.length > 0 ? (
                favoriteLocations.map((loc) => (
                  <View
                    key={loc.id}
                    className={styles.favoriteItem}
                    onClick={() => Taro.navigateTo({ url: `/pages/detail/index?id=${loc.id}` })}
                  >
                    <Text className={styles.favoriteCategory}>{formatCategory(loc.category)}</Text>
                    <Text className={styles.favoriteName}>{loc.name}</Text>
                    <Text className={styles.menuArrow}>›</Text>
                  </View>
                ))
              ) : (
                <View className={styles.emptyState}>
                  <Empty text="还没有收藏的地点" icon="❤️" />
                </View>
              )}
            </View>
          )}

          {activeTab === 'checkin' && (
            <View className={styles.checkinList}>
              {checkIns.length > 0 ? (
                checkIns.slice(0, 5).map((item) => (
                  <View
                    key={item.id}
                    className={styles.checkinItem}
                    onClick={() => Taro.navigateTo({ url: `/pages/detail/index?id=${item.locationId}` })}
                  >
                    <Image
                      className={styles.checkinStamp}
                      src={item.stampUrl}
                      mode="aspectFill"
                      onError={(e) => console.error('[MinePage] Stamp image error:', e.detail)}
                    />
                    <View className={styles.checkinInfo}>
                      <Text className={styles.checkinName}>{item.locationName}</Text>
                      <Text className={styles.checkinTime}>{item.checkInTime}</Text>
                    </View>
                    <Text className={styles.menuArrow}>›</Text>
                  </View>
                ))
              ) : (
                <View className={styles.emptyState}>
                  <Empty text="还没有打卡记录" icon="📌" />
                </View>
              )}
            </View>
          )}
        </View>

        <View className={styles.section}>
          <View className={styles.menuList}>
            {menuItems.map((item) => (
              <View
                key={item.key}
                className={styles.menuItem}
                onClick={() => handleMenuItemClick(item.key)}
              >
                <View className={styles.menuIcon}>
                  <Text>{item.icon}</Text>
                </View>
                <View className={styles.menuContent}>
                  <Text className={styles.menuName}>{item.name}</Text>
                  <Text className={styles.menuDesc}>{item.desc}</Text>
                </View>
                <Text className={styles.menuArrow}>›</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default MinePage;
