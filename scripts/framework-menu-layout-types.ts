export type MenuLayoutGroup = {
  key: string;
  title: string;
  itemIds: ReadonlyArray<string>;
};

export type MenuLayoutItem<Action extends { id: string }> = {
  id: string;
  action: Action;
};

export type MenuLayoutResolvedGroup<Action extends { id: string }> = {
  key: string;
  title: string;
  items: ReadonlyArray<MenuLayoutItem<Action>>;
};
