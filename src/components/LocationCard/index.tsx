import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import type { Location } from '@/types/location';
import {
  formatDistance,
  formatCrowdLevel,
  formatBusinessStatus,
  formatCategory,
  getCategoryColor,
  formatBudget,
} from '@/utils/distance';
import Tag from '@/components/Tag';
import styles from './index.module.scss';

interface LocationCardProps {
  location: Location;
  onClick?: () => void;
}

const LocationCard: React.FC<LocationCardProps> = ({ location, onClick }) => {
  const categoryColor = getCategoryColor(location.category);

  const getCrowdClass = () => {
    const map: Record<string, string> = {
      empty: styles.crowdEmpty,
      sparse: styles.crowdSparse,
      moderate: styles.crowdModerate,
      crowded: styles.crowdCrowded,
    };
    return map[location.crowdLevel] || '';
  };

  const getTagType = () => {
    const map: Record<string, 'green' | 'yellow' | 'orange' | 'primary'> = {
      study: 'green',
      food: 'yellow',
      activity: 'orange',
      walk: 'primary',
    };
    return map[location.category] || 'primary';
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      Taro.navigateTo({
        url: `/pages/detail/index?id=${location.id}`,
      });
    }
  };

  return (
    <View className={styles.card} onClick={handleClick}>
      <View className={styles.cardHeader}>
        <Image
          className={styles.cardImage}
          src={location.photos[0]?.url || 'https://picsum.photos/200/200'}
          mode="aspectFill"
          onError={(e) => {
            console.error('[LocationCard] Image load error:', e.detail);
          }}
        />
        <View className={styles.cardInfo}>
          <Text className={styles.cardTitle}>{location.name}</Text>
          <View className={styles.cardCategory}>
            <View
              className={styles.categoryTag}
              style={{ backgroundColor: categoryColor }}
            >
              <Text>{formatCategory(location.category)}</Text>
            </View>
            <Text className={styles.rating}>⭐ {location.rating}</Text>
            <Text className={styles.reviewCount}>({location.reviewCount}条评价)</Text>
          </View>
          <Text className={styles.cardDesc}>{location.description}</Text>
          <View className={styles.tagsRow}>
            {location.tags.slice(0, 3).map((tag) => (
              <Tag key={tag.id} text={tag.name} type={getTagType()} />
            ))}
          </View>
        </View>
      </View>
      <View className={styles.cardFooter}>
        <View className={styles.footerLeft}>
          <View className={styles.footerItem}>
            <Text className={styles.icon}>📍</Text>
            <Text>{formatDistance(location.distance)}</Text>
          </View>
          <View className={classnames(styles.footerItem, getCrowdClass())}>
            <Text className={styles.icon}>👥</Text>
            <Text>{formatCrowdLevel(location.crowdLevel)}</Text>
          </View>
          <View
            className={classnames(
              styles.footerItem,
              location.businessStatus === 'open'
                ? styles.statusOpen
                : styles.statusClosed
            )}
          >
            <Text className={styles.icon}>⏰</Text>
            <Text>{formatBusinessStatus(location.businessStatus)}</Text>
          </View>
        </View>
        <Text className={styles.price}>{formatBudget(location.budget)}</Text>
      </View>
    </View>
  );
};

export default LocationCard;
