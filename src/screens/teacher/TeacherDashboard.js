import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import StatCard from '../../components/StatCard';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';
import { useAuth } from '../../utils/AuthContext';
import { supabase, TABLES } from '../../utils/supabase';

const screenWidth = Dimensions.get('window').width;

const TeacherDashboard = () => {
  const [personalTasks, setPersonalTasks] = useState([]);
  const [adminTaskList, setAdminTaskList] = useState([]);
  const [showAddTaskBar, setShowAddTaskBar] = useState(false);
  const [newTask, setNewTask] = useState({ task: '', type: 'attendance', due: '' });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [addTaskModalVisible, setAddTaskModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teacherStats, setTeacherStats] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [analytics, setAnalytics] = useState({ attendanceRate: 0, marksDistribution: [] });
  const [assignedClasses, setAssignedClasses] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [classPerformance, setClassPerformance] = useState([]);
  const [marksTrend, setMarksTrend] = useState({});
  const [recentActivities, setRecentActivities] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const { user } = useAuth();

// Helper to extract class order key
function getClassOrderKey(className) {
  if (!className) return 9999;
  if (className.startsWith('Nursery')) return 0;
  if (className.startsWith('KG')) return 1;
  const match = className.match(/(\d+)/);
  if (match) return 2 + Number(match[1]);
  return 9999;
}

// Group and sort schedule by class
function groupAndSortSchedule(schedule) {
  const groups = {};
  schedule.forEach(item => {
    const classKey = item.class;
    if (!groups[classKey]) groups[classKey] = [];
    groups[classKey].push(item);
  });
  const sortedClassKeys = Object.keys(groups).sort((a, b) => {
    const orderA = getClassOrderKey(a);
    const orderB = getClassOrderKey(b);
    if (orderA !== orderB) return orderA - orderB;
    const secA = a.replace(/\d+/g, '');
    const secB = b.replace(/\d+/g, '');
    return secA.localeCompare(secB);
  });
  return sortedClassKeys.map(classKey => ({ classKey, items: groups[classKey] }));
}

  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get teacher info
      const { data: teacherData, error: teacherError } = await supabase
        .from(TABLES.TEACHERS)
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (teacherError) throw new Error('Teacher not found');
      const teacher = teacherData;

      // Get assigned classes and subjects
      const { data: assignedSubjects, error: subjectsError } = await supabase
        .from(TABLES.TEACHER_SUBJECTS)
        .select(`
          *,
          classes(class_name, section),
          subjects(name)
        `)
        .eq('teacher_id', teacher.id);

      if (subjectsError) throw subjectsError;

      // Process assigned classes
      const classMap = {};
      assignedSubjects.forEach(subject => {
        const className = `${subject.classes?.class_name} - ${subject.classes?.section}`;
        if (className) {
          if (!classMap[className]) classMap[className] = [];
          classMap[className].push(subject.subjects?.name || 'Unknown Subject');
        }
      });
      setAssignedClasses(classMap);

      // Get today's schedule (timetable)
      const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
      const { data: timetableData, error: timetableError } = await supabase
        .from(TABLES.TIMETABLE)
        .select(`
          *,
          subjects(name),
          teachers(full_name)
        `)
        .eq('teacher_id', teacher.id)
        .eq('day_of_week', today)
        .order('start_time');

      if (timetableError) throw timetableError;
      setSchedule(timetableData || []);

      // Get notifications
      const { data: notificationsData, error: notificationsError } = await supabase
        .from(TABLES.NOTIFICATIONS)
        .select('*')
        .eq('sent_to_role', 'teacher')
        .order('created_at', { ascending: false })
        .limit(5);

      if (notificationsError) throw notificationsError;
      setNotifications(notificationsData || []);

      // Get announcements
      const { data: announcementsData, error: announcementsError } = await supabase
        .from(TABLES.NOTIFICATIONS)
        .select('*')
        .eq('type', 'announcement')
        .order('created_at', { ascending: false })
        .limit(3);

      if (announcementsError) throw announcementsError;
      setAnnouncements(announcementsData || []);

      // Get upcoming events (using notifications as events for demo)
      const { data: eventsData, error: eventsError } = await supabase
        .from(TABLES.NOTIFICATIONS)
        .select('*')
        .eq('type', 'event')
        .order('created_at', { ascending: false })
        .limit(3);

      if (eventsError) throw eventsError;
      setUpcomingEvents(eventsData || []);

      // Get tasks (using notifications as tasks for demo)
      const { data: adminTasksData, error: adminTasksError } = await supabase
        .from(TABLES.NOTIFICATIONS)
        .select('*')
        .eq('type', 'task')
        .eq('sent_to_role', 'teacher')
        .order('created_at', { ascending: false })
        .limit(5);

      if (adminTasksError) throw adminTasksError;
      setAdminTaskList(adminTasksData || []);

      // Get personal tasks (using notifications as personal tasks for demo)
      const { data: personalTasksData, error: personalTasksError } = await supabase
        .from(TABLES.NOTIFICATIONS)
        .select('*')
        .eq('type', 'personal_task')
        .eq('sent_to_role', 'teacher')
        .order('created_at', { ascending: false })
        .limit(5);

      if (personalTasksError) throw personalTasksError;
      setPersonalTasks(personalTasksData || []);

      // Calculate analytics
      let totalAttendance = 0, totalDays = 0;
      const marksDist = { Excellent: 0, Good: 0, Average: 0, Poor: 0 };
      const perfArr = [];
      const marksTrendObj = {};

      for (const className of Object.keys(classMap)) {
        // Get students for this class
        const { data: studentsData } = await supabase
          .from(TABLES.STUDENTS)
          .select('id, full_name, roll_no')
          .eq('class_name', className);

        if (studentsData && studentsData.length > 0) {
          let classAttendance = 0, classDays = 0, classMarksSum = 0, classMarksCount = 0;
          const trendLabels = [], trendData = [];

          for (const student of studentsData) {
            // Get attendance for this student
            const { data: attendanceData } = await supabase
              .from(TABLES.STUDENT_ATTENDANCE)
              .select('*')
              .eq('student_id', student.id);

            if (attendanceData) {
              classAttendance += attendanceData.filter(a => a.status === 'Present').length;
              classDays += attendanceData.length;
            }

            // Get marks for this student
            const { data: marksData } = await supabase
              .from(TABLES.MARKS)
              .select('*')
              .eq('student_id', student.id);

            if (marksData) {
              marksData.forEach(m => {
                classMarksSum += m.marks_obtained || 0;
                classMarksCount++;
                
                // Distribution
                if (m.marks_obtained >= 90) marksDist.Excellent++;
                else if (m.marks_obtained >= 75) marksDist.Good++;
                else if (m.marks_obtained >= 50) marksDist.Average++;
                else marksDist.Poor++;
                
                // Trend
                if (!trendLabels.includes(m.exam_name)) trendLabels.push(m.exam_name);
              });
            }
          }

          const avgMarks = classMarksCount ? Math.round(classMarksSum / classMarksCount) : 0;
          const attendancePct = classDays ? Math.round((classAttendance / classDays) * 100) : 0;
          
          perfArr.push({ 
            class: className, 
            avgMarks, 
            attendance: attendancePct, 
            topStudent: studentsData[0]?.full_name || 'N/A' 
          });
          
          marksTrendObj[className] = { labels: trendLabels, data: trendData };
          totalAttendance += classAttendance;
          totalDays += classDays;
        }
      }

      setAnalytics({ 
        attendanceRate: totalDays ? Math.round((totalAttendance / totalDays) * 100) : 0, 
        marksDistribution: Object.entries(marksDist).map(([label, value]) => ({ label, value })) 
      });
      setClassPerformance(perfArr);
      setMarksTrend(marksTrendObj);

      // Recent activities
      const recentActivities = [
        ...(notificationsData || []).slice(0, 3).map(n => ({ 
          activity: n.message, 
          date: n.created_at,
          id: n.id 
        })),
        ...(adminTasksData || []).slice(0, 2).map(t => ({ 
          activity: t.message, 
          date: t.created_at,
          id: t.id 
        }))
      ];
      setRecentActivities(recentActivities);

      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
      console.error('Error fetching dashboard data:', err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Set up real-time subscriptions for dashboard updates
    const dashboardSubscription = supabase
      .channel('dashboard-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: TABLES.NOTIFICATIONS
      }, () => {
        // Refresh dashboard data when notifications change
        fetchDashboardData();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: TABLES.STUDENT_ATTENDANCE
      }, () => {
        // Refresh analytics when attendance changes
        fetchDashboardData();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: TABLES.MARKS
      }, () => {
        // Refresh analytics when marks change
        fetchDashboardData();
      })
      .subscribe();

    return () => {
      dashboardSubscription.unsubscribe();
    };
  }, []);

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
  function handleCompleteAdminTask(id) {
    setAdminTaskList(tasks => tasks.filter(t => t.id !== id));
  }

  const groupedSchedule = groupAndSortSchedule(schedule);

  function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Teacher Dashboard" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#1976d2" />
          <Text style={{ marginTop: 10, color: '#1976d2' }}>Loading dashboard...</Text>
        </View>
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.container}>
        <Header title="Teacher Dashboard" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#d32f2f', fontSize: 16, marginBottom: 20 }}>Error: {error}</Text>
          <TouchableOpacity style={{ backgroundColor: '#1976d2', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 }} onPress={fetchDashboardData}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
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
            {notifications.map(note => (
              <View key={note.id} style={{ backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, elevation: 2, shadowColor: '#1976d2', shadowOpacity: 0.08, shadowRadius: 4 }}>
                <Text style={{ color: '#1976d2', fontWeight: 'bold', fontSize: 15 }}>{note.message}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                  <Ionicons name="calendar" size={14} color="#888" style={{ marginRight: 4 }} />
                  <Text style={{ color: '#888', fontSize: 13 }}>{note.created_at}</Text>
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
                <Text style={{ color: '#1976d2', fontSize: 26, fontWeight: 'bold' }}>{analytics.attendanceRate}%</Text>
              </View>
              <View style={{ height: 6, backgroundColor: '#e0e0e0', borderRadius: 3, marginTop: 10 }}>
                <View style={{ width: `${analytics.attendanceRate}%`, height: 6, backgroundColor: '#388e3c', borderRadius: 3 }} />
              </View>
            </View>
            <View style={{ borderRadius: 14, padding: 18, margin: 6, minWidth: 160, flex: 1, elevation: 2, shadowColor: '#ff9800', shadowOpacity: 0.08, shadowRadius: 4 }}>
              <Text style={{ fontWeight: 'bold', color: '#ff9800', fontSize: 16 }}>Marks Distribution</Text>
              {analytics.marksDistribution.map(dist => (
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
            {Object.entries(assignedClasses).map(([className, subjects]) => (
              <View key={className} style={{ backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 8, elevation: 1 }}>
                <Text style={{ fontWeight: 'bold', color: '#388e3c', fontSize: 15, marginBottom: 4 }}>Class {className}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {subjects.map(subject => (
                    <View key={subject} style={{ backgroundColor: '#e3f2fd', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginRight: 8, marginBottom: 6 }}>
                      <Text style={{ color: '#1976d2', fontWeight: 'bold' }}>{subject}</Text>
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
            {upcomingEvents.map(event => (
              <View key={event.id} style={{ backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 8, elevation: 1 }}>
                <Text style={{ fontWeight: 'bold', color: '#1976d2', fontSize: 15 }}>{event.message}</Text>
                <Text style={{ color: '#555', marginTop: 2 }}>Date: {event.created_at} {event.class !== 'All' ? `| Class: ${event.class}` : ''}</Text>
              </View>
            ))}
          </View>
        </View>
        {/* Class Performance */}
        <View style={styles.section}>
          <View style={styles.sectionTitleAccent} />
          <Text style={styles.sectionTitle}>Class Performance</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: 8, marginBottom: 12 }}>
            {classPerformance.map(perf => (
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
          {Object.entries(marksTrend).map(([cls, trend]) => (
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
            {recentActivities.map(act => (
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
            {announcements.map(ann => (
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