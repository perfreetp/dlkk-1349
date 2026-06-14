import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Input, Swiper, SwiperItem } from '@tarojs/components';
import Taro, { usePullDownRefresh, useDidShow } from '@tarojs/taro';
import { mockLocations } from '@/data/mockLocations';
import type { Location, LocationCategory } from '@/types/location';
import { formatCategory } from '@/utils/distance';
import LocationCard from '@/components/LocationCard';
import { useUserStore } from '@/store/userStore';
import styles from './index.module.scss';

const HomePage: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const setSearchKeyword = useUserStore(state => state.setSearchKeyword);
  const setSelectedCategory = useUserStore(state => state.setSelectedCategory);
  const resetFilter = useUserStore(state => state.resetFilter);

  const categories = [
    { key: 'study' as LocationCategory, name: '自习角', icon: '📚', count: 28, color: '#5AD8A6' },
    { key: 'food' as LocationCategory, name: '低价餐馆', icon: '🍜', count: 45, color: '#F6BD16' },
    { key: 'activity' as LocationCategory, name: '社团活动', icon: '🎉', count: 16, color: '#E86452' },
    { key: 'walk' as LocationCategory, name: '散步路线', icon: '🚶', count: 12, color: '#5B8FF9' },
  ];

  const hotLocations = useMemo(() => {
    return [...mockLocations]
      .sort((a, b) => b.hotScore - a.hotScore)
      .slice(0, 5);
  }, []);

  useDidShow(() => {
    setSearchText('');
    console.log('[HomePage] Page did show, reset search text');
  });

  usePullDownRefresh(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      Taro.stopPullDownRefresh();
      console.log('[HomePage] Pull down refresh completed');
    }, 1000);
  });

  const handleCategoryClick = (category: LocationCategory) => {
    resetFilter();
    setSelectedCategory(category);
    setSearchKeyword('');
    Taro.switchTab({ url: '/pages/rank/index' });
    console.log('[HomePage] Category clicked:', category);
  };

  const handleSearch = () => {
    if (searchText.trim()) {
      resetFilter();
      setSelectedCategory('all');
      setSearchKeyword(searchText.trim());
      Taro.switchTab({ url: '/pages/rank/index' });
      console.log('[HomePage] Search:', searchText);
    }
  };

  const handleMapClick = () => {
    Taro.navigateTo({ url: '/pages/map/index' });
    console.log('[HomePage] Map mode clicked');
  };

  const getIconClass = (key: string) => {
    const map: Record<string, string> = {
      study: styles.iconStudy,
      food: styles.iconFood,
      activity: styles.iconActivity,
      walk: styles.iconWalk,
    };
    return map[key] || '';
  };

  return (
    <ScrollView
      className={styles.page}
      scrollY
      refresherEnabled
      refresherTriggered={refreshing}
      onRefresherRefresh={() => {
        setRefreshing(true);
        setTimeout(() => {
          setRefreshing(false);
        }, 1000);
      }}
    >
      <View className={styles.header}>
        <Text className={styles.greeting}>你好，同学 👋</Text>
        <Text className={styles.subtitle}>发现校园周边的宝藏地点</Text>
        <View className={styles.searchBar}>
          <Text className={styles.searchIcon}>🔍</Text>
          <Input
            className={styles.searchInput}
            placeholder="搜索自习室、美食、活动..."
            placeholderClass={styles.searchPlaceholder}
            value={searchText}
            onInput={(e) => setSearchText(e.detail.value)}
            onConfirm={handleSearch}
          />
        </View>
      </View>

      <View className={styles.categorySection}>
        <View className={styles.sectionTitle}>
          <Text className={styles.titleText}>分类探索</Text>
          <Text className={styles.moreText} onClick={() => Taro.switchTab({ url: '/pages/rank/index' })}>
            查看全部 →
          </Text>
        </View>
        <View className={styles.categoryGrid}>
          {categories.map((cat) => (
            <View
              key={cat.key}
              className={styles.categoryItem}
              onClick={() => handleCategoryClick(cat.key)}
            >
              <View className={`${styles.categoryIcon} ${getIconClass(cat.key)}`}>
                <Text>{cat.icon}</Text>
              </View>
              <Text className={styles.categoryName}>{cat.name}</Text>
              <Text className={styles.categoryCount}>{cat.count}个地点</Text>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.hotSection}>
        <View className={styles.hotBanner}>
          <Text className={styles.bannerTitle}>🔥 本周热门榜</Text>
          <Text className={styles.bannerDesc}>同学们都在收藏这些宝藏地点</Text>
        </View>

        <View className={styles.mapPlaceholder} onClick={handleMapClick}>
          <Text className={styles.mapIcon}>🗺️</Text>
          <Text className={styles.mapText}>地图模式</Text>
          <Text className={styles.mapTip}>点击在地图上查看周边地点</Text>
        </View>

        <View className={styles.sectionTitle}>
          <Text className={styles.titleText}>热门推荐</Text>
        </View>
        <View className={styles.locationList}>
          {hotLocations.map((location) => (
            <LocationCard key={location.id} location={location} />
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

export default HomePage;
