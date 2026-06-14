import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, Textarea, Button, ScrollView } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import { mockLocations } from '@/data/mockLocations';
import Empty from '@/components/Empty';
import { useUserStore } from '@/store/userStore';
import type { Location } from '@/types/location';
import styles from './index.module.scss';

const CommentPage: React.FC = () => {
  const router = useRouter();
  const locationId = router.params.id;
  const mode = router.params.mode;

  const addComment = useUserStore(state => state.addComment);
  const getMyComments = useUserStore(state => state.getMyComments);
  const deleteMyComment = useUserStore(state => state.deleteMyComment);

  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [, forceUpdate] = useState(0);

  const isPublishMode = locationId && locationId.length > 0 && mode !== 'list';

  useDidShow(() => {
    forceUpdate(prev => prev + 1);
    if (!isPublishMode) {
      Taro.setNavigationBarTitle({ title: '我的评价' });
    } else {
      Taro.setNavigationBarTitle({ title: '发表评价' });
    }
    console.log('[CommentPage] Page did show, mode:', isPublishMode ? 'publish' : 'list');
  });

  const location = useMemo(() => {
    if (!locationId) return null;
    return mockLocations.find((loc) => loc.id === locationId);
  }, [locationId]);

  const myComments = useMemo(() => {
    return getMyComments();
  }, [getMyComments]);

  const getLocationById = (id: string): Location | undefined => {
    return mockLocations.find(loc => loc.id === id);
  };

  useEffect(() => {
    if (isPublishMode && !location) {
      Taro.showToast({ title: '未选择地点，无法评价', icon: 'none' });
      setTimeout(() => {
        Taro.navigateBack();
      }, 1500);
      console.log('[CommentPage] No location selected, navigate back');
    }
  }, [isPublishMode, location]);

  const isFormValid = rating > 0 && content.trim().length >= 10;

  const handleStarClick = (star: number) => {
    setRating(star);
    console.log('[CommentPage] Rating selected:', star);
  };

  const handleSubmit = async () => {
    if (!isFormValid) {
      Taro.showToast({ title: '请填写完整评价（至少10字）', icon: 'none' });
      return;
    }

    if (!locationId || !location) {
      Taro.showToast({ title: '未选择地点，无法评价', icon: 'none' });
      return;
    }

    setSubmitting(true);
    try {
      const newComment = addComment(locationId, rating, content.trim());
      console.log('[CommentPage] Comment saved:', newComment);
      Taro.showToast({ title: '评价成功！', icon: 'success' });
      setTimeout(() => Taro.navigateBack(), 1000);
    } catch (error) {
      console.error('[CommentPage] Submit error:', error);
      Taro.showToast({ title: '提交失败，请重试', icon: 'none' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCommentClick = (comment: { locationId: string }) => {
    Taro.navigateTo({ url: `/pages/detail/index?id=${comment.locationId}` });
  };

  const handleDeleteComment = (commentId: string) => {
    Taro.showModal({
      title: '删除评价',
      content: '确定要删除这条评价吗？',
      success: (res) => {
        if (res.confirm) {
          deleteMyComment(commentId);
          Taro.showToast({ title: '删除成功', icon: 'none' });
          forceUpdate(prev => prev + 1);
          console.log('[CommentPage] Delete comment:', commentId);
        }
      },
    });
  };

  if (isPublishMode && !location) {
    return (
      <View className={styles.page}>
        <Empty text="未选择地点，无法评价" icon="❌" />
      </View>
    );
  }

  if (!isPublishMode) {
    return (
      <View className={styles.page}>
        <ScrollView scrollY className={styles.listContainer}>
          <View className={styles.listHeader}>
            <Text className={styles.listTitle}>我的评价</Text>
            <Text className={styles.listCount}>共 {myComments.length} 条</Text>
          </View>

          {myComments.length > 0 ? (
            <View className={styles.commentList}>
              {myComments.map((comment) => {
                const commentLocation = getLocationById(comment.locationId);
                return (
                  <View
                    key={comment.id}
                    className={styles.myCommentItem}
                    onClick={() => handleCommentClick(comment)}
                  >
                    <View className={styles.myCommentHeader}>
                      <View className={styles.myCommentLocation}>
                        <Text className={styles.myCommentLocationName}>
                          {commentLocation?.name || '未知地点'}
                        </Text>
                        <Text className={styles.myCommentTime}>{comment.createTime}</Text>
                      </View>
                      <Text className={styles.myCommentRating}>
                        {'⭐'.repeat(comment.rating)}
                      </Text>
                    </View>
                    <Text className={styles.myCommentContent}>{comment.content}</Text>
                    <View className={styles.myCommentActions}>
                      <Text
                        className={styles.deleteBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteComment(comment.id);
                        }}
                      >
                        删除
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View className={styles.emptyState}>
              <Empty text="还没有发表过评价" icon="💬" />
              <Text className={styles.emptyTip}>去发现校园宝藏，留下你的评价吧~</Text>
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <View className={styles.page}>
      <View className={styles.locationInfo}>
        <Text className={styles.locationName}>{location.name}</Text>
        <Text className={styles.locationDesc}>{location.address}</Text>
      </View>

      <View className={styles.ratingSection}>
        <Text className={styles.sectionTitle}>⭐ 整体评分</Text>
        <View className={styles.stars}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Text
              key={star}
              className={styles.star}
              onClick={() => handleStarClick(star)}
            >
              {star <= rating ? '⭐' : '☆'}
            </Text>
          ))}
        </View>
      </View>

      <View className={styles.commentSection}>
        <Text className={styles.sectionTitle}>💬 评价内容</Text>
        <Textarea
          className={styles.textarea}
          placeholder="分享你的真实体验，帮助更多同学..."
          value={content}
          onInput={(e) => setContent(e.detail.value)}
          maxlength={500}
          autoHeight
        />
        <Text className={styles.charCount}>{content.length}/500</Text>
      </View>

      <View className={styles.anonymousTip}>
        <Text className={styles.anonymousIcon}>🕵️</Text>
        <Text className={styles.anonymousText}>你的评价将以匿名方式发布</Text>
      </View>

      <Button
        className={classnames(
          styles.submitBtn,
          !isFormValid && styles.submitBtnDisabled
        )}
        onClick={handleSubmit}
        disabled={!isFormValid || submitting}
      >
        {submitting ? '提交中...' : '发布评价'}
      </Button>
    </View>
  );
};

export default CommentPage;
