import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';

const mockSummary = [
  { key: 'assignments', label: 'Assignments', value: 5, icon: 'book', color: '#1976d2' },
  { key: 'attendance', label: 'Attendance', value: '94%', icon: 'checkmark-circle', color: '#388e3c' },
  { key: 'marks', label: 'Marks', value: '88%', icon: 'bar-chart', color: '#ff9800' },
  { key: 'notifications', label: 'Notifications', value: 3, icon: 'notifications', color: '#9c27b0' },
];

const mockDeadlines = [
  { id: '1', title: 'Math Assignment Due', date: '2024-07-10' },
  { id: '2', title: 'Science Project Submission', date: '2024-07-12' },
  { id: '3', title: 'English Essay', date: '2024-07-15' },
];

const mockNotifications = [
  { id: 'n1', message: 'New assignment posted in Science.', date: '2024-07-05' },
  { id: 'n2', message: 'PTM scheduled for 12th July.', date: '2024-07-04' },
  { id: 'n3', message: 'Your attendance for June: 94%.', date: '2024-07-01' },
];

const studentProfile = {
  name: 'Emma Johnson',
  class: '5A',
  roll: '15',
  avatarColor: '#9C27B0',
};

// Combine deadlines and notifications into a single list with section headers
const combinedData = [
  { type: 'section', title: 'Upcoming Deadlines & Events' },
  ...mockDeadlines.map(item => ({ ...item, type: 'deadline' })),
  { type: 'section', title: 'Recent Notifications' },
  ...mockNotifications.map(item => ({ ...item, type: 'notification' })),
];

const StudentDashboard = ({ navigation }) => {
  const renderItem = ({ item }) => {
    if (item.type === 'section') {
      return <Text style={styles.sectionTitle}>{item.title}</Text>;
    }
    if (item.type === 'deadline') {
      return (
        <View style={styles.deadlineRow}>
          <Ionicons name="calendar" size={18} color="#1976d2" style={{ marginRight: 8 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.deadlineTitle}>{item.title}</Text>
            <Text style={styles.deadlineDate}>{item.date}</Text>
      </View>
    </View>
  );
    }
    if (item.type === 'notification') {
      return (
        <View style={styles.notificationRow}>
          <Ionicons name="notifications" size={18} color="#9c27b0" style={{ marginRight: 8 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.notificationMsg}>{item.message}</Text>
            <Text style={styles.notificationDate}>{item.date}</Text>
      </View>
    </View>
  );
    }
    return null;
  };

  const ListHeaderComponent = (
    <>
      <Header title="Student Dashboard" />
      {/* Student Profile */}
      <View style={styles.profileSection}>
        <View style={[styles.avatar, { backgroundColor: studentProfile.avatarColor }]}>
          <Text style={styles.avatarText}>{studentProfile.name.split(' ').map(n => n[0]).join('').toUpperCase()}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{studentProfile.name}</Text>
          <Text style={styles.profileDetails}>Class {studentProfile.class} • Roll No: {studentProfile.roll}</Text>
        </View>
          </View>
      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        {mockSummary.map(card => (
          <View key={card.key} style={[styles.summaryCard, { backgroundColor: card.color + '11', borderColor: card.color }]}> 
            <Ionicons name={card.icon} size={28} color={card.color} style={{ marginBottom: 6 }} />
            <Text style={styles.summaryValue}>{card.value}</Text>
            <Text style={styles.summaryLabel}>{card.label}</Text>
          </View>
        ))}
              </View>
    </>
  );

  return (
    <View style={styles.container}>
          <FlatList
        data={combinedData}
        renderItem={renderItem}
        keyExtractor={(item, index) => item.id ? item.id : item.title + index}
        ListHeaderComponent={ListHeaderComponent}
        contentContainerStyle={styles.scrollView}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scrollView: { padding: 16, paddingBottom: 40 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 6,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    backgroundColor: '#f8f8f8',
    marginBottom: 2,
  },
  summaryValue: { fontSize: 22, fontWeight: 'bold', color: '#222' },
  summaryLabel: { fontSize: 14, color: '#555', marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1976d2', marginBottom: 8, marginTop: 10 },
  deadlineRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 8, elevation: 1 },
  deadlineTitle: { fontSize: 15, color: '#333', fontWeight: 'bold' },
  deadlineDate: { fontSize: 13, color: '#888' },
  notificationRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 8, elevation: 1 },
  notificationMsg: { fontSize: 14, color: '#333' },
  notificationDate: { fontSize: 12, color: '#888' },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    marginTop: 8,
    paddingHorizontal: 8,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  profileDetails: {
    fontSize: 15,
    color: '#666',
    marginTop: 2,
  },
});

export default StudentDashboard; 