import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  Platform,
  RefreshControl,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import Header from '../../components/Header';
import StatCard from '../../components/StatCard';
import DateTimePicker from '@react-native-community/datetimepicker';
import CrossPlatformPieChart from '../../components/CrossPlatformPieChart';
import CrossPlatformBarChart from '../../components/CrossPlatformBarChart';
import { supabase } from '../../utils/supabase';
import { format } from 'date-fns';

const { width } = Dimensions.get('window');

const AdminDashboard = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Load real-time data from Supabase
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load students count
      const { data: students, error: studentError, count: studentCount } = await supabase
        .from('students')
        .select('id', { count: 'exact' });

      // Load teachers count
      const { data: teachers, error: teacherError, count: teacherCount } = await supabase
        .from('teachers')
        .select('id', { count: 'exact' });

      // Load today's attendance
      const today = new Date();
      const { data: attendance, error: attendanceError } = await supabase
        .from('attendance')
        .select('id')
        .eq('date', format(today, 'yyyy-MM-dd'));

      // Load fee data
      const { data: fees, error: feeError } = await supabase
        .from('student_fees')
        .select('amount, status')
        .gte('payment_date', format(new Date(), 'yyyy-MM-dd'));

      // Calculate statistics
      const totalStudents = studentCount || 0;
      const totalTeachers = teacherCount || 0;
      const attendancePercentage = attendance ? Math.round((attendance.length / totalStudents) * 100) : 0;
      const totalFees = fees?.reduce((sum, fee) => sum + (fee.amount || 0), 0) || 0;
      const collectedFees = fees?.filter(fee => fee.status === 'Paid')?.reduce((sum, fee) => sum + (fee.amount || 0), 0) || 0;
      const feeCollectionPercentage = Math.round((collectedFees / totalFees) * 100);

      // Update stats
      setStats([
        { 
          title: 'Total Students', 
          value: totalStudents.toLocaleString(), 
          icon: 'people', 
          color: '#2196F3', 
          subtitle: 'Updated now', 
          trend: 0 
        },
        { 
          title: 'Total Teachers', 
          value: totalTeachers.toString(), 
          icon: 'person', 
          color: '#4CAF50', 
          subtitle: 'Updated now', 
          trend: 0 
        },
        { 
          title: 'Attendance Today', 
          value: `${attendancePercentage}%`, 
          icon: 'checkmark-circle', 
          color: '#FF9800', 
          subtitle: `${attendance?.length || 0} present`, 
          trend: 0 
        },
        { 
          title: 'Fee Collection', 
          value: `₹${(collectedFees / 1000000).toFixed(1)}M`, 
          icon: 'card', 
          color: '#9C27B0', 
          subtitle: `${feeCollectionPercentage}% collected`, 
          trend: 0 
        }
      ]);

      // Load announcements
      const { data: announcementsData, error: announcementsError } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (announcementsData) {
        setAnnouncements(announcementsData.map(announcement => ({
          message: announcement.message,
          date: announcement.created_at,
          icon: announcement.icon || 'megaphone',
          color: announcement.color || '#2196F3'
        })));
      }

      // Load events
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .gte('date', format(new Date(), 'yyyy-MM-dd'))
        .order('date', { ascending: true })
        .limit(5);

      if (eventsData) {
        setEvents(eventsData.map(event => ({
          id: event.id,
          type: event.type,
          title: event.title,
          date: event.date,
          icon: event.icon || 'trophy',
          color: event.color || '#FF9800'
        })));
      }

      // Load recent activities
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (activitiesData) {
        setActivities(activitiesData.map(activity => ({
          text: activity.message,
          time: format(new Date(activity.created_at), 'PPp'),
          icon: activity.icon || 'activity'
        })));
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    // Subscribe to Supabase real-time updates
    const subscription = supabase
      .channel('dashboard-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'students'
      }, () => {
        loadDashboardData();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData()
      .finally(() => setRefreshing(false));
  };

  const quickActions = [
    { title: 'Manage Classes', icon: 'school', color: '#2196F3', screen: 'Classes' }, // Tab name
    { title: 'Manage Students', icon: 'people', color: '#4CAF50', screen: 'Students' }, // Tab name
    { title: 'Manage Teachers', icon: 'person', color: '#FF9800', screen: 'Teachers' }, // Tab name
    { title: 'Subjects Timetable', icon: 'calendar', color: '#607D8B', screen: 'SubjectsTimetable' }, // Stack screen
    { title: 'Attendance', icon: 'checkmark-circle', color: '#009688', screen: 'AttendanceManagement' }, // Stack screen
    { title: 'Fee Management', icon: 'card', color: '#9C27B0', screen: 'FeeManagement' }, // Stack screen
    { title: 'Exams & Marks', icon: 'document-text', color: '#795548', screen: 'ExamsMarks' }, // Stack screen
    { title: 'Notifications', icon: 'notifications', color: '#E91E63', screen: 'NotificationManagement' }, // Stack screen
  ];

  const attendanceData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    datasets: [
      {
        data: [92, 94, 89, 96, 94],
        color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  const performanceData = {
    labels: ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5'],
    datasets: [
      {
        data: [85, 78, 92, 88, 95],
      },
    ],
  };

  // Mock data for new key statistics charts
  const studentsAttendancePerClass = {
    labels: ['1A', '2A', '3A', '4A', '5A'],
    datasets: [
      { data: [95, 92, 88, 90, 93] },
    ],
  };

  const teachersAttendance = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    datasets: [
      { data: [98, 97, 99, 96, 97] },
    ],
  };

  const classesAttendance = {
    labels: ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5'],
    datasets: [
      { data: [94, 91, 89, 93, 92] },
    ],
  };

  const feesCollectedDue = [
    { name: 'Collected', population: 2400000, color: '#4CAF50', legendFontColor: '#333', legendFontSize: 14 },
    { name: 'Due', population: 350000, color: '#F44336', legendFontColor: '#333', legendFontSize: 14 },
  ];

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#2196F3',
    },
    propsForLabels: {
      fontSize: 12,
      fontWeight: '600',
    }
  };

  const [feeLoading, setFeeLoading] = useState(false);

  // Announcements state
  const [announcements, setAnnouncements] = useState([
    { message: 'School will remain closed on 15th August for Independence Day.', date: '2024-08-10', icon: 'megaphone', color: '#2196F3' },
    { message: 'New library books have arrived. Visit the library for more info.', date: '2024-08-05', icon: 'book', color: '#4CAF50' },
    { message: 'Annual Sports Day registrations are open till 18th August.', date: '2024-08-01', icon: 'trophy', color: '#FF9800' },
  ]);
  const [isAnnouncementModalVisible, setIsAnnouncementModalVisible] = useState(false);
  const [announcementInput, setAnnouncementInput] = useState({ message: '', date: '', icon: 'megaphone', color: '#2196F3' });
  const [editIndex, setEditIndex] = useState(null);

  // Date picker state for Announcements
  const [showAnnouncementDatePicker, setShowAnnouncementDatePicker] = useState(false);
  // Date picker state for Events
  const [showEventDatePicker, setShowEventDatePicker] = useState(false);

  const openAddAnnouncementModal = () => {
    setAnnouncementInput({ message: '', date: '', icon: 'megaphone', color: '#2196F3' });
    setEditIndex(null);
    setIsAnnouncementModalVisible(true);
  };

  const openEditAnnouncementModal = (item, idx) => {
    setAnnouncementInput(item);
    setEditIndex(idx);
    setIsAnnouncementModalVisible(true);
  };

  const saveAnnouncement = async () => {
    if (!announcementInput.message || !announcementInput.date) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    try {
      if (editIndex !== null) {
        // Update existing announcement
        const { error } = await supabase
          .from('announcements')
          .update({
            message: announcementInput.message,
            date: announcementInput.date
          })
          .eq('id', announcements[editIndex].id);

        if (error) throw error;
      } else {
        // Insert new announcement
        const { error } = await supabase
          .from('announcements')
          .insert({
            message: announcementInput.message,
            date: announcementInput.date,
            icon: announcementInput.icon,
            color: announcementInput.color
          });

        if (error) throw error;
      }

      await loadDashboardData();
      setIsAnnouncementModalVisible(false);
    } catch (error) {
      console.error('Error saving announcement:', error);
      Alert.alert('Error', 'Failed to save announcement');
    }
  };

  const deleteAnnouncement = (idx) => {
    Alert.alert('Delete Announcement', 'Are you sure you want to delete this announcement?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        setAnnouncements(announcements.filter((_, i) => i !== idx));
      }},
    ]);
  };

  // Upcoming Events state
  const [events, setEvents] = useState([
    { id: 1, type: 'Event', title: 'Annual Sports Day', date: '2024-08-20', icon: 'trophy', color: '#FF9800' },
    { id: 2, type: 'Exam', title: 'Mathematics Final Exam', date: '2024-09-05', icon: 'document-text', color: '#2196F3' },
    { id: 3, type: 'Exam', title: 'Mid Term Exams', date: '2024-10-10', icon: 'school', color: '#9C27B0' },
    { id: 4, type: 'Event', title: 'Science Exhibition', date: '2024-09-18', icon: 'flask', color: '#4CAF50' },
    { id: 5, type: 'Event', title: 'Parent-Teacher Meeting', date: '2024-08-30', icon: 'people', color: '#607D8B' },
    { id: 6, type: 'Event', title: 'Art & Craft Fair', date: '2024-11-15', icon: 'color-palette', color: '#E91E63' },
  ]);
  const [isEventModalVisible, setIsEventModalVisible] = useState(false);
  const [eventInput, setEventInput] = useState({ type: 'Event', title: '', date: '', icon: 'trophy', color: '#FF9800' });
  const [editEventIndex, setEditEventIndex] = useState(null);

  const openAddEventModal = () => {
    setEventInput({ type: 'Event', title: '', date: '', icon: 'trophy', color: '#FF9800' });
    setEditEventIndex(null);
    setIsEventModalVisible(true);
  };

  const openEditEventModal = (item, idx) => {
    setEventInput(item);
    setEditEventIndex(idx);
    setIsEventModalVisible(true);
  };

  const saveEvent = async () => {
    if (!eventInput.title || !eventInput.date) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    try {
      if (editEventIndex !== null) {
        // Update existing event
        const { error } = await supabase
          .from('events')
          .update({
            title: eventInput.title,
            date: eventInput.date,
            type: eventInput.type,
            icon: eventInput.icon,
            color: eventInput.color
          })
          .eq('id', events[editEventIndex].id);

        if (error) throw error;
      } else {
        // Insert new event
        const { error } = await supabase
          .from('events')
          .insert({
            title: eventInput.title,
            date: eventInput.date,
            type: eventInput.type,
            icon: eventInput.icon,
            color: eventInput.color
          });

        if (error) throw error;
      }

      await loadDashboardData();
      setIsEventModalVisible(false);
    } catch (error) {
      console.error('Error saving event:', error);
      Alert.alert('Error', 'Failed to save event');
    }
  };

  const deleteEvent = (id) => {
    Alert.alert('Delete Event', 'Are you sure you want to delete this event?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        setEvents(events.filter((e) => e.id !== id));
      }},
    ]);
  };

  // Recent Activities state
  const [activities, setActivities] = useState([
    { text: 'New student registered: John Doe (Class 3A)', time: '2 hours ago', icon: 'person-add' },
    { text: 'Fee payment received: ₹15,000 from Class 5B', time: '4 hours ago', icon: 'card' },
    { text: 'Attendance marked for Class 2A (95% present)', time: '6 hours ago', icon: 'checkmark-circle' },
    { text: 'Exam scheduled: Mathematics for Class 4A', time: '1 day ago', icon: 'calendar' },
  ]);

  const openAddActivityModal = () => {
    // This function is not fully implemented in the original file,
    // so it's not added to the new_code.
    Alert.alert('Add Activity', 'This feature is not yet implemented.');
  };

  const deleteActivity = (idx) => {
    Alert.alert('Delete Activity', 'Are you sure you want to delete this activity?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        setActivities(activities.filter((_, i) => i !== idx));
      }},
    ]);
  };

  return (
    <View style={styles.container}>
      <Header title="Admin Dashboard" />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Welcome back, Admin!</Text>
          <Text style={styles.dateText}>{new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</Text>
        </View>

        {/* Stats Cards - 2x2 grid layout */}
        <View style={styles.statsGridContainer}>
          <View style={styles.statsRow}>
            <View style={styles.statsCol}>
              {stats[0] && (
                <StatCard
                  title={stats[0].title}
                  value={stats[0].value}
                  icon={stats[0].icon}
                  color={stats[0].color}
                  subtitle={stats[0].subtitle}
                />
              )}
            </View>
            <View style={styles.statsCol}>
              {stats[1] && (
                <StatCard
                  title={stats[1].title}
                  value={stats[1].value}
                  icon={stats[1].icon}
                  color={stats[1].color}
                  subtitle={stats[1].subtitle}
                />
              )}
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statsCol}>
              {stats[2] && (
                <StatCard
                  title={stats[2].title}
                  value={stats[2].value}
                  icon={stats[2].icon}
                  color={stats[2].color}
                  subtitle={stats[2].subtitle}
                />
              )}
            </View>
            <View style={styles.statsCol}>
              {stats[3] && (
                <StatCard
                  title={stats[3].title}
                  value={stats[3].value}
                  icon={stats[3].icon}
                  color={stats[3].color}
                  subtitle={stats[3].subtitle}
                />
              )}
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickActionCard}
                onPress={() => navigation.navigate(action.screen)}
              >
                <View style={[styles.actionIcon, { backgroundColor: action.color }]}>
                  <Ionicons name={action.icon} size={24} color="#fff" />
                </View>
                <Text style={styles.actionTitle}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Upcoming Events, Exams, or Deadlines */}
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.sectionTitle}>Upcoming Events</Text>
            <TouchableOpacity style={styles.addButton} onPress={openAddEventModal}>
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.upcomingList}>
            {events.slice().sort((a, b) => new Date(a.date) - new Date(b.date)).map((item, idx) => (
              <View key={item.id} style={styles.upcomingItem}>
                <View style={[styles.upcomingIcon, { backgroundColor: item.color }]}> 
                  <Ionicons name={item.icon} size={20} color="#fff" />
                </View>
                <View style={styles.upcomingContent}>
                  <Text style={styles.upcomingTitle}>{item.title}</Text>
                  <Text style={styles.upcomingSubtitle}>{item.type} • {(() => { const [y, m, d] = item.date.split('-'); return `${d}-${m}-${y}`; })()}</Text>
                </View>
                <TouchableOpacity onPress={() => openEditEventModal(item, events.findIndex(e => e.id === item.id))} style={{ marginRight: 8 }}>
                  <Ionicons name="create-outline" size={20} color="#2196F3" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteEvent(item.id)}>
                  <Ionicons name="trash" size={20} color="#F44336" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
          {/* Event Modal */}
          <Modal
            visible={isEventModalVisible}
            animationType="slide"
            transparent
            onRequestClose={() => setIsEventModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>{editEventIndex !== null ? 'Edit Event' : 'Add Event'}</Text>
                <TextInput
                  placeholder="Event title"
                  value={eventInput.title}
                  onChangeText={text => setEventInput({ ...eventInput, title: text })}
                  style={styles.input}
                />
                {/* Date Picker Button for Events */}
                {Platform.OS === 'web' ? (
                  <input
                    type="date"
                    value={eventInput.date}
                    onChange={e => setEventInput({ ...eventInput, date: e.target.value })}
                    style={{ ...styles.input, padding: 10, fontSize: 15, borderRadius: 8, borderWidth: 1, borderColor: '#e0e0e0', marginBottom: 12 }}
                  />
                ) : (
                  <TouchableOpacity style={styles.input} onPress={() => setShowEventDatePicker(true)}>
                  <Text style={{ color: eventInput.date ? '#333' : '#aaa' }}>
                    {eventInput.date ? (() => { const [y, m, d] = eventInput.date.split('-'); return `${d}-${m}-${y}`; })() : 'Select Date'}
                  </Text>
                </TouchableOpacity>
                )}
                {showEventDatePicker && Platform.OS !== 'web' && (
                  <DateTimePicker
                    value={eventInput.date ? new Date(eventInput.date) : new Date()}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowEventDatePicker(false);
                      if (selectedDate) {
                        const dd = String(selectedDate.getDate()).padStart(2, '0');
                        const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
                        const yyyy = selectedDate.getFullYear();
                        setEventInput({ ...eventInput, date: `${yyyy}-${mm}-${dd}` }); // keep storage as yyyy-mm-dd
                      }
                    }}
                  />
                )}
                <TextInput
                  placeholder="Type (Event/Exam)"
                  value={eventInput.type}
                  onChangeText={text => setEventInput({ ...eventInput, type: text })}
                  style={styles.input}
                />
                {/* Optionally, icon/color pickers can be added here */}
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
                  <TouchableOpacity onPress={() => setIsEventModalVisible(false)} style={[styles.modalButton, { backgroundColor: '#ccc' }]}> 
                    <Text style={{ color: '#333', fontWeight: 'bold' }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={saveEvent} style={[styles.modalButton, { backgroundColor: '#2196F3', marginLeft: 8 }]}> 
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>{editEventIndex !== null ? 'Save' : 'Add'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </View>

        {/* Fee Collection Summary and Outstanding Dues */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fee Collection Summary & Outstanding Dues</Text>
          {/* Overall Summary Pie Chart with loading animation */}
          <View style={{ alignItems: 'center', marginBottom: 16, width: '100%', flexDirection: 'column', justifyContent: 'center' }}>
            <Text style={{ fontSize: 15, fontWeight: 'bold', marginBottom: 0, textAlign: 'center' }}></Text>
            <View style={{ width: '100%', alignItems: 'center', justifyContent: 'center' }}>
              <CrossPlatformPieChart data={[{ name: 'Collected', population: 1200000, color: '#2196F3', legendFontColor: '#333', legendFontSize: 14 }, { name: 'Due', population: 300000, color: '#F44336', legendFontColor: '#333', legendFontSize: 14 }]} width={Math.min(width * 0.8, 350)} height={200} chartConfig={chartConfig} accessor={'population'} backgroundColor={'transparent'} paddingLeft={'70'} absolute style={[styles.chart, feeLoading ? { opacity: 0.5, alignSelf: 'center' } : null]} hasLegend={false} />
              {feeLoading && (
                <View style={styles.pieLoadingOverlay}>
                  <ActivityIndicator size="large" color="#2196F3" />
                </View>
              )}
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 4, width: '100%' }}>
              <Text style={{ color: '#2196F3', fontWeight: 'bold', marginRight: 16 }}>
                Collected: ₹1,200,000
              </Text>
              <Text style={{ color: '#F44336', fontWeight: 'bold' }}>
                Due: ₹300,000
              </Text>
            </View>
          </View>
        </View>

        {/* Analytics Charts: Attendance Trends & Marks Distribution */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Class Performance Analysis</Text>
          {/* Attendance per Class Chart */}
          <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Attendance per Class (%)</Text>
          <CrossPlatformBarChart data={{ labels: ['1A', '2A', '3A', '4A', '5A'], datasets: [ { data: [95, 92, 88, 90, 93] } ] }} width={Math.min(width * 0.9, 400)} height={220} yAxisLabel={''} xAxisLabel={'%'} fromZero chartConfig={{ ...chartConfig, decimalPlaces: 0, barPercentage: 0.6, backgroundGradientFrom: '#fff', backgroundGradientTo: '#fff', color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`, labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`, }} verticalLabelRotation={0} style={{ marginBottom: 32, borderRadius: 12, alignSelf: 'center' }} />
          {/* Marks Trend per Class Chart */}
          <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Marks Trend per Class</Text>
          <CrossPlatformBarChart data={{ labels: ['1A', '2A', '3A', '4A', '5A'], datasets: [ { data: [78, 85, 69, 88, 91] } ] }} width={Math.min(width * 0.9, 400)} height={220} yAxisLabel={''} xAxisLabel={' marks'} fromZero chartConfig={{ ...chartConfig, decimalPlaces: 0, barPercentage: 0.6, backgroundGradientFrom: '#fff', backgroundGradientTo: '#fff', color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`, labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`, }} verticalLabelRotation={0} style={{ borderRadius: 12, alignSelf: 'center' }} />
        </View>

        {/* Recent Activities - moved to bottom */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activities</Text>
          <View style={styles.activitiesList}>
            {activities.map((activity, index) => (
              <View key={index} style={styles.activityItem}>
                <View style={styles.activityIcon}>
                  <Ionicons name={activity.icon} size={16} color="#2196F3" />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityText}>{activity.text}</Text>
                  <Text style={styles.activityTime}>{activity.time}</Text>
                </View>
                <TouchableOpacity onPress={() => deleteActivity(index)} style={{ marginRight: 8 }}>
                  <Ionicons name="trash" size={20} color="#F44336" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Admin Messages or Announcements */}
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.sectionTitle}>Announcements</Text>
            <TouchableOpacity style={styles.addButton} onPress={openAddAnnouncementModal}>
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.announcementsList}>
            {announcements.slice().sort((a, b) => new Date(a.date) - new Date(b.date)).map((item, idx) => {
              const originalIdx = announcements.findIndex(a => a.message === item.message && a.date === item.date);
              return (
              <View key={idx} style={styles.announcementItem}>
                <View style={[styles.announcementIcon, { backgroundColor: item.color }]}> 
                  <Ionicons name={item.icon} size={20} color="#fff" />
                </View>
                <View style={styles.announcementContent}>
                  <Text style={styles.announcementText}>{item.message}</Text>
                  <Text style={styles.announcementDate}>{(() => { const [y, m, d] = item.date.split('-'); return `${d}-${m}-${y}`; })()}</Text>
                </View>
                <TouchableOpacity onPress={() => openEditAnnouncementModal(item, idx)} style={{ marginRight: 8 }}>
                  <Ionicons name="create-outline" size={20} color="#2196F3" />
                </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteAnnouncement(originalIdx)}>
                  <Ionicons name="trash" size={20} color="#F44336" />
                </TouchableOpacity>
              </View>
              );
            })}
          </View>
          {/* Announcement Modal */}
          <Modal
            visible={isAnnouncementModalVisible}
            animationType="slide"
            transparent
            onRequestClose={() => setIsAnnouncementModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>{editIndex !== null ? 'Edit Announcement' : 'Add Announcement'}</Text>
                <TextInput
                  placeholder="Announcement message"
                  value={announcementInput.message}
                  onChangeText={text => setAnnouncementInput({ ...announcementInput, message: text })}
                  style={styles.input}
                  multiline
                />
                {/* Date Picker Button for Announcements */}
                {Platform.OS === 'web' ? (
                  <input
                    type="date"
                    value={announcementInput.date}
                    onChange={e => setAnnouncementInput({ ...announcementInput, date: e.target.value })}
                    style={{ ...styles.input, padding: 10, fontSize: 15, borderRadius: 8, borderWidth: 1, borderColor: '#e0e0e0', marginBottom: 12 }}
                  />
                ) : (
                  <TouchableOpacity style={styles.input} onPress={() => setShowAnnouncementDatePicker(true)}>
                  <Text style={{ color: announcementInput.date ? '#333' : '#aaa' }}>
                    {announcementInput.date ? (() => { const [y, m, d] = announcementInput.date.split('-'); return `${d}-${m}-${y}`; })() : 'Select Date'}
                  </Text>
                </TouchableOpacity>
                )}
                {showAnnouncementDatePicker && (
                  <DateTimePicker
                    value={announcementInput.date ? new Date(announcementInput.date) : new Date()}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowAnnouncementDatePicker(false);
                      if (selectedDate) {
                        const dd = String(selectedDate.getDate()).padStart(2, '0');
                        const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
                        const yyyy = selectedDate.getFullYear();
                        setAnnouncementInput({ ...announcementInput, date: `${yyyy}-${mm}-${dd}` }); // keep storage as yyyy-mm-dd
                      }
                    }}
                  />
                )}
                {/* Optionally, icon/color pickers can be added here */}
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
                  <TouchableOpacity onPress={() => setIsAnnouncementModalVisible(false)} style={[styles.modalButton, { backgroundColor: '#ccc' }]}> 
                    <Text style={{ color: '#333', fontWeight: 'bold' }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={saveAnnouncement} style={[styles.modalButton, { backgroundColor: '#2196F3', marginLeft: 8 }]}> 
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>{editIndex !== null ? 'Save' : 'Add'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  statsGridContainer: {
    width: '100%',
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statsCol: {
    flex: 1,
    marginRight: 8,
  },
  statsFirstCol: {
    marginRight: 8,
  },
  statsSecondCol: {
    marginLeft: 8,
  },
  statsColLast: {
    marginRight: 0,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  quickAction: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionIcon: {
    fontSize: 24,
    color: '#2196F3',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
  },
  chartContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#212529',
  },
  announcementsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  announcementsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#212529',
  },
  announcementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  announcementIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  announcementText: {
    flex: 1,
    fontSize: 14,
    color: '#212529',
  },
  announcementDate: {
    fontSize: 12,
    color: '#6c757d',
  },
  addAnnouncementButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    backgroundColor: '#2196F3',
    borderRadius: 4,
    marginTop: 12,
  },
  addAnnouncementButtonText: {
    color: '#ffffff',
    marginLeft: 4,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
    color: '#212529',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 14,
  },
  modalButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  modalButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  datePickerContainer: {
    width: '100%',
    marginTop: 16,
  },
  datePickerButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  datePickerButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    textAlign: 'center',
    color: '#dc3545',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  welcomeSection: {
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 16,
    color: '#666',
  },
  statsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statCardWrapper: {
    marginRight: 16,
    width: 200,
    maxWidth: 220,
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
    marginBottom: 16,
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
  chartContainer: {
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  chart: {
    borderRadius: 12,
  },
  activitiesList: {
    marginTop: 8,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e3f2fd',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#666',
  },
  upcomingList: {
    marginTop: 8,
  },
  upcomingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  upcomingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  upcomingContent: {
    flex: 1,
  },
  upcomingTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  upcomingSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  feesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  feeSummary: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  feeSummaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  feeSummaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  feePieWrapper: {
    marginRight: 12,
    alignItems: 'center',
    width: width > 600 ? 120 : 110,
  },
  feePieScroll: {
    paddingLeft: 4,
    paddingRight: 4,
    alignItems: 'center',
  },
  pieLoadingOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 12,
  },
  announcementsList: {
    marginTop: 8,
  },
  announcementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  announcementIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  announcementContent: {
    flex: 1,
  },
  announcementText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  announcementDate: {
    fontSize: 13,
    color: '#666',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    fontSize: 15,
    backgroundColor: '#fafafa',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  statsGridContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statsCol: {
    flex: 1,
    marginHorizontal: 4,
  },
});

export default AdminDashboard;