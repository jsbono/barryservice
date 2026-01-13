'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Car, Mail, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import LoginForm from '@/components/LoginForm';

export default function LoginPage() {
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const handleEmailSent = (email: string) => {
    setSentEmail(email);
    setIsEmailSent(true);
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-12 dark:from-slate-900 dark:to-slate-800">
      <div className="w-full max-w-md">
        <div className="card animate-fadeIn">
          {/* Logo */}
          <div className="mb-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/50">
              <Car className="h-8 w-8 text-primary-600 dark:text-primary-400" />
            </div>
            <h1 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">
              MotorAI
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              Customer Portal
            </p>
          </div>

          {isEmailSent ? (
            /* Success State */
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="mt-6 text-xl font-semibold text-slate-900 dark:text-white">
                Check Your Email
              </h2>
              <p className="mt-3 text-slate-600 dark:text-slate-400">
                We sent a magic link to{' '}
                <span className="font-medium text-slate-900 dark:text-white">
                  {sentEmail}
                </span>
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Click the link in the email to sign in to your account.
              </p>
              <div className="mt-8 rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  <span className="font-medium">Tip:</span> If you don&apos;t see the email,
                  check your spam folder.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsEmailSent(false);
                  setSentEmail('');
                }}
                className="mt-6 inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Try a different email
              </button>
            </div>
          ) : (
            /* Login Form */
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  Sign in to your account
                </h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  Enter your email and we&apos;ll send you a magic link to sign in instantly.
                </p>
              </div>

              <LoginForm onEmailSent={handleEmailSent} />

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-700" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-4 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    Secure passwordless login
                  </span>
                </div>
              </div>

              <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-700/50">
                <div className="flex items-start">
                  <Mail className="mr-3 h-5 w-5 flex-shrink-0 text-slate-400" />
                  <div className="text-sm">
                    <p className="font-medium text-slate-700 dark:text-slate-300">
                      How it works
                    </p>
                    <p className="mt-1 text-slate-600 dark:text-slate-400">
                      We&apos;ll send a secure link to your email. Click it to sign in - no password needed!
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <p className="mt-8 text-center text-sm text-slate-500">
          <Link href="/" className="hover:text-primary-600 dark:hover:text-primary-400">
            &larr; Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
