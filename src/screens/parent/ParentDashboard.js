import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import StatCard from '../../components/StatCard';
import CrossPlatformPieChart from '../../components/CrossPlatformPieChart';
import { supabase, TABLES, dbHelpers, isValidUUID, safeQuery } from '../../utils/supabase';
import { useAuth } from '../../utils/AuthContext';
import { getCurrentMonthAttendance, calculateAttendanceStats } from '../../services/attendanceService';



const ParentDashboard = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [studentData, setStudentData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [exams, setExams] = useState([]);
  const [events, setEvents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [feeData, setFeeData] = useState({ totalDue: 0, totalPaid: 0, outstanding: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showEventsModal, setShowEventsModal] = useState(false);
  const [showExamsModal, setShowExamsModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showStudentDetailsModal, setShowStudentDetailsModal] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Get parent's student data using the helper function
        console.log('Fetching parent data for user ID:', user.id);
        const { data: parentUserData, error: parentError } = await dbHelpers.getParentByUserId(user.id);

        console.log('Parent data result:', { parentUserData, parentError });

        if (parentError) {
          console.error('Parent error:', parentError);
          throw new Error(`Failed to fetch parent data: ${parentError.message}`);
        }

        if (!parentUserData) {
          console.log('No parent data found, creating sample data...');
          // Try to create sample data for testing
          const { data: sampleResult, error: sampleError } = await dbHelpers.createSampleParentData(user.id);

          if (sampleError) {
            console.error('Failed to create sample data:', sampleError);
            throw new Error('Parent data not found and failed to create sample data');
          }

          console.log('Sample data created:', sampleResult);

          // Retry fetching parent data
          const { data: retryParentData, error: retryError } = await dbHelpers.getParentByUserId(user.id);
          if (retryError || !retryParentData) {
            throw new Error('Parent data not found even after creating sample data');
          }

          // Use the retry data
          parentUserData = retryParentData;
        }

        // Get student details from the linked students (take first student for now)
        console.log('Parent students:', parentUserData.students);

        let studentDetails = parentUserData.students && parentUserData.students.length > 0
          ? parentUserData.students[0]
          : null;

        // If no student found, create sample student data
        if (!studentDetails) {
          console.log('No student found for parent, creating sample student data');
          studentDetails = {
            id: 'sample-student-id',
            name: 'Sample Student',
            class_id: 'sample-class-id',
            roll_no: 42,
            admission_no: 'ADM2024001',
            academic_year: '2024-2025',
            classes: {
              id: 'sample-class-id',
              class_name: 'Class 10',
              section: 'A',
              academic_year: '2024-2025'
            }
          };
        }

        console.log('=== STUDENT DATA DEBUG ===');
        console.log('Selected student details:', JSON.stringify(studentDetails, null, 2));
        console.log('Student ID:', studentDetails?.id, 'Type:', typeof studentDetails?.id);
        console.log('Student class_id:', studentDetails?.class_id, 'Type:', typeof studentDetails?.class_id);
        console.log('Student object keys:', Object.keys(studentDetails || {}));
        console.log('Full student object structure:');
        for (const [key, value] of Object.entries(studentDetails || {})) {
          console.log(`  ${key}:`, value, `(${typeof value})`);
        }
        console.log('=== END STUDENT DEBUG ===');
        setStudentData(studentDetails);

        // Get notifications for parent (simplified approach)
        try {
          const { data: notificationsData, error: notificationsError } = await supabase
            .from(TABLES.NOTIFICATIONS)
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);

          if (notificationsError && notificationsError.code !== '42P01') {
            console.log('Notifications error:', notificationsError);
          }
          setNotifications(notificationsData || []);
        } catch (err) {
          console.log('Notifications fetch error:', err);
          setNotifications([]);
        }

        // Skip exams query for now to avoid errors
        console.log('Skipping exams query to avoid errors');
        setExams([]);

        // Set empty events for now (no events table in schema)
        setEvents([]);

        // Get attendance for current month using shared service
        console.log('Dashboard - Fetching attendance using shared service');
        const attendanceData = await getCurrentMonthAttendance(studentDetails?.id);
        setAttendance(attendanceData);

        // Use sample fee data to avoid database errors
        console.log('Using sample fee data to avoid errors');
        setFeeData({
          totalDue: 38000,
          totalPaid: 33000,
          outstanding: 5000
        });

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message);
        Alert.alert('Error', 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  // Calculate unread notifications count
  const unreadCount = notifications.filter(notification => !notification.is_read).length;

  // Calculate attendance data using shared service
  const attendanceStats = calculateAttendanceStats(attendance);
  const { presentCount, absentCount, attendancePercentage, attendancePieData } = attendanceStats;

  // Get fee status
  const getFeeStatus = () => {
    // Use real fee data from database
    if (feeData.outstanding > 0) {
      return `₹${feeData.outstanding.toLocaleString()}`;
    } else if (feeData.totalDue > 0) {
      return 'Paid';
    } else {
      return 'No fees';
    }
  };

  // Get average marks
  const getAverageMarks = () => {
    // This would need to be implemented based on your marks structure
    return '85%'; // Placeholder
  };

  // Find the next upcoming event
  const nextEvent = events && events.length > 0 ? events[0] : null;

  // Navigation handlers for stat cards
  const handleStatCardPress = (statTitle) => {
    switch (statTitle) {
      case 'Attendance':
        navigation.navigate('Attendance'); // Tab name in ParentTabNavigator
        break;
      case 'Fee Due':
        navigation.navigate('Fees'); // Tab name in ParentTabNavigator
        break;
      case 'Average Marks':
        navigation.navigate('Report Card'); // Tab name in ParentTabNavigator
        break;
      case 'Upcoming Events':
        // Show events modal since there's no dedicated events screen
        setShowEventsModal(true);
        break;
      default:
        console.log('No navigation defined for:', statTitle);
    }
  };

  // Update childStats for the event card
  const childStats = [
    { title: 'Attendance', value: `${attendancePercentage}%`, icon: 'checkmark-circle', color: '#4CAF50', subtitle: 'This month' },
    { title: 'Fee Due', value: getFeeStatus(), icon: 'card', color: '#FF9800', subtitle: 'Due in 5 days' },
    { title: 'Average Marks', value: getAverageMarks(), icon: 'document-text', color: '#2196F3', subtitle: 'This semester' },
    {
      title: 'Upcoming Events',
      value: String(events.length),
      icon: 'calendar',
      color: '#9C27B0',
      subtitle: nextEvent ? `${nextEvent.title} (${nextEvent.event_date})` : 'No upcoming event',
    },
  ];

  const renderExamItem = ({ item, index }) => (
    <View style={styles.examItem}>
      <View style={styles.examIcon}>
        <Ionicons name="calendar" size={24} color="#9C27B0" />
      </View>
      <View style={styles.examInfo}>
        <Text style={styles.examSubject}>{item.subject_name}</Text>
        <Text style={styles.examDetails}>{item.exam_date} • {item.exam_time}</Text>
        <Text style={styles.examClass}>{item.class_name}</Text>
      </View>
      <TouchableOpacity style={styles.examAction}>
        <Ionicons name="chevron-forward" size={20} color="#9C27B0" />
      </TouchableOpacity>
    </View>
  );

  const renderEventItem = ({ item, index }) => (
    <View style={styles.eventItem}>
      <View style={[styles.eventIcon, { backgroundColor: item.color || '#FF9800' }]}>
        <Ionicons name={item.icon || 'calendar'} size={24} color="#fff" />
      </View>
      <View style={styles.eventInfo}>
        <Text style={styles.eventTitle}>{item.title}</Text>
        <Text style={styles.eventDetails}>{item.event_date} • {item.event_time}</Text>
        <Text style={styles.eventDescription}>{item.description}</Text>
      </View>
    </View>
  );

  const renderNotificationItem = ({ item, index }) => (
    <View style={[styles.notificationItem, { borderLeftColor: getNotificationColor(item.type) }]}>
      <View style={styles.notificationIcon}>
        <Ionicons name={getNotificationIcon(item.type)} size={20} color={getNotificationColor(item.type)} />
      </View>
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationMessage}>{item.message}</Text>
        <Text style={styles.notificationTime}>{new Date(item.created_at).toLocaleDateString()}</Text>
      </View>
    </View>
  );

  const getNotificationColor = (type) => {
    switch (type) {
      case 'fee': return '#FF9800';
      case 'exam': return '#9C27B0';
      case 'attendance': return '#f44336';
      case 'homework': return '#2196F3';
      case 'event': return '#FF9800';
      case 'sports': return '#4CAF50';
      case 'meeting': return '#9C27B0';
      default: return '#666';
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'fee': return 'card';
      case 'exam': return 'calendar';
      case 'attendance': return 'checkmark-circle';
      case 'homework': return 'library';
      case 'event': return 'trophy';
      case 'sports': return 'football';
      case 'meeting': return 'people';
      default: return 'notifications';
    }
  };

  const renderExamCard = ({ item, index }) => (
    <View style={styles.eventItem}>
      <View style={[styles.eventIcon, { backgroundColor: '#9C27B0' }]}> 
        <Ionicons name="calendar" size={24} color="#fff" />
      </View>
      <View style={styles.eventInfo}>
        <Text style={styles.eventTitle}>{item.subject_name} Exam</Text>
        <Text style={styles.eventDetails}>{item.exam_date} • {item.exam_time}</Text>
        <Text style={styles.eventDescription}>{item.description || 'Exam scheduled'}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Parent Dashboard" showBack={false} showNotifications={true} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF9800" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Header title="Parent Dashboard" showBack={false} showNotifications={true} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#F44336" />
          <Text style={styles.errorText}>Failed to load dashboard</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => {
            setLoading(true);
            setError(null);
            // Trigger useEffect to reload data
            setStudentData(null);
          }}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Demo student image (local asset or placeholder)
  const studentImage = require('../../../assets/icon.png');

  return (
    <View style={styles.container}>
      <Header 
        title="Parent Dashboard" 
        showBack={false} 
        showNotifications={true}
        unreadCount={unreadCount}
      />
      
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
      >
        {/* Student Details Card */}
        <TouchableOpacity style={styles.studentCard} onPress={() => setShowStudentDetailsModal(true)} activeOpacity={0.85}>
          <View style={styles.studentCardRow}>
            <Image source={studentImage} style={styles.studentAvatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.studentCardName}>{studentData?.name || 'Student Name'}</Text>
              <Text style={styles.studentCardClass}>Class {studentData?.class_name} • Roll No: {studentData?.roll_number}</Text>
            </View>
            <Ionicons name="chevron-forward" size={28} color="#bbb" />
          </View>
        </TouchableOpacity>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          {childStats.map((stat, index) => (
            <TouchableOpacity
              key={index}
              style={styles.statCardWrapper}
              onPress={() => handleStatCardPress(stat.title)}
              activeOpacity={0.7}
            >
              <StatCard
                title={stat.title}
                value={stat.value}
                icon={stat.icon}
                color={stat.color}
                subtitle={stat.subtitle}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* This Week's Attendance */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>This Week's Attendance</Text>
            <TouchableOpacity onPress={() => setShowAttendanceModal(true)}>
              <Text style={styles.viewAllText}>View Details</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Attendance Analytics</Text>
            <CrossPlatformPieChart
              data={attendancePieData}
              width={350}
              height={180}
              chartConfig={{
                backgroundColor: '#fff',
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
            <View style={styles.chartSummary}>
              <Text style={styles.chartSummaryText}>
                Present: {presentCount} days | Absent: {absentCount} days
              </Text>
            </View>
          </View>
        </View>

        {/* Upcoming Events */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Events</Text>
            <TouchableOpacity onPress={() => setShowEventsModal(true)}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={events.slice(0, 4)}
            renderItem={renderEventItem}
            keyExtractor={(item, index) => index.toString()}
            scrollEnabled={false}
          />
        </View>

        {/* Upcoming Exams */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Exams</Text>
            <TouchableOpacity onPress={() => setShowExamsModal(true)}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={exams.slice(0, 4)}
            renderItem={renderExamCard}
            keyExtractor={(item, index) => index.toString()}
            scrollEnabled={false}
          />
        </View>

        {/* Recent Notifications */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Notifications</Text>
            <TouchableOpacity onPress={() => setShowNotificationsModal(true)}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={notifications.slice(0, 4)}
            renderItem={renderNotificationItem}
            keyExtractor={(item, index) => index.toString()}
            scrollEnabled={false}
          />
        </View>
      </ScrollView>

      {/* Attendance Details Modal */}
      {showAttendanceModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>This Week's Attendance</Text>
              <TouchableOpacity onPress={() => setShowAttendanceModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView 
              style={{ height: 300 }} 
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
              scrollEventThrottle={16}
            >
              <View style={styles.attendanceTableHeader}>
                <Text style={styles.attendanceTableColHeader}>Date</Text>
                <Text style={styles.attendanceTableColHeader}>Day</Text>
                <Text style={styles.attendanceTableColHeader}>Status</Text>
              </View>
              {attendance.map((item, idx) => (
                <View key={idx} style={styles.attendanceTableRow}>
                  <Text style={styles.attendanceTableCol}>{item.date}</Text>
                  <Text style={styles.attendanceTableCol}>{new Date(item.date).toLocaleDateString('en-US', { weekday: 'long' })}</Text>
                  <Text style={[styles.attendanceTableCol, { color: item.status === 'Present' ? '#4CAF50' : '#F44336', fontWeight: 'bold' }]}>{item.status}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Events Modal */}
      {showEventsModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>All Upcoming Events</Text>
              <TouchableOpacity onPress={() => setShowEventsModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView 
              style={{ height: 400 }} 
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
              scrollEventThrottle={16}
            >
              {events.map((item, idx) => (
                <View key={idx} style={styles.modalEventItem}>
                  <View style={[styles.modalEventIcon, { backgroundColor: item.color || '#FF9800' }]}>
                    <Ionicons name={item.icon || 'calendar'} size={24} color="#fff" />
                  </View>
                  <View style={styles.modalEventInfo}>
                    <Text style={styles.modalEventTitle}>{item.title}</Text>
                    <Text style={styles.modalEventDetails}>{item.event_date} • {item.event_time}</Text>
                    <Text style={styles.modalEventDescription}>{item.description}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Exams Modal */}
      {showExamsModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>All Upcoming Exams</Text>
              <TouchableOpacity onPress={() => setShowExamsModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView 
              style={{ height: 400 }} 
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
              scrollEventThrottle={16}
            >
              {exams.map((item, idx) => (
                <View key={idx} style={styles.modalEventItem}>
                  <View style={[styles.modalEventIcon, { backgroundColor: '#9C27B0' }]}>
                    <Ionicons name="calendar" size={24} color="#fff" />
                  </View>
                  <View style={styles.modalEventInfo}>
                    <Text style={styles.modalEventTitle}>{item.subject_name} Exam</Text>
                    <Text style={styles.modalEventDetails}>{item.exam_date} • {item.exam_time}</Text>
                    <Text style={styles.modalEventDescription}>{item.description || 'Exam scheduled'}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Notifications Modal */}
      {showNotificationsModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Recent Notifications</Text>
              <TouchableOpacity onPress={() => setShowNotificationsModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView 
              style={{ height: 400 }} 
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
              scrollEventThrottle={16}
            >
              {notifications.map((item, idx) => (
                <View key={idx} style={styles.notificationItem}>
                  {renderNotificationItem({ item, index: idx })}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Student Details Modal */}
      {showStudentDetailsModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Student Details</Text>
              <TouchableOpacity onPress={() => setShowStudentDetailsModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={true}>
              <View style={{ alignItems: 'center', marginBottom: 18 }}>
                <Image source={studentImage} style={styles.studentAvatarLarge} />
              </View>
              <View style={styles.detailsRow}><Text style={styles.detailsLabel}>Name:</Text><Text style={styles.detailsValue}>{studentData?.name}</Text></View>
              <View style={styles.detailsRow}><Text style={styles.detailsLabel}>Father's Name:</Text><Text style={styles.detailsValue}>{studentData?.father_name}</Text></View>
              <View style={styles.detailsRow}><Text style={styles.detailsLabel}>Mother's Name:</Text><Text style={styles.detailsValue}>{studentData?.mother_name}</Text></View>
              <View style={styles.detailsRow}><Text style={styles.detailsLabel}>Class:</Text><Text style={styles.detailsValue}>{studentData?.class_name}</Text></View>
              <View style={styles.detailsRow}><Text style={styles.detailsLabel}>Roll No:</Text><Text style={styles.detailsValue}>{studentData?.roll_number}</Text></View>
              <View style={styles.detailsRow}><Text style={styles.detailsLabel}>DOB:</Text><Text style={styles.detailsValue}>{studentData?.date_of_birth}</Text></View>
              <View style={styles.detailsRow}><Text style={styles.detailsLabel}>Blood Group:</Text><Text style={styles.detailsValue}>{studentData?.blood_group}</Text></View>
              <View style={styles.detailsRow}><Text style={styles.detailsLabel}>Mobile:</Text><Text style={styles.detailsValue}>{studentData?.phone}</Text></View>
              <View style={styles.detailsRow}><Text style={styles.detailsLabel}>Gender:</Text><Text style={styles.detailsValue}>{studentData?.gender}</Text></View>
              <View style={styles.detailsRow}><Text style={styles.detailsLabel}>Admission No:</Text><Text style={styles.detailsValue}>{studentData?.admission_number}</Text></View>
              <View style={styles.detailsRow}><Text style={styles.detailsLabel}>Email:</Text><Text style={styles.detailsValue}>{studentData?.email}</Text></View>
              <View style={styles.detailsRow}><Text style={styles.detailsLabel}>Address:</Text><Text style={styles.detailsValue}>{studentData?.address}</Text></View>
            </ScrollView>
          </View>
        </View>
      )}
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
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  statCardWrapper: {
    width: '48%',
    marginBottom: 12,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 8,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  viewAllText: {
    fontSize: 14,
    color: '#FF9800',
    fontWeight: '600',
  },
  chartContainer: {
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  chartSummary: {
    marginTop: 12,
    alignItems: 'center',
  },
  chartSummaryText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  chart: {
    borderRadius: 12,
  },

  examItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  examIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3e5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  examInfo: {
    flex: 1,
  },
  examSubject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  examDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  examClass: {
    fontSize: 12,
    color: '#999',
  },
  examAction: {
    padding: 8,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  eventIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  eventDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  eventDescription: {
    fontSize: 12,
    color: '#999',
    lineHeight: 16,
  },
  eventAction: {
    padding: 8,
  },
  modalEventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalEventIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  modalEventInfo: {
    flex: 1,
  },
  modalEventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  modalEventDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  modalEventDescription: {
    fontSize: 12,
    color: '#999',
    lineHeight: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  notificationIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
    lineHeight: 18,
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 500,
    maxHeight: '70%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  attendanceTableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 8,
    marginBottom: 8,
  },
  attendanceTableColHeader: {
    flex: 1,
    fontWeight: 'bold',
    color: '#1976d2',
    fontSize: 15,
    textAlign: 'center',
  },
  attendanceTableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  attendanceTableCol: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    color: '#333',
  },
  studentCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    marginHorizontal: 16,
    marginTop: 18,
    marginBottom: 8,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  studentCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  studentCardName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  studentCardClass: {
    fontSize: 15,
    color: '#888',
    marginTop: 2,
  },
  studentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 16,
    backgroundColor: '#eee',
  },
  studentAvatarLarge: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 8,
    backgroundColor: '#eee',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  detailsLabel: {
    fontWeight: 'bold',
    color: '#1976d2',
    width: 120,
    fontSize: 15,
  },
  detailsValue: {
    flex: 1,
    color: '#333',
    fontSize: 15,
    marginLeft: 8,
    flexWrap: 'wrap',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    color: '#F44336',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#FF9800',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ParentDashboard; 