import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Modal, ScrollView, Button, Platform, Animated, Easing, Pressable } from 'react-native';
import Header from '../../components/Header';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import DropDownPicker from 'react-native-dropdown-picker';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// Mock student data
const mockStudents = [
  {
    id: '1',
    name: 'Alice Johnson',
    class: '10',
    section: 'A',
    photo: '',
    attendance: 95,
    marks: 88,
    feeStatus: 'Paid',
    parent: { name: 'John Johnson', contact: '1234567890' },
    contact: 'alice@email.com',
    homework: 'Completed',
    attendanceHistory: [90, 92, 95, 97],
    marksHistory: [80, 85, 88, 90],
    notifications: ['PTM on Friday', 'Fee paid'],
  },
  {
    id: '2',
    name: 'Bob Smith',
    class: '10',
    section: 'B',
    photo: '',
    attendance: 87,
    marks: 76,
    feeStatus: 'Due',
    parent: { name: 'Mary Smith', contact: '9876543210' },
    contact: 'bob@email.com',
    homework: 'Pending',
    attendanceHistory: [85, 87, 89, 87],
    marksHistory: [70, 75, 76, 78],
    notifications: ['Homework pending', 'Fee due'],
  },
  {
    id: '3',
    name: 'Charlie Lee',
    class: '9',
    section: 'A',
    photo: '',
    attendance: 92,
    marks: 81,
    feeStatus: 'Paid',
    parent: { name: 'Linda Lee', contact: '5551234567' },
    contact: 'charlie@email.com',
    homework: 'Completed',
    attendanceHistory: [90, 91, 92, 92],
    marksHistory: [78, 80, 81, 83],
    notifications: ['Science project due', 'Library book returned'],
  },
  {
    id: '4',
    name: 'Diana Patel',
    class: '9',
    section: 'B',
    photo: '',
    attendance: 98,
    marks: 93,
    feeStatus: 'Paid',
    parent: { name: 'Raj Patel', contact: '5559876543' },
    contact: 'diana@email.com',
    homework: 'Completed',
    attendanceHistory: [97, 98, 98, 99],
    marksHistory: [90, 92, 93, 94],
    notifications: ['Math Olympiad', 'Fee paid'],
  },
  {
    id: '5',
    name: 'Ethan Brown',
    class: '10',
    section: 'A',
    photo: '',
    attendance: 80,
    marks: 70,
    feeStatus: 'Due',
    parent: { name: 'Sarah Brown', contact: '5552223333' },
    contact: 'ethan@email.com',
    homework: 'Pending',
    attendanceHistory: [78, 80, 81, 80],
    marksHistory: [65, 68, 70, 72],
    notifications: ['Fee due', 'Homework pending'],
  },
  {
    id: '6',
    name: 'Fatima Khan',
    class: '9',
    section: 'A',
    photo: '',
    attendance: 89,
    marks: 85,
    feeStatus: 'Paid',
    parent: { name: 'Imran Khan', contact: '5554445555' },
    contact: 'fatima@email.com',
    homework: 'Completed',
    attendanceHistory: [88, 89, 90, 89],
    marksHistory: [82, 84, 85, 86],
    notifications: ['Sports day', 'PTM on Friday'],
  },
  {
    id: '7',
    name: 'George Miller',
    class: '10',
    section: 'B',
    photo: '',
    attendance: 91,
    marks: 79,
    feeStatus: 'Paid',
    parent: { name: 'Helen Miller', contact: '5556667777' },
    contact: 'george@email.com',
    homework: 'Completed',
    attendanceHistory: [90, 91, 91, 92],
    marksHistory: [75, 77, 79, 80],
    notifications: ['Library book due', 'Fee paid'],
  },
  // Add more mock students as needed
];

const ViewStudentInfo = () => {
  const [students, setStudents] = useState(mockStudents);
  const [search, setSearch] = useState('');
  const [showClear, setShowClear] = useState(false);
  const [filterClass, setFilterClass] = useState(null);
  const [filterSection, setFilterSection] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalAnim] = useState(new Animated.Value(0));
  const navigation = useNavigation();
  // Remove showAttendance and showMarks state

  // Dropdown state for react-native-dropdown-picker
  const [classOpen, setClassOpen] = useState(false);
  const [sectionOpen, setSectionOpen] = useState(false);
  const [classItems, setClassItems] = useState(
    Array.from(new Set(students.map(s => s.class))).map(cls => ({ label: cls, value: cls }))
  );
  const [sectionItems, setSectionItems] = useState(
    Array.from(new Set(students.map(s => s.section))).map(sec => ({ label: sec, value: sec }))
  );

  // Update section items when class changes
  const onClassChange = useCallback((value) => {
    setFilterClass(value);
    setFilterSection(null);
    const filteredSections = students.filter(s => s.class === value).map(s => s.section);
    setSectionItems(Array.from(new Set(filteredSections)).map(sec => ({ label: sec, value: sec })));
  }, [students]);

  // Animate modal open/close
  const openModal = () => {
    setModalVisible(true);
    Animated.timing(modalAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
      easing: Easing.out(Easing.ease),
    }).start();
  };
  const closeModal = () => {
    Animated.timing(modalAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
      easing: Easing.in(Easing.ease),
    }).start(() => setModalVisible(false));
  };

  // Filter logic
  const filteredStudents = students.filter(student => {
    const matchesName = student.name.toLowerCase().includes(search.toLowerCase());
    const matchesClass = filterClass ? student.class === filterClass : true;
    const matchesSection = filterSection ? student.section === filterSection : true;
    return matchesName && matchesClass && matchesSection;
  });

  // Export handlers
  const handleExportCSV = async () => {
    try {
      // Prepare CSV header and rows
      const header = 'Name,Class,Section,Attendance,Marks,Fee Status,Parent Name,Parent Contact,Contact,Homework\n';
      const rows = filteredStudents.map(s =>
        [
          s.name,
          s.class,
          s.section,
          s.attendance,
          s.marks,
          s.feeStatus,
          s.parent.name,
          s.parent.contact,
          s.contact,
          s.homework
        ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
      ).join('\n');
      const csv = header + rows;
      // Write to file
      const fileUri = FileSystem.cacheDirectory + 'students.csv';
      await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });
      // Share
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: 'Export Students CSV' });
      } else {
        alert('Sharing is not available on this device');
      }
    } catch (e) {
      alert('CSV export failed: ' + e.message);
    }
  };

  const handleExportPDF = async () => {
    try {
      // Prepare HTML table
      const tableRows = filteredStudents.map(s => `
        <tr>
          <td>${s.name}</td>
          <td>${s.class}</td>
          <td>${s.section}</td>
          <td>${s.attendance}%</td>
          <td>${s.marks}</td>
          <td>${s.feeStatus}</td>
          <td>${s.parent.name}</td>
          <td>${s.parent.contact}</td>
          <td>${s.contact}</td>
          <td>${s.homework}</td>
        </tr>
      `).join('');
      const html = `
        <html>
        <head>
          <style>
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #888; padding: 6px; font-size: 12px; }
            th { background: #1976d2; color: #fff; }
          </style>
        </head>
        <body>
          <h2>Student List</h2>
          <table>
            <tr>
              <th>Name</th><th>Class</th><th>Section</th><th>Attendance</th><th>Marks</th><th>Fee Status</th><th>Parent Name</th><th>Parent Contact</th><th>Contact</th><th>Homework</th>
            </tr>
            ${tableRows}
          </table>
        </body>
        </html>
      `;
      // Generate PDF
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      // Share
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Export Students PDF' });
      } else {
        alert('Sharing is not available on this device');
      }
    } catch (e) {
      alert('PDF export failed: ' + e.message);
    }
  };

  // Student card with touch feedback (using Pressable)
  const renderStudent = ({ item }) => (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
      onPress={() => { setSelectedStudent(item); openModal(); }}
    >
      <View style={styles.avatarPlaceholder} />
      <View style={{ flex: 1 }}>
        <Text style={styles.studentName}>{item.name}</Text>
        <Text style={styles.studentInfo}>Class: {item.class} | Section: {item.section}</Text>
        <Text style={styles.studentInfo}>Attendance: {item.attendance}% | Marks: {item.marks}</Text>
        <Text style={styles.studentInfo}>Fee: {item.feeStatus}</Text>
      </View>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <Header title="View Student Info" showBack={true} />
      <View style={styles.searchBar}>
        <View style={{ zIndex: 3000, marginBottom: 12 }}>
          <DropDownPicker
            open={classOpen}
            value={filterClass}
            items={classItems}
            setOpen={setClassOpen}
            setValue={onClassChange}
            setItems={setClassItems}
            placeholder="Select Class"
            style={styles.dropdown}
            containerStyle={styles.dropdownContainer}
            zIndex={3000}
          />
        </View>
        <View style={{ zIndex: 2000, marginBottom: 12 }}>
          <DropDownPicker
            open={sectionOpen}
            value={filterSection}
            items={sectionItems}
            setOpen={setSectionOpen}
            setValue={setFilterSection}
            setItems={setSectionItems}
            placeholder="Select Section"
            style={styles.dropdown}
            containerStyle={styles.dropdownContainer}
            zIndex={2000}
            disabled={!filterClass}
          />
        </View>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name"
            value={search}
            onChangeText={text => {
              setSearch(text);
              setShowClear(!!text);
            }}
            placeholderTextColor="#aaa"
          />
          {showClear && (
            <TouchableOpacity onPress={() => { setSearch(''); setShowClear(false); }}>
              <Ionicons name="close-circle" size={20} color="#bbb" />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.exportRow}>
          <TouchableOpacity
            style={styles.exportBtn}
            activeOpacity={0.7}
            onPress={handleExportCSV}
          >
            <Text style={styles.exportText}>CSV</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.exportBtn}
            activeOpacity={0.7}
            onPress={handleExportPDF}
          >
            <Text style={styles.exportText}>PDF</Text>
          </TouchableOpacity>
        </View>
      </View>
      <FlatList
        data={filteredStudents}
        keyExtractor={item => item.id}
        renderItem={renderStudent}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>No students found.</Text>}
      />
      {/* Student Profile Modal with animation */}
      <Modal
        visible={modalVisible}
        animationType="none"
        transparent={true}
        onRequestClose={closeModal}
      >
        <Animated.View style={[styles.modalOverlay, { opacity: modalAnim }]}>
          <Animated.View style={[styles.modalContent, { transform: [{ scale: modalAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) }] }]}>
            <ScrollView>
              {selectedStudent && (
                <>
                  <View style={styles.profileHeader}>
                    <View style={styles.avatarLarge} />
                    <Text style={styles.profileName}>{selectedStudent.name}</Text>
                    <Text style={styles.profileInfo}>Class: {selectedStudent.class} | Section: {selectedStudent.section}</Text>
                  </View>
                  <Text style={styles.profileLabel}>Attendance %</Text>
                  <Text style={styles.profileValue}>{selectedStudent.attendance}%</Text>
                  <Text style={styles.profileLabel}>Marks Summary</Text>
                  <Text style={styles.profileValue}>{selectedStudent.marks}</Text>
                  <Text style={styles.profileLabel}>Homework</Text>
                  <Text style={styles.profileValue}>{selectedStudent.homework}</Text>
                  <Text style={styles.profileLabel}>Fee Status</Text>
                  <Text style={styles.profileValue}>{selectedStudent.feeStatus}</Text>
                  <Text style={styles.profileLabel}>Contact Info</Text>
                  <Text style={styles.profileValue}>{selectedStudent.contact}</Text>
                  <Text style={styles.profileLabel}>Parent/Guardian</Text>
                  <Text style={styles.profileValue}>{selectedStudent.parent.name} ({selectedStudent.parent.contact})</Text>
                  <Text style={styles.profileLabel}>Recent Notifications</Text>
                  {selectedStudent.notifications.map((note, idx) => (
                    <Text key={idx} style={styles.profileValue}>- {note}</Text>
                  ))}
                  {/* Side by side action buttons */}
                  <View style={styles.modalActionRow}>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.modalActionBtn]}
                      onPress={() => {
                        closeModal();
                        setTimeout(() => {
                          navigation.navigate('StudentAttendanceScreen', { student: selectedStudent });
                        }, 300);
                      }}
                    >
                      <Text style={styles.actionBtnText}>View Attendance</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.modalActionBtn]}
                      onPress={() => {
                        closeModal();
                        setTimeout(() => {
                          navigation.navigate('StudentMarksScreen', { student: selectedStudent });
                        }, 300);
                      }}
                    >
                      <Text style={styles.actionBtnText}>View Marks</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
              <Button title="Close" onPress={closeModal} />
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#eee',
    flexWrap: 'wrap',
  },
  input: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    marginRight: 8,
    marginBottom: 6,
    minWidth: 90,
    flexGrow: 1,
  },
  exportBtn: {
    backgroundColor: '#1976d2',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 4,
    marginBottom: 6,
  },
  exportText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  list: {
    padding: 10,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#bdbdbd',
    marginRight: 16,
  },
  studentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  studentInfo: {
    fontSize: 14,
    color: '#666',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 40,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '85%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    elevation: 5,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#bdbdbd',
    marginBottom: 10,
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
  },
  profileInfo: {
    fontSize: 16,
    color: '#555',
    marginBottom: 8,
  },
  profileLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1976d2',
    marginTop: 10,
  },
  profileValue: {
    fontSize: 15,
    color: '#333',
    marginBottom: 4,
  },
  dropdown: {
    borderColor: '#e0e0e0',
    borderRadius: 8,
    minHeight: 44,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  dropdownContainer: {
    marginBottom: 8,
    zIndex: 3000,
  },
  exportRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  pickerWrapper: {
    flex: 1,
    minWidth: 110,
    marginRight: 8,
    marginBottom: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 44,
    width: '100%',
  },
  actionBtn: {
    backgroundColor: '#1976d2',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginVertical: 8,
    alignSelf: 'flex-start',
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  detailBox: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    marginTop: -4,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingVertical: 6,
  },
  cardPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.85,
    backgroundColor: '#e3f2fd',
  },
  modalActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 10,
    gap: 12,
  },
  modalActionBtn: {
    flex: 1,
    marginHorizontal: 6,
  },
});

export default ViewStudentInfo; 