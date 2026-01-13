'use client';

import Link from 'next/link';
import { Car, FileText, History, Shield, Clock, CheckCircle } from 'lucide-react';

export default function HomePage() {
  const features = [
    {
      icon: Car,
      title: 'Vehicle Management',
      description: 'View all your registered vehicles and their details in one place.',
    },
    {
      icon: History,
      title: 'Service History',
      description: 'Access complete service records and maintenance history for each vehicle.',
    },
    {
      icon: FileText,
      title: 'Digital Invoices',
      description: 'View and download invoices anytime, anywhere.',
    },
    {
      icon: Clock,
      title: 'Service Reminders',
      description: 'Never miss a service with automated maintenance reminders.',
    },
  ];

  const benefits = [
    'Access your records 24/7 from any device',
    'Receive instant notifications for service updates',
    'Download PDF invoices for your records',
    'Track upcoming maintenance schedules',
    'Secure and private - only you can see your data',
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Welcome to{' '}
              <span className="text-primary-200">MotorAI</span>
            </h1>
            <p className="mt-6 text-lg text-primary-100 sm:text-xl">
              Your complete automotive service portal. Manage your vehicles, track service history,
              and access invoices all in one secure place.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/login"
                className="btn-primary w-full rounded-lg bg-white px-8 py-3 text-base font-semibold text-primary-700 shadow-lg transition hover:bg-primary-50 sm:w-auto"
              >
                Sign In to Your Account
              </Link>
              <Link
                href="/login"
                className="btn-outline w-full rounded-lg border-2 border-white/30 px-8 py-3 text-base font-semibold text-white transition hover:bg-white/10 sm:w-auto"
              >
                New Customer? Get Started
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-50 dark:from-slate-900" />
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Everything You Need
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
              Manage your automotive service experience with ease
            </p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="card group transition-shadow hover:shadow-card-hover"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900/50 dark:text-primary-400">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="mt-2 text-slate-600 dark:text-slate-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-slate-100 py-20 dark:bg-slate-800/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                Why Use the Customer Portal?
              </h2>
              <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
                Take control of your automotive service experience with our comprehensive online portal.
              </p>
              <ul className="mt-8 space-y-4">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start">
                    <CheckCircle className="mr-3 h-6 w-6 flex-shrink-0 text-green-500" />
                    <span className="text-slate-700 dark:text-slate-300">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="card overflow-hidden">
                <div className="flex items-center gap-3 border-b border-slate-200 pb-4 dark:border-slate-700">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/50">
                    <Shield className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">Secure Access</p>
                    <p className="text-sm text-slate-500">Passwordless login via email</p>
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3 dark:bg-slate-700/50">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Vehicles</span>
                    <span className="font-medium text-slate-900 dark:text-white">3 registered</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3 dark:bg-slate-700/50">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Service Records</span>
                    <span className="font-medium text-slate-900 dark:text-white">12 total</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3 dark:bg-slate-700/50">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Invoices</span>
                    <span className="font-medium text-slate-900 dark:text-white">8 available</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="card bg-gradient-to-r from-primary-600 to-primary-700 text-center text-white">
            <h2 className="text-2xl font-bold sm:text-3xl">
              Ready to Get Started?
            </h2>
            <p className="mt-4 text-primary-100">
              Sign in to access your vehicles, service history, and invoices.
            </p>
            <div className="mt-8">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-3 text-base font-semibold text-primary-700 shadow-lg transition hover:bg-primary-50"
              >
                Sign In Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-12 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <Car className="h-6 w-6 text-primary-600" />
              <span className="font-semibold text-slate-900 dark:text-white">MotorAI</span>
            </div>
            <p className="text-sm text-slate-500">
              &copy; {new Date().getFullYear()} MotorAI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
