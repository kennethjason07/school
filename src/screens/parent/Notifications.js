import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';

const { width } = Dimensions.get('window');

// Dummy notifications data
export const DUMMY_NOTIFICATIONS = [
  {
    id: '1',
    title: 'Fee Payment Reminder',
    message: 'Second term fee is due on 15th October. Please make the payment before the due date to avoid late fees.',
    sender: 'School Admin',
    type: 'fee_reminder',
    priority: 'important',
    isRead: false,
    timestamp: '2024-01-15T10:30:00Z',
    relatedAction: 'fee_payment'
  },
  {
    id: '2',
    title: 'Parent-Teacher Meeting',
    message: 'PTM scheduled for January 5th, 2025 at 2:00 PM. Please confirm your attendance.',
    sender: 'Class Teacher',
    type: 'meeting',
    priority: 'important',
    isRead: false,
    timestamp: '2024-01-14T14:20:00Z',
    relatedAction: 'ptm_attendance'
  },
  {
    id: '3',
    title: 'Annual Day Invitation',
    message: 'You are cordially invited to the Annual Day celebration on December 25th, 2024 at 6:00 PM.',
    sender: 'School Principal',
    type: 'event',
    priority: 'regular',
    isRead: true,
    timestamp: '2024-01-13T09:15:00Z',
    relatedAction: 'event_details'
  },
  {
    id: '4',
    title: 'Attendance Update',
    message: 'Your child was absent on January 12th, 2024. Please provide a reason for the absence.',
    sender: 'Class Teacher',
    type: 'attendance',
    priority: 'regular',
    isRead: true,
    timestamp: '2024-01-12T16:45:00Z',
    relatedAction: 'attendance_update'
  },
  {
    id: '5',
    title: 'Sports Day Registration',
    message: 'Sports day registration is now open. Please register your child for the events by January 20th.',
    sender: 'Sports Department',
    type: 'sports',
    priority: 'regular',
    isRead: false,
    timestamp: '2024-01-11T11:30:00Z',
    relatedAction: 'sports_registration'
  },
  {
    id: '6',
    title: 'Library Book Due',
    message: 'The library book "Science Encyclopedia" is due for return on January 18th. Please ensure timely return.',
    sender: 'Library Staff',
    type: 'academic',
    priority: 'regular',
    isRead: true,
    timestamp: '2024-01-10T13:20:00Z',
    relatedAction: 'library_return'
  },
  {
    id: '7',
    title: 'Exam Schedule Update',
    message: 'Midterm examinations will be conducted from January 20-22, 2025. Please check the updated schedule.',
    sender: 'Examination Department',
    type: 'exam',
    priority: 'important',
    isRead: false,
    timestamp: '2024-01-09T15:10:00Z',
    relatedAction: 'exam_schedule'
  },
  {
    id: '8',
    title: 'Transport Route Change',
    message: 'Due to road construction, the bus route has been modified. New pickup time is 7:30 AM from tomorrow.',
    sender: 'Transport Department',
    type: 'transport',
    priority: 'important',
    isRead: true,
    timestamp: '2024-01-08T08:45:00Z',
    relatedAction: 'transport_update'
  }
];

const Notifications = ({ navigation }) => {
  const [notifications, setNotifications] = useState(DUMMY_NOTIFICATIONS);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'read') return n.isRead;
    if (filter === 'important') return n.priority === 'important';
    return true;
  }).filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.message.toLowerCase().includes(search.toLowerCase()) ||
    n.sender.toLowerCase().includes(search.toLowerCase())
  );

  const markAsRead = (id) => {
    setNotifications(notifications =>
      notifications.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  };
  const markAsUnread = (id) => {
    setNotifications(notifications =>
      notifications.map(n => n.id === id ? { ...n, isRead: false } : n)
    );
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  const renderNotification = ({ item }) => (
    <View style={[styles.card, item.isRead ? styles.cardRead : styles.cardUnread]}>
      <View style={styles.cardHeader}>
        <Ionicons name={item.isRead ? 'mail-open' : 'mail'} size={22} color={item.isRead ? '#888' : '#1976d2'} style={{ marginRight: 10 }} />
        <Text style={[styles.title, item.isRead && { color: '#888' }]}>{item.title}</Text>
        {item.priority === 'important' && (
          <Ionicons name="star" size={18} color="#FFD700" style={{ marginLeft: 6 }} />
        )}
        <Text style={styles.date}>{formatDate(item.timestamp)}</Text>
      </View>
      <Text style={styles.message}>{item.message}</Text>
      <View style={styles.metaRow}>
        <Text style={styles.sender}>{item.sender}</Text>
        {!item.isRead && (
          <TouchableOpacity style={styles.actionBtn} onPress={() => markAsRead(item.id)}>
            <Ionicons name="mail-open" size={18} color="#388e3c" />
            <Text style={styles.actionText}>Mark as Read</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'unread', label: 'Unread' },
    { key: 'read', label: 'Read' },
    { key: 'important', label: 'Important' },
  ];

  return (
    <View style={styles.container}>
      <Header title="Notifications" showBack={true} />
      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterBtn, filter === f.key && styles.filterBtnActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>{f.label}</Text>
            {f.key === 'important' && (
              <Ionicons name="star" size={15} color="#FFD700" style={{ marginLeft: 4 }} />
            )}
          </TouchableOpacity>
        ))}
      </View>
      <TextInput
        style={styles.searchInput}
        placeholder="Search notifications..."
        value={search}
        onChangeText={setSearch}
        placeholderTextColor="#aaa"
      />
      <FlatList
        data={filteredNotifications}
        keyExtractor={item => item.id}
        renderItem={renderNotification}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={<Text style={{ color: '#888', textAlign: 'center', marginTop: 40 }}>No notifications found.</Text>}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 10,
    justifyContent: 'center',
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#e3eaf2',
    marginHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterBtnActive: {
    backgroundColor: '#1976d2',
  },
  filterText: {
    color: '#1976d2',
    fontWeight: 'bold',
    fontSize: 14,
  },
  filterTextActive: {
    color: '#fff',
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e3eaf2',
    color: '#222',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#1976d2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#e3eaf2',
  },
  cardUnread: {
    borderLeftWidth: 5,
    borderLeftColor: '#1976d2',
  },
  cardRead: {
    borderLeftWidth: 5,
    borderLeftColor: '#bdbdbd',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    color: '#222',
  },
  date: {
    color: '#888',
    fontSize: 13,
    marginLeft: 8,
  },
  message: {
    color: '#333',
    fontSize: 15,
    marginBottom: 8,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sender: {
    color: '#888',
    fontSize: 13,
    fontStyle: 'italic',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#e3eaf2',
    marginLeft: 8,
  },
  actionText: {
    color: '#1976d2',
    fontWeight: 'bold',
    marginLeft: 4,
    fontSize: 13,
  },
});

export default Notifications; 