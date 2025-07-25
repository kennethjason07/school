import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../utils/AuthContext';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import SignupScreen from '../screens/auth/SignupScreen';

// Admin Screens
import AdminDashboard from '../screens/admin/AdminDashboard';
import ManageClasses from '../screens/admin/ManageClasses';
import ManageStudents from '../screens/admin/ManageStudents';
import ManageTeachers from '../screens/admin/ManageTeachers';
import SubjectsTimetable from '../screens/admin/SubjectsTimetable';
import ExamsMarks from '../screens/admin/ExamsMarks';
import AttendanceManagement from '../screens/admin/AttendanceManagement';
import FeeManagement from '../screens/admin/FeeManagement';
import AnalyticsReports from '../screens/admin/AnalyticsReports';
import NotificationManagement from '../screens/admin/NotificationManagement';
import StudentDetails from '../screens/admin/StudentDetails';
import StudentList from '../screens/admin/StudentList';
import TeacherDetails from '../screens/admin/TeacherDetails';
import FeeClassDetails from '../screens/admin/FeeClassDetails';
import AssignTaskToTeacher from '../screens/admin/AssignTaskToTeacher';

// Teacher Screens
import TeacherDashboard from '../screens/teacher/TeacherDashboard';
import TakeAttendance from '../screens/teacher/TakeAttendance';
import MarksEntry from '../screens/teacher/MarksEntry';
import UploadHomework from '../screens/teacher/UploadHomework';
import ViewStudentInfo from '../screens/teacher/ViewStudentInfo';
import MarksEntryStudentsScreen from '../screens/teacher/MarksEntryStudentsScreen';
import StudentAttendanceScreen from '../screens/teacher/StudentAttendanceScreen';
import StudentMarksScreen from '../screens/teacher/StudentMarksScreen';

// Parent Screens
import ParentDashboard from '../screens/parent/ParentDashboard';
import ViewReportCard from '../screens/parent/ViewReportCard';
import AttendanceSummary from '../screens/parent/AttendanceSummary';
import FeePayment from '../screens/parent/FeePayment';
import Notifications from '../screens/parent/Notifications';
import ChatWithTeacher from '../screens/parent/ChatWithTeacher';

// Student Screens
import StudentDashboard from '../screens/student/StudentDashboard';
import ViewAssignments from '../screens/student/ViewAssignments';
import StudentAttendanceMarks from '../screens/student/StudentAttendanceMarks';
import StudentNotifications from '../screens/student/StudentNotifications';
import StudentChatWithTeacher from '../screens/student/StudentChatWithTeacher';

// Universal Screens
import ProfileScreen from '../screens/universal/ProfileScreen';
import SettingsScreen from '../screens/universal/SettingsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Loading Screen
function LoadingScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#007AFF" />
    </View>
  );
}

// Admin Tab Navigator
function AdminTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Classes') {
            iconName = focused ? 'school' : 'school-outline';
          } else if (route.name === 'Students') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Teachers') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'Reports') {
            iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Dashboard" component={AdminDashboard} />
      <Tab.Screen name="Classes" component={ManageClasses} />
      <Tab.Screen name="Students" component={ManageStudents} />
      <Tab.Screen name="Teachers" component={ManageTeachers} options={{ tabBarLabel: 'Manage Teachers' }} />
      <Tab.Screen name="Reports" component={AnalyticsReports} />
      {/* Removed StudentDetails and StudentList from Tab.Navigator */}
    </Tab.Navigator>
  );
}

// Teacher Tab Navigator
function TeacherTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Attendance') {
            iconName = focused ? 'checkmark-circle' : 'checkmark-circle-outline';
          } else if (route.name === 'Marks') {
            iconName = focused ? 'document-text' : 'document-text-outline';
          } else if (route.name === 'Homework') {
            iconName = focused ? 'library' : 'library-outline';
          } else if (route.name === 'Students') {
            iconName = focused ? 'people' : 'people-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Dashboard" component={TeacherDashboard} />
      <Tab.Screen name="Attendance" component={TakeAttendance} />
      <Tab.Screen name="Marks" component={MarksEntry} />
      <Tab.Screen name="Homework" component={UploadHomework} />
      <Tab.Screen name="Students" component={ViewStudentInfo} />
    </Tab.Navigator>
  );
}

// Parent Tab Navigator
function ParentTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Report Card') {
            iconName = focused ? 'document-text' : 'document-text-outline';
          } else if (route.name === 'Attendance') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Fees') {
            iconName = focused ? 'card' : 'card-outline';
          } else if (route.name === 'Chat') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FF9800',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Dashboard" component={ParentDashboard} />
      <Tab.Screen name="Report Card" component={ViewReportCard} />
      <Tab.Screen name="Attendance" component={AttendanceSummary} />
      <Tab.Screen name="Fees" component={FeePayment} />
      <Tab.Screen name="Chat" component={ChatWithTeacher} />
    </Tab.Navigator>
  );
}

// Student Tab Navigator
function StudentTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Assignments') {
            iconName = focused ? 'library' : 'library-outline';
          } else if (route.name === 'Marks') {
            iconName = focused ? 'document-text' : 'document-text-outline';
          } else if (route.name === 'Notifications') {
            iconName = focused ? 'notifications' : 'notifications-outline';
          } else if (route.name === 'Chat') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#9C27B0',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Dashboard" component={StudentDashboard} />
      <Tab.Screen name="Assignments" component={ViewAssignments} />
      <Tab.Screen name="Marks" component={StudentAttendanceMarks} />
      <Tab.Screen name="Notifications" component={StudentNotifications} />
      <Tab.Screen name="Chat" component={StudentChatWithTeacher} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, userType, loading } = useAuth();

  // Show loading screen while checking authentication
  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          // Auth Stack - when user is not authenticated
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          </>
        ) : (
          // Role-based Stacks - when user is authenticated
          <>
            {userType === 'admin' && (
              <>
                <Stack.Screen name="AdminTabs" component={AdminTabNavigator} />
                <Stack.Screen name="SubjectsTimetable" component={SubjectsTimetable} />
                <Stack.Screen name="AttendanceManagement" component={AttendanceManagement} />
                <Stack.Screen name="FeeManagement" component={FeeManagement} />
                <Stack.Screen name="FeeClassDetails" component={FeeClassDetails} />
                <Stack.Screen name="ExamsMarks" component={ExamsMarks} />
                <Stack.Screen name="NotificationManagement" component={NotificationManagement} />
                <Stack.Screen name="TeacherDetails" component={TeacherDetails} />
                <Stack.Screen name="AssignTaskToTeacher" component={AssignTaskToTeacher} />
              </>
            )}
            {userType === 'teacher' && (
              <>
                <Stack.Screen name="TeacherTabs" component={TeacherTabNavigator} />
                <Stack.Screen name="MarksEntryStudentsScreen" component={MarksEntryStudentsScreen} />
                <Stack.Screen name="StudentAttendanceScreen" component={StudentAttendanceScreen} />
                <Stack.Screen name="StudentMarksScreen" component={StudentMarksScreen} />
              </>
            )}
            {userType === 'parent' && (
              <>
              <Stack.Screen name="ParentTabs" component={ParentTabNavigator} />
                <Stack.Screen name="Notifications" component={Notifications} />
              </>
            )}
            {userType === 'student' && (
              <Stack.Screen name="StudentTabs" component={StudentTabNavigator} />
            )}
            
            {/* Universal Screens */}
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="StudentDetails" component={StudentDetails} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
} 