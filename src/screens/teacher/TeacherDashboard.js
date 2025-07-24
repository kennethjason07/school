import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import StatCard from '../../components/StatCard';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';

const screenWidth = Dimensions.get('window').width;

const DUMMY_SCHEDULE = [
  { id: '1', time: '08:00 - 09:00', subject: 'Maths', class: '5A', room: '101' },
  { id: '2', time: '09:00 - 10:00', subject: 'Science', class: '5B', room: '102' },
  { id: '3', time: '10:15 - 11:15', subject: 'English', class: '6A', room: '103' },
  { id: '4', time: '11:15 - 12:15', subject: 'Social', class: '7A', room: '104' },
];

// Helper to extract class order key
function getClassOrderKey(className) {
  if (!className) return 9999;
  if (className.startsWith('Nursery')) return 0;
  if (className.startsWith('KG')) return 1;
  // Extract numeric part
  const match = className.match(/(\d+)/);
  if (match) return 2 + Number(match[1]);
  return 9999;
}

// Group and sort schedule by class
function groupAndSortSchedule(schedule) {
  // Group by class
  const groups = {};
  schedule.forEach(item => {
    const classKey = item.class;
    if (!groups[classKey]) groups[classKey] = [];
    groups[classKey].push(item);
  });
  // Sort class keys
  const sortedClassKeys = Object.keys(groups).sort((a, b) => {
    const orderA = getClassOrderKey(a);
    const orderB = getClassOrderKey(b);
    if (orderA !== orderB) return orderA - orderB;
    // If same numeric, sort by section (A, B, ...)
    const secA = a.replace(/\d+/g, '');
    const secB = b.replace(/\d+/g, '');
    return secA.localeCompare(secB);
  });
  return sortedClassKeys.map(classKey => ({ classKey, items: groups[classKey] }));
}

// Sample/mock data for new sections
const UPCOMING_EVENTS = [
  { id: 'e1', title: 'Maths Unit Test', date: '2024-06-10', class: '5A' },
  { id: 'e2', title: 'Science Fair', date: '2024-06-12', class: 'All' },
  { id: 'e3', title: 'PTA Meeting', date: '2024-06-15', class: '6A' },
];

const CLASS_PERFORMANCE = [
  { class: '5A', avgMarks: 78, attendance: 92, topStudent: 'Amit Sharma' },
  { class: '6A', avgMarks: 84, attendance: 95, topStudent: 'Priya Singh' },
];

const MARKS_TREND = {
  '5A': {
    labels: ['FA1', 'FA2', 'SA1', 'FA3', 'SA2'],
    data: [72, 75, 80, 78, 85],
  },
  '6A': {
    labels: ['FA1', 'FA2', 'SA1', 'FA3', 'SA2'],
    data: [80, 82, 85, 87, 90],
  },
};

const RECENT_ACTIVITIES = [
  { id: 'a1', activity: 'Uploaded homework for 5A', date: '2024-06-07' },
  { id: 'a2', activity: 'Entered marks for 6A', date: '2024-06-06' },
  { id: 'a3', activity: 'Marked attendance for 5A', date: '2024-06-05' },
];

const ANNOUNCEMENTS = [
  { id: 'n1', message: 'School will remain closed on 14th June for maintenance.' },
  { id: 'n2', message: 'Annual Sports Day registrations open till 20th June.' },
];

// Sample/mock data for assigned classes and subjects
const ASSIGNED_CLASSES = [
  { class: '5A', subjects: ['Maths', 'Science'] },
  { class: '6A', subjects: ['Maths', 'English'] },
];

  const teacherStats = [
  { title: 'My Classes', value: '3', icon: 'school', color: '#1976d2', subtitle: 'This semester' },
  { title: 'My Students', value: '58', icon: 'people', color: '#388e3c', subtitle: 'Across all classes' },
  { title: 'Attendance Today', value: '94%', icon: 'checkmark-circle', color: '#ff9800', subtitle: 'Avg. today' },
  { title: 'Pending Tasks', value: '3', icon: 'document-text', color: '#9c27b0', subtitle: 'To complete' },
  ];

const teacherQuickActions = [
  { title: 'Mark Attendance', icon: 'checkmark-circle', color: '#388e3c' },
  { title: 'Enter Marks', icon: 'document-text', color: '#1976d2' },
  { title: 'Upload Homework', icon: 'cloud-upload', color: '#ff9800' },
  { title: 'Messages', icon: 'chatbubble-ellipses', color: '#9c27b0' },
];

const initialTasks = [
  { id: 't1', task: 'Mark attendance for 5A', type: 'attendance', due: '2024-06-10' },
  { id: 't2', task: 'Enter marks for 6A', type: 'marks', due: '2024-06-12' },
  { id: 't3', task: 'Upload homework for 7A', type: 'homework', due: '2024-06-15' },
];

const RECENT_NOTIFICATIONS = [
  { id: 'n1', message: 'PTA Meeting scheduled for tomorrow.', date: '2024-06-10' },
  { id: 'n2', message: 'School will be closed on 14th June for maintenance.', date: '2024-06-09' },
  { id: 'n3', message: 'Annual Sports Day registrations open till 20th June.', date: '2024-06-08' },
  ];

const ASSIGNED_STUDENTS = [
  { id: 's1', name: 'Amit Sharma', class: '5A', roll: '1' },
  { id: 's2', name: 'Priya Singh', class: '5A', roll: '2' },
  { id: 's3', name: 'Raj Patel', class: '6A', roll: '1' },
  { id: 's4', name: 'Neha Gupta', class: '6A', roll: '2' },
  { id: 's5', name: 'Rahul Kumar', class: '7A', roll: '1' },
  { id: 's6', name: 'Sneha Verma', class: '7A', roll: '2' },
];

const ANALYTICS = {
  attendanceRate: 92,
  marksDistribution: [
    { label: 'Excellent', value: 15 },
    { label: 'Good', value: 20 },
    { label: 'Average', value: 10 },
    { label: 'Poor', value: 5 },
  ],
};

// Add static admin tasks
const adminTasks = [
  { id: 'a1', task: 'Submit marks for 5A', type: 'marks', due: '2024-06-14' },
  { id: 'a2', task: 'Update attendance for 6A', type: 'attendance', due: '2024-06-13' },
  ];

const TeacherDashboard = () => {
  const [personalTasks, setPersonalTasks] = useState(initialTasks);
  const [showAddTaskBar, setShowAddTaskBar] = useState(false);
  const [newTask, setNewTask] = useState({ task: '', type: 'attendance', due: '' });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [addTaskModalVisible, setAddTaskModalVisible] = useState(false);

  function handleCompletePersonalTask(id) {
    setPersonalTasks(tasks => tasks.filter(t => t.id !== id));
  }
  function handleAddTask() {
    if (!newTask.task || !newTask.due) {
      Alert.alert('Missing Fields', 'Please enter both a task description and due date.');
      return;
    }
    setPersonalTasks(tasks => [
      { ...newTask, id: 't' + (Date.now()), type: newTask.type },
      ...tasks,
    ]);
    setNewTask({ task: '', type: 'attendance', due: '' });
    setAddTaskModalVisible(false);
  }
  // For demo, allow marking admin tasks as complete (local only)
  const [adminTaskList, setAdminTaskList] = useState(adminTasks);
  function handleCompleteAdminTask(id) {
    setAdminTaskList(tasks => tasks.filter(t => t.id !== id));
  }

  const renderScheduleItem = ({ item }) => (
    <View style={styles.scheduleCard}>
      <View style={styles.scheduleTimeBox}>
        <Ionicons name="time" size={18} color="#1976d2" style={{ marginRight: 6 }} />
        <Text style={styles.scheduleTime}>{item.time}</Text>
      </View>
      <Text style={styles.scheduleSubject}>{item.subject}</Text>
      <Text style={styles.scheduleClass}>Class: {item.class}</Text>
      <Text style={styles.scheduleRoom}>Room: {item.room}</Text>
    </View>
  );

  const groupedSchedule = groupAndSortSchedule(DUMMY_SCHEDULE);

  // Add helper for avatar initials
  function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }

  return (
    <View style={styles.container}>
      <Header title="Teacher Dashboard" />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Welcome Section at the very top */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Welcome back, Teacher!</Text>
          <Text style={styles.dateText}>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
        </View>
        {/* Stats Cards - 2x2 grid below welcome */}
        <View style={styles.statsGridContainer}>
          <View style={styles.statsRow}>
            <View style={styles.statsCol}><StatCard {...teacherStats[0]} /></View>
            <View style={styles.statsCol}><StatCard {...teacherStats[1]} /></View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statsCol}><StatCard {...teacherStats[2]} /></View>
            <View style={styles.statsCol}><StatCard {...teacherStats[3]} /></View>
          </View>
        </View>
        {/* Today's Schedule below stats */}
        <View style={styles.section}>
          <View style={styles.sectionTitleAccent} />
          <Text style={styles.sectionTitle}>Today's Schedule & Upcoming Classes</Text>
          <View style={{ marginHorizontal: 4, marginTop: 8 }}>
            {groupedSchedule.map(group => (
              <View key={group.classKey} style={{ marginBottom: 8 }}>
                <Text style={{ fontWeight: 'bold', fontSize: 15, color: '#1976d2', marginBottom: 4, marginLeft: 4 }}>
                  Class: {group.classKey}
                </Text>
                {group.items.map(item => (
                  <View key={item.id} style={{ backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', elevation: 2, shadowColor: '#1976d2', shadowOpacity: 0.08, shadowRadius: 4 }}>
                    <View style={{ backgroundColor: '#e3f2fd', borderRadius: 20, width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      <Ionicons name="time" size={20} color="#1976d2" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#333', fontWeight: 'bold', fontSize: 15 }}>{item.subject}</Text>
                      <Text style={{ color: '#888', fontSize: 13 }}>{item.time}  |  Room: {item.room}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </View>
        {/* Pending Tasks */}
        <View style={styles.section}>
          <View style={styles.sectionTitleAccent} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="time" size={22} color="#1976d2" style={{ marginRight: 8 }} />
              <Text style={[styles.sectionTitle, { marginTop: 0, marginBottom: 0, paddingLeft: 0 }]}>Pending Tasks</Text>
            </View>
            <TouchableOpacity
              onPress={() => setAddTaskModalVisible(true)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#1976d2',
                borderRadius: 24,
                paddingHorizontal: 18,
                paddingVertical: 10,
                elevation: 3,
                shadowColor: '#1976d2',
                shadowOpacity: 0.12,
                shadowRadius: 6,
                marginLeft: 24,
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={22} color="#fff" style={{ marginRight: 6 }} />
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Add Task</Text>
            </TouchableOpacity>
          </View>
          {/* Tasks from Admin */}
          <Text style={{ fontWeight: 'bold', color: '#1976d2', fontSize: 16, marginBottom: 6, marginLeft: 2 }}>Tasks from Admin</Text>
          <View style={{ marginHorizontal: 12, marginBottom: 12, marginTop: 2 }}>
            {adminTaskList.length === 0 && (
              <Text style={{ color: '#888', fontStyle: 'italic', textAlign: 'center', marginVertical: 8 }}>No admin tasks!</Text>
            )}
            {adminTaskList.map(task => (
              <View key={task.id} style={{ backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, elevation: 2, flexDirection: 'row', alignItems: 'center', shadowColor: '#1976d2', shadowOpacity: 0.08, shadowRadius: 4 }}>
                <View style={{ backgroundColor: task.type === 'attendance' ? '#388e3c' : task.type === 'marks' ? '#1976d2' : '#ff9800', borderRadius: 20, width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <Ionicons name={task.type === 'attendance' ? 'checkmark-circle' : task.type === 'marks' ? 'document-text' : 'cloud-upload'} size={20} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#333', fontWeight: 'bold', fontSize: 15 }}>{task.task}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                    <Ionicons name="calendar" size={14} color="#888" style={{ marginRight: 4 }} />
                    <Text style={{ color: '#888', fontSize: 13 }}>Due: {task.due}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => handleCompleteAdminTask(task.id)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#4CAF50',
                    borderRadius: 24,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    elevation: 2,
                    shadowColor: '#4CAF50',
                    shadowOpacity: 0.10,
                    shadowRadius: 4,
                    marginLeft: 8,
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="checkmark" size={20} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>Complete</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
          {/* Personal Tasks */}
          <Text style={{ fontWeight: 'bold', color: '#1976d2', fontSize: 16, marginBottom: 6, marginLeft: 2 }}>Personal Tasks</Text>
          {/* Inline Add Task Bar */}
          {/* This section is now redundant as the modal is rendered outside */}
          {/* {addTaskModalVisible && (
            <View style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.18)',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000
            }}>
              <View style={{
                backgroundColor: '#fff',
                borderRadius: 14,
                padding: 20,
                width: '85%',
                elevation: 4,
                maxWidth: 400,
              }}>
                <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>Add New Task</Text>
                <TextInput
                  placeholder="Task description"
                  value={newTask.task}
                  onChangeText={text => setNewTask(t => ({ ...t, task: text }))}
                  style={{ borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, padding: 10, marginBottom: 10, fontSize: 15 }}
                />
                <View style={{ flexDirection: 'row', marginBottom: 10 }}>
                  <TouchableOpacity onPress={() => setNewTask(t => ({ ...t, type: 'attendance' }))} style={{ backgroundColor: newTask.type === 'attendance' ? '#388e3c' : '#eee', borderRadius: 8, padding: 8, marginRight: 8 }}>
                    <Ionicons name="checkmark-circle" size={18} color={newTask.type === 'attendance' ? '#fff' : '#888'} />
                    <Text style={{ color: newTask.type === 'attendance' ? '#fff' : '#333', marginLeft: 4 }}>Attendance</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setNewTask(t => ({ ...t, type: 'marks' }))} style={{ backgroundColor: newTask.type === 'marks' ? '#1976d2' : '#eee', borderRadius: 8, padding: 8, marginRight: 8 }}>
                    <Ionicons name="document-text" size={18} color={newTask.type === 'marks' ? '#fff' : '#888'} />
                    <Text style={{ color: newTask.type === 'marks' ? '#fff' : '#333', marginLeft: 4 }}>Marks</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setNewTask(t => ({ ...t, type: 'homework' }))} style={{ backgroundColor: newTask.type === 'homework' ? '#ff9800' : '#eee', borderRadius: 8, padding: 8 }}>
                    <Ionicons name="cloud-upload" size={18} color={newTask.type === 'homework' ? '#fff' : '#888'} />
                    <Text style={{ color: newTask.type === 'homework' ? '#fff' : '#333', marginLeft: 4 }}>Homework</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  style={{
                    borderWidth: 1,
                    borderColor: '#e0e0e0',
                    borderRadius: 8,
                    padding: 10,
                    marginBottom: 10,
                    fontSize: 15,
                    backgroundColor: '#fafafa',
                  }}
                >
                  <Text style={{ color: newTask.due ? '#333' : '#aaa', fontSize: 15 }}>
                    {newTask.due ? newTask.due : 'Select Due Date'}
                  </Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={newTask.due ? new Date(newTask.due) : new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) {
                        const yyyy = selectedDate.getFullYear();
                        const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
                        const dd = String(selectedDate.getDate()).padStart(2, '0');
                        setNewTask(t => ({ ...t, due: `${yyyy}-${mm}-${dd}` }));
                      }
                    }}
                  />
                )}
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
                  <TouchableOpacity
                    onPress={() => { setAddTaskModalVisible(false); setNewTask({ task: '', type: 'attendance', due: '' }); }}
                    style={{
                      backgroundColor: '#aaa',
                      borderRadius: 24,
                      paddingHorizontal: 20,
                      paddingVertical: 10,
                      marginRight: 10,
                      elevation: 2,
                      shadowColor: '#aaa',
                      shadowOpacity: 0.10,
                      shadowRadius: 4,
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleAddTask}
                    style={{
                      backgroundColor: '#1976d2',
                      borderRadius: 24,
                      paddingHorizontal: 20,
                      paddingVertical: 10,
                      elevation: 2,
                      shadowColor: '#1976d2',
                      shadowOpacity: 0.10,
                      shadowRadius: 4,
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Add</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )} */}
          <View style={{ marginHorizontal: 12, marginBottom: 18, marginTop: 2 }}>
            {personalTasks.length === 0 && (
              <Text style={{ color: '#888', fontStyle: 'italic', textAlign: 'center', marginVertical: 8 }}>No personal tasks!</Text>
            )}
            {personalTasks.map(task => (
              <View key={task.id} style={{ backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, elevation: 2, flexDirection: 'row', alignItems: 'center', shadowColor: '#1976d2', shadowOpacity: 0.08, shadowRadius: 4 }}>
                <View style={{ backgroundColor: task.type === 'attendance' ? '#388e3c' : task.type === 'marks' ? '#1976d2' : '#ff9800', borderRadius: 20, width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <Ionicons name={task.type === 'attendance' ? 'checkmark-circle' : task.type === 'marks' ? 'document-text' : 'cloud-upload'} size={20} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#333', fontWeight: 'bold', fontSize: 15 }}>{task.task}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                    <Ionicons name="calendar" size={14} color="#888" style={{ marginRight: 4 }} />
                    <Text style={{ color: '#888', fontSize: 13 }}>Due: {task.due}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => handleCompletePersonalTask(task.id)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#4CAF50',
                    borderRadius: 24,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    elevation: 2,
                    shadowColor: '#4CAF50',
                    shadowOpacity: 0.10,
                    shadowRadius: 4,
                    marginLeft: 8,
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="checkmark" size={20} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>Complete</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
        {/* Recent Notifications and Messages */}
        <View style={styles.section}>
          <View style={styles.sectionTitleAccent} />
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, paddingLeft: 18 }}>
            <Ionicons name="notifications" size={22} color="#1976d2" style={{ marginRight: 8 }} />
            <Text style={[styles.sectionTitle, { marginTop: 0, marginBottom: 0, paddingLeft: 0 }]}>Recent Notifications & Messages</Text>
          </View>
          <View style={{ marginHorizontal: 12, marginBottom: 18 }}>
            {RECENT_NOTIFICATIONS.map(note => (
              <View key={note.id} style={{ backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, elevation: 2, shadowColor: '#1976d2', shadowOpacity: 0.08, shadowRadius: 4 }}>
                <Text style={{ color: '#1976d2', fontWeight: 'bold', fontSize: 15 }}>{note.message}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                  <Ionicons name="calendar" size={14} color="#888" style={{ marginRight: 4 }} />
                  <Text style={{ color: '#888', fontSize: 13 }}>{note.date}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
        {/* Analytics */}
        <View style={styles.section}>
          <View style={styles.sectionTitleAccent} />
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="analytics" size={22} color="#1976d2" style={{ marginLeft: 4, marginRight: 8 }} />
            <Text style={styles.sectionTitle}>Analytics</Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: 8, marginBottom: 18 }}>
            <View style={{ borderRadius: 14, padding: 18, margin: 6, minWidth: 160, flex: 1, elevation: 2, shadowColor: '#388e3c', shadowOpacity: 0.08, shadowRadius: 4 }}>
              <Text style={{ fontWeight: 'bold', color: '#388e3c', fontSize: 16 }}>Attendance Rate</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                <Ionicons name="checkmark-circle" size={22} color="#388e3c" style={{ marginRight: 6 }} />
                <Text style={{ color: '#1976d2', fontSize: 26, fontWeight: 'bold' }}>{ANALYTICS.attendanceRate}%</Text>
              </View>
              <View style={{ height: 6, backgroundColor: '#e0e0e0', borderRadius: 3, marginTop: 10 }}>
                <View style={{ width: `${ANALYTICS.attendanceRate}%`, height: 6, backgroundColor: '#388e3c', borderRadius: 3 }} />
              </View>
            </View>
            <View style={{ borderRadius: 14, padding: 18, margin: 6, minWidth: 160, flex: 1, elevation: 2, shadowColor: '#ff9800', shadowOpacity: 0.08, shadowRadius: 4 }}>
              <Text style={{ fontWeight: 'bold', color: '#ff9800', fontSize: 16 }}>Marks Distribution</Text>
              {ANALYTICS.marksDistribution.map(dist => (
                <View key={dist.label} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: '#ff9800', marginRight: 6 }} />
                  <Text style={{ color: '#333', fontSize: 15 }}>{dist.label}: {dist.value}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
        {/* Assigned Classes & Subjects Summary */}
        <View style={styles.section}>
          <View style={styles.sectionTitleAccent} />
          <Text style={styles.sectionTitle}>Assigned Classes & Subjects</Text>
          <View style={{ marginHorizontal: 12, marginBottom: 12 }}>
            {ASSIGNED_CLASSES.map(cls => (
              <View key={cls.class} style={{ backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 8, elevation: 1 }}>
                <Text style={{ fontWeight: 'bold', color: '#388e3c', fontSize: 15, marginBottom: 4 }}>Class {cls.class}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {cls.subjects.map(subj => (
                    <View key={subj} style={{ backgroundColor: '#e3f2fd', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginRight: 8, marginBottom: 6 }}>
                      <Text style={{ color: '#1976d2', fontWeight: 'bold' }}>{subj}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        </View>
        {/* Upcoming Events */}
        <View style={styles.section}>
          <View style={styles.sectionTitleAccent} />
          <Text style={styles.sectionTitle}>Upcoming Events</Text>
          <View style={{ marginHorizontal: 12, marginBottom: 12 }}>
            {UPCOMING_EVENTS.map(event => (
              <View key={event.id} style={{ backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 8, elevation: 1 }}>
                <Text style={{ fontWeight: 'bold', color: '#1976d2', fontSize: 15 }}>{event.title}</Text>
                <Text style={{ color: '#555', marginTop: 2 }}>Date: {event.date} {event.class !== 'All' ? `| Class: ${event.class}` : ''}</Text>
              </View>
            ))}
          </View>
        </View>
        {/* Class Performance */}
        <View style={styles.section}>
          <View style={styles.sectionTitleAccent} />
          <Text style={styles.sectionTitle}>Class Performance</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: 8, marginBottom: 12 }}>
            {CLASS_PERFORMANCE.map(perf => (
              <View key={perf.class} style={{ backgroundColor: '#e3f2fd', borderRadius: 10, padding: 14, margin: 6, minWidth: 150, flex: 1 }}>
                <Text style={{ fontWeight: 'bold', color: '#1976d2', fontSize: 15 }}>Class {perf.class}</Text>
                <Text style={{ color: '#388e3c', marginTop: 2 }}>Avg. Marks: {perf.avgMarks}</Text>
                <Text style={{ color: '#ff9800', marginTop: 2 }}>Attendance: {perf.attendance}%</Text>
                <Text style={{ color: '#9c27b0', marginTop: 2 }}>Top: {perf.topStudent}</Text>
              </View>
            ))}
          </View>
        </View>
        {/* Marks Trend per Class */}
        <View style={styles.section}>
          <View style={styles.sectionTitleAccent} />
          <Text style={styles.sectionTitle}>Marks Trend per Class</Text>
          {Object.entries(MARKS_TREND).map(([cls, trend]) => (
            <View key={cls} style={{ backgroundColor: '#fff', borderRadius: 10, padding: 10, marginHorizontal: 12, marginBottom: 14, elevation: 1 }}>
              <Text style={{ fontWeight: 'bold', color: '#1976d2', fontSize: 15, marginBottom: 4 }}>Class {cls}</Text>
              <LineChart
                data={{
                  labels: trend.labels,
                  datasets: [{ data: trend.data }],
                }}
                width={screenWidth - 48}
                height={160}
                chartConfig={{
                  backgroundColor: '#fff',
                  backgroundGradientFrom: '#fff',
                  backgroundGradientTo: '#fff',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0,0,0,${opacity})`,
                  style: { borderRadius: 8 },
                  propsForDots: { r: '4', strokeWidth: '2', stroke: '#1976d2' },
                }}
                bezier
                style={{ borderRadius: 8 }}
              />
            </View>
          ))}
        </View>
        {/* Recent Activities */}
        <View style={styles.section}>
          <View style={styles.sectionTitleAccent} />
          <Text style={styles.sectionTitle}>Recent Activities</Text>
          <View style={{ marginHorizontal: 12, marginBottom: 12 }}>
            {RECENT_ACTIVITIES.map(act => (
              <View key={act.id} style={{ backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 8, elevation: 1 }}>
                <Text style={{ color: '#333', fontWeight: 'bold' }}>{act.activity}</Text>
                <Text style={{ color: '#888', marginTop: 2, fontSize: 13 }}>{act.date}</Text>
              </View>
            ))}
                </View>
                </View>
        {/* Announcements */}
        <View style={styles.section}>
          <View style={styles.sectionTitleAccent} />
          <Text style={styles.sectionTitle}>Announcements</Text>
          <View style={{ marginHorizontal: 12, marginBottom: 18 }}>
            {ANNOUNCEMENTS.map(ann => (
              <View key={ann.id} style={{ backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 8, elevation: 1 }}>
                <Text style={{ color: '#1976d2', fontWeight: 'bold' }}>{ann.message}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
      {/* Add Task Modal rendered outside the ScrollView for proper centering */}
      {addTaskModalVisible && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.18)',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 14,
            padding: 20,
            width: '85%',
            elevation: 4,
            maxWidth: 400,
          }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>Add New Task</Text>
            <TextInput
              placeholder="Task description"
              value={newTask.task}
              onChangeText={text => setNewTask(t => ({ ...t, task: text }))}
              style={{ borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, padding: 10, marginBottom: 10, fontSize: 15 }}
            />
            <View style={{ flexDirection: 'row', marginBottom: 10 }}>
              <TouchableOpacity onPress={() => setNewTask(t => ({ ...t, type: 'attendance' }))} style={{ backgroundColor: newTask.type === 'attendance' ? '#388e3c' : '#eee', borderRadius: 8, padding: 8, marginRight: 8 }}>
                <Ionicons name="checkmark-circle" size={18} color={newTask.type === 'attendance' ? '#fff' : '#888'} />
                <Text style={{ color: newTask.type === 'attendance' ? '#fff' : '#333', marginLeft: 4 }}>Attendance</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setNewTask(t => ({ ...t, type: 'marks' }))} style={{ backgroundColor: newTask.type === 'marks' ? '#1976d2' : '#eee', borderRadius: 8, padding: 8, marginRight: 8 }}>
                <Ionicons name="document-text" size={18} color={newTask.type === 'marks' ? '#fff' : '#888'} />
                <Text style={{ color: newTask.type === 'marks' ? '#fff' : '#333', marginLeft: 4 }}>Marks</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setNewTask(t => ({ ...t, type: 'homework' }))} style={{ backgroundColor: newTask.type === 'homework' ? '#ff9800' : '#eee', borderRadius: 8, padding: 8 }}>
                <Ionicons name="cloud-upload" size={18} color={newTask.type === 'homework' ? '#fff' : '#888'} />
                <Text style={{ color: newTask.type === 'homework' ? '#fff' : '#333', marginLeft: 4 }}>Homework</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={{
                borderWidth: 1,
                borderColor: '#e0e0e0',
                borderRadius: 8,
                padding: 10,
                marginBottom: 10,
                fontSize: 15,
                backgroundColor: '#fafafa',
              }}
            >
              <Text style={{ color: newTask.due ? '#333' : '#aaa', fontSize: 15 }}>
                {newTask.due ? newTask.due : 'Select Due Date'}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={newTask.due ? new Date(newTask.due) : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    const yyyy = selectedDate.getFullYear();
                    const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
                    const dd = String(selectedDate.getDate()).padStart(2, '0');
                    setNewTask(t => ({ ...t, due: `${yyyy}-${mm}-${dd}` }));
                  }
                }}
              />
            )}
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
              <TouchableOpacity
                onPress={() => { setAddTaskModalVisible(false); setNewTask({ task: '', type: 'attendance', due: '' }); }}
                style={{
                  backgroundColor: '#aaa',
                  borderRadius: 24,
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  marginRight: 10,
                  elevation: 2,
                  shadowColor: '#aaa',
                  shadowOpacity: 0.10,
                  shadowRadius: 4,
                }}
                activeOpacity={0.8}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddTask}
                style={{
                  backgroundColor: '#1976d2',
                  borderRadius: 24,
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  elevation: 2,
                  shadowColor: '#1976d2',
                  shadowOpacity: 0.10,
                  shadowRadius: 4,
                }}
                activeOpacity={0.8}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Add</Text>
              </TouchableOpacity>
            </View>
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
  welcomeSection: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  dateText: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  statsGridContainer: {
    paddingHorizontal: 8,
    marginBottom: 18,
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
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  quickActionCard: {
    width: '45%', // Adjust as needed for 2 columns
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  // Enhanced section title style
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 8,
    marginBottom: 18,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1976d2',
    marginTop: 22,
    marginBottom: 10,
    marginLeft: 0,
    paddingLeft: 18,
    position: 'relative',
  },
  sectionTitleAccent: {
    position: 'absolute',
    left: 0,
    top: '50%',
    width: 6,
    height: 28,
    backgroundColor: '#1976d2',
    borderRadius: 3,
    transform: [{ translateY: -14 }],
  },
  scheduleCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginRight: 14,
    minWidth: 170,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    alignItems: 'flex-start',
  },
  scheduleTimeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  scheduleTime: {
    fontSize: 15,
    color: '#1976d2',
    fontWeight: 'bold',
  },
  scheduleSubject: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  scheduleClass: {
    fontSize: 14,
    color: '#555',
    marginBottom: 2,
  },
  scheduleRoom: {
    fontSize: 13,
    color: '#888',
  },
});

export default TeacherDashboard; 