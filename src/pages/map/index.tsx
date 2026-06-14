import React, { useState, useMemo } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { mockLocations } from '@/data/mockLocations';
import type { Location, LocationCategory } from '@/types/location';
import { formatDistance, getCategoryColor, formatCategory } from '@/utils/distance';
import Tag from '@/components/Tag';
import styles from './index.module.scss';

const MapPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<LocationCategory | 'all'>('all');
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [zoom, setZoom] = useState(1);

  const categories = [
    { key: 'all' as const, name: '全部', icon: '🌟' },
    { key: 'study' as const, name: '自习', icon: '📚' },
    { key: 'food' as const, name: '美食', icon: '🍜' },
    { key: 'activity' as const, name: '活动', icon: '🎉' },
    { key: 'walk' as const, name: '散步', icon: '🚶' },
  ];

  const filteredLocations = useMemo(() => {
    if (selectedCategory === 'all') return mockLocations;
    return mockLocations.filter(loc => loc.category === selectedCategory);
  }, [selectedCategory]);

  const getMarkerPosition = (location: Location) => {
    const positions: Record<string, { x: number; y: number }> = {
      '1': { x: 25, y: 20 },
      '2': { x: 65, y: 35 },
      '3': { x: 80, y: 75 },
      '4': { x: 45, y: 45 },
      '5': { x: 30, y: 55 },
      '6': { x: 15, y: 40 },
      '7': { x: 50, y: 25 },
      '8': { x: 85, y: 50 },
      '9': { x: 35, y: 80 },
      '10': { x: 55, y: 60 },
    };
    return positions[location.id] || { x: 50, y: 50 };
  };

  const getMarkerIconClass = (category: LocationCategory) => {
    const map: Record<string, string> = {
      study: styles.markerIconStudy,
      food: styles.markerIconFood,
      activity: styles.markerIconActivity,
      walk: styles.markerIconWalk,
    };
    return map[category] || '';
  };

  const getCategoryEmoji = (category: LocationCategory) => {
    const map: Record<string, string> = {
      study: '📚',
      food: '🍜',
      activity: '🎉',
      walk: '🚶',
    };
    return map[category] || '📍';
  };

  const handleMarkerClick = (location: Location) => {
    setSelectedLocation(location);
    console.log('[MapPage] Marker clicked:', location.name);
  };

  const handleClosePanel = () => {
    setSelectedLocation(null);
  };

  const handleViewDetail = () => {
    if (selectedLocation) {
      Taro.navigateTo({
        url: `/pages/detail/index?id=${selectedLocation.id}`,
      });
    }
  };

  const handleNavigate = () => {
    if (selectedLocation) {
      Taro.openLocation({
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        name: selectedLocation.name,
        address: selectedLocation.address,
        scale: 18,
      });
      console.log('[MapPage] Navigate to:', selectedLocation.name);
    }
  };

  const handleLocationClick = () => {
    Taro.showToast({ title: '已定位到当前位置', icon: 'none' });
    console.log('[MapPage] Location button clicked');
  };

  const getTagType = (category: LocationCategory) => {
    const map: Record<string, 'green' | 'yellow' | 'orange' | 'primary'> = {
      study: 'green',
      food: 'yellow',
      activity: 'orange',
      walk: 'primary',
    };
    return map[category] || 'primary';
  };

  const generateGridCells = () => {
    const cells = [];
    for (let i = 0; i < 192; i++) {
      const row = Math.floor(i / 12);
      const col = i % 12;
      let cellClass = styles.gridCell;

      if (row === 7 || row === 8 || col === 5 || col === 6) {
        cellClass = styles.gridCellRoad;
      } else if (row >= 1 && row <= 3 && col >= 1 && col <= 4) {
        cellClass = styles.gridCellBuilding;
      } else if (row >= 10 && row <= 12 && col >= 7 && col <= 10) {
        cellClass = styles.gridCellBuilding;
      } else if (row >= 4 && row <= 6 && col >= 8 && col <= 11) {
        cellClass = styles.gridCellGreen;
      } else if (row >= 13 && row <= 15 && col >= 1 && col <= 4) {
        cellClass = styles.gridCellWater;
      }

      cells.push(
        <View key={i} className={cellClass} />
      );
    }
    return cells;
  };

  return (
    <View className={styles.page}>
      <View className={styles.mapContainer}>
        <View className={styles.mapBackground}>
          <View className={styles.mapGrid}>
            {generateGridCells()}
          </View>
        </View>

        {filteredLocations.length === 0 && (
          <Text className={styles.emptyTip}>该分类暂无地点</Text>
        )}

        {filteredLocations.map((location) => {
          const pos = getMarkerPosition(location);
          const isSelected = selectedLocation?.id === location.id;
          return (
            <View
              key={location.id}
              className={classnames(
                styles.marker,
                isSelected && styles.markerSelected
              )}
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                transform: `translate(-50%, -100%) scale(${zoom})`,
              }}
              onClick={() => handleMarkerClick(location)}
            >
              <View className={styles.markerPin}>
                <View
                  className={classnames(
                    styles.markerIcon,
                    getMarkerIconClass(location.category)
                  )}
                >
                  <Text>{getCategoryEmoji(location.category)}</Text>
                </View>
                <View
                  className={styles.markerPulse}
                  style={{ color: getCategoryColor(location.category) }}
                />
              </View>
              {isSelected && (
                <View className={styles.markerLabel}>
                  <Text>{location.name}</Text>
                </View>
              )}
            </View>
          );
        })}

        <View className={styles.categoryFilter}>
          {categories.map((cat) => (
            <Button
              key={cat.key}
              className={classnames(
                styles.filterChip,
                selectedCategory === cat.key && styles.filterChipActive
              )}
              onClick={() => {
                setSelectedCategory(cat.key);
                setSelectedLocation(null);
              }}
            >
              <Text className={styles.filterChipIcon}>{cat.icon}</Text>
              <Text>{cat.name}</Text>
            </Button>
          ))}
        </View>

        <View className={styles.zoomControls}>
          <View
            className={styles.zoomBtn}
            onClick={() => setZoom(prev => Math.min(prev + 0.1, 1.5))}
          >
            <Text>+</Text>
          </View>
          <View
            className={styles.zoomBtn}
            onClick={() => setZoom(prev => Math.max(prev - 0.1, 0.6))}
          >
            <Text>−</Text>
          </View>
        </View>

        <View
          className={styles.locationBtn}
          onClick={handleLocationClick}
        >
          <Text>📍</Text>
        </View>

        <View
          className={classnames(
            styles.infoPanel,
            !selectedLocation && styles.infoPanelHidden
          )}
        >
          {selectedLocation && (
            <View>
              <View
                className={styles.closeBtn}
                onClick={handleClosePanel}
              >
                <Text>×</Text>
              </View>
              <View className={styles.infoHeader}>
                <View
                  className={styles.infoIcon}
                  style={{ backgroundColor: `${getCategoryColor(selectedLocation.category)}20` }}
                >
                  <Text>{getCategoryEmoji(selectedLocation.category)}</Text>
                </View>
                <View className={styles.infoContent}>
                  <Text className={styles.infoTitle}>{selectedLocation.name}</Text>
                  <View className={styles.infoMeta}>
                    <Text className={styles.infoRating}>⭐ {selectedLocation.rating}</Text>
                    <Text className={styles.infoDistance}>
                      📍 {formatDistance(selectedLocation.distance)}
                    </Text>
                  </View>
                  <Text className={styles.infoDesc}>{selectedLocation.description}</Text>
                  <View className={styles.infoTags}>
                    <Tag
                      text={formatCategory(selectedLocation.category)}
                      type={getTagType(selectedLocation.category)}
                    />
                    {selectedLocation.tags.slice(0, 3).map(tag => (
                      <Tag key={tag.id} text={tag.name} type="default" />
                    ))}
                  </View>
                  <View className={styles.infoActions}>
                    <Button
                      className={classnames(styles.actionBtn, styles.actionBtnSecondary)}
                      onClick={handleNavigate}
                    >
                      🗺️ 导航
                    </Button>
                    <Button
                      className={classnames(styles.actionBtn, styles.actionBtnPrimary)}
                      onClick={handleViewDetail}
                    >
                      查看详情
                    </Button>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

export default MapPage;
