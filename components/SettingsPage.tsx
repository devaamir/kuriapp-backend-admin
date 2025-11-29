import React from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { User } from '../types';

interface SettingsPageProps {
  currentUser?: User;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ currentUser }) => {
  if (!currentUser) return null;

  const [firstName, ...lastNameParts] = currentUser.name.split(' ');
  const lastName = lastNameParts.join(' ');

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your account settings and preferences.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
        <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4">General Information</h2>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Input label="First Name" defaultValue={firstName} />
          <Input label="Last Name" defaultValue={lastName} />
          <div className="sm:col-span-2">
            <Input label="Email Address" defaultValue={currentUser.email} disabled />
            <p className="mt-1 text-xs text-slate-500">Email cannot be changed for {currentUser.role} accounts.</p>
          </div>
          <div className="sm:col-span-2">
            <Input label="Unique Code" defaultValue={currentUser.uniqueCode} disabled />
          </div>
        </div>

        <div className="flex justify-end">
          <Button>Save Changes</Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
        <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4">Security</h2>
        <div className="space-y-4">
          <Button variant="secondary">Change Password</Button>
          <Button variant="secondary">Enable Two-Factor Authentication</Button>
        </div>
      </div>
    </div>
  );
};