import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  ChevronDown,
  Briefcase
} from 'lucide-react';
import { User } from '../types';

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: User | null;
  onLogout: () => void;
  activePage: string;
  onNavigate: (page: string) => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  user,
  onLogout,
  activePage,
  onNavigate
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', icon: LayoutDashboard, id: 'dashboard', roles: ['admin', 'member'] },
    { name: 'Users', icon: Users, id: 'users', roles: ['admin'] },
    { name: 'Kuris', icon: Briefcase, id: 'kuris', roles: ['admin'] },
    { name: 'Settings', icon: Settings, id: 'settings', roles: ['admin', 'member'] },
  ];

  const filteredNavigation = navigation.filter(item =>
    user && item.roles.includes(user.role)
  );

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 
        transform transition-transform duration-200 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-slate-100">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center mr-3">
              <span className="text-white font-bold text-lg">K</span>
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">KuriApp</span>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="ml-auto lg:hidden text-slate-400 hover:text-slate-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Nav Items */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {filteredNavigation.map((item) => (
              <button
                key={item.name}
                onClick={() => {
                  onNavigate(item.id);
                  setIsSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors
                  ${activePage === item.id
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                `}
              >
                <item.icon className={`
                  mr-3 flex-shrink-0 h-5 w-5
                  ${activePage === item.id ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-500'}
                `} />
                {item.name}
              </button>
            ))}
          </nav>

          {/* User & Logout */}
          <div className="p-4 border-t border-slate-100">
            <button
              onClick={onLogout}
              className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <button
              onClick={toggleSidebar}
              className="mr-4 lg:hidden text-slate-500 hover:text-slate-700 focus:outline-none"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Search Bar (Visual only) */}
            <div className="hidden sm:flex relative max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search..."
                className="block w-full pl-10 pr-3 py-1.5 border border-slate-300 rounded-md leading-5 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button className="p-1 rounded-full text-slate-400 hover:text-slate-500 relative">
              <Bell className="h-6 w-6" />
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
            </button>

            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center max-w-xs rounded-full text-sm focus:outline-none lg:p-2 lg:rounded-md lg:hover:bg-slate-50 transition-colors"
              >
                <img
                  className="h-8 w-8 rounded-full"
                  src={user?.avatar}
                  alt=""
                />
                <span className="hidden ml-3 text-slate-700 font-medium lg:block">
                  {user?.name}
                </span>
                <ChevronDown className="hidden ml-1 h-4 w-4 text-slate-400 lg:block" />
              </button>

              {/* Profile Dropdown */}
              {isProfileOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-sm text-slate-500">Signed in as</p>
                    <p className="text-sm font-bold text-slate-900 truncate">{user?.email}</p>
                    <p className="text-xs text-indigo-600 capitalize mt-1">{user?.role}</p>
                  </div>
                  <button
                    onClick={onLogout}
                    className="w-full text-left block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};