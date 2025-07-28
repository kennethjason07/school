import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Platform,
  Alert,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import { supabase, dbHelpers } from '../../utils/supabase';
import { format } from 'date-fns';
import * as Animatable from 'react-native-animatable';
import CrossPlatformPieChart from '../../components/CrossPlatformPieChart';

const AttendanceManagement = () => {
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('student');
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [teacherAttendanceRecords, setTeacherAttendanceRecords] = useState({});
  const [teacherAttendanceMark, setTeacherAttendanceMark] = useState({});
  const [teacherEditMode, setTeacherEditMode] = useState({});
  const [teacherDate, setTeacherDate] = useState(new Date());
  const [teacherShowDatePicker, setTeacherShowDatePicker] = useState(false);
  const [teacherViewModalVisible, setTeacherViewModalVisible] = useState(false);
  const [teacherViewDate, setTeacherViewDate] = useState(new Date());
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [attendanceMark, setAttendanceMark] = useState({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [editMode, setEditMode] = useState({});
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [viewClass, setViewClass] = useState(null);
  const [viewDate, setViewDate] = useState(new Date());
  const [studentsForClass, setStudentsForClass] = useState([]); // State for filtered students

  // Calculate studentsForClass based on selectedClass and selectedSection
  useEffect(() => {
    if (selectedClass && selectedSection) {
      const filteredStudents = students.filter(student => 
        student.class_id === selectedClass && student.section === selectedSection
      );
      setStudentsForClass(filteredStudents);
    }
  }, [selectedClass, selectedSection, students]);

  useEffect(() => {
    loadAllData();
  }, []);

  // Helper function to format date as dd-mm-yyyy
  const formatDateDMY = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}-${m}-${y}`;
  };

  // When selectedClass or selectedDate changes, load attendanceMark from attendanceRecords
  useEffect(() => {
    if (!selectedClass || !selectedDate) return;
    const key = `${selectedClass}|${selectedDate.toISOString().split('T')[0]}`;
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
    const key = `${teacherDate.toISOString().split('T')[0]}`;
    const saved = teacherAttendanceRecords[key];
    if (saved) {
      setTeacherAttendanceMark(saved);
    } else {
      setTeacherAttendanceMark({});
    }
    setTeacherEditMode({});
  }, [teacherDate]);

  // Mark attendance for all students in modal
  const handleMarkAttendance = async () => {
    try {
      const key = `${selectedClass}|${selectedDate.toISOString().split('T')[0]}`;
      const attendanceDate = selectedDate.toISOString().split('T')[0];

      // Delete existing attendance records for this class/date
      await supabase
        .from('attendance')
        .delete()
        .eq('class_id', selectedClass)
        .eq('attendance_date', attendanceDate);

      // Insert new attendance records
      const records = Object.entries(attendanceMark).map(([studentId, status]) => ({
        class_id: selectedClass,
        student_id: studentId,
        attendance_date: attendanceDate,
        status: status
      }));

      await supabase
        .from('attendance')
        .insert(records);

      // Update local state
      setAttendanceRecords({
        ...attendanceRecords,
        [key]: { ...attendanceMark },
      });
      setEditMode({});

      // Show confirmation popup
      Alert.alert('Success', 'Attendance saved successfully!');
    } catch (error) {
      console.error('Error saving attendance:', error);
      Alert.alert('Error', 'Failed to save attendance');
    }
  };

  // Handle teacher attendance marking
  const handleTeacherMarkAttendance = async () => {
    try {
      const attendanceDate = teacherDate.toISOString().split('T')[0];

      // Delete existing teacher attendance records for this date
      await supabase
        .from('teacher_attendance')
        .delete()
        .eq('attendance_date', attendanceDate);

      // Insert new teacher attendance records
      const records = Object.entries(teacherAttendanceMark).map(([teacherId, status]) => ({
        teacher_id: teacherId,
        attendance_date: attendanceDate,
        status: status
      }));

      await supabase
        .from('teacher_attendance')
        .insert(records);

      // Update local state
      const key = attendanceDate;
      setTeacherAttendanceRecords({
        ...teacherAttendanceRecords,
        [key]: { ...teacherAttendanceMark },
      });
      setTeacherEditMode({});

      // Show confirmation popup
      Alert.alert('Success', 'Teacher attendance saved successfully!');
    } catch (error) {
      console.error('Error saving teacher attendance:', error);
      Alert.alert('Error', 'Failed to save teacher attendance');
    }
  };

  // PDF Export Functions
  const exportToPDF = async () => {
    if (loading) return;

    try {
      const attendanceDate = viewDate.toISOString().split('T')[0];
      const records = Object.entries(attendanceRecords[attendanceDate] || {});

      if (Platform.OS === 'web') {
        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.text(`Attendance for Class ${viewClass} on ${formatDateDMY(viewDate)}`, 105, 20, { align: 'center' });
        doc.setFontSize(12);
        
        // Add present students
        doc.text('Present Students:', 15, 40);
        let y = 50;
        records.forEach(([studentId, status]) => {
          if (status === 'Present') {
            const student = students.find(s => s.id === studentId);
            doc.text(`${student?.name || 'Unknown'} - Present`, 15, y);
            y += 10;
          }
        });

        // Add absent students
        doc.text('Absent Students:', 15, y + 10);
        y += 20;
        records.forEach(([studentId, status]) => {
          if (status === 'Absent') {
            const student = students.find(s => s.id === studentId);
            doc.text(`${student?.name || 'Unknown'} - Absent`, 15, y);
            y += 10;
          }
        });

        doc.save(`attendance_${viewClass}_${formatDateDMY(viewDate)}.pdf`);
      } else {
        const presentHtml = records.filter(([_, status]) => status === 'Present').map(([studentId]) => {
          const student = students.find(s => s.id === studentId);
          return `<tr><td style="text-align:center;">${student?.roll_no || '-'}</td><td style="text-align:center;">${student?.name || '-'}</td></tr>`;
        }).join('');

        const absentHtml = records.filter(([_, status]) => status === 'Absent').map(([studentId]) => {
          const student = students.find(s => s.id === studentId);
          return `<tr><td style="text-align:center;">${student?.roll_no || '-'}</td><td style="text-align:center;">${student?.name || '-'}</td></tr>`;
        }).join('');

        const formattedDate = formatDateDMY(viewDate);
        const html = `
          <h2 style="text-align:center;">Attendance for Class ${viewClass} on ${formattedDate}</h2>
          <h3 style="text-align:center;">Present Students</h3>
          <table border="1" style="border-collapse:collapse;width:100%">
            <tr><th style="text-align:center;">Roll No</th><th style="text-align:center;">Student Name</th></tr>
            ${presentHtml || '<tr><td style="text-align:center;">-</td><td style="text-align:center;">-</td></tr>'}
          </table>
          <h3 style="text-align:center;">Absent Students</h3>
          <table border="1" style="border-collapse:collapse;width:100%">
            <tr><th style="text-align:center;">Roll No</th><th style="text-align:center;">Student Name</th></tr>
            ${absentHtml || '<tr><td style="text-align:center;">-</td><td style="text-align:center;">-</td></tr>'}
          </table>
        `;

        await Print.printAsync({ html });
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
      Alert.alert('Error', 'Failed to export attendance');
    }
  };

  const exportTeacherToPDF = async () => {
    if (loading) return;

    try {
      const attendanceDate = teacherViewDate.toISOString().split('T')[0];
      const records = Object.entries(teacherAttendanceRecords[attendanceDate] || {});

      if (Platform.OS === 'web') {
        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.text(`Teacher Attendance on ${formatDateDMY(teacherViewDate)}`, 105, 20, { align: 'center' });
        doc.setFontSize(12);
        
        // Add present teachers
        doc.text('Present Teachers:', 15, 40);
        let y = 50;
        records.forEach(([teacherId, status]) => {
          if (status === 'Present') {
            const teacher = teachers.find(t => t.id === teacherId);
            doc.text(`${teacher?.name || 'Unknown'} - Present`, 15, y);
            y += 10;
          }
        });

        // Add absent teachers
        doc.text('Absent Teachers:', 15, y + 10);
        y += 20;
        records.forEach(([teacherId, status]) => {
          if (status === 'Absent') {
            const teacher = teachers.find(t => t.id === teacherId);
            doc.text(`${teacher?.name || 'Unknown'} - Absent`, 15, y);
            y += 10;
          }
        });

        doc.save(`teacher_attendance_${formatDateDMY(teacherViewDate)}.pdf`);
      } else {
        const presentHtml = records.filter(([_, status]) => status === 'Present').map(([teacherId]) => {
          const teacher = teachers.find(t => t.id === teacherId);
          return `<tr><td style="text-align:center;">${teacher?.roll_no || '-'}</td><td style="text-align:center;">${teacher?.name || '-'}</td></tr>`;
        }).join('');

        const absentHtml = records.filter(([_, status]) => status === 'Absent').map(([teacherId]) => {
          const teacher = teachers.find(t => t.id === teacherId);
          return `<tr><td style="text-align:center;">${teacher?.roll_no || '-'}</td><td style="text-align:center;">${teacher?.name || '-'}</td></tr>`;
        }).join('');

        const formattedDate = formatDateDMY(teacherViewDate);
        const html = `
          <h2 style="text-align:center;">Teacher Attendance on ${formattedDate}</h2>
          <h3 style="text-align:center;">Present Teachers</h3>
          <table border="1" style="border-collapse:collapse;width:100%">
            <tr><th style="text-align:center;">Roll No</th><th style="text-align:center;">Teacher Name</th></tr>
            ${presentHtml || '<tr><td style="text-align:center;">-</td><td style="text-align:center;">-</td></tr>'}
          </table>
          <h3 style="text-align:center;">Absent Teachers</h3>
          <table border="1" style="border-collapse:collapse;width:100%">
            <tr><th style="text-align:center;">Roll No</th><th style="text-align:center;">Teacher Name</th></tr>
            ${absentHtml || '<tr><td style="text-align:center;">-</td><td style="text-align:center;">-</td></tr>'}
          </table>
        `;

        await Print.printAsync({ html });
      }
    } catch (error) {
      console.error('Error exporting teacher attendance:', error);
      Alert.alert('Error', 'Failed to export teacher attendance');
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Attendance Management" />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1976d2" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={() => {
                setLoading(true);
                loadAllData().finally(() => setLoading(false));
              }}
            />
          }
        >
          <>
            {/* Overview Section */}
            <Animatable.View 
              style={styles.overviewContainer}
              animation="fadeInUp"
              duration={1000}
            >
              <Text style={styles.sectionTitle}>Attendance Overview</Text>
              <View style={styles.overviewStats}>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Total Students</Text>
                  <Text style={styles.statValue}>{students.length}</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Total Teachers</Text>
                  <Text style={styles.statValue}>{teachers.length}</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Today's Attendance</Text>
                  <Text style={styles.statValue}>{formatDateDMY(today.toISOString())}</Text>
                </View>
              </View>
            </Animatable.View>

            {/* Tab Navigation */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tabButton, tab === 'student' && styles.tabActive]}
                onPress={() => setTab('student')}
              >
                <Text style={[styles.tabText, tab === 'student' && styles.tabTextActive]}>Student Attendance</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabButton, tab === 'teacher' && styles.tabActive]}
                onPress={() => setTab('teacher')}
              >
                <Text style={[styles.tabText, tab === 'teacher' && styles.tabTextActive]}>Teacher Attendance</Text>
              </TouchableOpacity>
            </View>

            {/* Tab Content */}
            <Animatable.View 
              style={styles.tabContent}
              animation="fadeInUp"
              duration={800}
            >
              {tab === 'student' ? (
                <View style={styles.content}>
                  <Text style={styles.sectionTitle}>Student Attendance</Text>
                  <View style={styles.selectionContainer}>
                    <View style={styles.selectionRow}>
                      <Text style={styles.selectionLabel}>Select Class:</Text>
                      <Picker
                        selectedValue={selectedClass}
                        onValueChange={(itemValue) => setSelectedClass(itemValue)}
                        style={styles.picker}
                      >
                        <Picker.Item label="Select Section" value="" />
                        {sections.map(section => (
                          <Picker.Item key={section.id} label={section.section_name} value={section.section_name} />
                        ))}
                      </Picker>
                    </View>
                    <View style={styles.selectionRow}>
                      <Text style={styles.selectionLabel}>Select Section:</Text>
                      <Picker
                        selectedValue={selectedSection}
                        onValueChange={(itemValue) => setSelectedSection(itemValue)}
                        style={styles.picker}
                      >
                        <Picker.Item label="Select Section" value="" />
                        {sections.map(section => (
                          <Picker.Item key={section.id} label={section.section_name} value={section.section_name} />
                        ))}
                      </Picker>
                    </View>
                    <TouchableOpacity
                      style={styles.dateButton}
                      onPress={() => setShowDatePicker(true)}
                    >
                      <Ionicons name="calendar" size={24} color="#1976d2" />
                      <Text style={styles.dateButtonText}>{format(selectedDate, 'dd MMM yyyy')}</Text>
                    </TouchableOpacity>
                  </View>

                  {selectedClass && selectedSection && (
                    <FlatList
                      data={studentsForClass}
                      renderItem={({ item }) => (
                        <View style={styles.studentCard}>
                          <View style={styles.studentInfo}>
                            <Ionicons name="person" size={24} color="#1976d2" />
                            <Text style={styles.studentName}>{item.name}</Text>
                          </View>
                          <View style={styles.attendanceStatus}>
                            <TouchableOpacity
                              style={[styles.statusButton, 
                                editMode[item.id] && styles.editMode,
                                attendanceMark[item.id] === 'Present' && styles.present,
                                attendanceMark[item.id] === 'Absent' && styles.absent]}
                              onPress={() => {
                                if (editMode[item.id]) {
                                  setEditMode(prev => ({
                                    ...prev,
                                    [item.id]: false
                                  }));
                                } else {
                                  setEditMode(prev => ({
                                    ...prev,
                                    [item.id]: true
                                  }));
                                }
                              }}
                            >
                              <Text style={styles.statusText}>
                                {attendanceMark[item.id] || 'Absent'}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                      keyExtractor={item => item.id}
                    />
                  )}

                  {Object.keys(editMode).some(key => editMode[key]) && (
                    <TouchableOpacity
                      style={styles.saveButton}
                      onPress={handleMarkAttendance}
                    >
                      <Text style={styles.buttonText}>Save Attendance</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.viewButton}
                    onPress={() => {
                      setViewClass(selectedClass);
                      setViewDate(selectedDate);
                      setViewModalVisible(true);
                    }}
                  >
                    <Text style={styles.buttonText}>View Attendance</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.content}>
                  <Text style={styles.sectionTitle}>Teacher Attendance</Text>
                  <View style={styles.selectionContainer}>
                    <TouchableOpacity
                      style={styles.dateButton}
                      onPress={() => setTeacherShowDatePicker(true)}
                    >
                      <Ionicons name="calendar" size={24} color="#1976d2" />
                      <Text style={styles.dateButtonText}>{format(teacherDate, 'dd MMM yyyy')}</Text>
                    </TouchableOpacity>
                  </View>

                  <FlatList
                    data={teachers}
                    renderItem={({ item }) => (
                      <View style={styles.teacherCard}>
                        <View style={styles.teacherInfo}>
                          <Ionicons name="person" size={24} color="#1976d2" />
                          <Text style={styles.teacherName}>{item.name}</Text>
                        </View>
                        <View style={styles.attendanceStatus}>
                          <TouchableOpacity
                            style={[styles.statusButton, 
                              teacherEditMode[item.id] && styles.editMode,
                              teacherAttendanceMark[item.id] === 'Present' && styles.present,
                              teacherAttendanceMark[item.id] === 'Absent' && styles.absent]}
                            onPress={() => {
                              if (teacherEditMode[item.id]) {
                                setTeacherEditMode(prev => ({
                                  ...prev,
                                  [item.id]: false
                                }));
                              } else {
                                setTeacherEditMode(prev => ({
                                  ...prev,
                                  [item.id]: true
                                }));
                              }
                            }}
                          >
                            <Text style={styles.statusText}>
                              {teacherAttendanceMark[item.id] || 'Absent'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                    keyExtractor={item => item.id}
                  />

                  {Object.keys(teacherEditMode).some(key => teacherEditMode[key]) && (
                    <TouchableOpacity
                      style={styles.saveButton}
                      onPress={handleTeacherMarkAttendance}
                    >
                      <Text style={styles.buttonText}>Save Attendance</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.viewButton}
                    onPress={() => {
                      setTeacherViewDate(teacherDate);
                      setTeacherViewModalVisible(true);
                    }}
                  >
                    <Text style={styles.buttonText}>View Attendance</Text>
                  </TouchableOpacity>
                </View>
              )}
            </Animatable.View>
          </>
        </ScrollView>
      )}
      <Modal
        visible={viewModalVisible}
        onRequestClose={() => setViewModalVisible(false)}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Attendance for Class {viewClass} on {formatDateDMY(viewDate)}</Text>
          <View style={styles.modalContent}>
            <Text style={styles.modalSectionTitle}>Present Students</Text>
            <FlatList
              data={studentsForClass}
              renderItem={({ item }) => (
                <View style={styles.modalStudentCard}>
                  <Text style={styles.modalStudentName}>{item.name}</Text>
                  <Text style={styles.modalStudentStatus}>{attendanceMark[item.id] || 'Absent'}</Text>
                </View>
              )}
              keyExtractor={item => item.id}
            />
            <Text style={styles.modalSectionTitle}>Absent Students</Text>
            <FlatList
              data={studentsForClass}
              renderItem={({ item }) => (
                <View style={styles.modalStudentCard}>
                  <Text style={styles.modalStudentName}>{item.name}</Text>
                  <Text style={styles.modalStudentStatus}>{attendanceMark[item.id] || 'Absent'}</Text>
                </View>
              )}
              keyExtractor={item => item.id}
            />
          </View>
        </View>
      </Modal>
      <Modal
        visible={teacherViewModalVisible}
        onRequestClose={() => setTeacherViewModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Teacher Attendance on {formatDateDMY(teacherViewDate)}</Text>
          <View style={styles.modalContent}>
            <Text style={styles.modalSectionTitle}>Present Teachers</Text>
            <FlatList
              data={teachers}
              renderItem={({ item }) => (
                <View style={styles.modalTeacherCard}>
                  <Text style={styles.modalTeacherName}>{item.name}</Text>
                  <Text style={styles.modalTeacherStatus}>{teacherAttendanceMark[item.id] || 'Absent'}</Text>
                </View>
              )}
              keyExtractor={item => item.id}
            />
            <Text style={styles.modalSectionTitle}>Absent Teachers</Text>
            <FlatList
              data={teachers}
              renderItem={({ item }) => (
                <View style={styles.modalTeacherCard}>
                  <Text style={styles.modalTeacherName}>{item.name}</Text>
                  <Text style={styles.modalTeacherStatus}>{teacherAttendanceMark[item.id] || 'Absent'}</Text>
                </View>
              )}
              keyExtractor={item => item.id}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default AttendanceManagement;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 28, 
    paddingBottom: 8, 
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