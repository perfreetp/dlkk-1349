import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';

interface FilterBarProps {
  sortType: string;
  onSortChange: (type: string) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ sortType, onSortChange }) => {
  const filters = [
    { key: 'hot', label: '热门', icon: '🔥' },
    { key: 'distance', label: '距离', icon: '📍' },
    { key: 'rating', label: '评分', icon: '⭐' },
    { key: 'price', label: '价格', icon: '💰' },
  ];

  const handleFilterClick = () => {
    Taro.navigateTo({ url: '/pages/filter/index' });
  };

  return (
    <View className={styles.filterBar}>
      {filters.map((item) => (
        <View
          key={item.key}
          className={classnames(
            styles.filterItem,
            sortType === item.key && styles.filterItemActive
          )}
          onClick={() => onSortChange(item.key)}
        >
          <Text className={styles.filterIcon}>{item.icon}</Text>
          <Text>{item.label}</Text>
        </View>
      ))}
      <View
        className={classnames(styles.filterItem)}
        onClick={handleFilterClick}
      >
        <Text className={styles.filterIcon}>🎛️</Text>
        <Text>筛选</Text>
      </View>
    </View>
  );
};

export default FilterBar;
