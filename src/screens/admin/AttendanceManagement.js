import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, Platform, Alert } from 'react-native';
import Header from '../../components/Header';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as Print from 'expo-print';
import CrossPlatformPieChart from '../../components/CrossPlatformPieChart';

const CLASSES = ['5A', '6B'];
const SECTIONS = ['A', 'B'];
// Add roll numbers to students
const STUDENTS = [
  { id: 1, rollNo: 1, name: 'Abhishek', class: '5A', section: 'A' },
  { id: 2, rollNo: 2, name: 'Abhishek T', class: '5A', section: 'A' },
  { id: 3, rollNo: 3, name: 'Abhilash', class: '5A', section: 'A' },
  { id: 4, rollNo: 4, name: 'Anuradha', class: '5A', section: 'A' },
  { id: 5, rollNo: 5, name: 'Basavakiran', class: '5A', section: 'A' },
  { id: 6, rollNo: 6, name: 'Chidanand', class: '5A', section: 'A' },
  { id: 7, rollNo: 7, name: 'Daniel', class: '5A', section: 'A' },
];
const TEACHERS = [
  { id: 1, rollNo: 1, name: 'Mrs. Sarah Johnson' },
  { id: 2, rollNo: 2, name: 'Mr. David Wilson' },
  { id: 3, rollNo: 3, name: 'Ms. Emily Brown' },
  { id: 4, rollNo: 4, name: 'Mr. James Davis' },
  { id: 5, rollNo: 5, name: 'Mrs. Lisa Anderson' },
];
const MOCK_TEACHER_ATTENDANCE = [
  { id: 1, name: 'Mrs. Sarah Johnson', date: '2024-06-10', status: 'Present', subject: 'Mathematics', class: '5A' },
  { id: 2, name: 'Mr. David Wilson', date: '2024-06-10', status: 'Present', subject: 'English', class: '4B' },
  { id: 3, name: 'Ms. Emily Brown', date: '2024-06-10', status: 'Absent', subject: 'Science', class: '3A' },
];

// Helper function to format date as dd-mm-yyyy
function formatDateDMY(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}-${m}-${y}`;
}

const AttendanceManagement = () => {
  const [tab, setTab] = useState('student');
  // Replace studentAttendance with attendanceRecords: { [class|date]: { [studentId]: 'Present'|'Absent' } }
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [teacherAttendanceRecords, setTeacherAttendanceRecords] = useState({});
  const [teacherAttendanceMark, setTeacherAttendanceMark] = useState({});
  const [teacherEditMode, setTeacherEditMode] = useState({});
  const [teacherDate, setTeacherDate] = useState(selectedDate);
  const [teacherShowDatePicker, setTeacherShowDatePicker] = useState(false);
  const [teacherViewModalVisible, setTeacherViewModalVisible] = useState(false);
  const [teacherViewDate, setTeacherViewDate] = useState(teacherDate);
  const [selectedClass, setSelectedClass] = useState('5A');
  const [selectedSection, setSelectedSection] = useState('A');
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`);
  const [attendanceMark, setAttendanceMark] = useState({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [editMode, setEditMode] = useState({});
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [viewClass, setViewClass] = useState(CLASSES[0]);
  const [viewDate, setViewDate] = useState(selectedDate);

  // When selectedClass or selectedDate changes, load attendanceMark from attendanceRecords
  useEffect(() => {
    const key = `${selectedClass}|${selectedDate}`;
    const savedAttendance = attendanceRecords[key];
    if (savedAttendance) {
      setAttendanceMark(savedAttendance);
    } else {
      setAttendanceMark({});
    }
    setEditMode({});
  }, [selectedDate, selectedClass]);

  // When teacherDate changes, load teacherAttendanceMark from teacherAttendanceRecords
  useEffect(() => {
    const key = `${teacherDate}`;
    const saved = teacherAttendanceRecords[key];
    if (saved) {
      setTeacherAttendanceMark(saved);
    } else {
      setTeacherAttendanceMark({});
    }
    setTeacherEditMode({});
  }, [teacherDate]);

  // Get students for selected class/section
  const studentsForClass = STUDENTS.filter(s => s.class === selectedClass && s.section === selectedSection);

  // Mark attendance for all students in modal
  const handleMarkAttendance = () => {
    const key = `${selectedClass}|${selectedDate}`;
    setAttendanceRecords({
      ...attendanceRecords,
      [key]: { ...attendanceMark },
    });
    setEditMode({});
    // Show confirmation popup
    if (Platform.OS === 'web') {
      window.alert('Attendance saved successfully!');
    } else {
      Alert.alert('Success', 'Attendance saved successfully!');
    }
  };

  const handleTeacherMarkAttendance = () => {
    const key = `${teacherDate}`;
    setTeacherAttendanceRecords({
      ...teacherAttendanceRecords,
      [key]: { ...teacherAttendanceMark },
    });
    setTeacherEditMode({});
    // Show confirmation popup
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
      // Explicitly attach autoTable if needed
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
      const absentStartY =
        (presentTable && presentTable.finalY) ||
        (doc.lastAutoTable && doc.lastAutoTable.finalY) ||
        80;
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

  const exportTeacherToPDF = async () => {
    if (Platform.OS === 'web') {
      const jsPDF = require('jspdf').default;
      const autoTable = require('jspdf-autotable');
      const doc = new jsPDF();
      if (autoTable && typeof doc.autoTable !== 'function' && typeof autoTable.default === 'function') {
        autoTable.default(doc);
      }
      doc.text(`Teacher Attendance on ${formatDateDMY(teacherViewDate)}`, 14, 16);
      const records = Object.entries(teacherAttendanceRecords[`${teacherViewDate}`] || {});
      const present = records.filter(([_, status]) => status === 'Present').map(([teacherId]) => {
        const teacher = TEACHERS.find(t => t.id.toString() === teacherId.toString());
        return [teacher?.rollNo || '-', teacher?.name || '-'];
      });
      const absent = records.filter(([_, status]) => status === 'Absent').map(([teacherId]) => {
        const teacher = TEACHERS.find(t => t.id.toString() === teacherId.toString());
        return [teacher?.rollNo || '-', teacher?.name || '-'];
      });
      doc.text('Present Teachers', 14, 28);
      const presentTable = doc.autoTable({
        head: [['Roll No', 'Teacher Name']],
        body: present.length ? present : [['-', '-']],
        startY: 32,
        styles: { halign: 'center' },
      });
      const absentStartY = (presentTable && presentTable.finalY) || (doc.lastAutoTable && doc.lastAutoTable.finalY) || 80;
      doc.text('Absent Teachers', 14, absentStartY);
      doc.autoTable({
        head: [['Roll No', 'Teacher Name']],
        body: absent.length ? absent : [['-', '-']],
        startY: absentStartY + 4,
        styles: { halign: 'center' },
      });
      doc.save(`TeacherAttendance_${teacherViewDate}.pdf`);
      return;
    }
    // Mobile: Use expo-print
    const records = Object.entries(teacherAttendanceRecords[`${teacherViewDate}`] || {});
    const present = records.filter(([_, status]) => status === 'Present').map(([teacherId]) => {
      const teacher = TEACHERS.find(t => t.id.toString() === teacherId.toString());
      return `<tr><td style=\"text-align:center;\">${teacher?.rollNo || '-'}</td><td style=\"text-align:center;\">${teacher?.name || '-'}</td></tr>`;
    }).join('');
    const absent = records.filter(([_, status]) => status === 'Absent').map(([teacherId]) => {
      const teacher = TEACHERS.find(t => t.id.toString() === teacherId.toString());
      return `<tr><td style=\"text-align:center;\">${teacher?.rollNo || '-'}</td><td style=\"text-align:center;\">${teacher?.name || '-'}</td></tr>`;
    }).join('');
    let html = `
      <h2 style=\"text-align:center;\">Teacher Attendance on ${formatDateDMY(teacherViewDate)}</h2>
      <h3 style=\"text-align:center;\">Present Teachers</h3>
      <table border=\"1\" style=\"border-collapse:collapse;width:100%\">
        <tr><th style=\"text-align:center;\">Roll No</th><th style=\"text-align:center;\">Teacher Name</th></tr>
        ${present || '<tr><td style=\"text-align:center;\">-</td><td style=\"text-align:center;\">-</td></tr>'}
      </table>
      <h3 style=\"text-align:center;\">Absent Teachers</h3>
      <table border=\"1\" style=\"border-collapse:collapse;width:100%\">
        <tr><th style=\"text-align:center;\">Roll No</th><th style=\"text-align:center;\">Teacher Name</th></tr>
        ${absent || '<tr><td style=\"text-align:center;\">-</td><td style=\"text-align:center;\">-</td></tr>'}
      </table>
    `;
    await Print.printAsync({ html });
  };

  return (
    <View style={styles.container}>
      <Header title="Attendance Management" showBack={true} />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabButton, tab === 'student' && styles.tabButtonActive]}
            onPress={() => setTab('student')}
          >
            <Text style={[styles.tabText, tab === 'student' && styles.tabTextActive]}>Student Attendance</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, tab === 'teacher' && styles.tabButtonActive]}
            onPress={() => setTab('teacher')}
          >
            <Text style={[styles.tabText, tab === 'teacher' && styles.tabTextActive]}>Teacher Attendance</Text>
          </TouchableOpacity>
        </View>
        {tab === 'student' && (
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
                <Text style={{ flex: 1, fontWeight: 'bold', textAlign: 'center' }}>Roll No</Text>
                <Text style={{ flex: 3, fontWeight: 'bold', textAlign: 'center' }}>Student Name</Text>
                <Text style={{ flex: 1, fontWeight: 'bold', textAlign: 'center' }}>Present</Text>
                <Text style={{ flex: 1, fontWeight: 'bold', textAlign: 'center' }}>Absent</Text>
              </View>
              {studentsForClass.map(s => (
                <View key={s.id} style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f5f5f5', paddingVertical: 10, backgroundColor: editMode[s.id] ? '#e3f2fd' : '#fff', borderColor: editMode[s.id] ? '#2196F3' : 'transparent', borderWidth: editMode[s.id] ? 1 : 0 }}>
                  <Text style={{ flex: 1, textAlign: 'center' }}>{s.rollNo}</Text>
                  <Text style={{ flex: 3, textAlign: 'center' }}>{s.name}</Text>
                  <TouchableOpacity style={{ flex: 1, alignItems: 'center' }} onPress={() => setAttendanceMark({ ...attendanceMark, [s.id]: 'Present' })} disabled={!editMode[s.id] && !!attendanceMark[s.id]}>
                    <Ionicons name="checkmark-circle" size={28} color={attendanceMark[s.id] === 'Present' ? '#4CAF50' : '#e0e0e0'} />
                  </TouchableOpacity>
                  <TouchableOpacity style={{ flex: 1, alignItems: 'center' }} onPress={() => setAttendanceMark({ ...attendanceMark, [s.id]: 'Absent' })} disabled={!editMode[s.id] && !!attendanceMark[s.id]}>
                    <Ionicons name="close-circle" size={28} color={attendanceMark[s.id] === 'Absent' ? '#F44336' : '#e0e0e0'} />
                  </TouchableOpacity>
                  <TouchableOpacity style={{ flex: 1, alignItems: 'center' }} onPress={() => setEditMode({ ...editMode, [s.id]: true })}>
                    <Ionicons name="pencil" size={28} color={editMode[s.id] ? '#2196F3' : '#666'} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            <TouchableOpacity style={styles.markButton} onPress={() => { setViewClass(selectedClass); setViewDate(selectedDate); setViewModalVisible(true); }}>
              <Text style={styles.markButtonText}>View Attendance</Text>
            </TouchableOpacity>
            {/* Pie Chart Analytics */}
            <View style={{ marginTop: 24, alignItems: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>Attendance Analytics</Text>
              {(() => {
                const key = `${selectedClass}|${selectedDate}`;
                const records = Object.entries(attendanceRecords[key] || {});
                const presentCount = records.filter(([_, status]) => status === 'Present').length;
                const absentCount = records.filter(([_, status]) => status === 'Absent').length;
                const data = [
                  { name: 'Present', population: presentCount, color: '#4CAF50', legendFontColor: '#333', legendFontSize: 14 },
                  { name: 'Absent', population: absentCount, color: '#F44336', legendFontColor: '#333', legendFontSize: 14 },
                ];
                return (
                  <CrossPlatformPieChart
                    data={data}
                    width={300}
                    height={180}
                    chartConfig={{
                      backgroundColor: '#fff',
                      backgroundGradientFrom: '#fff',
                      backgroundGradientTo: '#fff',
                      color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
                      labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    }}
                    accessor="population"
                    backgroundColor="transparent"
                    paddingLeft="15"
                    absolute
                  />
                );
              })()}
            </View>
          </View>
        )}
        {tab === 'teacher' && (
          <View style={{ padding: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, justifyContent: 'space-between' }}>
              <View style={{ flex: 1, marginRight: 8 }} />
              <View style={{ flex: 1, marginRight: 8 }}>
                {Platform.OS === 'web' ? (
                  <input type="date" value={teacherDate} onChange={e => setTeacherDate(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 8, borderColor: '#e0e0e0', borderWidth: 1 }} />
                ) : (
                  <TouchableOpacity style={{ borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, padding: 10, backgroundColor: '#fafafa' }} onPress={() => setTeacherShowDatePicker(true)}>
                    <Text style={{ color: teacherDate ? '#333' : '#aaa', fontSize: 15 }}>{teacherDate ? formatDateDMY(teacherDate) : 'Select Date'}</Text>
                  </TouchableOpacity>
                )}
                {teacherShowDatePicker && Platform.OS !== 'web' && (
                  <DateTimePicker value={teacherDate ? new Date(teacherDate) : new Date()} mode="date" display="default" onChange={(event, selected) => { setTeacherShowDatePicker(false); if (selected) { const dd = String(selected.getDate()).padStart(2, '0'); const mm = String(selected.getMonth() + 1).padStart(2, '0'); const yyyy = selected.getFullYear(); setTeacherDate(`${yyyy}-${mm}-${dd}`); } }} />
                )}
              </View>
              <TouchableOpacity onPress={handleTeacherMarkAttendance} style={{ backgroundColor: '#2196F3', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 18 }}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Submit</Text>
              </TouchableOpacity>
            </View>
            <View style={{ backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', marginTop: 12, elevation: 2 }}>
              <View style={{ flexDirection: 'row', backgroundColor: '#f8f8f8', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' }}>
                <Text style={{ flex: 1, fontWeight: 'bold', textAlign: 'center' }}>Roll No</Text>
                <Text style={{ flex: 3, fontWeight: 'bold', textAlign: 'center' }}>Teacher Name</Text>
                <Text style={{ flex: 1, fontWeight: 'bold', textAlign: 'center' }}>Present</Text>
                <Text style={{ flex: 1, fontWeight: 'bold', textAlign: 'center' }}>Absent</Text>
                <Text style={{ flex: 1, fontWeight: 'bold', textAlign: 'center' }}>Edit</Text>
              </View>
              {TEACHERS.map(t => (
                <View key={t.id} style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f5f5f5', paddingVertical: 10, backgroundColor: teacherEditMode[t.id] ? '#e3f2fd' : '#fff', borderColor: teacherEditMode[t.id] ? '#2196F3' : 'transparent', borderWidth: teacherEditMode[t.id] ? 1 : 0 }}>
                  <Text style={{ flex: 1, textAlign: 'center' }}>{t.rollNo}</Text>
                  <Text style={{ flex: 3, textAlign: 'center' }}>{t.name}</Text>
                  <TouchableOpacity style={{ flex: 1, alignItems: 'center' }} onPress={() => setTeacherAttendanceMark({ ...teacherAttendanceMark, [t.id]: 'Present' })} disabled={!teacherEditMode[t.id] && !!teacherAttendanceMark[t.id]}>
                    <Ionicons name="checkmark-circle" size={28} color={teacherAttendanceMark[t.id] === 'Present' ? '#4CAF50' : '#e0e0e0'} />
                  </TouchableOpacity>
                  <TouchableOpacity style={{ flex: 1, alignItems: 'center' }} onPress={() => setTeacherAttendanceMark({ ...teacherAttendanceMark, [t.id]: 'Absent' })} disabled={!teacherEditMode[t.id] && !!teacherAttendanceMark[t.id]}>
                    <Ionicons name="close-circle" size={28} color={teacherAttendanceMark[t.id] === 'Absent' ? '#F44336' : '#e0e0e0'} />
                  </TouchableOpacity>
                  <TouchableOpacity style={{ flex: 1, alignItems: 'center' }} onPress={() => setTeacherEditMode({ ...teacherEditMode, [t.id]: true })}>
                    <Ionicons name="pencil" size={28} color={teacherEditMode[t.id] ? '#2196F3' : '#666'} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            <TouchableOpacity style={styles.markButton} onPress={() => { setTeacherViewDate(teacherDate); setTeacherViewModalVisible(true); }}>
              <Text style={styles.markButtonText}>View Attendance</Text>
            </TouchableOpacity>
            {/* Pie Chart Analytics for Teachers */}
            <View style={{ marginTop: 24, alignItems: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>Attendance Analytics</Text>
              {(() => {
                const key = `${teacherDate}`;
                const records = Object.entries(teacherAttendanceRecords[key] || {});
                const presentCount = records.filter(([_, status]) => status === 'Present').length;
                const absentCount = records.filter(([_, status]) => status === 'Absent').length;
                const data = [
                  { name: 'Present', population: presentCount, color: '#4CAF50', legendFontColor: '#333', legendFontSize: 14 },
                  { name: 'Absent', population: absentCount, color: '#F44336', legendFontColor: '#333', legendFontSize: 14 },
                ];
                return (
                  <CrossPlatformPieChart
                    data={data}
                    width={300}
                    height={180}
                    chartConfig={{
                      backgroundColor: '#fff',
                      backgroundGradientFrom: '#fff',
                      backgroundGradientTo: '#fff',
                      color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
                      labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    }}
                    accessor="population"
                    backgroundColor="transparent"
                    paddingLeft="15"
                    absolute
                  />
                );
              })()}
            </View>
            <Modal visible={teacherViewModalVisible} animationType="slide" transparent onRequestClose={() => setTeacherViewModalVisible(false)}>
              <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' }}>
                <View style={{ width: '90%', backgroundColor: '#fff', borderRadius: 12, padding: 20 }}>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>View Teacher Attendance</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                    {Platform.OS === 'web' ? (
                      <input type="date" value={teacherViewDate} onChange={e => setTeacherViewDate(e.target.value)} style={{ width: 140, padding: 8, borderRadius: 8, borderColor: '#e0e0e0', borderWidth: 1 }} />
                    ) : (
                      <TouchableOpacity style={{ borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, padding: 10, backgroundColor: '#fafafa' }} onPress={() => setTeacherShowDatePicker(true)}>
                        <Text style={{ color: teacherViewDate ? '#333' : '#aaa', fontSize: 15 }}>{teacherViewDate ? formatDateDMY(teacherViewDate) : 'Select Date'}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <View style={{ backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', marginTop: 12, elevation: 2 }}>
                    <View style={{ flexDirection: 'row', backgroundColor: '#f8f8f8', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' }}>
                      <Text style={{ flex: 1, fontWeight: 'bold', textAlign: 'center' }}>Roll No</Text>
                      <Text style={{ flex: 3, fontWeight: 'bold', textAlign: 'center' }}>Teacher Name</Text>
                      <Text style={{ flex: 2, fontWeight: 'bold', textAlign: 'center' }}>Date</Text>
                      <Text style={{ flex: 1, fontWeight: 'bold', textAlign: 'center' }}>Status</Text>
                    </View>
                    {Object.entries(teacherAttendanceRecords[`${teacherViewDate}`] || {}).map(([teacherId, status]) => {
                      const teacher = TEACHERS.find(t => t.id.toString() === teacherId.toString());
                      return (
                        <View key={teacherId} style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f5f5f5', paddingVertical: 10 }}>
                          <Text style={{ flex: 1, textAlign: 'center' }}>{teacher?.rollNo || '-'}</Text>
                          <Text style={{ flex: 3, textAlign: 'center' }}>{teacher?.name || '-'}</Text>
                          <Text style={{ flex: 2, textAlign: 'center' }}>{formatDateDMY(teacherViewDate)}</Text>
                          <Text style={{ flex: 1, textAlign: 'center', fontSize: 13 }}>{status === 'Present' ? 'P' : status === 'Absent' ? 'A' : status}</Text>
                        </View>
                      );
                    })}
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
                    <TouchableOpacity onPress={exportTeacherToPDF} style={{ backgroundColor: '#4CAF50', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 18, marginRight: 8 }}>
                      <Text style={{ color: '#fff', fontWeight: 'bold' }}>Export to PDF</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setTeacherViewModalVisible(false)} style={{ backgroundColor: '#2196F3', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 18 }}>
                      <Text style={{ color: '#fff', fontWeight: 'bold' }}>Close</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          </View>
        )}
      </ScrollView>
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 28, // Increased for mobile header spacing
    paddingBottom: 8, // Keep lower padding
  },
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tabButtonActive: {
    borderBottomWidth: 3,
    borderBottomColor: '#2196F3',
    backgroundColor: '#f0f8ff',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
  tabTextActive: {
    color: '#2196F3',
  },
  recordsContainer: {
    padding: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 6,
    marginBottom: 6,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  tableCell: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    textAlign: 'left',
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

export default AttendanceManagement; 