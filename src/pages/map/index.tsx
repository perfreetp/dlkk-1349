import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, Button, Input, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { mockLocations } from '@/data/mockLocations';
import type { Location, LocationCategory } from '@/types/location';
import { formatDistance, getCategoryColor, formatCategory, formatCrowdLevel, formatBudget, formatBusinessStatus } from '@/utils/distance';
import Tag from '@/components/Tag';
import Empty from '@/components/Empty';
import { useUserStore } from '@/store/userStore';
import styles from './index.module.scss';

type FilterCategory = LocationCategory | 'all';

const MapPage: React.FC = () => {
  const [category, setCategory] = useState<FilterCategory>('all');
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [zoom, setZoom] = useState(1);
  const [searchText, setSearchText] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const isFavorite = useUserStore(state => state.isFavorite);
  const toggleFavorite = useUserStore(state => state.toggleFavorite);
  const [, forceUpdate] = useState(0);

  const categories = [
    { key: 'all' as const, name: '全部', icon: '🌟' },
    { key: 'study' as const, name: '自习', icon: '📚' },
    { key: 'food' as const, name: '美食', icon: '🍜' },
    { key: 'activity' as const, name: '活动', icon: '🎉' },
    { key: 'walk' as const, name: '散步', icon: '🚶' },
  ];

  const filteredLocations = useMemo(() => {
    let result = [...mockLocations];

    if (category !== 'all') {
      result = result.filter(loc => loc.category === category);
    }

    if (searchText.trim()) {
      const keyword = searchText.toLowerCase();
      result = result.filter(loc =>
        loc.name.toLowerCase().includes(keyword) ||
        loc.description.toLowerCase().includes(keyword) ||
        loc.address.toLowerCase().includes(keyword) ||
        loc.tags.some(tag => tag.name.toLowerCase().includes(keyword))
      );
    }

    return result;
  }, [category, searchText]);

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

  const getMarkerIconClass = (cat: LocationCategory) => {
    const map: Record<string, string> = {
      study: styles.markerIconStudy,
      food: styles.markerIconFood,
      activity: styles.markerIconActivity,
      walk: styles.markerIconWalk,
    };
    return map[cat] || '';
  };

  const getCategoryEmoji = (cat: LocationCategory) => {
    const map: Record<string, string> = {
      study: '📚',
      food: '🍜',
      activity: '🎉',
      walk: '🚶',
    };
    return map[cat] || '📍';
  };

  const getTagType = (cat: LocationCategory) => {
    const map: Record<string, 'green' | 'yellow' | 'orange' | 'primary'> = {
      study: 'green',
      food: 'yellow',
      activity: 'orange',
      walk: 'primary',
    };
    return map[cat] || 'primary';
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

  const handleNavigate = (loc?: Location) => {
    const target = loc || selectedLocation;
    if (target) {
      Taro.openLocation({
        latitude: target.latitude,
        longitude: target.longitude,
        name: target.name,
        address: target.address,
        scale: 18,
      });
      console.log('[MapPage] Navigate to:', target.name);
    }
  };

  const handleLocationClick = () => {
    Taro.showToast({ title: '已定位到当前位置', icon: 'none' });
    console.log('[MapPage] Location button clicked');
  };

  const handleToggleFavorite = (loc?: Location) => {
    const target = loc || selectedLocation;
    if (!target) return;
    toggleFavorite(target.id);
    const newState = !isFavorite(target.id);
    Taro.showToast({
      title: newState ? '已加入收藏' : '已取消收藏',
      icon: 'none',
    });
    forceUpdate(prev => prev + 1);
    console.log('[MapPage] Toggle favorite:', { locationId: target.id, newState });
  };

  const handleSearchConfirm = () => {
    console.log('[MapPage] Search confirmed:', searchText);
    setSearchFocused(false);
  };

  const handleSearchClear = () => {
    setSearchText('');
    console.log('[MapPage] Search cleared');
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

  const handleSearchResultClick = (location: Location) => {
    setSelectedLocation(location);
    setSearchFocused(false);
    setSearchText(location.name);
  };

  const searchResults = useMemo(() => {
    if (!searchFocused && !searchText.trim()) return [];
    return filteredLocations.slice(0, 8);
  }, [filteredLocations, searchFocused, searchText]);

  const selLoc = selectedLocation;
  const selIsFav = selLoc ? isFavorite(selLoc.id) : false;

  return (
    <View className={styles.page}>
      <View className={styles.mapContainer}>
        <View className={styles.mapBackground}>
          <View className={styles.mapGrid}>
            {generateGridCells()}
          </View>
        </View>

        <View className={styles.searchBarWrapper}>
          <View className={styles.searchBar}>
            <Text className={styles.searchIcon}>🔍</Text>
            <Input
              className={styles.searchInput}
              placeholder="搜索地点、标签..."
              placeholderClass={styles.searchPlaceholder}
              value={searchText}
              onInput={(e) => setSearchText(e.detail.value)}
              onConfirm={handleSearchConfirm}
              onFocus={() => setSearchFocused(true)}
            />
            {searchText && (
              <View className={styles.searchClear} onClick={handleSearchClear}>
                <Text>✕</Text>
              </View>
            )}
          </View>

          {searchFocused && (
            <View className={styles.searchResults}>
              <ScrollView scrollY className={styles.searchResultsScroll}>
                {searchResults.length > 0 ? (
                  searchResults.map((loc) => {
                    const pos = getMarkerPosition(loc);
                    return (
                      <View
                        key={loc.id}
                        className={styles.searchResultItem}
                        onClick={() => handleSearchResultClick(loc)}
                      >
                        <View
                          className={classnames(
                            styles.searchResultIcon,
                            getMarkerIconClass(loc.category)
                          )}
                        >
                          <Text>{getCategoryEmoji(loc.category)}</Text>
                        </View>
                        <View className={styles.searchResultInfo}>
                          <Text className={styles.searchResultName}>{loc.name}</Text>
                          <Text className={styles.searchResultAddr}>
                            {loc.address} · {formatDistance(loc.distance)}
                          </Text>
                        </View>
                        <View className={styles.searchResultActions}>
                          <View
                            className={styles.searchResultFav}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleFavorite(loc);
                            }}
                          >
                            <Text>{isFavorite(loc.id) ? '❤️' : '🤍'}</Text>
                          </View>
                          <View
                            className={styles.searchResultNav}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNavigate(loc);
                            }}
                          >
                            <Text>🧭</Text>
                          </View>
                        </View>
                      </View>
                    );
                  })
                ) : searchText.trim() ? (
                  <View className={styles.searchEmpty}>
                    <Empty text="未找到匹配地点" icon="🔍" />
                  </View>
                ) : null}
              </ScrollView>
            </View>
          )}
        </View>

        <View className={styles.categoryFilter}>
          {categories.map((cat) => (
            <Button
              key={cat.key}
              className={classnames(
                styles.filterChip,
                category === cat.key && styles.filterChipActive
              )}
              onClick={() => {
                setCategory(cat.key);
                setSelectedLocation(null);
              }}
            >
              <Text className={styles.filterChipIcon}>{cat.icon}</Text>
              <Text>{cat.name}</Text>
            </Button>
          ))}
        </View>

        {filteredLocations.length === 0 && (
          <Text className={styles.emptyTip}>该条件下暂无地点</Text>
        )}

        {filteredLocations.map((location) => {
          const pos = getMarkerPosition(location);
          const isSelected = selLoc?.id === location.id;
          const isFav = isFavorite(location.id);
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
                {isFav && (
                  <View className={styles.markerFavBadge}>
                    <Text>❤️</Text>
                  </View>
                )}
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
            !selLoc && styles.infoPanelHidden
          )}
        >
          {selLoc && (
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
                  style={{ backgroundColor: `${getCategoryColor(selLoc.category)}20` }}
                >
                  <Text>{getCategoryEmoji(selLoc.category)}</Text>
                </View>
                <View className={styles.infoContent}>
                  <Text className={styles.infoTitle}>{selLoc.name}</Text>
                  <View className={styles.infoMeta}>
                    <Text className={styles.infoRating}>⭐ {selLoc.rating}</Text>
                    <Text className={styles.infoDistance}>📍 {formatDistance(selLoc.distance)}</Text>
                    <Text className={styles.infoCrowd}>👥 {formatCrowdLevel(selLoc.crowdLevel)}</Text>
                  </View>
                  <Text className={styles.infoDesc}>{selLoc.description}</Text>
                </View>
                <View
                  className={classnames(styles.favBtn, selIsFav && styles.favBtnActive)}
                  onClick={() => handleToggleFavorite()}
                >
                  <Text>{selIsFav ? '❤️' : '🤍'}</Text>
                </View>
              </View>

              <View className={styles.infoExtra}>
                <View className={styles.infoExtraItem}>
                  <Text className={styles.infoExtraLabel}>营业状态</Text>
                  <Text className={classnames(
                    styles.infoExtraValue,
                    selLoc.businessStatus === 'open' && styles.infoValueGreen
                  )}>
                    {formatBusinessStatus(selLoc.businessStatus)}
                  </Text>
                </View>
                <View className={styles.infoExtraItem}>
                  <Text className={styles.infoExtraLabel}>营业时间</Text>
                  <Text className={styles.infoExtraValue}>{selLoc.businessHours}</Text>
                </View>
                <View className={styles.infoExtraItem}>
                  <Text className={styles.infoExtraLabel}>人均消费</Text>
                  <Text className={styles.infoExtraValue}>{formatBudget(selLoc.budget)}</Text>
                </View>
                <View className={styles.infoExtraItem}>
                  <Text className={styles.infoExtraLabel}>插座情况</Text>
                  <Text className={classnames(
                    styles.infoExtraValue,
                    selLoc.socketAvailable && styles.infoValueGreen
                  )}>
                    {selLoc.socketAvailable ? '有插座' : '无插座'}
                  </Text>
                </View>
              </View>

              <View className={styles.infoTags}>
                <Tag
                  text={formatCategory(selLoc.category)}
                  type={getTagType(selLoc.category)}
                />
                {selLoc.tags.slice(0, 3).map(tag => (
                  <Tag key={tag.id} text={tag.name} type="default" />
                ))}
              </View>

              <View className={styles.infoActions}>
                <Button
                  className={classnames(styles.actionBtn, styles.actionBtnSecondary)}
                  onClick={() => handleNavigate()}
                >
                  🧭 导航
                </Button>
                <Button
                  className={classnames(
                    styles.actionBtn,
                    styles.actionBtnSecondaryAlt
                  )}
                  onClick={() => handleToggleFavorite()}
                >
                  {selIsFav ? '❤️ 已收藏' : '🤍 收藏'}
                </Button>
                <Button
                  className={classnames(styles.actionBtn, styles.actionBtnPrimary)}
                  onClick={handleViewDetail}
                >
                  查看详情 →
                </Button>
              </View>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

export default MapPage;
