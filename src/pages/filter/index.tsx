import React, { useState } from 'react';
import { View, Text, Button, Slider } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import type { CrowdLevel, BusinessStatus, LocationFilter } from '@/types/location';
import { useUserStore } from '@/store/userStore';
import styles from './index.module.scss';

const FilterPage: React.FC = () => {
  const storeFilter = useUserStore((state) => state.filter);
  const setFilter = useUserStore((state) => state.setFilter);
  const resetFilter = useUserStore((state) => state.resetFilter);

  const [maxDistance, setMaxDistance] = useState<number>(storeFilter.maxDistance || 3);
  const [crowdLevel, setCrowdLevel] = useState<CrowdLevel | undefined>(storeFilter.crowdLevel);
  const [businessStatus, setBusinessStatus] = useState<BusinessStatus | undefined>(storeFilter.businessStatus);
  const [maxBudget, setMaxBudget] = useState<number>(storeFilter.maxBudget || 50);

  const crowdOptions = [
    { key: 'empty' as CrowdLevel, label: '空无一人' },
    { key: 'sparse' as CrowdLevel, label: '人很少' },
    { key: 'moderate' as CrowdLevel, label: '适中' },
    { key: 'crowded' as CrowdLevel, label: '拥挤' },
  ];

  const statusOptions = [
    { key: 'open' as BusinessStatus, label: '营业中' },
    { key: 'closed' as BusinessStatus, label: '已打烊' },
  ];

  const handleReset = () => {
    setMaxDistance(3);
    setCrowdLevel(undefined);
    setBusinessStatus(undefined);
    setMaxBudget(50);
    resetFilter();
    console.log('[FilterPage] Filter reset');
  };

  const handleConfirm = () => {
    const filter: LocationFilter = {
      maxDistance: maxDistance > 0 ? maxDistance : undefined,
      crowdLevel,
      businessStatus,
      maxBudget: maxBudget > 0 ? maxBudget : undefined,
    };
    setFilter(filter);
    Taro.showToast({ title: '筛选条件已应用', icon: 'success' });
    console.log('[FilterPage] Filter confirmed:', filter);
    setTimeout(() => Taro.navigateBack(), 500);
  };

  return (
    <View className={styles.page}>
      <View className={styles.content}>
        <View className={styles.filterSection}>
          <Text className={styles.sectionTitle}>📍 最远距离</Text>
          <View className={styles.sliderSection}>
            <View className={styles.sliderLabels}>
              <Text className={styles.sliderLabel}>不限</Text>
              <Text className={styles.sliderValue}>{maxDistance}km</Text>
            </View>
            <Slider
              min={0}
              max={5}
              step={0.5}
              value={maxDistance}
              activeColor="#5B8FF9"
              backgroundColor="#E5E6EB"
              blockSize={24}
              onChange={(e) => setMaxDistance(e.detail.value)}
            />
            <View className={styles.sliderLabels}>
              <Text className={styles.sliderLabel}>0km</Text>
              <Text className={styles.sliderLabel}>5km</Text>
            </View>
          </View>
        </View>

        <View className={styles.filterSection}>
          <Text className={styles.sectionTitle}>👥 拥挤程度</Text>
          <View className={styles.optionGrid}>
            {crowdOptions.map((opt) => (
              <View
                key={opt.key}
                className={classnames(
                  styles.optionItem,
                  crowdLevel === opt.key && styles.optionItemActive
                )}
                onClick={() => {
                  setCrowdLevel(crowdLevel === opt.key ? undefined : opt.key);
                }}
              >
                <Text>{opt.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.filterSection}>
          <Text className={styles.sectionTitle}>⏰ 营业状态</Text>
          <View className={styles.optionGrid}>
            {statusOptions.map((opt) => (
              <View
                key={opt.key}
                className={classnames(
                  styles.optionItem,
                  businessStatus === opt.key && styles.optionItemActive
                )}
                onClick={() => {
                  setBusinessStatus(businessStatus === opt.key ? undefined : opt.key);
                }}
              >
                <Text>{opt.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.filterSection}>
          <Text className={styles.sectionTitle}>💰 人均预算</Text>
          <View className={styles.sliderSection}>
            <View className={styles.sliderLabels}>
              <Text className={styles.sliderLabel}>不限</Text>
              <Text className={styles.sliderValue}>¥{maxBudget}</Text>
            </View>
            <Slider
              min={0}
              max={100}
              step={5}
              value={maxBudget}
              activeColor="#5B8FF9"
              backgroundColor="#E5E6EB"
              blockSize={24}
              onChange={(e) => setMaxBudget(e.detail.value)}
            />
            <View className={styles.sliderLabels}>
              <Text className={styles.sliderLabel}>¥0</Text>
              <Text className={styles.sliderLabel}>¥100</Text>
            </View>
          </View>
        </View>
      </View>

      <View className={styles.bottomBar}>
        <Button className={styles.resetBtn} onClick={handleReset}>
          重置
        </Button>
        <Button className={styles.confirmBtn} onClick={handleConfirm}>
          确定筛选
        </Button>
      </View>
    </View>
  );
};

export default FilterPage;
