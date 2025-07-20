import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
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

const quickLinks = [
  { key: 'assignments', label: 'Assignments', icon: 'book', color: '#1976d2' },
  { key: 'attendance', label: 'Attendance', icon: 'checkmark-circle', color: '#388e3c' },
  { key: 'marks', label: 'Marks', icon: 'bar-chart', color: '#ff9800' },
  { key: 'chat', label: 'Chat', icon: 'chatbubbles', color: '#9c27b0' },
];

const studentProfile = {
  name: 'Emma Johnson',
  class: '5A',
  roll: '15',
  avatarColor: '#9C27B0',
};

const StudentDashboard = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Header title="Student Dashboard" />
      <ScrollView contentContainerStyle={styles.scrollView} showsVerticalScrollIndicator={false}>
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
          {mockSummary.map(card => {
            const [pressed, setPressed] = useState(false);
            return (
              <TouchableOpacity
                key={card.key}
                style={[
                  styles.summaryCard,
                  { backgroundColor: card.color + '11', borderColor: card.color },
                  pressed && styles.summaryCardPressed,
                ]}
                activeOpacity={0.85}
                onPressIn={() => setPressed(true)}
                onPressOut={() => setPressed(false)}
              >
                <Ionicons name={card.icon} size={28} color={card.color} style={{ marginBottom: 6 }} />
                <Text style={styles.summaryValue}>{card.value}</Text>
                <Text style={styles.summaryLabel}>{card.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {/* Upcoming Deadlines/Events */}
        <Text style={styles.sectionTitle}>Upcoming Deadlines & Events</Text>
        <FlatList
          data={mockDeadlines}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.deadlineRow}>
              <Ionicons name="calendar" size={18} color="#1976d2" style={{ marginRight: 8 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.deadlineTitle}>{item.title}</Text>
                <Text style={styles.deadlineDate}>{item.date}</Text>
              </View>
            </View>
          )}
          contentContainerStyle={styles.deadlineList}
        />
        {/* Recent Notifications */}
        <Text style={styles.sectionTitle}>Recent Notifications</Text>
        <FlatList
          data={mockNotifications}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.notificationRow}>
              <Ionicons name="notifications" size={18} color="#9c27b0" style={{ marginRight: 8 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.notificationMsg}>{item.message}</Text>
                <Text style={styles.notificationDate}>{item.date}</Text>
              </View>
            </View>
          )}
          contentContainerStyle={styles.notificationList}
        />
      </ScrollView>
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
    // Remove elevation/shadow
  },
  summaryCardPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.85,
  },
  summaryValue: { fontSize: 22, fontWeight: 'bold', color: '#222' },
  summaryLabel: { fontSize: 14, color: '#555', marginTop: 2 },
  quickLinksRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 },
  quickLinkBtn: { flex: 1, alignItems: 'center', padding: 12, marginHorizontal: 6, backgroundColor: '#fff', borderRadius: 10, elevation: 1 },
  quickLinkText: { fontSize: 13, fontWeight: 'bold', marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1976d2', marginBottom: 8, marginTop: 10 },
  deadlineList: { marginBottom: 18 },
  deadlineRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 8, elevation: 1 },
  deadlineTitle: { fontSize: 15, color: '#333', fontWeight: 'bold' },
  deadlineDate: { fontSize: 13, color: '#888' },
  notificationList: { marginBottom: 18 },
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