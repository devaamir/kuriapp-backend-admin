import { RevenueData, User } from './types';

export const USERS_STORAGE_KEY = 'kuriapp_users_data';
export const KURIS_STORAGE_KEY = 'kuriapp_kuris_data';

export const MOCK_REVENUE_DATA: RevenueData[] = [
  { name: 'Jan', revenue: 4000, users: 2400 },
  { name: 'Feb', revenue: 3000, users: 1398 },
  { name: 'Mar', revenue: 2000, users: 9800 },
  { name: 'Apr', revenue: 2780, users: 3908 },
  { name: 'May', revenue: 1890, users: 4800 },
  { name: 'Jun', revenue: 2390, users: 3800 },
  { name: 'Jul', revenue: 3490, users: 4300 },
];

export const MOCK_USERS: User[] = [];