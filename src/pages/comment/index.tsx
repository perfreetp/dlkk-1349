import React, { useState, useMemo } from 'react';
import { View, Text, Textarea, Button } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import { mockLocations } from '@/data/mockLocations';
import styles from './index.module.scss';

const CommentPage: React.FC = () => {
  const router = useRouter();
  const locationId = router.params.id;

  const location = useMemo(() => {
    return mockLocations.find((loc) => loc.id === locationId);
  }, [locationId]);

  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

    setSubmitting(true);
    try {
      console.log('[CommentPage] Comment submitted:', { locationId, rating, content });
      Taro.showToast({ title: '评价成功！', icon: 'success' });
      setTimeout(() => Taro.navigateBack(), 1000);
    } catch (error) {
      console.error('[CommentPage] Submit error:', error);
      Taro.showToast({ title: '提交失败，请重试', icon: 'none' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className={styles.page}>
      {location && (
        <View className={styles.locationInfo}>
          <Text className={styles.locationName}>{location.name}</Text>
          <Text className={styles.locationDesc}>{location.address}</Text>
        </View>
      )}

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
