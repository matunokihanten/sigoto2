import { CheckItem } from './types';

export const DEFAULT_CHECKLIST: CheckItem[] = [
    { id: 'c1', category: '一般的衛生管理', text: '調理従事者の健康チェック・服装・手洗い', type: 'boolean', displayOrder: 1 },
    { id: 'c2', category: '一般的衛生管理', text: '調理器具（包丁・まな板）の洗浄・消毒', type: 'boolean', displayOrder: 2 },
    { id: 'c3', category: '一般的衛生管理', text: '冷蔵庫の温度確認（10℃以下）', type: 'record', unit: '℃', displayOrder: 3 },
    { id: 'c4', category: '一般的衛生管理', text: '冷凍庫の温度確認（-15℃以下）', type: 'record', unit: '℃', displayOrder: 4 },
    { id: 'c5', category: '一般的衛生管理', text: '調理場の清掃・ゴミの処理', type: 'boolean', displayOrder: 5 },
    { id: 'c6', category: '一般的衛生管理', text: 'トイレの洗浄・消毒', type: 'boolean', displayOrder: 6 },
    { id: 'h1', category: '重要管理点 (HACCP)', text: '食材受入時の鮮度・品温確認', type: 'boolean', displayOrder: 7 },
    { id: 'h2', category: '重要管理点 (HACCP)', text: '加熱調理時の中心温度確認（75℃ 1分以上）', type: 'boolean', displayOrder: 8 },
    { id: 'h3', category: '重要管理点 (HACCP)', text: '加熱後の食品の冷却処理（速やかに冷却）', type: 'boolean', displayOrder: 9 },
    { id: 'h4', category: '重要管理点 (HACCP)', text: '再加熱時の中心温度確認', type: 'boolean', displayOrder: 10 },
    { id: 'h5', category: '重要管理点 (HACCP)', text: '揚げ油の交換基準確認', type: 'boolean', displayOrder: 11 },
];
