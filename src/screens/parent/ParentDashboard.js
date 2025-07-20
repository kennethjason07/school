import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import StatCard from '../../components/StatCard';
import CrossPlatformPieChart from '../../components/CrossPlatformPieChart';

// Import notifications data to calculate real unread count
import { DUMMY_NOTIFICATIONS } from './Notifications';

const ParentDashboard = ({ navigation }) => {
  // Calculate real unread count from notifications data
  const unreadCount = DUMMY_NOTIFICATIONS.filter(notification => !notification.isRead).length;

  // Mock data
  const upcomingExams = [
    { subject: 'Mathematics', date: 'Dec 15, 2024', time: '9:00 AM', class: 'Class 5A' },
    { subject: 'Science', date: 'Dec 17, 2024', time: '10:00 AM', class: 'Class 5A' },
  ];

  const upcomingEvents = [
    { 
      title: 'Annual Day Celebration', 
      date: 'Dec 25, 2024', 
      time: '6:00 PM - 9:00 PM', 
      type: 'event',
      description: 'Annual day with cultural performances and awards',
      icon: 'trophy',
      color: '#FF9800'
    },
    { 
      title: 'Sports Day', 
      date: 'Dec 28, 2024', 
      time: '8:00 AM - 4:00 PM', 
      type: 'sports',
      description: 'Annual sports day with various competitions',
      icon: 'football',
      color: '#4CAF50'
    },
    { 
      title: 'Parent-Teacher Meeting', 
      date: 'Jan 5, 2025', 
      time: '2:00 PM - 4:00 PM', 
      type: 'meeting',
      description: 'Quarterly parent-teacher meeting',
      icon: 'people',
      color: '#9C27B0'
    },
    { 
      title: 'Science Exhibition', 
      date: 'Jan 10, 2025', 
      time: '10:00 AM - 2:00 PM', 
      type: 'exhibition',
      description: 'Annual science exhibition with student projects',
      icon: 'flask',
      color: '#607D8B'
    },
    { 
      title: 'Art & Craft Fair', 
      date: 'Jan 15, 2025', 
      time: '11:00 AM - 3:00 PM', 
      type: 'art',
      description: 'Art and craft exhibition showcasing student creativity',
      icon: 'color-palette',
      color: '#E91E63'
    },
    { 
      title: 'Library Week', 
      date: 'Jan 25, 2025', 
      time: 'All Day', 
      type: 'library',
      description: 'Week-long library activities and book fair',
      icon: 'library',
      color: '#8BC34A'
    },
    { 
      title: 'Music Concert', 
      date: 'Jan 30, 2025', 
      time: '6:30 PM - 8:30 PM', 
      type: 'music',
      description: 'Annual music concert featuring school choir',
      icon: 'musical-notes',
      color: '#FF5722'
    },
    { 
      title: 'Career Counseling', 
      date: 'Feb 5, 2025', 
      time: '3:00 PM - 5:00 PM', 
      type: 'counseling',
      description: 'Career guidance session for senior students',
      icon: 'school',
      color: '#3F51B5'
    },
  ];

  const recentNotifications = [
    { title: 'Annual Day Invitation', message: 'You are invited to Annual Day celebration on Dec 25, 2024', time: '1 hour ago', type: 'event' },
    { title: 'Sports Day Registration', message: 'Sports day registration open for your child', time: '3 hours ago', type: 'sports' },
    { title: 'Midterm Exam Schedule', message: 'Midterm exams will be conducted from Dec 20-22, 2024', time: '1 day ago', type: 'exam' },
    { title: 'Parent-Teacher Meeting', message: 'PTM scheduled for Jan 5, 2025 at 2:00 PM', time: '2 days ago', type: 'meeting' },
  ];

  // Helper function to convert time string to a comparable value
  function getTimeValue(timeStr) {
    if (timeStr.includes('hour')) return parseInt(timeStr) * 60;
    if (timeStr.includes('hours')) return parseInt(timeStr) * 60;
    if (timeStr.includes('min')) return parseInt(timeStr);
    if (timeStr.includes('day')) return parseInt(timeStr) * 24 * 60;
    if (timeStr.includes('days')) return parseInt(timeStr) * 24 * 60;
    return 999999; // fallback for unknown
  }

  const sortedNotifications = [...recentNotifications].sort((a, b) => getTimeValue(a.time) - getTimeValue(b.time));


  // State for attendance details modal
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  // State for events modal
  const [showEventsModal, setShowEventsModal] = useState(false);

  // Mock week attendance data
  const weekAttendance = [
    { date: '10-06-2024', day: 'Monday', status: 'Present' },
    { date: '11-06-2024', day: 'Tuesday', status: 'Present' },
    { date: '12-06-2024', day: 'Wednesday', status: 'Absent' },
    { date: '13-06-2024', day: 'Thursday', status: 'Present' },
    { date: '14-06-2024', day: 'Friday', status: 'Present' },
    { date: '15-06-2024', day: 'Saturday', status: 'Present' },
  ];

  // Calculate attendance data for pie chart
  const presentCount = weekAttendance.filter(item => item.status === 'Present').length;
  const absentCount = weekAttendance.filter(item => item.status === 'Absent').length;
  const attendancePieData = [
    { name: 'Present', population: presentCount, color: '#4CAF50', legendFontColor: '#333', legendFontSize: 14 },
    { name: 'Absent', population: absentCount, color: '#F44336', legendFontColor: '#333', legendFontSize: 14 },
  ];

  // 2. Create a new upcomingExamsList array (at least 8 items, sorted latest first)
  const upcomingExamsList = [
    { title: 'Mathematics Final Exam', date: 'Feb 20, 2025', time: '9:00 AM - 12:00 PM', description: 'Final exam for Mathematics', icon: 'calculator', color: '#2196F3', type: 'exam' },
    { title: 'Science Final Exam', date: 'Feb 18, 2025', time: '9:00 AM - 12:00 PM', description: 'Final exam for Science', icon: 'flask', color: '#4CAF50', type: 'exam' },
    { title: 'English Final Exam', date: 'Feb 16, 2025', time: '9:00 AM - 12:00 PM', description: 'Final exam for English', icon: 'book', color: '#9C27B0', type: 'exam' },
    { title: 'Social Studies Final Exam', date: 'Feb 14, 2025', time: '9:00 AM - 12:00 PM', description: 'Final exam for Social Studies', icon: 'globe', color: '#FF9800', type: 'exam' },
    { title: 'Computer Science Exam', date: 'Feb 12, 2025', time: '9:00 AM - 12:00 PM', description: 'Final exam for Computer Science', icon: 'laptop', color: '#607D8B', type: 'exam' },
    { title: 'Hindi Final Exam', date: 'Feb 10, 2025', time: '9:00 AM - 12:00 PM', description: 'Final exam for Hindi', icon: 'language', color: '#E91E63', type: 'exam' },
    { title: 'Mathematics Olympiad', date: 'Jan 20, 2025', time: '9:00 AM - 11:00 AM', description: 'Inter-school mathematics competition', icon: 'calculator', color: '#795548', type: 'exam' },
    { title: 'Midterm Examinations', date: 'Dec 20, 2024', time: '9:00 AM - 12:00 PM', description: 'All subjects midterm exams', icon: 'document-text', color: '#2196F3', type: 'exam' },
  ];
  // Sort by date (latest first)
  const sortedExams = [...upcomingExamsList].sort((a, b) => new Date(b.date) - new Date(a.date));

  // 3. Add state for exams modal
  const [showExamsModal, setShowExamsModal] = useState(false);

  const renderExamItem = ({ item, index }) => (
    <View style={styles.examItem}>
      <View style={styles.examIcon}>
        <Ionicons name="calendar" size={24} color="#9C27B0" />
      </View>
      <View style={styles.examInfo}>
        <Text style={styles.examSubject}>{item.subject}</Text>
        <Text style={styles.examDetails}>{item.date} • {item.time}</Text>
        <Text style={styles.examClass}>{item.class}</Text>
      </View>
      <TouchableOpacity style={styles.examAction}>
        <Ionicons name="chevron-forward" size={20} color="#9C27B0" />
      </TouchableOpacity>
    </View>
  );

  const renderEventItem = ({ item, index }) => (
    <View style={styles.eventItem}>
      <View style={[styles.eventIcon, { backgroundColor: item.color }]}>
        <Ionicons name={item.icon} size={24} color="#fff" />
      </View>
      <View style={styles.eventInfo}>
        <Text style={styles.eventTitle}>{item.title}</Text>
        <Text style={styles.eventDetails}>{item.date} • {item.time}</Text>
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
        <Text style={styles.notificationTime}>{item.time}</Text>
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
      case 'exhibition': return '#607D8B';
      case 'art': return '#E91E63';
      case 'competition': return '#795548';
      case 'library': return '#8BC34A';
      case 'music': return '#FF5722';
      case 'counseling': return '#3F51B5';
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
      case 'exhibition': return 'flask';
      case 'art': return 'color-palette';
      case 'competition': return 'calculator';
      case 'library': return 'library';
      case 'music': return 'musical-notes';
      case 'counseling': return 'school';
      default: return 'notifications';
    }
  };

  // 4. Render function for exams (same style as events)
  const renderExamCard = ({ item, index }) => (
    <View style={styles.eventItem}>
      <View style={[styles.eventIcon, { backgroundColor: item.color }]}> 
        <Ionicons name={item.icon} size={24} color="#fff" />
      </View>
      <View style={styles.eventInfo}>
        <Text style={styles.eventTitle}>{item.title}</Text>
        <Text style={styles.eventDetails}>{item.date} • {item.time}</Text>
        <Text style={styles.eventDescription}>{item.description}</Text>
      </View>
    </View>
  );

  // 1. Add state for notifications modal
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);

  // 2. Filter sortedNotifications for last 7 days
  const weekNotifications = sortedNotifications.filter(n => {
    if (n.time.includes('min') || n.time.includes('hour') || n.time.includes('hours')) return true;
    if (n.time.includes('day')) {
      const days = parseInt(n.time);
      return days <= 7;
    }
    if (n.time.includes('days')) {
      const days = parseInt(n.time);
      return days <= 7;
    }
    return false;
  });

  // 1. Add state for student details modal
  const [showStudentDetailsModal, setShowStudentDetailsModal] = useState(false);

  // 2. Student details object
  const studentDetails = {
    name: 'Emma Johnson',
    fatherName: 'Robert Johnson',
    motherName: 'Sophia Johnson',
    class: '5A',
    rollNo: '15',
    dob: '2014-03-12',
    bloodGroup: 'A+',
    mobile: '+91 9876543210',
    address: '123, Green Avenue, Springfield',
    email: 'emma.johnson@email.com',
    gender: 'Female',
    admissionNo: '2020-0051',
  };

  // Demo student image (local asset or placeholder)
  const studentImage = require('../../../assets/icon.png'); // or use a placeholder URL

  // Find the next upcoming event
  const nextEvent = upcomingEvents && upcomingEvents.length > 0 ? upcomingEvents[0] : null;

  // Update childStats for the event card
  const childStats = [
    { title: 'Attendance', value: '92%', icon: 'checkmark-circle', color: '#4CAF50', subtitle: 'This month' },
    { title: 'Fee Due', value: '₹5,000', icon: 'card', color: '#FF9800', subtitle: 'Due in 5 days' },
    { title: 'Average Marks', value: '85%', icon: 'document-text', color: '#2196F3', subtitle: 'This semester' },
    { 
      title: 'Upcoming Events', 
      value: String(upcomingEvents.length), 
      icon: 'calendar', 
      color: '#9C27B0', 
      subtitle: nextEvent ? `${nextEvent.title} (${nextEvent.date})` : 'No upcoming event',
    },
  ];

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
              <Text style={styles.studentCardName}>{studentDetails.name}</Text>
              <Text style={styles.studentCardClass}>Class {studentDetails.class} • Roll No: {studentDetails.rollNo}</Text>
            </View>
            <Ionicons name="chevron-forward" size={28} color="#bbb" />
          </View>
        </TouchableOpacity>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          {childStats.map((stat, index) => (
            <View key={index} style={styles.statCardWrapper}>
              <StatCard
                title={stat.title}
                value={stat.value}
                icon={stat.icon}
                color={stat.color}
                subtitle={stat.subtitle}
              />
            </View>
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
            data={upcomingEvents.slice(0, 4)}
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
            data={sortedExams.slice(0, 4)}
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
            data={sortedNotifications}
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
              {weekAttendance.map((item, idx) => (
                <View key={idx} style={styles.attendanceTableRow}>
                  <Text style={styles.attendanceTableCol}>{item.date}</Text>
                  <Text style={styles.attendanceTableCol}>{item.day}</Text>
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
              {upcomingEvents.map((item, idx) => (
                <View key={idx} style={styles.modalEventItem}>
                  <View style={[styles.modalEventIcon, { backgroundColor: item.color }]}>
                    <Ionicons name={item.icon} size={24} color="#fff" />
                  </View>
                  <View style={styles.modalEventInfo}>
                    <Text style={styles.modalEventTitle}>{item.title}</Text>
                    <Text style={styles.modalEventDetails}>{item.date} • {item.time}</Text>
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
              {sortedExams.map((item, idx) => (
                <View key={idx} style={styles.modalEventItem}>
                  <View style={[styles.modalEventIcon, { backgroundColor: item.color }]}>
                    <Ionicons name={item.icon} size={24} color="#fff" />
                  </View>
                  <View style={styles.modalEventInfo}>
                    <Text style={styles.modalEventTitle}>{item.title}</Text>
                    <Text style={styles.modalEventDetails}>{item.date} • {item.time}</Text>
                    <Text style={styles.modalEventDescription}>{item.description}</Text>
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
              <Text style={styles.modalTitle}>Recent Notifications (Last 7 Days)</Text>
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
              {weekNotifications.map((item, idx) => (
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
              <View style={styles.detailsRow}><Text style={styles.detailsLabel}>Name:</Text><Text style={styles.detailsValue}>{studentDetails.name}</Text></View>
              <View style={styles.detailsRow}><Text style={styles.detailsLabel}>Father's Name:</Text><Text style={styles.detailsValue}>{studentDetails.fatherName}</Text></View>
              <View style={styles.detailsRow}><Text style={styles.detailsLabel}>Mother's Name:</Text><Text style={styles.detailsValue}>{studentDetails.motherName}</Text></View>
              <View style={styles.detailsRow}><Text style={styles.detailsLabel}>Class:</Text><Text style={styles.detailsValue}>{studentDetails.class}</Text></View>
              <View style={styles.detailsRow}><Text style={styles.detailsLabel}>Roll No:</Text><Text style={styles.detailsValue}>{studentDetails.rollNo}</Text></View>
              <View style={styles.detailsRow}><Text style={styles.detailsLabel}>DOB:</Text><Text style={styles.detailsValue}>{studentDetails.dob}</Text></View>
              <View style={styles.detailsRow}><Text style={styles.detailsLabel}>Blood Group:</Text><Text style={styles.detailsValue}>{studentDetails.bloodGroup}</Text></View>
              <View style={styles.detailsRow}><Text style={styles.detailsLabel}>Mobile:</Text><Text style={styles.detailsValue}>{studentDetails.mobile}</Text></View>
              <View style={styles.detailsRow}><Text style={styles.detailsLabel}>Gender:</Text><Text style={styles.detailsValue}>{studentDetails.gender}</Text></View>
              <View style={styles.detailsRow}><Text style={styles.detailsLabel}>Admission No:</Text><Text style={styles.detailsValue}>{studentDetails.admissionNo}</Text></View>
              <View style={styles.detailsRow}><Text style={styles.detailsLabel}>Email:</Text><Text style={styles.detailsValue}>{studentDetails.email}</Text></View>
              <View style={styles.detailsRow}><Text style={styles.detailsLabel}>Address:</Text><Text style={styles.detailsValue}>{studentDetails.address}</Text></View>
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
});

export default ParentDashboard; 