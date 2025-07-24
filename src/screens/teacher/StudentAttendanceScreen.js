import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, ScrollView } from 'react-native';
import Header from '../../components/Header';

const mockMonthlyAttendance = [
  { month: 'January', percent: 95 },
  { month: 'February', percent: 92 },
  { month: 'March', percent: 97 },
  { month: 'April', percent: 93 },
  { month: 'May', percent: 90 },
  { month: 'June', percent: 96 },
  { month: 'July', percent: 94 },
  { month: 'August', percent: 98 },
  { month: 'September', percent: 91 },
  { month: 'October', percent: 95 },
  { month: 'November', percent: 93 },
  { month: 'December', percent: 97 },
];

// Mock daily attendance for a month (e.g., 31 days, random Present/Absent)
function getMockDailyAttendance(month) {
  const daysInMonth = {
    January: 31, February: 28, March: 31, April: 30, May: 31, June: 30,
    July: 31, August: 31, September: 30, October: 31, November: 30, December: 31
  };
  const days = daysInMonth[month] || 30;
  const arr = [];
  for (let i = 1; i <= days; i++) {
    arr.push({ day: i, status: Math.random() > 0.1 ? 'Present' : 'Absent' });
  }
  return arr;
}

const StudentAttendanceScreen = ({ navigation, route }) => {
  const { student } = route.params;
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [dailyAttendance, setDailyAttendance] = useState([]);

  const openMonth = (month) => {
    setSelectedMonth(month);
    setDailyAttendance(getMockDailyAttendance(month));
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <Header title={`${student.name}'s Attendance`} showBack={true} />
      <View style={{ height: 16 }} />
      <FlatList
        data={mockMonthlyAttendance}
        keyExtractor={item => item.month}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.row} onPress={() => openMonth(item.month)}>
            <Text style={styles.month}>{item.month}</Text>
            <Text style={styles.percent}>{item.percent}%</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
      />
      {/* Calendar Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedMonth} Daily Attendance</Text>
            <ScrollView>
              <View style={styles.calendarGrid}>
                {dailyAttendance.map(({ day, status }) => (
                  <View key={day} style={[styles.dayCell, status === 'Present' ? styles.present : styles.absent]}>
                    <Text style={styles.dayText}>{day}</Text>
                    <Text style={styles.statusText}>{status[0]}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  backBtn: { marginBottom: 12 },
  backText: { color: '#1976d2', fontWeight: 'bold', fontSize: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#222', marginBottom: 20, textAlign: 'center' },
  list: { paddingBottom: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', padding: 16, borderRadius: 8, marginBottom: 10, elevation: 1 },
  month: { fontSize: 16, color: '#333' },
  percent: { fontSize: 16, color: '#1976d2', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', maxHeight: '80%', backgroundColor: '#fff', borderRadius: 16, padding: 20, alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1976d2', marginBottom: 16 },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', marginBottom: 16 },
  dayCell: { width: 40, height: 40, margin: 4, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#eee' },
  present: { backgroundColor: '#c8e6c9' },
  absent: { backgroundColor: '#ffcdd2' },
  dayText: { fontWeight: 'bold', color: '#333' },
  statusText: { fontSize: 12, color: '#555' },
  closeBtn: { marginTop: 10, backgroundColor: '#1976d2', borderRadius: 8, paddingHorizontal: 18, paddingVertical: 8 },
  closeBtnText: { color: '#fff', fontWeight: 'bold' },
});

export default StudentAttendanceScreen; 