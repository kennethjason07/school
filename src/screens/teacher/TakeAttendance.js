import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform, Alert } from 'react-native';
import Header from '../../components/Header';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as Print from 'expo-print';

const CLASSES = ['5A', '6B'];
const STUDENTS = [
  { id: 1, rollNo: 1, name: 'Abhishek', class: '5A' },
  { id: 2, rollNo: 2, name: 'Abhishek T', class: '5A' },
  { id: 3, rollNo: 3, name: 'Abhilash', class: '5A' },
  { id: 4, rollNo: 4, name: 'Anuradha', class: '5A' },
  { id: 5, rollNo: 5, name: 'Basavakiran', class: '5A' },
  { id: 6, rollNo: 6, name: 'Chidanand', class: '5A' },
  { id: 7, rollNo: 7, name: 'Daniel', class: '5A' },
  { id: 8, rollNo: 1, name: 'Riya', class: '6B' },
  { id: 9, rollNo: 2, name: 'Amit', class: '6B' },
  { id: 10, rollNo: 3, name: 'Priya', class: '6B' },
];

function formatDateDMY(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}-${m}-${y}`;
}

const TakeAttendance = () => {
  const today = new Date();
  const [selectedClass, setSelectedClass] = useState(CLASSES[0]);
  const [selectedDate, setSelectedDate] = useState(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [attendanceMark, setAttendanceMark] = useState({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [viewClass, setViewClass] = useState(CLASSES[0]);
  const [viewDate, setViewDate] = useState(selectedDate);

  useEffect(() => {
    const key = `${selectedClass}|${selectedDate}`;
    const savedAttendance = attendanceRecords[key];
    if (savedAttendance) {
      setAttendanceMark(savedAttendance);
    } else {
      setAttendanceMark({});
    }
  }, [selectedDate, selectedClass]);

  const studentsForClass = STUDENTS.filter(s => s.class === selectedClass);

  const handleMarkAttendance = () => {
    const key = `${selectedClass}|${selectedDate}`;
    setAttendanceRecords({
      ...attendanceRecords,
      [key]: { ...attendanceMark },
    });
    if (Platform.OS === 'web') {
      window.alert('Attendance saved successfully!');
    } else {
      Alert.alert('Success', 'Attendance saved successfully!');
    }
  };

  const exportToPDF = async () => {
    if (Platform.OS === 'web') {
      const jsPDF = require('jspdf').default;
      const autoTable = require('jspdf-autotable');
      const doc = new jsPDF();
      if (autoTable && typeof doc.autoTable !== 'function' && typeof autoTable.default === 'function') {
        autoTable.default(doc);
      }
      doc.text(`Attendance for Class ${viewClass} on ${formatDateDMY(viewDate)}`, 14, 16);
      const records = Object.entries(attendanceRecords[`${viewClass}|${viewDate}`] || {});
      const present = records.filter(([_, status]) => status === 'Present').map(([studentId]) => {
        const student = STUDENTS.find(s => s.id.toString() === studentId.toString());
        return [student?.rollNo || '-', student?.name || '-'];
      });
      const absent = records.filter(([_, status]) => status === 'Absent').map(([studentId]) => {
        const student = STUDENTS.find(s => s.id.toString() === studentId.toString());
        return [student?.rollNo || '-', student?.name || '-'];
      });
      doc.text('Present Students', 14, 28);
      const presentTable = doc.autoTable({
        head: [['Roll No', 'Student Name']],
        body: present.length ? present : [['-', '-']],
        startY: 32,
        styles: { halign: 'center' },
      });
      const absentStartY = (presentTable && presentTable.finalY) || (doc.lastAutoTable && doc.lastAutoTable.finalY) || 80;
      doc.text('Absent Students', 14, absentStartY);
      doc.autoTable({
        head: [['Roll No', 'Student Name']],
        body: absent.length ? absent : [['-', '-']],
        startY: absentStartY + 4,
        styles: { halign: 'center' },
      });
      doc.save(`Attendance_${viewClass}_${viewDate}.pdf`);
      return;
    }
    // Mobile: Use expo-print
    const records = Object.entries(attendanceRecords[`${viewClass}|${viewDate}`] || {});
    const present = records.filter(([_, status]) => status === 'Present').map(([studentId]) => {
      const student = STUDENTS.find(s => s.id.toString() === studentId.toString());
      return `<tr><td style=\"text-align:center;\">${student?.rollNo || '-'}</td><td style=\"text-align:center;\">${student?.name || '-'}</td></tr>`;
    }).join('');
    const absent = records.filter(([_, status]) => status === 'Absent').map(([studentId]) => {
      const student = STUDENTS.find(s => s.id.toString() === studentId.toString());
      return `<tr><td style=\"text-align:center;\">${student?.rollNo || '-'}</td><td style=\"text-align:center;\">${student?.name || '-'}</td></tr>`;
    }).join('');
    let html = `
      <h2 style=\"text-align:center;\">Attendance for Class ${viewClass} on ${formatDateDMY(viewDate)}</h2>
      <h3 style=\"text-align:center;\">Present Students</h3>
      <table border=\"1\" style=\"border-collapse:collapse;width:100%\">
        <tr><th style=\"text-align:center;\">Roll No</th><th style=\"text-align:center;\">Student Name</th></tr>
        ${present || '<tr><td style=\"text-align:center;\">-</td><td style=\"text-align:center;\">-</td></tr>'}
      </table>
      <h3 style=\"text-align:center;\">Absent Students</h3>
      <table border=\"1\" style=\"border-collapse:collapse;width:100%\">
        <tr><th style=\"text-align:center;\">Roll No</th><th style=\"text-align:center;\">Student Name</th></tr>
        ${absent || '<tr><td style=\"text-align:center;\">-</td><td style=\"text-align:center;\">-</td></tr>'}
      </table>
    `;
    await Print.printAsync({ html });
  };

  return (
    <View style={styles.container}>
      <Header title="Take Attendance" showBack={true} />
      <View style={{ padding: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, justifyContent: 'space-between' }}>
          <View style={{ flex: 1, marginRight: 8 }}>
            {Platform.OS === 'web' ? (
              <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 8, borderColor: '#e0e0e0', borderWidth: 1 }}>
                {CLASSES.map(cls => <option key={cls} value={cls}>{cls}</option>)}
              </select>
            ) : (
              <Picker selectedValue={selectedClass} onValueChange={setSelectedClass} style={{ width: '100%' }}>
                {CLASSES.map(cls => <Picker.Item key={cls} label={cls} value={cls} />)}
              </Picker>
            )}
          </View>
          <View style={{ flex: 1, marginRight: 8 }}>
            {Platform.OS === 'web' ? (
              <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 8, borderColor: '#e0e0e0', borderWidth: 1 }} />
            ) : (
              <TouchableOpacity style={{ borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, padding: 10, backgroundColor: '#fafafa' }} onPress={() => setShowDatePicker(true)}>
                <Text style={{ color: selectedDate ? '#333' : '#aaa', fontSize: 15 }}>{selectedDate ? formatDateDMY(selectedDate) : 'Select Date'}</Text>
              </TouchableOpacity>
            )}
            {showDatePicker && Platform.OS !== 'web' && (
              <DateTimePicker value={selectedDate ? new Date(selectedDate) : new Date()} mode="date" display="default" onChange={(event, selected) => { setShowDatePicker(false); if (selected) { const dd = String(selected.getDate()).padStart(2, '0'); const mm = String(selected.getMonth() + 1).padStart(2, '0'); const yyyy = selected.getFullYear(); setSelectedDate(`${yyyy}-${mm}-${dd}`); } }} />
            )}
          </View>
          <TouchableOpacity onPress={handleMarkAttendance} style={{ backgroundColor: '#2196F3', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 18 }}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Submit</Text>
          </TouchableOpacity>
        </View>
        <View style={{ backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', marginTop: 12, elevation: 2 }}>
          <View style={{ flexDirection: 'row', backgroundColor: '#f8f8f8', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' }}>
            <Text style={{ flex: 1.5, fontWeight: 'bold', textAlign: 'center' }}>Roll No</Text>
            <Text style={{ flex: 3, fontWeight: 'bold', textAlign: 'center' }}>Student Name</Text>
            <Text style={{ flex: 2, fontWeight: 'bold', textAlign: 'center' }}>Present</Text>
            <Text style={{ flex: 2, fontWeight: 'bold', textAlign: 'center' }}>Absent</Text>
          </View>
          {studentsForClass.map(s => (
            <View key={s.id} style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f5f5f5', paddingVertical: 10 }}>
              <Text style={{ flex: 1.5, textAlign: 'center' }}>{s.rollNo}</Text>
              <Text style={{ flex: 3, textAlign: 'center' }}>{s.name}</Text>
              <TouchableOpacity style={{ flex: 2, alignItems: 'center' }} onPress={() => setAttendanceMark({ ...attendanceMark, [s.id]: 'Present' })}>
                <Ionicons name="checkmark-circle" size={28} color={attendanceMark[s.id] === 'Present' ? '#4CAF50' : '#e0e0e0'} />
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 2, alignItems: 'center' }} onPress={() => setAttendanceMark({ ...attendanceMark, [s.id]: 'Absent' })}>
                <Ionicons name="close-circle" size={28} color={attendanceMark[s.id] === 'Absent' ? '#F44336' : '#e0e0e0'} />
              </TouchableOpacity>
            </View>
          ))}
      </View>
        <TouchableOpacity style={styles.markButton} onPress={() => { setViewClass(selectedClass); setViewDate(selectedDate); setViewModalVisible(true); }}>
          <Text style={styles.markButtonText}>View Attendance</Text>
        </TouchableOpacity>
        <Modal visible={viewModalVisible} animationType="slide" transparent onRequestClose={() => setViewModalVisible(false)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ width: '90%', backgroundColor: '#fff', borderRadius: 12, padding: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>View Attendance</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                {Platform.OS === 'web' ? (
                  <select value={viewClass} onChange={e => setViewClass(e.target.value)} style={{ width: 120, padding: 8, borderRadius: 8, borderColor: '#e0e0e0', borderWidth: 1, marginRight: 12 }}>
                    {CLASSES.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                  </select>
                ) : (
                  <Picker selectedValue={viewClass} onValueChange={setViewClass} style={{ width: 120, marginRight: 12 }}>
                    {CLASSES.map(cls => <Picker.Item key={cls} label={cls} value={cls} />)}
                  </Picker>
                )}
                {Platform.OS === 'web' ? (
                  <input type="date" value={viewDate} onChange={e => setViewDate(e.target.value)} style={{ width: 140, padding: 8, borderRadius: 8, borderColor: '#e0e0e0', borderWidth: 1 }} />
                ) : (
                  <TouchableOpacity style={{ borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, padding: 10, backgroundColor: '#fafafa' }} onPress={() => setShowDatePicker(true)}>
                    <Text style={{ color: viewDate ? '#333' : '#aaa', fontSize: 15 }}>{viewDate ? formatDateDMY(viewDate) : 'Select Date'}</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={{ backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', marginTop: 12, elevation: 2 }}>
                <View style={{ flexDirection: 'row', backgroundColor: '#f8f8f8', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' }}>
                  <Text style={{ flex: 1, fontWeight: 'bold', textAlign: 'center' }}>Roll No</Text>
                  <Text style={{ flex: 3, fontWeight: 'bold', textAlign: 'center' }}>Student Name</Text>
                  <Text style={{ flex: 2, fontWeight: 'bold', textAlign: 'center' }}>Date</Text>
                  <Text style={{ flex: 1, fontWeight: 'bold', textAlign: 'center' }}>Status</Text>
                </View>
                {Object.entries(attendanceRecords[`${viewClass}|${viewDate}`] || {}).map(([studentId, status]) => {
                  const student = STUDENTS.find(s => s.id.toString() === studentId.toString());
                  return (
                    <View key={studentId} style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f5f5f5', paddingVertical: 10 }}>
                      <Text style={{ flex: 1, textAlign: 'center' }}>{student?.rollNo || '-'}</Text>
                      <Text style={{ flex: 3, textAlign: 'center' }}>{student?.name || '-'}</Text>
                      <Text style={{ flex: 2, textAlign: 'center' }}>{formatDateDMY(viewDate)}</Text>
                      <Text style={{ flex: 1, textAlign: 'center', fontSize: 13 }}>{status === 'Present' ? 'P' : status === 'Absent' ? 'A' : status}</Text>
                    </View>
                  );
                })}
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
                <TouchableOpacity onPress={exportToPDF} style={{ backgroundColor: '#4CAF50', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 18, marginRight: 8 }}>
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>Export to PDF</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setViewModalVisible(false)} style={{ backgroundColor: '#2196F3', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 18 }}>
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  markButton: {
    backgroundColor: '#2196F3',
    alignSelf: 'flex-end',
    margin: 16,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  markButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});

export default TakeAttendance; 