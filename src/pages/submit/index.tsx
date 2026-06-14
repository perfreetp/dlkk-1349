import React, { useState } from 'react';
import { View, Text, Input, Textarea, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import type { LocationCategory } from '@/types/location';
import { useUserStore } from '@/store/userStore';
import { mockTags } from '@/data/mockLocations';
import styles from './index.module.scss';

const SubmitPage: React.FC = () => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<LocationCategory | ''>('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const submissions = useUserStore((state) => state.submissions);
  const addSubmission = useUserStore((state) => state.addSubmission);

  const categories = [
    { key: 'study' as LocationCategory, name: '自习角', icon: '📚' },
    { key: 'food' as LocationCategory, name: '低价餐馆', icon: '🍜' },
    { key: 'activity' as LocationCategory, name: '社团活动', icon: '🎉' },
    { key: 'walk' as LocationCategory, name: '散步路线', icon: '🚶' },
  ];

  const availableTags = mockTags.filter((tag) => !category || tag.category === category);

  const isFormValid = name.trim() && category && address.trim() && description.trim();

  const handleTagToggle = (tagName: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagName) ? prev.filter((t) => t !== tagName) : [...prev, tagName]
    );
  };

  const handleSubmit = async () => {
    if (!isFormValid) {
      Taro.showToast({ title: '请填写完整信息', icon: 'none' });
      return;
    }

    setSubmitting(true);
    try {
      addSubmission({
        name: name.trim(),
        category: category as LocationCategory,
        address: address.trim(),
        description: description.trim(),
        tags: selectedTags,
      });

      console.log('[SubmitPage] Submission added');
      Taro.showToast({ title: '提交成功，等待审核', icon: 'success' });

      setName('');
      setCategory('');
      setAddress('');
      setDescription('');
      setSelectedTags([]);
    } catch (error) {
      console.error('[SubmitPage] Submit error:', error);
      Taro.showToast({ title: '提交失败，请重试', icon: 'none' });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusClass = (status: string) => {
    const map: Record<string, string> = {
      pending: styles.statusPending,
      approved: styles.statusApproved,
      rejected: styles.statusRejected,
    };
    return map[status] || '';
  };

  const getStatusText = (status: string) => {
    const map: Record<string, string> = {
      pending: '审核中',
      approved: '已通过',
      rejected: '已拒绝',
    };
    return map[status] || '未知';
  };

  return (
    <View className={styles.page}>
      <View className={styles.tipCard}>
        <Text className={styles.tipTitle}>💡 发现宝藏了吗？</Text>
        <Text className={styles.tipText}>
          分享你发现的小众地点，帮助更多同学发现校园周边的美好。审核通过后将获得积分奖励！
        </Text>
      </View>

      <View className={styles.anonymousTip}>
        <Text className={styles.anonymousIcon}>🕵️</Text>
        <Text className={styles.anonymousText}>支持匿名投稿，你的隐私我们来保护</Text>
      </View>

      <View className={styles.form}>
        <View className={styles.formItem}>
          <Text className={styles.formLabel}>
            地点名称<Text className={styles.required}>*</Text>
          </Text>
          <Input
            className={styles.formInput}
            placeholder="请输入地点名称"
            value={name}
            onInput={(e) => setName(e.detail.value)}
            maxlength={50}
          />
        </View>

        <View className={styles.formItem}>
          <Text className={styles.formLabel}>
            地点分类<Text className={styles.required}>*</Text>
          </Text>
          <View className={styles.categoryGrid}>
            {categories.map((cat) => (
              <View
                key={cat.key}
                className={classnames(
                  styles.categoryOption,
                  category === cat.key && styles.categoryOptionActive
                )}
                onClick={() => {
                  setCategory(cat.key);
                  setSelectedTags([]);
                  console.log('[SubmitPage] Category selected:', cat.key);
                }}
              >
                <Text className={styles.categoryIcon}>{cat.icon}</Text>
                <Text
                  className={classnames(
                    styles.categoryName,
                    category === cat.key && styles.categoryNameActive
                  )}
                >
                  {cat.name}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.formItem}>
          <Text className={styles.formLabel}>
            详细地址<Text className={styles.required}>*</Text>
          </Text>
          <Input
            className={styles.formInput}
            placeholder="请输入详细地址，如：图书馆三楼东侧"
            value={address}
            onInput={(e) => setAddress(e.detail.value)}
            maxlength={100}
          />
        </View>

        <View className={styles.formItem}>
          <Text className={styles.formLabel}>
            补充标签
          </Text>
          <View className={styles.tagsContainer}>
            {availableTags.map((tag) => (
              <View
                key={tag.id}
                className={classnames(
                  styles.tagOption,
                  selectedTags.includes(tag.name) && styles.tagOptionActive
                )}
                onClick={() => handleTagToggle(tag.name)}
              >
                <Text>{tag.name}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.formItem}>
          <Text className={styles.formLabel}>
            详细描述<Text className={styles.required}>*</Text>
          </Text>
          <Textarea
            className={styles.formTextarea}
            placeholder="请详细描述这个地点的特点，比如环境如何、有什么特别之处、适合什么时候去等..."
            value={description}
            onInput={(e) => setDescription(e.detail.value)}
            maxlength={500}
          />
        </View>

        <Button
          className={classnames(
            styles.submitBtn,
            !isFormValid && styles.submitBtnDisabled
          )}
          onClick={handleSubmit}
          disabled={!isFormValid || submitting}
        >
          {submitting ? '提交中...' : '匿名提交'}
        </Button>
      </View>

      {submissions.length > 0 && (
        <View className={styles.mySubmissions}>
          <Text className={styles.sectionTitle}>📝 我的投稿</Text>
          {submissions.map((sub) => (
            <View key={sub.id} className={styles.submissionCard}>
              <View className={styles.submissionHeader}>
                <Text className={styles.submissionName}>{sub.name}</Text>
                <Text className={getStatusClass(sub.status)}>
                  {getStatusText(sub.status)}
                </Text>
              </View>
              <Text className={styles.submissionDesc}>{sub.description}</Text>
              <Text className={styles.submissionTime}>投稿时间：{sub.submitTime}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

export default SubmitPage;
