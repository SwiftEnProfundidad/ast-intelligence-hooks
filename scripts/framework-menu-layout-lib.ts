type MenuLayoutGroup = {
  key: string;
  title: string;
  itemIds: ReadonlyArray<string>;
};

type MenuLayoutItem<Action extends { id: string }> = {
  id: string;
  action: Action;
};

type MenuLayoutResolvedGroup<Action extends { id: string }> = {
  key: string;
  title: string;
  items: ReadonlyArray<MenuLayoutItem<Action>>;
};

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

export const CONSUMER_MENU_LAYOUT: ReadonlyArray<MenuLayoutGroup> = [
  {
    key: 'audit',
    title: 'Audit Flows',
    itemIds: ['1', '2', '3', '4'],
  },
  {
    key: 'diagnostics',
    title: 'Diagnostics',
    itemIds: ['5', '6', '7', '9'],
  },
  {
    key: 'export',
    title: 'Export',
    itemIds: ['8'],
  },
  {
    key: 'system',
    title: 'System',
    itemIds: ['10'],
  },
];

export const ADVANCED_MENU_LAYOUT: ReadonlyArray<MenuLayoutGroup> = [
  {
    key: 'gates',
    title: 'Gates',
    itemIds: ['1', '2', '3', '28', '29', '30', '4', '5', '6', '7', '8'],
  },
  {
    key: 'diagnostics',
    title: 'Diagnostics',
    itemIds: ['9', '10', '11', '12', '13', '14', '15', '16', '19', '20', '32'],
  },
  {
    key: 'maintenance',
    title: 'Maintenance',
    itemIds: ['17', '18', '31', '33'],
  },
  {
    key: 'validation',
    title: 'Validation',
    itemIds: ['21', '22', '23', '24', '25', '26'],
  },
  {
    key: 'system',
    title: 'System',
    itemIds: ['27'],
  },
];

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
