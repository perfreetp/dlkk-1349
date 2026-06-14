import React, { useState, useMemo } from 'react';
import { View, Text, Swiper, SwiperItem, Image, Button, ScrollView } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import { mockLocations } from '@/data/mockLocations';
import type { Location, LocationComment, LocationActivity, ActivityType } from '@/types/location';
import {
  formatDistance,
  formatCrowdLevel,
  formatBusinessStatus,
  formatBudget,
  getCategoryColor,
  formatCategory,
} from '@/utils/distance';
import Tag from '@/components/Tag';
import Empty from '@/components/Empty';
import { useUserStore } from '@/store/userStore';
import styles from './index.module.scss';

const COMMENT_PREVIEW_COUNT = 3;
const ACTIVITY_PREVIEW_COUNT = 5;

const DetailPage: React.FC = () => {
  const router = useRouter();
  const locationId = router.params.id;

  const location = useMemo(() => {
    return mockLocations.find((loc) => loc.id === locationId) as Location;
  }, [locationId]);

  const isFavorite = useUserStore(state => state.isFavorite);
  const toggleFavorite = useUserStore(state => state.toggleFavorite);
  const addCheckIn = useUserStore(state => state.addCheckIn);
  const getCommentsByLocationSorted = useUserStore(state => state.getCommentsByLocationSorted);
  const getCommentCountByLocation = useUserStore(state => state.getCommentCountByLocation);
  const toggleCommentLike = useUserStore(state => state.toggleCommentLike);
  const isCommentLiked = useUserStore(state => state.isCommentLiked);
  const getCommentLikesCount = useUserStore(state => state.getCommentLikesCount);
  const deleteMyComment = useUserStore(state => state.deleteMyComment);
  const getActivitiesByLocation = useUserStore(state => state.getActivitiesByLocation);
  const getLocationStats = useUserStore(state => state.getLocationStats);

  const [commentSort, setCommentSort] = useState<'latest' | 'useful'>('latest');
  const [showAllComments, setShowAllComments] = useState(false);
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [scrollIntoView, setScrollIntoView] = useState('');
  const [, forceUpdate] = useState(0);

  useDidShow(() => {
    forceUpdate(prev => prev + 1);
    setShowAllComments(false);
    console.log('[DetailPage] Page did show, refresh comments');
  });

  const allComments = location ? getCommentsByLocationSorted(location.id, commentSort) : [];
  const totalCommentCount = location ? getCommentCountByLocation(location.id) : 0;
  const displayComments = showAllComments ? allComments : allComments.slice(0, COMMENT_PREVIEW_COUNT);
  const hasMoreComments = allComments.length > COMMENT_PREVIEW_COUNT;

  const allActivities = location ? getActivitiesByLocation(location.id) : [];
  const locationStats = location ? getLocationStats(location.id) : { comments: 0, checkIns: 0, favorites: 0 };
  const displayActivities = showAllActivities ? allActivities : allActivities.slice(0, ACTIVITY_PREVIEW_COUNT);
  const hasMoreActivities = allActivities.length > ACTIVITY_PREVIEW_COUNT;

  if (!location) {
    return (
      <View className={styles.page}>
        <Empty text="地点不存在" icon="❓" />
      </View>
    );
  }

  const getTagType = () => {
    const map: Record<string, 'green' | 'yellow' | 'orange' | 'primary'> = {
      study: 'green',
      food: 'yellow',
      activity: 'orange',
      walk: 'primary',
    };
    return map[location.category] || 'primary';
  };

  const handleFavorite = () => {
    toggleFavorite(location.id);
    const newState = !isFavorite(location.id);
    Taro.showToast({
      title: newState ? '已收藏' : '已取消收藏',
      icon: 'none',
    });
    console.log('[DetailPage] Toggle favorite:', { locationId: location.id, isFavorite: newState });
  };

  const handleCheckIn = () => {
    addCheckIn(location.id, location.name);
    Taro.showToast({ title: '打卡成功！', icon: 'success' });
    console.log('[DetailPage] Check in:', { locationId: location.id });
  };

  const handleNavigate = () => {
    Taro.openLocation({
      latitude: location.latitude,
      longitude: location.longitude,
      name: location.name,
      address: location.address,
      scale: 18,
    });
    console.log('[DetailPage] Navigate to:', { locationId: location.id });
  };

  const handleReport = () => {
    Taro.showActionSheet({
      itemList: ['地点已关闭', '地址错误', '信息不准确', '其他问题'],
      success: (res) => {
        Taro.showToast({ title: '感谢反馈，我们会尽快核实', icon: 'none' });
        console.log('[DetailPage] Report issue:', res.tapIndex);
      },
    });
  };

  const handleCommentLike = (commentId: string) => {
    toggleCommentLike(commentId);
    forceUpdate(prev => prev + 1);
  };

  const handleDeleteMyComment = (comment: LocationComment) => {
    if (!comment.isMine) return;
    Taro.showModal({
      title: '删除评价',
      content: '确定要删除这条评价吗？',
      success: (res) => {
        if (res.confirm) {
          deleteMyComment(comment.id);
          Taro.showToast({ title: '删除成功', icon: 'none' });
          forceUpdate(prev => prev + 1);
          console.log('[DetailPage] Delete comment:', comment.id);
        }
      },
    });
  };

  const handleSortChange = (sort: 'latest' | 'useful') => {
    setCommentSort(sort);
    setShowAllComments(false);
    console.log('[DetailPage] Comment sort changed:', sort);
  };

  const isFav = isFavorite(location.id);

  const getActivityIcon = (type: ActivityType) => {
    const icons: Record<ActivityType, string> = {
      comment: '💬',
      checkin: '📌',
      favorite: '❤️',
      like: '👍',
    };
    return icons[type] || '📝';
  };

  const getActivityLabel = (type: ActivityType) => {
    const labels: Record<ActivityType, string> = {
      comment: '发表了评价',
      checkin: '打卡了这里',
      favorite: '收藏了这里',
      like: '点了赞',
    };
    return labels[type] || '有新动态';
  };

  const handleActivityClick = (activity: LocationActivity) => {
    if (activity.type === 'comment') {
      setScrollIntoView('comments-section');
      setTimeout(() => setScrollIntoView(''), 100);
      Taro.showToast({ title: '已跳转到评价区', icon: 'none' });
    } else if (activity.type === 'checkin') {
      Taro.showActionSheet({
        itemList: ['🧭 导航到这里', '📄 查看地点详情'],
        success: (res) => {
          if (res.tapIndex === 0) {
            handleNavigate();
          } else if (res.tapIndex === 1) {
            setScrollIntoView('top-section');
            setTimeout(() => setScrollIntoView(''), 100);
          }
        }
      });
    } else if (activity.type === 'favorite') {
      Taro.showActionSheet({
        itemList: ['🧭 导航到这里', '📄 查看地点详情', isFav ? '❤️ 取消收藏' : '🤍 加入收藏'],
        success: (res) => {
          if (res.tapIndex === 0) {
            handleNavigate();
          } else if (res.tapIndex === 1) {
            setScrollIntoView('top-section');
            setTimeout(() => setScrollIntoView(''), 100);
          } else if (res.tapIndex === 2) {
            handleFavorite();
          }
        }
      });
    }
    console.log('[DetailPage] Activity clicked:', activity);
  };

  const handleActivityQuickAction = (e: React.MouseEvent, activity: LocationActivity, action: 'navigate' | 'detail' | 'comment') => {
    e.stopPropagation();
    if (action === 'navigate') {
      handleNavigate();
    } else if (action === 'detail') {
      setScrollIntoView('top-section');
      setTimeout(() => setScrollIntoView(''), 100);
    } else if (action === 'comment') {
      Taro.navigateTo({ url: `/pages/comment/index?id=${location.id}` });
    }
    console.log('[DetailPage] Activity quick action:', { activity, action });
  };

  return (
    <View className={styles.page}>
      <ScrollView scrollY scroll-into-view={scrollIntoView} scroll-with-animation>
        <Swiper
          className={styles.photoSwiper}
          indicatorDots
          autoplay
          circular
          indicatorColor="rgba(255,255,255,0.5)"
          indicatorActiveColor="#fff"
        >
          {location.photos.map((photo) => (
            <SwiperItem key={photo.id} className={styles.photoItem}>
              <Image
                className={styles.photoImage}
                src={photo.url}
                mode="aspectFill"
                onError={(e) => console.error('[DetailPage] Photo error:', e.detail)}
              />
            </SwiperItem>
          ))}
        </Swiper>

        <View className={styles.content}>
          <View className={styles.header} id="top-section">
            <View className={styles.titleRow}>
              <Text className={styles.title}>{location.name}</Text>
              {location.isVerified && (
                <Text className={styles.verifiedBadge}>✓ 已认证</Text>
              )}
            </View>

            <View className={styles.ratingRow}>
              <Text className={styles.rating}>{location.rating}</Text>
              <Text className={styles.ratingStars}>
                {'⭐'.repeat(Math.round(location.rating))}
              </Text>
              <Text className={styles.reviewCount}>({totalCommentCount}条评价)</Text>
            </View>

            <View className={styles.tagsRow}>
              <Tag text={formatCategory(location.category)} type={getTagType()} />
              {location.tags.map((tag) => (
                <Tag key={tag.id} text={tag.name} type="default" />
              ))}
            </View>

            <Text className={styles.desc}>{location.description}</Text>
          </View>

          <View className={styles.infoSection}>
            <Text className={styles.sectionTitle}>📋 基本信息</Text>
            <View className={styles.infoGrid}>
              <View className={styles.infoItem}>
                <Text className={styles.infoLabel}>营业状态</Text>
                <Text
                  className={classnames(
                    styles.infoValue,
                    location.businessStatus === 'open' && styles.infoValueGreen
                  )}
                >
                  {formatBusinessStatus(location.businessStatus)}
                </Text>
              </View>
              <View className={styles.infoItem}>
                <Text className={styles.infoLabel}>营业时间</Text>
                <Text className={styles.infoValue}>{location.businessHours}</Text>
              </View>
              <View className={styles.infoItem}>
                <Text className={styles.infoLabel}>拥挤程度</Text>
                <Text
                  className={classnames(
                    styles.infoValue,
                    location.crowdLevel === 'empty' && styles.infoValueGreen,
                    location.crowdLevel === 'crowded' && styles.infoValueRed,
                    location.crowdLevel === 'moderate' && styles.infoValueOrange
                  )}
                >
                  {formatCrowdLevel(location.crowdLevel)}
                </Text>
              </View>
              <View className={styles.infoItem}>
                <Text className={styles.infoLabel}>人均消费</Text>
                <Text className={styles.infoValue}>{formatBudget(location.budget)}</Text>
              </View>
              <View className={styles.infoItem}>
                <Text className={styles.infoLabel}>座位数量</Text>
                <Text className={styles.infoValue}>
                  {location.seatCount > 0 ? `${location.seatCount}个` : '无'}
                </Text>
              </View>
              <View className={styles.infoItem}>
                <Text className={styles.infoLabel}>插座情况</Text>
                <Text
                  className={classnames(
                    styles.infoValue,
                    location.socketAvailable && styles.infoValueGreen
                  )}
                >
                  {location.socketAvailable ? '有插座' : '无插座'}
                </Text>
              </View>
            </View>

            <View className={styles.addressRow}>
              <Text className={styles.addressIcon}>📍</Text>
              <Text className={styles.addressText}>
                {location.address} · {formatDistance(location.distance)}
              </Text>
              <Button className={styles.navBtn} onClick={handleNavigate}>
                导航
              </Button>
            </View>
          </View>

          <View className={styles.recommendSection}>
            <Text className={styles.sectionTitle}>⏰ 推荐时段</Text>
            <View className={styles.recommendCard}>
              <Text className={styles.recommendIcon}>💡</Text>
              <Text className={styles.recommendText}>{location.recommendedTime}</Text>
            </View>
          </View>

          <View className={styles.commentsSection} id="comments-section">
            <View className={styles.commentsHeader}>
              <Text className={styles.sectionTitle}>💬 同学评价 ({totalCommentCount})</Text>
              {totalCommentCount > 0 && (
                <View className={styles.sortTabs}>
                  <Text
                    className={classnames(
                      styles.sortTab,
                      commentSort === 'latest' && styles.sortTabActive
                    )}
                    onClick={() => handleSortChange('latest')}
                  >
                    最新
                  </Text>
                  <Text
                    className={classnames(
                      styles.sortTab,
                      commentSort === 'useful' && styles.sortTabActive
                    )}
                    onClick={() => handleSortChange('useful')}
                  >
                    最有用
                  </Text>
                </View>
              )}
            </View>

            {displayComments.length > 0 ? (
              <>
                {displayComments.map((comment) => (
                  <View key={comment.id} className={styles.commentItem}>
                    <View className={styles.commentHeader}>
                      <View className={styles.avatar}>
                        <Text>{comment.isMine ? '😊' : '🙂'}</Text>
                      </View>
                      <View className={styles.userInfo}>
                        <Text className={styles.userName}>
                          {comment.userName}
                          {comment.isMine && <Text className={styles.mineBadge}> (我)</Text>}
                        </Text>
                        <Text className={styles.commentTime}>{comment.createTime}</Text>
                      </View>
                      <Text className={styles.commentRating}>
                        {'⭐'.repeat(comment.rating)}
                      </Text>
                    </View>
                    <Text className={styles.commentContent}>{comment.content}</Text>
                    <View className={styles.commentFooter}>
                      <View
                        className={styles.likeBtn}
                        onClick={() => handleCommentLike(comment.id)}
                      >
                        <Text className={styles.likeIcon}>
                          {isCommentLiked(comment.id) ? '❤️' : '🤍'}
                        </Text>
                        <Text>{getCommentLikesCount(comment)}</Text>
                      </View>
                      {comment.isMine && (
                        <Text
                          className={styles.deleteCommentBtn}
                          onClick={() => handleDeleteMyComment(comment)}
                        >
                          删除
                        </Text>
                      )}
                    </View>
                  </View>
                ))}

                {hasMoreComments && (
                  <Button
                    className={classnames(
                      styles.addCommentBtn,
                      styles.showMoreBtn
                    )}
                    onClick={() => setShowAllComments(true)}
                  >
                    {showAllComments ? '收起评价' : `查看全部 ${allComments.length} 条评价 ↓`}
                  </Button>
                )}
              </>
            ) : (
              <Empty text="暂无评价，快来抢沙发吧" icon="💬" />
            )}
            <Button
              className={styles.addCommentBtn}
              onClick={() => Taro.navigateTo({ url: `/pages/comment/index?id=${location.id}` })}
            >
              ✍️ 写评价
            </Button>
          </View>

          <View className={styles.activitySection} id="activity-section">
            <View className={styles.activityHeader}>
              <Text className={styles.sectionTitle}>📜 地点动态</Text>
              <View className={styles.activityStats}>
                <View className={styles.activityStatItem}>
                  <Text className={styles.activityStatNum}>{locationStats.comments}</Text>
                  <Text className={styles.activityStatLabel}>评价</Text>
                </View>
                <View className={styles.activityStatItem}>
                  <Text className={styles.activityStatNum}>{locationStats.checkIns}</Text>
                  <Text className={styles.activityStatLabel}>打卡</Text>
                </View>
                <View className={styles.activityStatItem}>
                  <Text className={styles.activityStatNum}>{locationStats.favorites}</Text>
                  <Text className={styles.activityStatLabel}>收藏</Text>
                </View>
              </View>
            </View>

            {displayActivities.length > 0 ? (
              <View className={styles.timeline}>
                {displayActivities.map((activity, index) => (
                  <View
                    key={activity.id}
                    className={classnames(
                      styles.timelineItem,
                      index === displayActivities.length - 1 && styles.timelineItemLast
                    )}
                    onClick={() => handleActivityClick(activity)}
                  >
                    <View className={styles.timelineDot}>
                      <Text className={styles.timelineIcon}>
                        {getActivityIcon(activity.type)}
                      </Text>
                    </View>
                    <View className={styles.timelineLine} />
                    <View className={styles.timelineContent}>
                      <View className={styles.timelineHeader}>
                        <Text className={styles.timelineUser}>
                          {activity.userName}
                          {activity.isMine && <Text className={styles.timelineMine}> (我)</Text>}
                        </Text>
                        <Text className={styles.timelineTime}>{activity.time}</Text>
                      </View>
                      <Text className={styles.timelineAction}>
                        {getActivityLabel(activity.type)}
                      </Text>
                      {activity.content && (
                        <Text className={styles.timelineText}>"{activity.content}"</Text>
                      )}
                      {activity.rating && (
                        <Text className={styles.timelineRating}>
                          {'⭐'.repeat(activity.rating)}
                        </Text>
                      )}
                      <View className={styles.timelineActions}>
                        <View
                          className={styles.timelineActionBtn}
                          onClick={(e) => handleActivityQuickAction(e, activity, 'navigate')}
                        >
                          <Text>🧭 导航</Text>
                        </View>
                        <View
                          className={styles.timelineActionBtn}
                          onClick={(e) => handleActivityQuickAction(e, activity, 'detail')}
                        >
                          <Text>📄 详情</Text>
                        </View>
                        {activity.type === 'comment' && (
                          <View
                            className={styles.timelineActionBtn}
                            onClick={(e) => handleActivityQuickAction(e, activity, 'comment')}
                          >
                            <Text>✍️ 写评价</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                ))}

                {hasMoreActivities && (
                  <Button
                    className={styles.showMoreBtn}
                    onClick={() => setShowAllActivities(!showAllActivities)}
                  >
                    {showAllActivities ? '收起动态' : `查看全部 ${allActivities.length} 条动态 ↓`}
                  </Button>
                )}
              </View>
            ) : (
              <Empty text="暂无动态，来创造第一条吧" icon="📜" />
            )}
          </View>
        </View>
      </ScrollView>

      <View className={styles.bottomBar}>
        <View className={styles.actionBtn} onClick={handleFavorite}>
          <Text className={styles.actionIcon}>{isFav ? '❤️' : '🤍'}</Text>
          <Text
            className={classnames(
              styles.actionText,
              isFav && styles.actionTextActive
            )}
          >
            {isFav ? '已收藏' : '收藏'}
          </Text>
        </View>
        <View className={styles.actionBtn} onClick={handleReport}>
          <Text className={styles.actionIcon}>⚠️</Text>
          <Text className={styles.actionText}>报错</Text>
        </View>
        <Button className={styles.secondaryBtn} onClick={handleCheckIn}>
          📌 打卡
        </Button>
        <Button className={styles.primaryBtn} onClick={handleNavigate}>
          🗺️ 路线导航
        </Button>
      </View>
    </View>
  );
};

export default DetailPage;
