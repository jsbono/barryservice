import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { useService } from '../context/ServiceContext';
import { apiClient, Job, Invoice } from '../services/api';
import { RootStackParamList } from '../navigation/AppNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface DashboardStats {
  todayJobsCount: number;
  pendingInvoicesCount: number;
  totalRevenueToday: number;
  completedJobsToday: number;
}

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user, logout } = useAuth();
  const { startNewSession } = useService();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [todayJobs, setTodayJobs] = useState<Job[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);

  const loadDashboardData = useCallback(async () => {
    try {
      const [statsData, jobsData, invoicesData] = await Promise.all([
        apiClient.dashboard.getStats().catch(() => null),
        apiClient.jobs.getToday().catch(() => []),
        apiClient.dashboard.getRecentInvoices(5).catch(() => []),
      ]);

      if (statsData) setStats(statsData);
      setTodayJobs(jobsData);
      setRecentInvoices(invoicesData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDashboardData();
    setIsRefreshing(false);
  };

  const handleStartNewService = () => {
    startNewSession();
    navigation.navigate('VehicleSelect', {});
  };

  const handleJobPress = (job: Job) => {
    startNewSession();
    navigation.navigate('RecordService', { vehicleId: job.vehicleId, jobId: job.id });
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout },
      ]
    );
  };

  const formatCurrency = (amount: number): string => {
    return `$${amount.toFixed(2)}`;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'scheduled':
        return '#F59E0B';
      case 'in_progress':
        return '#3B82F6';
      case 'completed':
        return '#10B981';
      case 'paid':
        return '#10B981';
      case 'sent':
        return '#3B82F6';
      case 'overdue':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor="#1E3A8A"
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()},</Text>
          <Text style={styles.userName}>
            {user?.firstName || 'Mechanic'}
          </Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Action */}
      <TouchableOpacity style={styles.newServiceButton} onPress={handleStartNewService}>
        <View style={styles.newServiceIcon}>
          <Text style={styles.newServiceIconText}>+</Text>
        </View>
        <View style={styles.newServiceTextContainer}>
          <Text style={styles.newServiceTitle}>Start New Service</Text>
          <Text style={styles.newServiceSubtitle}>
            Record a service with voice
          </Text>
        </View>
      </TouchableOpacity>

      {/* Stats Grid */}
      {stats && (
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, styles.statCardBlue]}>
            <Text style={styles.statValue}>{stats.todayJobsCount}</Text>
            <Text style={styles.statLabel}>Today's Jobs</Text>
          </View>
          <View style={[styles.statCard, styles.statCardGreen]}>
            <Text style={styles.statValue}>{stats.completedJobsToday}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={[styles.statCard, styles.statCardYellow]}>
            <Text style={styles.statValue}>{stats.pendingInvoicesCount}</Text>
            <Text style={styles.statLabel}>Pending Invoices</Text>
          </View>
          <View style={[styles.statCard, styles.statCardPurple]}>
            <Text style={styles.statValue}>
              {formatCurrency(stats.totalRevenueToday)}
            </Text>
            <Text style={styles.statLabel}>Today's Revenue</Text>
          </View>
        </View>
      )}

      {/* Today's Jobs */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Jobs</Text>
          <Text style={styles.sectionCount}>{todayJobs.length}</Text>
        </View>

        {todayJobs.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No jobs scheduled for today</Text>
          </View>
        ) : (
          todayJobs.map((job) => (
            <TouchableOpacity
              key={job.id}
              style={styles.jobCard}
              onPress={() => handleJobPress(job)}
            >
              <View style={styles.jobHeader}>
                <View style={styles.jobInfo}>
                  <Text style={styles.jobVehicle}>
                    {job.vehicle.year} {job.vehicle.make} {job.vehicle.model}
                  </Text>
                  <Text style={styles.jobCustomer}>{job.customer.name}</Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: `${getStatusColor(job.status)}20` },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: getStatusColor(job.status) },
                    ]}
                  >
                    {job.status.replace('_', ' ')}
                  </Text>
                </View>
              </View>
              <Text style={styles.jobDescription} numberOfLines={2}>
                {job.description}
              </Text>
              <View style={styles.jobFooter}>
                <Text style={styles.jobTime}>
                  {new Date(job.scheduledTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
                {job.priority === 'high' && (
                  <View style={styles.priorityBadge}>
                    <Text style={styles.priorityText}>High Priority</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Recent Invoices */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Invoices</Text>
        </View>

        {recentInvoices.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No recent invoices</Text>
          </View>
        ) : (
          recentInvoices.map((invoice) => (
            <View key={invoice.id} style={styles.invoiceCard}>
              <View style={styles.invoiceLeft}>
                <Text style={styles.invoiceNumber}>#{invoice.invoiceNumber}</Text>
                <Text style={styles.invoiceCustomer}>{invoice.customerName}</Text>
                <Text style={styles.invoiceVehicle}>{invoice.vehicleInfo}</Text>
              </View>
              <View style={styles.invoiceRight}>
                <Text style={styles.invoiceAmount}>
                  {formatCurrency(invoice.total)}
                </Text>
                <View
                  style={[
                    styles.invoiceStatusBadge,
                    { backgroundColor: `${getStatusColor(invoice.status)}20` },
                  ]}
                >
                  <Text
                    style={[
                      styles.invoiceStatusText,
                      { color: getStatusColor(invoice.status) },
                    ]}
                  >
                    {invoice.status}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 14,
    color: '#6B7280',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
  },
  newServiceButton: {
    backgroundColor: '#1E3A8A',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  newServiceIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  newServiceIconText: {
    fontSize: 28,
    fontWeight: '300',
    color: '#1E3A8A',
  },
  newServiceTextContainer: {
    flex: 1,
  },
  newServiceTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  newServiceSubtitle: {
    fontSize: 14,
    color: '#93C5FD',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  statCardBlue: {
    backgroundColor: '#EFF6FF',
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  statCardGreen: {
    backgroundColor: '#ECFDF5',
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  statCardYellow: {
    backgroundColor: '#FFFBEB',
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  statCardPurple: {
    backgroundColor: '#F5F3FF',
    borderLeftWidth: 4,
    borderLeftColor: '#8B5CF6',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  sectionCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  jobCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  jobInfo: {
    flex: 1,
  },
  jobVehicle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  jobCustomer: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  jobDescription: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 12,
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E3A8A',
  },
  priorityBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#DC2626',
  },
  invoiceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invoiceLeft: {
    flex: 1,
  },
  invoiceNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  invoiceCustomer: {
    fontSize: 14,
    color: '#4B5563',
    marginTop: 2,
  },
  invoiceVehicle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  invoiceRight: {
    alignItems: 'flex-end',
  },
  invoiceAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  invoiceStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  invoiceStatusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});

export default HomeScreen;
