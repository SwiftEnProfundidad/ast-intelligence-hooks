import type { MenuLayoutGroup } from './framework-menu-layout-types';

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
