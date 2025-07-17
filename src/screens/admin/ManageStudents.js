import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import StatCard from '../../components/StatCard';
import { Picker } from '@react-native-picker/picker';

const DUMMY_STUDENTS = [
  {
    id: '1',
    roll: '101',
    name: 'Amit Sharma',
    class: '5',
    section: 'A',
    parent: 'Rajesh Sharma',
    contact: '9876543210',
    attendance: '95%',
    marks: '88',
    fees: 'Paid',
  },
  {
    id: '2',
    roll: '102',
    name: 'Priya Singh',
    class: '6',
    section: 'B',
    parent: 'Sunita Singh',
    contact: '9123456780',
    attendance: '97%',
    marks: '92',
    fees: 'Unpaid',
  },
  {
    id: '3',
    roll: '103',
    name: 'Rahul Verma',
    class: '5',
    section: 'A',
    parent: 'Anil Verma',
    contact: '9988776655',
    attendance: '92%',
    marks: '75',
    fees: 'Paid',
  },
  {
    id: '4',
    roll: '104',
    name: 'Sneha Gupta',
    class: '7',
    section: 'C',
    parent: 'Meena Gupta',
    contact: '9001122334',
    attendance: '98%',
    marks: '89',
    fees: 'Unpaid',
  },
];

const ManageStudents = () => {
  const [students, setStudents] = useState(DUMMY_STUDENTS);
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ roll: '', name: '', class: '', section: '', parent: '', contact: '', marks: '', fees: '' });
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editForm, setEditForm] = useState({ roll: '', name: '', class: '', section: '', parent: '', contact: '', marks: '', fees: '' });
  const [scoreModalVisible, setScoreModalVisible] = useState(false);
  const [scoreStudent, setScoreStudent] = useState(null);
  const [selectedClass, setSelectedClass] = useState('All');
  const [selectedSection, setSelectedSection] = useState('All');

  const classOptions = ['All', '5', '6', '7'];
  const sectionOptions = ['All', 'A', 'B', 'C'];

  const handleAddStudent = () => {
    setForm(form => ({
      ...form,
      class: selectedClass !== 'All' ? selectedClass : '',
      section: selectedSection !== 'All' ? selectedSection : '',
    }));
    setModalVisible(true);
  };

  const handleFormChange = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  const handleSubmit = () => {
    if (!form.roll || !form.name || !form.class || !form.section || !form.parent || !form.contact) return;
    const newStudent = {
      id: (students.length + 1).toString(),
      ...form,
      attendance: '0%', // Default attendance
    };
    setStudents([newStudent, ...students]);
    setForm({ roll: '', name: '', class: '', section: '', parent: '', contact: '', marks: '', fees: '' });
    setModalVisible(false);
  };

  const handleDelete = (id) => {
    setStudents(students.filter((student) => student.id !== id));
  };

  const handleEdit = (student) => {
    setSelectedStudent(student);
    setEditForm({
      roll: student.roll,
      name: student.name,
      class: student.class,
      section: student.section,
      parent: student.parent,
      contact: student.contact,
      marks: student.marks,
      fees: student.fees,
    });
    setEditModalVisible(true);
  };

  const handleEditFormChange = (field, value) => {
    setEditForm({ ...editForm, [field]: value });
  };

  const handleEditSave = () => {
    setStudents(students.map(s =>
      s.id === selectedStudent.id ? { ...s, ...editForm } : s
    ));
    setEditModalVisible(false);
    setSelectedStudent(null);
  };

  const handleViewProfile = (student) => {
    setSelectedStudent(student);
    setViewModalVisible(true);
  };

  const handleViewScore = (student) => {
    setScoreStudent(student);
    setScoreModalVisible(true);
  };

  const getAverageAttendance = (students) => {
    if (!students.length) return '0%';
    const total = students.reduce((sum, s) => sum + parseInt(s.attendance), 0);
    return (total / students.length).toFixed(1) + '%';
  };

  const studentStats = [
    { title: 'Total Students', value: students.length.toString(), icon: 'people', color: '#2196F3', subtitle: 'All enrolled' },
    { title: 'Attendance', value: getAverageAttendance(students), icon: 'checkmark-circle', color: '#4CAF50', subtitle: 'Avg. attendance' },
  ];

  const filteredStudents = students.filter(
    s =>
      (selectedClass === 'All' || s.class === selectedClass) &&
      (selectedSection === 'All' || s.section === selectedSection) &&
      (s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.roll.toLowerCase().includes(search.toLowerCase()))
  );

  const renderStudent = ({ item, index }) => (
    <View style={[styles.teacherCard, index === 0 && styles.topStudentCard]}>
      {index === 0 && (
        <View style={styles.topBadge}>
          <Ionicons name="star" size={16} color="#fff" />
          <Text style={styles.topBadgeText}>Top Student</Text>
        </View>
      )}
      <TouchableOpacity activeOpacity={0.8} onPress={() => handleViewProfile(item)} style={{ flex: 1 }}>
        <View style={styles.teacherInfo}>
          <View style={styles.teacherAvatar}>
            <Ionicons name="person" size={24} color="#2196F3" />
          </View>
          <View style={styles.teacherDetails}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.teacherName}>{item.name}</Text>
              <Text style={styles.rollNumber}>  #{item.roll}</Text>
            </View>
            <View style={styles.classRow}>
              <Ionicons name="school" size={26} color="#2196F3" style={{ marginRight: 6 }} />
              <Text style={styles.classBigValue}>Class {item.class}</Text>
              <Text style={styles.sectionBigValue}>  | Section {item.section}</Text>
            </View>
            <Text style={styles.teacherParent}>Parent: {item.parent}</Text>
            <Text style={styles.teacherContact}>Contact: {item.contact}</Text>
            <Text style={styles.marksFees}>Fees: <Text style={item.fees === 'Paid' ? styles.feesPaid : styles.feesUnpaid}>{item.fees}</Text></Text>
        </View>
          <View style={styles.teacherStats}>
          <Text style={styles.attendanceText}>{item.attendance}</Text>
          <Text style={styles.attendanceLabel}>Attendance</Text>
        </View>
      </View>
      </TouchableOpacity>
      <View style={styles.teacherActions}>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleViewProfile(item)}>
          <Ionicons name="eye" size={16} color="#2196F3" />
          <Text style={styles.actionText}>View</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.viewScoreBtn} onPress={() => handleViewScore(item)}>
          <Ionicons name="trophy-outline" size={18} color="#fff" style={{ marginRight: 4 }} />
          <Text style={styles.viewScoreBtnText}>View Score</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleEdit(item)}>
          <Ionicons name="create" size={16} color="#FF9800" />
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleDelete(item.id)}>
          <Ionicons name="trash" size={16} color="#f44336" />
          <Text style={styles.actionText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header title="Manage Students" />
      <View style={styles.filterRow}>
        <View style={[styles.filterCol, styles.filterColMargin]}>
          <Text style={styles.filterLabelBlue}>Class</Text>
          <View style={styles.filterBoxBlue}>
            <Picker
              selectedValue={selectedClass}
              onValueChange={setSelectedClass}
              style={styles.pickerBlue}
            >
              {classOptions.map(opt => (
                <Picker.Item key={opt} label={opt === 'All' ? 'All Classes' : `Class ${opt}`} value={opt} />
              ))}
            </Picker>
          </View>
        </View>
        <View style={styles.filterCol}>
          <Text style={styles.filterLabelGreen}>Section</Text>
          <View style={styles.filterBoxGreen}>
            <Picker
              selectedValue={selectedSection}
              onValueChange={setSelectedSection}
              style={styles.pickerGreen}
            >
              {sectionOptions.map(opt => (
                <Picker.Item key={opt} label={opt === 'All' ? 'All Sections' : opt} value={opt} />
              ))}
            </Picker>
          </View>
        </View>
      </View>
      <View style={styles.searchBarContainer}>
        <Ionicons name="search" size={24} color="#2196F3" style={{ marginRight: 10 }} />
        <TextInput
          style={styles.searchBar}
          placeholder="Search by name or roll number"
          value={search}
          onChangeText={setSearch}
        />
      </View>
      <FlatList
        data={filteredStudents}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => renderStudent({ item, index })}
        contentContainerStyle={{ paddingBottom: 80, paddingHorizontal: 8 }}
      />
      <TouchableOpacity style={styles.fab} onPress={handleAddStudent}>
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Student</Text>
            <Text style={styles.inputLabel}>Roll Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Roll Number"
              value={form.roll}
              onChangeText={(text) => handleFormChange('roll', text)}
              keyboardType="number-pad"
            />
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Name"
              value={form.name}
              onChangeText={(text) => handleFormChange('name', text)}
            />
            <Text style={styles.inputLabel}>Class</Text>
            <TextInput
              style={styles.input}
              placeholder="Class"
              value={form.class}
              onChangeText={(text) => handleFormChange('class', text)}
            />
            <Text style={styles.inputLabel}>Section</Text>
            <TextInput
              style={styles.input}
              placeholder="Section"
              value={form.section}
              onChangeText={(text) => handleFormChange('section', text)}
            />
            <Text style={styles.inputLabel}>Parent Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Parent Name"
              value={form.parent}
              onChangeText={(text) => handleFormChange('parent', text)}
            />
            <Text style={styles.inputLabel}>Contact</Text>
            <TextInput
              style={styles.input}
              placeholder="Contact"
              value={form.contact}
              onChangeText={(text) => handleFormChange('contact', text)}
              keyboardType="phone-pad"
            />
            <Text style={styles.inputLabel}>Marks</Text>
            <TextInput
              style={styles.input}
              placeholder="Marks"
              value={form.marks}
              onChangeText={(text) => handleFormChange('marks', text)}
              keyboardType="number-pad"
            />
            <Text style={styles.inputLabel}>Fees (Paid/Unpaid)</Text>
            <TextInput
              style={styles.input}
              placeholder="Fees (Paid/Unpaid)"
              value={form.fees}
              onChangeText={(text) => handleFormChange('fees', text)}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalButton} onPress={handleSubmit}>
                <Text style={styles.modalButtonText}>Add</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#aaa' }]} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Add View Modal */}
      <Modal
        visible={viewModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setViewModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Student Profile</Text>
            {selectedStudent && (
              <>
                <Text style={styles.profileField}><Text style={styles.profileLabel}>Name:</Text> {selectedStudent.name}</Text>
                <Text style={styles.profileField}><Text style={styles.profileLabel}>Roll Number:</Text> {selectedStudent.roll}</Text>
                <Text style={styles.profileField}><Text style={styles.profileLabel}>Class:</Text> {selectedStudent.class}</Text>
                <Text style={styles.profileField}><Text style={styles.profileLabel}>Section:</Text> {selectedStudent.section}</Text>
                <Text style={styles.profileField}><Text style={styles.profileLabel}>Parent:</Text> {selectedStudent.parent}</Text>
                <Text style={styles.profileField}><Text style={styles.profileLabel}>Contact:</Text> {selectedStudent.contact}</Text>
                <Text style={styles.profileField}><Text style={styles.profileLabel}>Marks:</Text> <Text style={styles.marksBigValue}>{selectedStudent.marks}</Text></Text>
                <Text style={styles.profileField}><Text style={styles.profileLabel}>Fees:</Text> <Text style={selectedStudent.fees === 'Paid' ? styles.feesPaid : styles.feesUnpaid}>{selectedStudent.fees}</Text></Text>
                <Text style={styles.profileField}><Text style={styles.profileLabel}>Attendance:</Text> <Text style={styles.attendanceText}>{selectedStudent.attendance}</Text></Text>
              </>
            )}
            <TouchableOpacity style={[styles.modalButton, { marginTop: 18 }]} onPress={() => setViewModalVisible(false)}>
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Student</Text>
            <Text style={styles.inputLabel}>Roll Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Roll Number"
              value={editForm.roll}
              onChangeText={(text) => handleEditFormChange('roll', text)}
              keyboardType="number-pad"
            />
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Name"
              value={editForm.name}
              onChangeText={(text) => handleEditFormChange('name', text)}
            />
            <Text style={styles.inputLabel}>Class</Text>
            <TextInput
              style={styles.input}
              placeholder="Class"
              value={editForm.class}
              onChangeText={(text) => handleEditFormChange('class', text)}
            />
            <Text style={styles.inputLabel}>Section</Text>
            <TextInput
              style={styles.input}
              placeholder="Section"
              value={editForm.section}
              onChangeText={(text) => handleEditFormChange('section', text)}
            />
            <Text style={styles.inputLabel}>Parent Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Parent Name"
              value={editForm.parent}
              onChangeText={(text) => handleEditFormChange('parent', text)}
            />
            <Text style={styles.inputLabel}>Contact</Text>
            <TextInput
              style={styles.input}
              placeholder="Contact"
              value={editForm.contact}
              onChangeText={(text) => handleEditFormChange('contact', text)}
              keyboardType="phone-pad"
            />
            <Text style={styles.inputLabel}>Marks</Text>
            <TextInput
              style={styles.input}
              placeholder="Marks"
              value={editForm.marks}
              onChangeText={(text) => handleEditFormChange('marks', text)}
              keyboardType="number-pad"
            />
            <Text style={styles.inputLabel}>Fees (Paid/Unpaid)</Text>
            <TextInput
              style={styles.input}
              placeholder="Fees (Paid/Unpaid)"
              value={editForm.fees}
              onChangeText={(text) => handleEditFormChange('fees', text)}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalButton} onPress={handleEditSave}>
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#aaa' }]} onPress={() => setEditModalVisible(false)}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Score Modal */}
      <Modal
        visible={scoreModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setScoreModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Student Score</Text>
            {scoreStudent && (
              <>
                <Text style={styles.profileField}><Text style={styles.profileLabel}>Name:</Text> {scoreStudent.name}</Text>
                <Text style={styles.profileField}><Text style={styles.profileLabel}>Roll Number:</Text> {scoreStudent.roll}</Text>
                <Text style={styles.profileField}><Text style={styles.profileLabel}>Marks:</Text> <Text style={styles.marksBigValue}>{scoreStudent.marks}</Text></Text>
              </>
            )}
            <TouchableOpacity style={[styles.modalButton, { marginTop: 18 }]} onPress={() => setScoreModalVisible(false)}>
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
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
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
    alignSelf: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
  detail: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
  },
  profileBtn: {
    marginTop: 10,
    alignSelf: 'flex-end',
    backgroundColor: '#1976d2',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 5,
  },
  profileBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#1976d2',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    alignSelf: 'center',
    marginBottom: 16,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    elevation: 5,
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
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    backgroundColor: '#1976d2',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 6,
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  actionBtn: {
    backgroundColor: '#1976d2',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 5,
    marginLeft: 8,
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  studentCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#222',
  },
  studentDetails: {
    fontSize: 14,
    color: '#555',
    marginTop: 2,
  },
  studentParent: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  studentContact: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  studentActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    paddingVertical: 7,
    paddingHorizontal: 14,
    marginLeft: 8,
  },
  viewButton: {
    backgroundColor: '#e3f2fd',
  },
  editButton: {
    backgroundColor: '#fff3e0',
  },
  deleteButton: {
    backgroundColor: '#ffebee',
  },
  viewButtonText: {
    color: '#2196F3',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  editButtonText: {
    color: '#FF9800',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  deleteButtonText: {
    color: '#f44336',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  profileField: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  profileLabel: {
    fontWeight: 'bold',
    color: '#1976d2',
  },
  statsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  teacherCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  teacherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  teacherAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e3f2fd',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  teacherDetails: {
    flex: 1,
  },
  teacherName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
  },
  teacherClass: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  teacherParent: {
    fontSize: 13,
    color: '#888',
    marginBottom: 2,
  },
  teacherContact: {
    fontSize: 13,
    color: '#888',
  },
  teacherStats: {
    alignItems: 'center',
    marginLeft: 12,
  },
  attendanceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  attendanceLabel: {
    fontSize: 10,
    color: '#666',
  },
  teacherActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginLeft: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    backgroundColor: '#4CAF50',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#2196F3',
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    marginTop: 4,
    height: 44,
  },
  searchBar: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  rollNumber: {
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  marksFees: {
    fontSize: 13,
    color: '#555',
    marginTop: 2,
  },
  marksValue: {
    color: '#1976d2',
    fontWeight: 'bold',
  },
  feesPaid: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  feesUnpaid: {
    color: '#f44336',
    fontWeight: 'bold',
  },
  marksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  marksBigValue: {
    fontSize: 22,
    color: '#FF9800',
    fontWeight: 'bold',
    marginRight: 2,
  },
  marksLabel: {
    fontSize: 15,
    color: '#FF9800',
    fontWeight: 'bold',
    marginRight: 8,
  },
  classRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 2,
  },
  classBigValue: {
    fontSize: 15,
    color: '#2196F3',
    fontWeight: 'bold',
    marginRight: 2,
  },
  sectionBigValue: {
    fontSize: 15,
    color: '#1976d2',
    fontWeight: 'bold',
    marginLeft: 2,
  },
  viewScoreBtn: {
    backgroundColor: '#ffe0b2',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginLeft: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  viewScoreBtnText: {
    color: '#FF9800',
    fontWeight: 'bold',
    fontSize: 14,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginHorizontal: 16,
    marginBottom: 8,
    marginTop: 4,
  },
  filterCol: {
    flex: 1,
  },
  filterColMargin: {
    marginRight: 6,
  },
  filterLabelBlue: {
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 2,
    marginLeft: 4,
    fontSize: 15,
  },
  filterLabelGreen: {
    fontWeight: 'bold',
    color: '#388e3c',
    marginBottom: 2,
    marginLeft: 4,
    fontSize: 15,
  },
  filterBoxBlue: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    borderWidth: 2.5,
    borderColor: '#2196F3',
    height: 54,
    justifyContent: 'center',
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
    minHeight: 48,
    paddingVertical: 4,
  },
  filterBoxGreen: {
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    borderWidth: 2.5,
    borderColor: '#4CAF50',
    height: 54,
    justifyContent: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
    minHeight: 48,
    paddingVertical: 4,
  },
  pickerBlue: {
    width: '100%',
    height: 54,
    color: '#1976d2',
    fontWeight: 'bold',
    textAlignVertical: 'center',
    fontSize: 18,
  },
  pickerGreen: {
    width: '100%',
    height: 54,
    color: '#388e3c',
    fontWeight: 'bold',
    textAlignVertical: 'center',
    fontSize: 18,
  },
  topStudentCard: {
    backgroundColor: '#fffde7',
    borderColor: '#FFD600',
    borderWidth: 2.5,
    position: 'relative',
  },
  topBadge: {
    position: 'absolute',
    top: 8,
    right: 12,
    backgroundColor: '#FFD600',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    zIndex: 2,
    elevation: 2,
  },
  topBadgeText: {
    color: '#333',
    fontWeight: 'bold',
    marginLeft: 4,
    fontSize: 12,
  },
  inputLabel: {
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 2,
    marginLeft: 2,
    fontSize: 14,
  },
});

export default ManageStudents; 