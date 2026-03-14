import { ADVANCED_MENU_LAYOUT, CONSUMER_MENU_LAYOUT } from './framework-menu-layout-data';
import type { MenuLayoutGroup, MenuLayoutItem, MenuLayoutResolvedGroup } from './framework-menu-layout-types';

const resolveLayout = <Action extends { id: string }>(
  layout: ReadonlyArray<MenuLayoutGroup>,
  actions: ReadonlyArray<Action>
): ReadonlyArray<MenuLayoutResolvedGroup<Action>> => {
  const byId = new Map(actions.map((action) => [action.id, action] as const));
  return layout.map((group) => ({
    key: group.key,
    title: group.title,
    items: group.itemIds
      .map((id) => {
        const action = byId.get(id);
        if (!action) {
          return null;
        }
        return { id, action };
      })
      .filter((entry): entry is MenuLayoutItem<Action> => entry !== null),
  }));
};

export const resolveConsumerMenuLayout = <Action extends { id: string }>(
  actions: ReadonlyArray<Action>
): ReadonlyArray<MenuLayoutResolvedGroup<Action>> => resolveLayout(CONSUMER_MENU_LAYOUT, actions);

export const resolveAdvancedMenuLayout = <Action extends { id: string }>(
  actions: ReadonlyArray<Action>
): ReadonlyArray<MenuLayoutResolvedGroup<Action>> => resolveLayout(ADVANCED_MENU_LAYOUT, actions);

export const flattenMenuLayoutIds = (
  layout: ReadonlyArray<MenuLayoutGroup>
): ReadonlyArray<string> => layout.flatMap((group) => group.itemIds);

export const hasFullLayoutCoverage = (
  layout: ReadonlyArray<MenuLayoutGroup>,
  actionIds: ReadonlyArray<string>
): boolean => {
  const layoutSet = new Set(flattenMenuLayoutIds(layout));
  const actionsSet = new Set(actionIds);
  if (layoutSet.size !== actionsSet.size) {
    return false;
  }
  for (const id of actionsSet) {
    if (!layoutSet.has(id)) {
      return false;
    }
  }
  return true;
};
