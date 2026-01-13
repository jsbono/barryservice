'use client';

import { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Bell,
  Shield,
  Camera,
  Save,
  Loader2,
  Check,
} from 'lucide-react';

// Mock user data
const mockUser = {
  id: '1',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@email.com',
  phone: '(555) 987-6543',
  address: {
    street: '456 Oak Avenue',
    city: 'Anytown',
    state: 'ST',
    zip: '12346',
  },
  avatar: null,
  notifications: {
    email: true,
    sms: false,
    serviceReminders: true,
    promotions: false,
  },
  createdAt: '2023-01-15',
};

export default function ProfilePage() {
  const [user, setUser] = useState(mockUser);
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'security'>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setUser((prev) => ({
        ...prev,
        [parent]: {
          ...(prev as any)[parent],
          [child]: value,
        },
      }));
    } else {
      setUser((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleNotificationChange = (field: string, value: boolean) => {
    setUser((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="animate-fadeIn space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Profile Settings
        </h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Manage your account settings and preferences.
        </p>
      </div>

      {/* Profile Card */}
      <div className="card">
        <div className="flex flex-col items-center gap-4 border-b border-slate-200 pb-6 dark:border-slate-700 sm:flex-row">
          <div className="relative">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/50">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt="Profile"
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <span className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                  {user.firstName[0]}
                  {user.lastName[0]}
                </span>
              )}
            </div>
            <button className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-white shadow-lg transition hover:bg-primary-700">
              <Camera className="h-4 w-4" />
            </button>
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              {user.firstName} {user.lastName}
            </h2>
            <p className="text-slate-600 dark:text-slate-400">{user.email}</p>
            <p className="mt-1 text-sm text-slate-500">
              Member since {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 border-b border-slate-200 dark:border-slate-700">
          <nav className="flex gap-8">
            <button
              onClick={() => setActiveTab('profile')}
              className={`border-b-2 pb-4 text-sm font-medium transition-colors ${
                activeTab === 'profile'
                  ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                  : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <User className="mr-2 inline-block h-4 w-4" />
              Profile
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`border-b-2 pb-4 text-sm font-medium transition-colors ${
                activeTab === 'notifications'
                  ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                  : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Bell className="mr-2 inline-block h-4 w-4" />
              Notifications
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`border-b-2 pb-4 text-sm font-medium transition-colors ${
                activeTab === 'security'
                  ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                  : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Shield className="mr-2 inline-block h-4 w-4" />
              Security
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="label">First Name</label>
                  <input
                    type="text"
                    value={user.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className="input mt-1"
                  />
                </div>
                <div>
                  <label className="label">Last Name</label>
                  <input
                    type="text"
                    value={user.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className="input mt-1"
                  />
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="label">
                    <Mail className="mr-2 inline-block h-4 w-4" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={user.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="input mt-1"
                  />
                </div>
                <div>
                  <label className="label">
                    <Phone className="mr-2 inline-block h-4 w-4" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={user.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="input mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="label">
                  <MapPin className="mr-2 inline-block h-4 w-4" />
                  Address
                </label>
                <div className="mt-1 space-y-3">
                  <input
                    type="text"
                    placeholder="Street Address"
                    value={user.address.street}
                    onChange={(e) => handleInputChange('address.street', e.target.value)}
                    className="input"
                  />
                  <div className="grid gap-3 sm:grid-cols-3">
                    <input
                      type="text"
                      placeholder="City"
                      value={user.address.city}
                      onChange={(e) => handleInputChange('address.city', e.target.value)}
                      className="input"
                    />
                    <input
                      type="text"
                      placeholder="State"
                      value={user.address.state}
                      onChange={(e) => handleInputChange('address.state', e.target.value)}
                      className="input"
                    />
                    <input
                      type="text"
                      placeholder="ZIP Code"
                      value={user.address.zip}
                      onChange={(e) => handleInputChange('address.zip', e.target.value)}
                      className="input"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <p className="text-slate-600 dark:text-slate-400">
                Choose how you want to receive notifications and updates.
              </p>
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      Email Notifications
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Receive updates and confirmations via email
                    </p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={user.notifications.email}
                      onChange={(e) => handleNotificationChange('email', e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary-600 peer-checked:after:translate-x-full dark:bg-slate-700"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      SMS Notifications
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Receive text messages for important updates
                    </p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={user.notifications.sms}
                      onChange={(e) => handleNotificationChange('sms', e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary-600 peer-checked:after:translate-x-full dark:bg-slate-700"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      Service Reminders
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Get notified when service is due
                    </p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={user.notifications.serviceReminders}
                      onChange={(e) => handleNotificationChange('serviceReminders', e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary-600 peer-checked:after:translate-x-full dark:bg-slate-700"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      Promotions & Offers
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Receive special offers and discounts
                    </p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={user.notifications.promotions}
                      onChange={(e) => handleNotificationChange('promotions', e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary-600 peer-checked:after:translate-x-full dark:bg-slate-700"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="rounded-lg border border-slate-200 p-6 dark:border-slate-700">
                <h3 className="font-medium text-slate-900 dark:text-white">
                  Passwordless Authentication
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  Your account uses passwordless authentication via magic links.
                  Each time you sign in, you&apos;ll receive a secure link via email.
                </p>
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
                  <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <span className="text-sm text-green-700 dark:text-green-300">
                    Your account is protected with secure email authentication
                  </span>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 p-6 dark:border-slate-700">
                <h3 className="font-medium text-slate-900 dark:text-white">
                  Active Sessions
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  Manage your active sessions across devices.
                </p>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3 dark:bg-slate-700/50">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        Current Session
                      </p>
                      <p className="text-sm text-slate-500">
                        Chrome on macOS - Last active: Just now
                      </p>
                    </div>
                    <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-900/50 dark:text-green-400">
                      Active
                    </span>
                  </div>
                </div>
                <button className="btn-outline mt-4 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20">
                  Sign Out All Other Sessions
                </button>
              </div>

              <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
                <h3 className="font-medium text-red-900 dark:text-red-100">
                  Delete Account
                </h3>
                <p className="mt-2 text-sm text-red-700 dark:text-red-300">
                  Permanently delete your account and all associated data.
                  This action cannot be undone.
                </p>
                <button className="btn mt-4 border-red-600 bg-red-600 text-white hover:bg-red-700">
                  Delete Account
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        {(activeTab === 'profile' || activeTab === 'notifications') && (
          <div className="mt-8 flex items-center justify-end gap-4 border-t border-slate-200 pt-6 dark:border-slate-700">
            {saveSuccess && (
              <span className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <Check className="h-4 w-4" />
                Changes saved successfully
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="btn-primary inline-flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
