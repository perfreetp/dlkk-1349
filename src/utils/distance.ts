export function formatDistance(distance: number): string {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  }
  return `${distance.toFixed(1)}km`;
}

export function formatCrowdLevel(level: string): string {
  const map: Record<string, string> = {
    empty: '空无一人',
    sparse: '人很少',
    moderate: '适中',
    crowded: '拥挤',
  };
  return map[level] || '未知';
}

export function formatBusinessStatus(status: string): string {
  const map: Record<string, string> = {
    open: '营业中',
    closed: '已打烊',
    unknown: '未知',
  };
  return map[status] || '未知';
}

export function formatCategory(category: string): string {
  const map: Record<string, string> = {
    study: '自习角',
    food: '低价餐馆',
    activity: '社团活动',
    walk: '散步路线',
  };
  return map[category] || '其他';
}

export function getCategoryColor(category: string): string {
  const map: Record<string, string> = {
    study: '#5AD8A6',
    food: '#F6BD16',
    activity: '#E86452',
    walk: '#5B8FF9',
  };
  return map[category] || '#86909C';
}

export function formatBudget(budget: number): string {
  if (budget === 0) return '免费';
  return `¥${budget}/人`;
}
