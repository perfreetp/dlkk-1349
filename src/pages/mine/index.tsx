import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Image, Button } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import { useUserStore } from '@/store/userStore';
import { mockLocations, mockCheckIns, mockCourseGaps } from '@/data/mockLocations';
import { formatCategory, formatDistance, getCategoryColor } from '@/utils/distance';
import type { Location, UserCheckIn, LocationComment } from '@/types/location';
import Empty from '@/components/Empty';
import Tag from '@/components/Tag';
import styles from './index.module.scss';

type InteractionTab = 'favorite' | 'comment' | 'checkin';
type ViewMode = 'byType' | 'byLocation';

const MinePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<InteractionTab>('favorite');
  const [viewMode, setViewMode] = useState<ViewMode>('byType');
  const [expandedLocationId, setExpandedLocationId] = useState<string | null>(null);
  const [, forceUpdate] = useState(0);

  const favorites = useUserStore(state => state.favorites);
  const checkIns = useUserStore(state => state.checkIns);
  const getMyComments = useUserStore(state => state.getMyComments);
  const toggleFavorite = useUserStore(state => state.toggleFavorite);
  const isFavorite = useUserStore(state => state.isFavorite);
  const deleteMyComment = useUserStore(state => state.deleteMyComment);
  const getMyInteractionsByLocation = useUserStore(state => state.getMyInteractionsByLocation);
  const getMyLocationIds = useUserStore(state => state.getMyLocationIds);
  const getCheckInsByLocation = useUserStore(state => state.getCheckInsByLocation);

  useDidShow(() => {
    forceUpdate(prev => prev + 1);
    console.log('[MinePage] Page did show');
  });

  const myComments = useMemo(() => getMyComments(), [getMyComments]);

  const favoriteLocations = useMemo(() => {
    return mockLocations.filter((loc) =>
      favorites.some((f) => f.locationId === loc.id)
    );
  }, [favorites]);

  const myLocationIds = useMemo(() => getMyLocationIds(), [getMyLocationIds]);

  const myInteractionLocations = useMemo(() => {
    return myLocationIds
      .map(id => mockLocations.find(loc => loc.id === id))
      .filter((loc): loc is Location => !!loc)
      .sort((a, b) => {
        const aInter = getMyInteractionsByLocation(a.id);
        const bInter = getMyInteractionsByLocation(b.id);
        const aScore = aInter.checkInCount + aInter.commentCount + (aInter.isFavorite ? 1 : 0);
        const bScore = bInter.checkInCount + bInter.commentCount + (bInter.isFavorite ? 1 : 0);
        return bScore - aScore;
      });
  }, [myLocationIds, getMyInteractionsByLocation]);

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
        setActiveTab('comment');
        setViewMode('byType');
        break;
      case 'favorite':
        setActiveTab('favorite');
        setViewMode('byType');
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
    { key: 'report', name: '失效报错', desc: '反馈地点信息错误', icon: '⚠️' },
    { key: 'settings', name: '设置', desc: '隐私与通知设置', icon: '⚙️' },
  ];

  const tabs = [
    { key: 'favorite' as const, name: '我的收藏', icon: '❤️', count: favoriteLocations.length },
    { key: 'comment' as const, name: '我的评价', icon: '💬', count: myComments.length },
    { key: 'checkin' as const, name: '最近打卡', icon: '📌', count: checkIns.length },
  ];

  const handleGoDetail = (locationId: string) => {
    Taro.navigateTo({ url: `/pages/detail/index?id=${locationId}` });
  };

  const handleRemoveFavorite = (locationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(locationId);
    Taro.showToast({ title: '已取消收藏', icon: 'none' });
    forceUpdate(prev => prev + 1);
  };

  const handleAddFavorite = (locationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(locationId);
    Taro.showToast({ title: '已加入收藏', icon: 'none' });
    forceUpdate(prev => prev + 1);
  };

  const handleDeleteMyComment = (commentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    Taro.showModal({
      title: '删除评价',
      content: '确定要删除这条评价吗？',
      success: (res) => {
        if (res.confirm) {
          deleteMyComment(commentId);
          Taro.showToast({ title: '删除成功', icon: 'none' });
          forceUpdate(prev => prev + 1);
        }
      },
    });
  };

  const handleLocationCardClick = (locationId: string) => {
    setExpandedLocationId(expandedLocationId === locationId ? null : locationId);
  };

  const getLocationById = (id: string) => {
    return mockLocations.find(loc => loc.id === id);
  };

  const getCategoryEmoji = (cat: string) => {
    const map: Record<string, string> = {
      study: '📚',
      food: '🍜',
      activity: '🎉',
      walk: '🚶',
    };
    return map[cat] || '📍';
  };

  const getTagType = (cat: string) => {
    const map: Record<string, 'green' | 'yellow' | 'orange' | 'primary'> = {
      study: 'green',
      food: 'yellow',
      activity: 'orange',
      walk: 'primary',
    };
    return map[cat] || 'primary';
  };

  const renderLocationCard = (loc: Location) => {
    const inter = getMyInteractionsByLocation(loc.id);
    const isExpanded = expandedLocationId === loc.id;
    const isFav = inter.isFavorite;
    const locCheckIns = getCheckInsByLocation(loc.id);

    return (
      <View key={loc.id} className={styles.locationCard}>
        <View
          className={styles.locationCardHeader}
          onClick={() => handleLocationCardClick(loc.id)}
        >
          <View className={styles.locationCardLeft}>
            <View
              className={styles.locationCardIcon}
              style={{ backgroundColor: `${getCategoryColor(loc.category)}20` }}
            >
              <Text>{getCategoryEmoji(loc.category)}</Text>
            </View>
            <View className={styles.locationCardInfo}>
              <Text className={styles.locationCardName}>{loc.name}</Text>
              <View className={styles.locationCardMeta}>
                <Tag text={formatCategory(loc.category)} type={getTagType(loc.category)} />
                <Text className={styles.locationCardDistance}>{formatDistance(loc.distance)}</Text>
              </View>
            </View>
          </View>
          <View className={styles.locationCardStats}>
            <View className={styles.locStatItem}>
              <Text className={styles.locStatNum}>{isFav ? 1 : 0}</Text>
              <Text className={styles.locStatLabel}>收藏</Text>
            </View>
            <View className={styles.locStatItem}>
              <Text className={styles.locStatNum}>{inter.commentCount}</Text>
              <Text className={styles.locStatLabel}>评价</Text>
            </View>
            <View className={styles.locStatItem}>
              <Text className={styles.locStatNum}>{inter.checkInCount}</Text>
              <Text className={styles.locStatLabel}>打卡</Text>
            </View>
            <Text className={classnames(
              styles.expandArrow,
              isExpanded && styles.expandArrowUp
            )}>›</Text>
          </View>
        </View>

        {isExpanded && (
          <View className={styles.locationCardDetail}>
            <View className={styles.locDetailActions}>
              <Button
                className={classnames(
                  styles.locDetailBtn,
                  isFav && styles.locDetailBtnActive
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  isFav ? handleRemoveFavorite(loc.id, e) : handleAddFavorite(loc.id, e);
                }}
              >
                {isFav ? '❤️ 已收藏' : '🤍 收藏'}
              </Button>
              <Button
                className={styles.locDetailBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  handleGoDetail(loc.id);
                }}
              >
                📄 查看详情
              </Button>
            </View>

            {inter.comments.length > 0 && (
              <View className={styles.locDetailSection}>
                <Text className={styles.locDetailSectionTitle}>💬 我的评价 ({inter.comments.length})</Text>
                {inter.comments.slice(0, 3).map((comment: LocationComment) => (
                  <View key={comment.id} className={styles.locCommentItem}>
                    <View className={styles.locCommentHeader}>
                      <Text className={styles.locCommentRating}>
                        {'⭐'.repeat(comment.rating)}
                      </Text>
                      <Text className={styles.locCommentTime}>{comment.createTime}</Text>
                    </View>
                    <Text className={styles.locCommentContent}>{comment.content}</Text>
                    <View className={styles.locCommentActions}>
                      <Text
                        className={styles.deleteBtn}
                        onClick={(e) => handleDeleteMyComment(comment.id, e)}
                      >
                        删除
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {locCheckIns.length > 0 && (
              <View className={styles.locDetailSection}>
                <Text className={styles.locDetailSectionTitle}>📌 打卡记录 ({locCheckIns.length})</Text>
                <View className={styles.locCheckinList}>
                  {locCheckIns.slice(0, 5).map((item: UserCheckIn) => (
                    <View key={item.id} className={styles.locCheckinItem}>
                      <Image
                        className={styles.locCheckinThumb}
                        src={item.stampUrl}
                        mode="aspectFill"
                      />
                      <View className={styles.locCheckinInfo}>
                        <Text className={styles.locCheckinTime}>{item.checkInTime}</Text>
                        <Text className={styles.locCheckinDesc}>🎉 已打卡盖章</Text>
                      </View>
                    </View>
                  ))}
                </View>
                {locCheckIns.length > 5 && (
                  <Text className={styles.locMoreText}>还有 {locCheckIns.length - 5} 条记录...</Text>
                )}
              </View>
            )}

            {isFav && inter.favoriteTime && (
              <View className={styles.locDetailSection}>
                <Text className={styles.locDetailSectionTitle}>❤️ 收藏信息</Text>
                <Text className={styles.locFavTime}>收藏时间：{inter.favoriteTime}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.header}>
        <View className={styles.userInfo}>
          <View className={styles.avatar}>
            <Text>🎓</Text>
          </View>
          <View>
            <Text className={styles.userName}>同学你好</Text>
            <Text className={styles.userDesc}>已发现 {favoriteLocations.length} 个宝藏地点</Text>
          </View>
        </View>
        <View className={styles.stats}>
          <View className={styles.statItem}>
            <Text className={styles.statNumber}>{favoriteLocations.length}</Text>
            <Text className={styles.statLabel}>收藏</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statNumber}>{checkIns.length}</Text>
            <Text className={styles.statLabel}>打卡</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statNumber}>{myComments.length}</Text>
            <Text className={styles.statLabel}>评价</Text>
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
          <View className={styles.interactionHeader}>
            <View className={styles.viewModeToggle}>
              <View
                className={classnames(
                  styles.viewModeTab,
                  viewMode === 'byType' && styles.viewModeTabActive
                )}
                onClick={() => setViewMode('byType')}
              >
                <Text>按类型</Text>
              </View>
              <View
                className={classnames(
                  styles.viewModeTab,
                  viewMode === 'byLocation' && styles.viewModeTabActive
                )}
                onClick={() => setViewMode('byLocation')}
              >
                <Text>按地点</Text>
              </View>
            </View>
          </View>

          {viewMode === 'byType' && (
            <View>
              <View className={styles.interactionTabs}>
                {tabs.map((tab) => (
                  <View
                    key={tab.key}
                    className={classnames(
                      styles.interactionTab,
                      activeTab === tab.key && styles.interactionTabActive
                    )}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    <Text className={styles.interactionTabIcon}>{tab.icon}</Text>
                    <Text className={styles.interactionTabName}>{tab.name}</Text>
                    {tab.count > 0 && (
                      <Text className={styles.interactionTabCount}>{tab.count}</Text>
                    )}
                  </View>
                ))}
              </View>

              {activeTab === 'favorite' && (
                <View className={styles.interactionList}>
                  {favoriteLocations.length > 0 ? (
                    favoriteLocations.map((loc) => (
                      <View
                        key={loc.id}
                        className={styles.interactionItem}
                        onClick={() => handleGoDetail(loc.id)}
                      >
                        <View className={styles.interactionItemContent}>
                          <View className={styles.interactionItemHeader}>
                            <Text className={styles.interactionItemCategory}>
                              {formatCategory(loc.category)}
                            </Text>
                            <Text className={styles.interactionItemDistance}>
                              {formatDistance(loc.distance)}
                            </Text>
                          </View>
                          <Text className={styles.interactionItemName}>{loc.name}</Text>
                          <Text className={styles.interactionItemDesc}>{loc.address}</Text>
                        </View>
                        <View
                          className={styles.removeFavoriteBtn}
                          onClick={(e) => handleRemoveFavorite(loc.id, e)}
                        >
                          <Text>❤️ 已收藏</Text>
                        </View>
                      </View>
                    ))
                  ) : (
                    <View className={styles.emptyState}>
                      <Empty text="还没有收藏的地点" icon="❤️" />
                      <Text className={styles.emptyTip}>去发现校园里的宝藏地点吧~</Text>
                    </View>
                  )}
                </View>
              )}

              {activeTab === 'comment' && (
                <View className={styles.interactionList}>
                  {myComments.length > 0 ? (
                    myComments.map((comment) => {
                      const commentLocation = getLocationById(comment.locationId);
                      return (
                        <View
                          key={comment.id}
                          className={styles.interactionItem}
                          onClick={() => comment.locationId && handleGoDetail(comment.locationId)}
                        >
                          <View className={styles.interactionItemContent}>
                            <View className={styles.interactionItemHeader}>
                              <Text className={styles.interactionItemLocation}>
                                {commentLocation?.name || '未知地点'}
                              </Text>
                              <Text className={styles.interactionItemRating}>
                                {'⭐'.repeat(comment.rating)}
                              </Text>
                            </View>
                            <Text className={styles.interactionItemTime}>{comment.createTime}</Text>
                            <Text className={styles.interactionItemDesc}>{comment.content}</Text>
                          </View>
                          <View
                            className={styles.deleteBtn}
                            onClick={(e) => handleDeleteMyComment(comment.id, e)}
                          >
                            <Text>删除</Text>
                          </View>
                        </View>
                      );
                    })
                  ) : (
                    <View className={styles.emptyState}>
                      <Empty text="还没有发表过评价" icon="💬" />
                      <Text className={styles.emptyTip}>去地点详情页留下你的真实评价吧~</Text>
                    </View>
                  )}
                </View>
              )}

              {activeTab === 'checkin' && (
                <View className={styles.interactionList}>
                  {checkIns.length > 0 ? (
                    checkIns.slice(0, 10).map((item) => (
                      <View
                        key={item.id}
                        className={styles.interactionItem}
                        onClick={() => handleGoDetail(item.locationId)}
                      >
                        <Image
                          className={styles.checkinThumbnail}
                          src={item.stampUrl}
                          mode="aspectFill"
                          onError={(e) => console.error('[MinePage] Stamp image error:', e.detail)}
                        />
                        <View className={styles.interactionItemContent}>
                          <View className={styles.interactionItemHeader}>
                            <Text className={styles.interactionItemName}>{item.locationName}</Text>
                          </View>
                          <Text className={styles.interactionItemTime}>{item.checkInTime}</Text>
                          <Text className={styles.interactionItemDesc}>🎉 已打卡盖章</Text>
                        </View>
                        <Text className={styles.menuArrow}>›</Text>
                      </View>
                    ))
                  ) : (
                    <View className={styles.emptyState}>
                      <Empty text="还没有打卡记录" icon="📌" />
                      <Text className={styles.emptyTip}>去地点详情页打卡收集徽章吧~</Text>
                    </View>
                  )}
                  {checkIns.length > 10 && (
                    <Button
                      className={styles.viewMoreBtn}
                      onClick={() => Taro.navigateTo({ url: '/pages/checkin/index' })}
                    >
                      查看全部打卡记录 →
                    </Button>
                  )}
                </View>
              )}
            </View>
          )}

          {viewMode === 'byLocation' && (
            <View className={styles.locationView}>
              {myInteractionLocations.length > 0 ? (
                <View className={styles.locationCardList}>
                  {myInteractionLocations.map((loc) => renderLocationCard(loc))}
                </View>
              ) : (
                <View className={styles.emptyState}>
                  <Empty text="还没有互动过的地点" icon="🏠" />
                  <Text className={styles.emptyTip}>去探索校园，留下你的足迹吧~</Text>
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
