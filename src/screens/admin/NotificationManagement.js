import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Modal, TextInput, Button, Alert, ScrollView } from 'react-native';
import Header from '../../components/Header';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

const mockUsers = [
  { id: 'u1', name: 'Alice', role: 'student' },
  { id: 'u2', name: 'Bob', role: 'parent' },
  { id: 'u3', name: 'Carol', role: 'teacher' },
  { id: 'u4', name: 'Admin', role: 'admin' },
];
const roles = ['teacher', 'parent', 'student'];
const notificationTypes = ['general', 'urgent', 'fee reminder', 'event', 'homework', 'attendance'];

const initialNotifications = [
  { id: 'n1', type: 'fee reminder', message: 'Fee due soon!', recipients: ['parent'], date: '2024-06-10 10:00', status: 'Sent', read: false },
  { id: 'n2', type: 'event', message: 'Sports day on Friday', recipients: ['student', 'parent'], date: '2024-06-09 09:00', status: 'Scheduled', read: false },
  { id: 'n3', type: 'urgent', message: 'School closed tomorrow', recipients: ['all'], date: '2024-06-08 18:00', status: 'Sent', read: true },
];

const NotificationManagement = () => {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [typeFilter, setTypeFilter] = useState('');
  const [modal, setModal] = useState({ visible: false, mode: 'view', notification: null });
  const [createForm, setCreateForm] = useState({ type: notificationTypes[0], message: '', recipients: [], date: '', status: 'Scheduled' });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [search, setSearch] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  // Filtering logic
  const filteredNotifications = notifications.filter(n => {
    if (typeFilter && n.type !== typeFilter) return false;
    if (search && !n.message.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Actions
  const openViewModal = (notification) => setModal({ visible: true, mode: 'view', notification });
  const openEditModal = (notification) => {
    if (notification.date) {
      const [d, t] = notification.date.split(' ');
      setDate(d);
      setTime(t || '');
    }
    setModal({ visible: true, mode: 'edit', notification });
  };
  const openCreateModal = () => {
    setDate('');
    setTime('');
    setModal({ visible: true, mode: 'create', notification: null });
  };
  const handleDelete = (id) => {
    Alert.alert('Delete Notification', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => setNotifications(notifications.filter(n => n.id !== id)) },
    ]);
  };
  const handleResend = (notification) => {
    setNotifications([...notifications, { ...notification, id: 'n' + Date.now(), status: 'Sent', date: new Date().toISOString().slice(0, 16).replace('T', ' ') }]);
    Alert.alert('Notification resent!');
  };
  const handleDuplicate = (notification) => {
    setNotifications([...notifications, { ...notification, id: 'n' + Date.now(), status: 'Scheduled' }]);
    Alert.alert('Notification duplicated!');
  };
  const handleMarkRead = (id, read) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read } : n));
  };
  // Create/Edit logic
  const handleSave = () => {
    if (!createForm.message || createForm.recipients.length === 0 || !date || !time) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    const dateTime = `${date} ${time}`;
    if (modal.mode === 'edit') {
      setNotifications(notifications.map(n => n.id === modal.notification.id ? { ...n, ...createForm, date: dateTime } : n));
    } else {
      setNotifications([...notifications, { ...createForm, id: 'n' + Date.now(), date: dateTime }]);
    }
    setModal({ visible: false, mode: 'view', notification: null });
    setCreateForm({ type: notificationTypes[0], message: '', recipients: [], date: '', status: 'Scheduled' });
    setDate('');
    setTime('');
  };

  // UI
  return (
    <View style={styles.container}>
      <Header title="Notification Management" showBack={true} />
      {/* Filter/Search Bar */}
      <View style={styles.filterBarMain}>
        <View style={styles.searchBarRow}>
          <Ionicons name="search" size={20} color="#888" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search message..."
            value={search}
            onChangeText={setSearch}
            style={styles.filterInput}
            placeholderTextColor="#888"
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', marginTop: 8 }}>
          <TouchableOpacity
            style={[styles.filterBtn, (typeFilter.trim().toLowerCase() === '') ? styles.activeFilterBtn : null]}
            onPress={() => setTypeFilter('')}
          >
            <Text style={(typeFilter.trim().toLowerCase() === '') ? styles.activeFilterText : styles.filterBtnText}>All Types</Text>
          </TouchableOpacity>
          {notificationTypes.map(type => (
            <TouchableOpacity
              key={type}
              style={[styles.filterBtn, (typeFilter.trim().toLowerCase() === type.toLowerCase()) ? styles.activeFilterBtn : null]}
              onPress={() => setTypeFilter(type)}
            >
              <Text style={(typeFilter.trim().toLowerCase() === type.toLowerCase()) ? styles.activeFilterText : styles.filterBtnText}>{type}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <FlatList
        data={filteredNotifications}
        keyExtractor={item => item.id}
        style={{ width: '100%', marginTop: 8 }}
        contentContainerStyle={{ paddingBottom: 80 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.notificationCard} onPress={() => openViewModal(item)}>
            <View style={{ flex: 1 }}>
              <Text style={styles.notificationType}>{item.type.toUpperCase()}</Text>
              <Text style={styles.notificationMsg}>{item.message}</Text>
              <Text style={styles.notificationMeta}>To: {item.recipients.join(', ')} | {item.date}</Text>
            </View>
            <View style={styles.iconCol}>
              <TouchableOpacity onPress={() => openEditModal(item)}>
                <Ionicons name="create-outline" size={22} color="#1976d2" style={styles.actionIcon} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item.id)}>
                <Ionicons name="trash-outline" size={22} color="#d32f2f" style={styles.actionIcon} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleResend(item)}>
                <Ionicons name="refresh-outline" size={22} color="#388e3c" style={styles.actionIcon} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />
      {/* Floating Add Button */}
      <TouchableOpacity style={styles.fab} onPress={openCreateModal}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
      {/* Create/Edit/View Modal */}
      <Modal visible={modal.visible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentModern}>
            {modal.mode === 'view' && modal.notification && (
              <>
                <Text style={styles.modalTitle}>Notification Details</Text>
                <Text style={styles.notificationType}>{modal.notification.type.toUpperCase()}</Text>
                <Text style={styles.notificationMsg}>{modal.notification.message}</Text>
                <Text style={styles.notificationMeta}>To: {modal.notification.recipients.join(', ')}</Text>
                <Text style={styles.notificationMeta}>Date: {modal.notification.date}</Text>
                <Text style={styles.notificationMeta}>Status: {modal.notification.status}</Text>
                <Button title="Close" onPress={() => setModal({ visible: false, mode: 'view', notification: null })} />
              </>
            )}
            {(modal.mode === 'edit' || modal.mode === 'create') && (
              <ScrollView>
                <Text style={styles.modalTitle}>{modal.mode === 'edit' ? 'Edit Notification' : 'Create Notification'}</Text>
                <Text style={{ marginTop: 8 }}>Type:</Text>
                <ScrollView horizontal style={{ marginBottom: 8 }}>
                  {notificationTypes.map(type => (
                    <TouchableOpacity
                      key={type}
                      style={[styles.typeBtn, createForm.type === type && styles.activeTypeBtn]}
                      onPress={() => setCreateForm(f => ({ ...f, type }))}
                    >
                      <Text>{type}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <TextInput
                  placeholder="Message"
                  value={createForm.message}
                  onChangeText={text => setCreateForm(f => ({ ...f, message: text }))}
                  style={styles.input}
                  multiline
                />
                <Text style={{ marginTop: 8 }}>Recipients:</Text>
                <ScrollView horizontal style={{ marginBottom: 8 }}>
                  {roles.map(role => (
                    <TouchableOpacity
                      key={role}
                      style={[styles.recipientBtn, createForm.recipients.includes(role) && styles.activeRecipientBtn]}
                      onPress={() => setCreateForm(f => ({ ...f, recipients: f.recipients.includes(role) ? f.recipients.filter(r => r !== role) : [...f.recipients, role] }))}
                    >
                      <Text>{role}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    style={[styles.input, { flex: 1, flexDirection: 'row', alignItems: 'center' }]}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text style={{ color: date ? '#222' : '#888' }}>{date ? date : 'Date (YYYY-MM-DD)'}</Text>
                    <Ionicons name="calendar-outline" size={20} color="#888" style={{ marginLeft: 8 }} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.input, { flex: 1, flexDirection: 'row', alignItems: 'center' }]}
                    onPress={() => setShowTimePicker(true)}
                  >
                    <Text style={{ color: time ? '#222' : '#888' }}>{time ? time : 'Time (HH:mm)'}</Text>
                    <Ionicons name="time-outline" size={20} color="#888" style={{ marginLeft: 8 }} />
                  </TouchableOpacity>
                </View>
                {showDatePicker && (
                  <DateTimePicker
                    value={date ? new Date(date) : new Date()}
                    mode="date"
                    display="calendar"
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) {
                        const yyyy = selectedDate.getFullYear();
                        const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
                        const dd = String(selectedDate.getDate()).padStart(2, '0');
                        setDate(`${yyyy}-${mm}-${dd}`);
                      }
                    }}
                  />
                )}
                {showTimePicker && (
                  <DateTimePicker
                    value={time ? new Date(`1970-01-01T${time}:00`) : new Date()}
                    mode="time"
                    is24Hour={true}
                    display="clock"
                    onChange={(event, selectedDate) => {
                      setShowTimePicker(false);
                      if (selectedDate) {
                        const h = selectedDate.getHours().toString().padStart(2, '0');
                        const m = selectedDate.getMinutes().toString().padStart(2, '0');
                        setTime(`${h}:${m}`);
                      }
                    }}
                  />
                )}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
                  <Button title="Cancel" onPress={() => setModal({ visible: false, mode: 'view', notification: null })} />
                  <Button title="Save" onPress={handleSave} />
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#007bff',
    backgroundColor: '#fff',
  },
  tabText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  filterInput: {
    flex: 1,
    minWidth: 0,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 8,
    marginRight: 8,
    color: '#222',
    backgroundColor: '#fff',
    fontSize: 16,
  },
  filterBtn: {
    padding: 8,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  filterBtnText: {
    color: '#1976d2',
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  activeFilterBtn: {
    backgroundColor: '#1976d2',
    borderColor: '#1976d2',
    color: '#fff',
  },
  activeFilterText: {
    color: '#fff',
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    elevation: 1,
  },
  notificationType: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  notificationMsg: {
    fontSize: 16,
    color: '#333',
    marginVertical: 2,
  },
  notificationMeta: {
    fontSize: 12,
    color: '#888',
  },
  iconCol: {
    flexDirection: 'column',
    alignItems: 'center',
    marginLeft: 8,
    gap: 4,
  },
  icon: {
    fontSize: 20,
    textAlign: 'center',
    marginVertical: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 8,
    width: '90%',
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 8,
    marginTop: 8,
  },
  typeBtn: {
    padding: 8,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    alignItems: 'center',
  },
  activeTypeBtn: {
    backgroundColor: '#e3f2fd',
    borderColor: '#1976d2',
  },
  recipientBtn: {
    padding: 8,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    alignItems: 'center',
  },
  activeRecipientBtn: {
    backgroundColor: '#e3f2fd',
    borderColor: '#1976d2',
  },
  filterBarMain: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 0,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    backgroundColor: '#007bff',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabIcon: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: -2,
  },
  modalContentModern: {
    backgroundColor: '#fff',
    padding: 28,
    borderRadius: 16,
    width: '92%',
    maxHeight: '92%',
    elevation: 4,
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 4,
  },
  actionIcon: {
    marginVertical: 2,
    marginBottom: 2,
  },
});

export default NotificationManagement; 