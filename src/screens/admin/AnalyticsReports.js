import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import StatCard from '../../components/StatCard';
import { supabase, dbHelpers } from '../../utils/supabase';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { useTheme } from 'react-native-paper';
import { Share } from 'react-native';
import ExpoPrint from 'expo-print';
import * as FileSystem from 'expo-file-system';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Alert } from 'react-native';

const AnalyticsReports = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([]);
  const [reports, setReports] = useState([]);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dateRange, setDateRange] = useState({
    start: new Date(),
    end: new Date()
  });

  // Helper function to format date
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Helper function to calculate month-over-month change
  const calculateMoM = (current, previous) => {
    if (!previous) return 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  // Load previous month's data for comparison
  const loadPreviousMonthData = async () => {
    try {
      const prevMonth = new Date(selectedDate);
      prevMonth.setMonth(prevMonth.getMonth() - 1);

      const { data: prevStudents, error: studentError } = await supabase
        .from('students')
        .select('id')
        .gte('created_at', prevMonth.toISOString())
        .lt('created_at', selectedDate.toISOString());

      const { data: prevTeachers, error: teacherError } = await supabase
        .from('teachers')
        .select('id')
        .gte('created_at', prevMonth.toISOString())
        .lt('created_at', selectedDate.toISOString());

      return {
        prevStudents: prevStudents?.length || 0,
        prevTeachers: prevTeachers?.length || 0
      };
    } catch (error) {
      console.error('Error loading previous month data:', error);
      return { prevStudents: 0, prevTeachers: 0 };
    }
  };

  // Load analytics data
  const loadAnalyticsData = async () => {
    try {
      // Load student count
      const { data: students, error: studentError } = await supabase
        .from('students')
        .select('id')
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString());

      // Load teacher count
      const { data: teachers, error: teacherError } = await supabase
        .from('teachers')
        .select('id')
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString());

      // Load attendance stats
      const { data: attendance, error: attendanceError } = await supabase
        .from('attendance')
        .select('student_id, date')
        .gte('date', dateRange.start.toISOString())
        .lte('date', dateRange.end.toISOString());

      // Load fee data
      const { data: fees, error: feeError } = await supabase
        .from('student_fees')
        .select('amount, payment_date, status')
        .gte('payment_date', dateRange.start.toISOString())
        .lte('payment_date', dateRange.end.toISOString());

      // Load previous month data for comparison
      const prevData = await loadPreviousMonthData();

      // Calculate statistics
      const totalStudents = students?.length || 0;
      const totalTeachers = teachers?.length || 0;
      const attendancePercentage = attendance ? Math.round((attendance.length / (totalStudents * 20)) * 100) : 0;
      const totalFees = fees?.reduce((sum, fee) => sum + (fee.amount || 0), 0) || 0;
      const collectedFees = fees?.filter(fee => fee.status === 'Paid')?.reduce((sum, fee) => sum + (fee.amount || 0), 0) || 0;
      const feeCollectionPercentage = Math.round((collectedFees / totalFees) * 100);

      // Calculate month-over-month changes
      const studentMoM = calculateMoM(totalStudents, prevData.prevStudents);
      const teacherMoM = calculateMoM(totalTeachers, prevData.prevTeachers);

      // Update stats
      setStats([
        {
          title: 'Total Students',
          value: totalStudents.toLocaleString(),
          icon: 'people',
          color: '#2196F3',
          subtitle: `${studentMoM}% ${studentMoM >= 0 ? '↑' : '↓'} from last month`,
          trend: studentMoM
        },
        {
          title: 'Total Teachers',
          value: totalTeachers.toString(),
          icon: 'person',
          color: '#4CAF50',
          subtitle: `${teacherMoM}% ${teacherMoM >= 0 ? '↑' : '↓'} from last month`,
          trend: teacherMoM
        },
        {
          title: 'Average Attendance',
          value: `${attendancePercentage}%`,
          icon: 'checkmark-circle',
          color: '#FF9800',
          subtitle: 'This period'
        },
        {
          title: 'Fee Collection',
          value: `₹${(collectedFees / 1000000).toFixed(1)}M`,
          icon: 'card',
          color: '#9C27B0',
          subtitle: `${feeCollectionPercentage}% collected`
        },
      ]);

      // Calculate attendance by class
      const attendanceByClass = attendance.reduce((acc, curr) => {
        const classId = curr.class_id;
        if (!acc[classId]) {
          acc[classId] = { count: 0, total: 0 };
        }
        acc[classId].count++;
        acc[classId].total++;
        return acc;
      }, {});

      // Calculate fee collection by class
      const feeCollectionByClass = fees.reduce((acc, curr) => {
        const classId = curr.class_id;
        if (!acc[classId]) {
          acc[classId] = { collected: 0, total: 0 };
        }
        acc[classId].collected += curr.amount || 0;
        acc[classId].total += curr.amount || 0;
        return acc;
      }, {});

      // Load reports data
      setReports([
        {
          title: 'Attendance Report',
          icon: 'checkmark-circle',
          color: '#4CAF50',
          data: {
            total: attendance.length,
            percentage: attendancePercentage,
            byClass: attendanceByClass
          }
        },
        {
          title: 'Fee Collection Report',
          icon: 'card',
          color: '#9C27B0',
          data: fees
        },
        {
          title: 'Academic Performance',
          icon: 'document-text',
          color: '#2196F3',
          data: null // TODO: Implement academic performance data
        },
        {
          title: 'Student Progress Report',
          icon: 'trending-up',
          color: '#FF9800',
          data: null // TODO: Implement student progress data
        },
      ]);

    } catch (error) {
      console.error('Error loading analytics data:', error);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Analytics & Reports" showBack={true} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Loading analytics data...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Header title="Analytics & Reports" showBack={true} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadAnalyticsData}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Analytics & Reports" showBack={true} />
      
      <View style={styles.datePickerContainer}>
        <Text style={styles.datePickerLabel}>Select Period:</Text>
        <TouchableOpacity
          style={styles.datePickerButton}
          onPress={() => {
            const now = new Date();
            if (selectedDate.getMonth() === now.getMonth() && selectedDate.getFullYear() === now.getFullYear()) {
              setDateRange(prev => ({
                start: new Date(now.getFullYear(), now.getMonth(), 1),
                end: now
              }));
            } else {
              setDateRange(prev => ({
                start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
                end: new Date(now.getFullYear(), now.getMonth(), 0)
              }));
            }
            loadAnalyticsData();
          }}
        >
          <Text style={styles.datePickerButtonText}>
            {formatDate(dateRange.start)} - {formatDate(dateRange.end)}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.statsContainer}>
          {stats.map((stat, index) => (
            <StatCard
              key={index}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              color={stat.color}
              subtitle={stat.subtitle}
              trend={stat.trend}
            />
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reports</Text>
          <View style={styles.reportsList}>
            {reports.map((report, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.reportItem, styles.reportCard]}
                onPress={() => handleReportPress(report)}
              >
                <View style={[styles.reportIcon, { backgroundColor: report.color }]}>
                  <Ionicons name={report.icon} size={24} color="#fff" />
                </View>
                <View style={styles.reportContent}>
                  <Text style={styles.reportTitle}>{report.title}</Text>
                  {report.data && (
                    <>
                      {report.title === 'Attendance Report' && (
                        <View style={styles.reportMetrics}>
                          <Text style={styles.reportMetric}>
                            Total: {report.data.total}
                          </Text>
                          <Text style={styles.reportMetric}>
                            Attendance: {report.data.percentage}%
                          </Text>
                          <Text style={styles.reportMetric}>
                            Classes: {Object.keys(report.data.byClass).length}
                          </Text>
                        </View>
                      )}
                      {report.title === 'Fee Collection Report' && (
                        <View style={styles.reportMetrics}>
                          <Text style={styles.reportMetric}>
                            Total: ₹{(report.data.total / 1000000).toFixed(1)}M
                          </Text>
                          <Text style={styles.reportMetric}>
                            Collected: {report.data.collectionPercentage}%
                          </Text>
                          <Text style={styles.reportMetric}>
                            Classes: {Object.keys(report.data.byClass).length}
                          </Text>
                        </View>
                      )}
                      {report.title === 'Academic Performance' && (
                        <Text style={styles.reportMetric}>
                          Coming soon...
                        </Text>
                      )}
                      {report.title === 'Student Progress Report' && (
                        <Text style={styles.reportMetric}>
                          Coming soon...
                        </Text>
                      )}
                    </>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  datePickerContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  datePickerLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  datePickerButton: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  datePickerButtonText: {
    fontSize: 16,
    color: '#333',
  },
  statsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 8,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  reportsList: {
    marginTop: 16,
  },
  reportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  reportCard: {
    flex: 1,
  },
  reportIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  reportContent: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  reportMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  reportMetric: {
    fontSize: 14,
    color: '#666',
  },
  reportActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  exportButton: {
    backgroundColor: '#2196F3',
    padding: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  chartContainer: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 16,
    borderRadius: 8,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  chart: {
    borderRadius: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  }
});

export default AnalyticsReports;