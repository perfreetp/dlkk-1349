import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { usePullDownRefresh, useRouter } from '@tarojs/taro';
import { mockLocations } from '@/data/mockLocations';
import type { Location, LocationCategory } from '@/types/location';
import { formatDistance, formatCrowdLevel, formatBusinessStatus } from '@/utils/distance';
import LocationCard from '@/components/LocationCard';
import FilterBar from '@/components/FilterBar';
import Empty from '@/components/Empty';
import { useUserStore } from '@/store/userStore';
import styles from './index.module.scss';
import classnames from 'classnames';

const RankPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<LocationCategory | 'all'>('all');
  const [sortType, setSortType] = useState('hot');
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const filter = useUserStore((state) => state.filter);

  const categories = [
    { key: 'all' as const, name: '全部', icon: '🌟' },
    { key: 'study' as const, name: '自习角', icon: '📚' },
    { key: 'food' as const, name: '低价餐馆', icon: '🍜' },
    { key: 'activity' as const, name: '社团活动', icon: '🎉' },
    { key: 'walk' as const, name: '散步路线', icon: '🚶' },
  ];

  useEffect(() => {
    if (router.params.category) {
      setActiveCategory(router.params.category as LocationCategory);
    }
  }, [router.params]);

  const filteredLocations = useMemo(() => {
    let result = [...mockLocations];

    if (activeCategory !== 'all') {
      result = result.filter((loc) => loc.category === activeCategory);
    }

    if (filter.crowdLevel) {
      result = result.filter((loc) => loc.crowdLevel === filter.crowdLevel);
    }
    if (filter.businessStatus) {
      result = result.filter((loc) => loc.businessStatus === filter.businessStatus);
    }
    if (filter.maxDistance) {
      result = result.filter((loc) => loc.distance <= filter.maxDistance!);
    }
    if (filter.maxBudget) {
      result = result.filter((loc) => loc.budget <= filter.maxBudget!);
    }

    switch (sortType) {
      case 'hot':
        result.sort((a, b) => b.hotScore - a.hotScore);
        break;
      case 'distance':
        result.sort((a, b) => a.distance - b.distance);
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'price':
        result.sort((a, b) => a.budget - b.budget);
        break;
    }

    return result;
  }, [activeCategory, sortType, filter]);

  const hotRankLocations = useMemo(() => {
    return [...mockLocations].sort((a, b) => b.hotScore - a.hotScore).slice(0, 10);
  }, []);

  usePullDownRefresh(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      Taro.stopPullDownRefresh();
      console.log('[RankPage] Pull down refresh completed');
    }, 1000);
  });

  const getRankClass = (index: number) => {
    if (index === 0) return styles.rankTop1;
    if (index === 1) return styles.rankTop2;
    if (index === 2) return styles.rankTop3;
    return styles.rankOther;
  };

  const handleLocationClick = (location: Location) => {
    Taro.navigateTo({
      url: `/pages/detail/index?id=${location.id}`,
    });
  };

  return (
    <View className={styles.page}>
      <ScrollView
        scrollX
        className={styles.categoryTabs}
        showScrollbar={false}
      >
        {categories.map((cat) => (
          <View
            key={cat.key}
            className={classnames(
              styles.tabItem,
              activeCategory === cat.key && styles.tabItemActive
            )}
            onClick={() => {
              setActiveCategory(cat.key);
              console.log('[RankPage] Category selected:', cat.key);
            }}
          >
            <Text>{cat.icon} {cat.name}</Text>
          </View>
        ))}
      </ScrollView>

      <FilterBar sortType={sortType} onSortChange={setSortType} />

      <ScrollView
        className={styles.content}
        scrollY
        refresherEnabled
        refresherTriggered={refreshing}
        onRefresherRefresh={() => {
          setRefreshing(true);
          setTimeout(() => setRefreshing(false), 1000);
        }}
      >
        {activeCategory === 'all' && sortType === 'hot' && (
          <View>
            <View style={{ marginTop: 24, marginBottom: 16 }}>
              <Text style={{ fontSize: 34, fontWeight: 600, color: '#1D2129' }}>🔥 热门榜 TOP10</Text>
            </View>
            {hotRankLocations.map((location, index) => (
              <View
                key={location.id}
                className={styles.hotRankItem}
                onClick={() => handleLocationClick(location)}
              >
                <View className={classnames(styles.rankNumber, getRankClass(index))}>
                  <Text>{index + 1}</Text>
                </View>
                <View className={styles.rankContent}>
                  <Text className={styles.rankTitle}>{location.name}</Text>
                  <View className={styles.rankMeta}>
                    <View className={styles.metaItem}>
                      <Text style={{ marginRight: 8 }}>⭐</Text>
                      <Text>{location.rating}</Text>
                    </View>
                    <View className={styles.metaItem}>
                      <Text style={{ marginRight: 8 }}>📍</Text>
                      <Text>{formatDistance(location.distance)}</Text>
                    </View>
                    <View className={styles.metaItem}>
                      <Text style={{ marginRight: 8 }}>👥</Text>
                      <Text>{formatCrowdLevel(location.crowdLevel)}</Text>
                    </View>
                  </View>
                </View>
                <Text className={styles.hotScore}>🔥 {location.hotScore}</Text>
              </View>
            ))}
          </View>
        )}

        {(activeCategory !== 'all' || sortType !== 'hot') && (
          <View className={styles.locationList}>
            {filteredLocations.length > 0 ? (
              filteredLocations.map((location) => (
                <LocationCard key={location.id} location={location} />
              ))
            ) : (
              <View className={styles.emptyWrapper}>
                <Empty text="暂无符合条件的地点" icon="🔍" />
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default RankPage;
