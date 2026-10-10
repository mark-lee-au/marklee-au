import type { Landmark } from './city-landmarks';
export type LandmarkSort = 'abc' | 'height';
const categoryOrder: Landmark['category'][] = ['ICONS', 'TOWERS', 'HISTORY', 'CULTURE', 'SPORT'];
/** Return a new array so rendering order never mutates scene/selection order. */
export function sortedLandmarkList(items: Landmark[], sort: LandmarkSort, grouped: boolean): Landmark[] {
  return [...items].sort((a, b) => {
    if (grouped) {
      const groupOrder = categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category);
      if (groupOrder !== 0) return groupOrder;
    }
    if (sort === 'height' && b.heightM !== a.heightM) return b.heightM - a.heightM;
    return a.name.localeCompare(b.name, 'en', { sensitivity: 'base', numeric: true }) || a.id.localeCompare(b.id);
  });
}
export function landmarkHeightLabel(item: Landmark): string {
  return `${item.heightComparable ? '' : '~'}${Math.round(item.heightM)} m`;
}
