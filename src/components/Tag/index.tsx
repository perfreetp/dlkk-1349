import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

interface TagProps {
  text: string;
  type?: 'default' | 'primary' | 'green' | 'yellow' | 'orange';
  selected?: boolean;
  onClick?: () => void;
}

const Tag: React.FC<TagProps> = ({ text, type = 'default', selected = false, onClick }) => {
  const tagClass = classnames(
    styles.tag,
    type === 'primary' && styles.tagPrimary,
    type === 'green' && styles.tagGreen,
    type === 'yellow' && styles.tagYellow,
    type === 'orange' && styles.tagOrange,
    selected && styles.tagSelected
  );

  return (
    <View className={tagClass} onClick={onClick}>
      <Text>{text}</Text>
    </View>
  );
};

export default Tag;
