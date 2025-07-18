import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import Header from '../../components/Header';
import StatCard from '../../components/StatCard';
import DateTimePicker from '@react-native-community/datetimepicker';
import CrossPlatformPieChart from '../../components/CrossPlatformPieChart';
import CrossPlatformBarChart from '../../components/CrossPlatformBarChart';

const { width } = Dimensions.get('window');

const AdminDashboard = ({ navigation }) => {
  // Mock data
  const stats = [
    { title: 'Total Students', value: '1,247', icon: 'people', color: '#2196F3', subtitle: '+12 this month' },
    { title: 'Total Teachers', value: '89', icon: 'person', color: '#4CAF50', subtitle: '+3 this month' },
    { title: 'Attendance Today', value: '94.2%', icon: 'checkmark-circle', color: '#FF9800', subtitle: '1,173 present' },
    { title: 'Fee Collection', value: '₹2.4M', icon: 'card', color: '#9C27B0', subtitle: '87% collected' },
  ];1.

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

  const saveAnnouncement = () => {
    if (!announcementInput.message || !announcementInput.date) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    if (editIndex !== null) {
      // Edit existing
      const updated = [...announcements];
      updated[editIndex] = announcementInput;
      setAnnouncements(updated);
    } else {
      // Add new
      setAnnouncements([{ ...announcementInput }, ...announcements]);
    }
    setIsAnnouncementModalVisible(false);
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

  const saveEvent = () => {
    if (!eventInput.title || !eventInput.date) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    if (editEventIndex !== null) {
      // Edit existing
      const updated = [...events];
      updated[editEventIndex] = { ...eventInput, id: events[editEventIndex].id };
      setEvents(updated);
    } else {
      // Add new
      setEvents([{ ...eventInput, id: Date.now() }, ...events]);
    }
    setIsEventModalVisible(false);
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
              <StatCard
                title={stats[0].title}
                value={stats[0].value}
                icon={stats[0].icon}
                color={stats[0].color}
                subtitle={stats[0].subtitle}
              />
            </View>
            <View style={styles.statsCol}>
              <StatCard
                title={stats[1].title}
                value={stats[1].value}
                icon={stats[1].icon}
                color={stats[1].color}
                subtitle={stats[1].subtitle}
              />
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statsCol}>
              <StatCard
                title={stats[2].title}
                value={stats[2].value}
                icon={stats[2].icon}
                color={stats[2].color}
                subtitle={stats[2].subtitle}
              />
            </View>
            <View style={styles.statsCol}>
              <StatCard
                title={stats[3].title}
                value={stats[3].value}
                icon={stats[3].icon}
                color={stats[3].color}
                subtitle={stats[3].subtitle}
              />
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
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
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