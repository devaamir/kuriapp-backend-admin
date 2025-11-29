import React, { useState } from 'react';
import { Lock, Mail, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Input } from './Input';
import { Button } from './Button';
import { User } from '../types';
import { USERS_STORAGE_KEY } from '../constants';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // 1. Check Hardcoded Admin (Keep as fallback or remove if admin is in DB)
    // For now, let's try API first, if it fails, check hardcoded admin

    try {
      const API_BASE_URL = `http://${window.location.hostname}:3001/api/v1`;
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        onLogin(data.user);
        return;
      } else {
        // If API fails, check hardcoded admin as fallback
        if (email.toLowerCase() === 'admin@kuriapp.com' && password === 'admin123') {
          const adminUser: User = {
            id: 'admin-1',
            name: 'Kuri Admin',
            email: 'admin@kuriapp.com',
            role: 'admin',
            avatar: 'https://ui-avatars.com/api/?name=Kuri+Admin&background=4f46e5&color=fff',
            status: 'active',
            lastLogin: new Date().toISOString(),
            uniqueCode: '#MASTER01',
          };
          onLogin(adminUser);
          return;
        }
        throw new Error(data.error || 'Invalid credentials');
      }
    } catch (e: any) {
      console.error("Login Error", e);
      setError(e.message || 'Login failed. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-2xl">K</span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
          Sign in to KuriApp
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Admin or Member Access
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-xl sm:px-10 border border-slate-100">
          <form className="space-y-6" onSubmit={handleSubmit}>

            {error && (
              <div className="rounded-md bg-red-50 p-4 flex items-start">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Login Failed</h3>
                  <div className="mt-1 text-sm text-red-700">{error}</div>
                </div>
              </div>
            )}

            <Input
              label="Email address"
              type="email"
              required
              icon={Mail}
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <div className="space-y-1">
              <Input
                label="Password"
                type="password"
                required
                icon={Lock}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div className="flex justify-end">
                <a href="#" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">Forgot password?</a>
              </div>
            </div>

            <div>
              <Button type="submit" className="w-full" isLoading={isLoading}>
                Sign in
              </Button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">New to KuriApp?</span>
              </div>
            </div>
            <div className="mt-6 flex justify-center">
              <Link to="/signup" className="font-medium text-indigo-600 hover:text-indigo-500">
                Create an account
              </Link>
            </div>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">Demo Credentials</span>
              </div>
            </div>
            <div className="mt-6 text-center text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <p>Admin: <span className="font-mono text-slate-700">admin@kuriapp.com</span> / <span className="font-mono text-slate-700">admin123</span></p>
              <p className="mt-1">Or use any User credentials you created.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};