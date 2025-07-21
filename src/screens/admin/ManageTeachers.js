import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';

const SUBJECTS = [
  'Mathematics', 'English', 'Science', 'History', 'Geography', 'Computer Science', 'Physics', 'Chemistry', 'Biology', 'Art', 'Music', 'Physical Education'
];
const CLASSES = [
  'Class 1A', 'Class 1B', 'Class 2A', 'Class 2B', 'Class 3A', 'Class 3B', 'Class 4A', 'Class 4B', 'Class 5A', 'Class 5B'
];

const initialTeachers = [
  { id: 1, name: 'Sarah Johnson', subjects: ['Mathematics'], classes: ['Class 5A'], students: 32, attendance: '98%', salary: 50000, qualification: 'M.Sc. Physics' },
  { id: 2, name: 'David Wilson', subjects: ['English'], classes: ['Class 4B'], students: 30, attendance: '95%', salary: 45000, qualification: 'B.Ed. English' },
  { id: 3, name: 'Emily Brown', subjects: ['Science'], classes: ['Class 3A'], students: 28, attendance: '92%', salary: 52000, qualification: 'M.Sc. Chemistry' },
  { id: 4, name: 'James Davis', subjects: ['History'], classes: ['Class 2B'], students: 31, attendance: '94%', salary: 48000, qualification: 'B.A. History' },
  { id: 5, name: 'Lisa Anderson', subjects: ['Geography'], classes: ['Class 1A'], students: 29, attendance: '96%', salary: 51000, qualification: 'M.Sc. Geography' },
];

const ManageTeachers = ({ navigation }) => {
  const [teachers, setTeachers] = useState(initialTeachers);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [form, setForm] = useState({ name: '', subjects: [], classes: [], salary: '', qualification: '' });
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Multi-select logic
  const toggleSelect = (arr, value) => arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value];

  const openAddModal = () => {
    setModalMode('add');
    setForm({ name: '', subjects: [], classes: [], salary: '', qualification: '' });
    setIsModalVisible(true);
  };
  const openEditModal = (teacher) => {
    setModalMode('edit');
    setSelectedTeacher(teacher);
    setForm({ name: teacher.name, subjects: teacher.subjects, classes: teacher.classes, salary: teacher.salary, qualification: teacher.qualification });
    setIsModalVisible(true);
  };
  const closeModal = () => {
    setIsModalVisible(false);
    setSelectedTeacher(null);
  };
  const handleSave = () => {
    if (!form.name.trim() || form.subjects.length === 0 || form.classes.length === 0) {
      alert('Please fill all fields and select at least one subject and class.');
      return;
    }
    if (modalMode === 'add') {
      const newTeacher = {
        id: Date.now() + Math.random(),
        name: form.name.trim(),
        subjects: form.subjects,
        classes: form.classes,
        students: Math.floor(Math.random() * 40) + 20,
        attendance: (90 + Math.floor(Math.random() * 10)) + '%',
        salary: form.salary,
        qualification: form.qualification,
      };
      setTeachers([...teachers, newTeacher].sort((a, b) => a.name.localeCompare(b.name)));
    } else if (modalMode === 'edit' && selectedTeacher) {
      const updatedTeachers = teachers.map(t => t.id === selectedTeacher.id ? {
        ...t,
        name: form.name.trim(),
        subjects: form.subjects,
        classes: form.classes,
        salary: form.salary,
        qualification: form.qualification,
      } : t);
      setTeachers(updatedTeachers.sort((a, b) => a.name.localeCompare(b.name)));
    }
    closeModal();
  };
  const handleDelete = (teacher) => {
    setTeachers(teachers.filter(t => t.id !== teacher.id));
  };

  // Filtered and sorted teachers
  const filteredTeachers = teachers
    .filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  const renderTeacherItem = ({ item }) => (
    <View style={styles.teacherCard}>
      <View style={styles.teacherInfo}>
        <View style={styles.teacherAvatar}>
          <Ionicons name="person" size={24} color="#4CAF50" />
        </View>
        <View style={styles.teacherDetails}>
          <Text style={styles.teacherName}>{item.name}</Text>
          <Text style={styles.teacherSubject}>{item.subjects.join(', ')}</Text>
          <Text style={styles.teacherClass}>{item.classes.join(', ')}</Text>
          {/* Salary and Education */}
          <Text style={styles.teacherSalary}>
            Salary: {item.salary ? `₹${parseFloat(item.salary).toFixed(2)}` : 'N/A'}
          </Text>
          <Text style={styles.teacherQualification}>
            Education: {item.qualification || 'N/A'}
          </Text>
        </View>
      </View>
      <View style={styles.teacherActions}>
        <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('TeacherDetails', { teacher: item })}>
          <Ionicons name="eye" size={16} color="#2196F3" />
          <Text style={styles.actionText}>View</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('AssignTaskToTeacher', { teacher: item })}>
          <Ionicons name="clipboard" size={16} color="#388e3c" />
          <Text style={styles.actionText}>Assign Task</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => openEditModal(item)}>
          <Ionicons name="create" size={16} color="#FF9800" />
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleDelete(item)}>
          <Ionicons name="trash" size={16} color="#f44336" />
          <Text style={styles.actionText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header title="Manage Teachers" showBack={true} />
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Total Teachers: {filteredTeachers.length}</Text>
          <Text style={styles.headerSubtitle}>Active Teachers</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {searchVisible && (
            <TextInput
              placeholder="Search teachers..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={{
                borderWidth: 1,
                borderColor: '#e0e0e0',
                borderRadius: 8,
                padding: 8,
                marginRight: 8,
                width: 160,
                backgroundColor: '#fafafa',
                fontSize: 15,
              }}
              autoFocus
            />
          )}
          <TouchableOpacity style={{ marginRight: 16 }} onPress={() => setSearchVisible(v => !v)}>
            <Ionicons name="search" size={24} color="#2196F3" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
        </View>
      </View>
      <FlatList
        data={filteredTeachers}
        renderItem={renderTeacherItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
      {/* Add/Edit Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: '90%', backgroundColor: '#fff', borderRadius: 12, padding: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>{modalMode === 'add' ? 'Add Teacher' : 'Edit Teacher'}</Text>
            <TextInput
              placeholder="Teacher Name"
              value={form.name}
              onChangeText={text => setForm({ ...form, name: text })}
              style={{ borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, padding: 10, marginBottom: 12, fontSize: 15, backgroundColor: '#fafafa' }}
            />
            <TextInput
              placeholder="Salary"
              value={form.salary}
              onChangeText={text => setForm({ ...form, salary: text })}
              keyboardType="numeric"
              style={{ borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, padding: 10, marginBottom: 12, fontSize: 15, backgroundColor: '#fafafa' }}
            />
            <TextInput
              placeholder="Education Qualification"
              value={form.qualification}
              onChangeText={text => setForm({ ...form, qualification: text })}
              style={{ borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, padding: 10, marginBottom: 12, fontSize: 15, backgroundColor: '#fafafa' }}
            />
            <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Subjects Assigned</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
              {SUBJECTS.map(subject => (
                <TouchableOpacity
                  key={subject}
                  style={{
                    backgroundColor: form.subjects.includes(subject) ? '#4CAF50' : (form.subjects.length > 0 ? '#e0e0e0' : '#f0f0f0'),
                    borderRadius: 16,
                    paddingVertical: 6,
                    paddingHorizontal: 14,
                    margin: 4,
                  }}
                  onPress={() => setForm({ ...form, subjects: form.subjects[0] === subject ? [] : [subject] })}
                  disabled={form.subjects.length > 0 && form.subjects[0] !== subject}
                >
                  <Text style={{ color: form.subjects.includes(subject) ? '#fff' : (form.subjects.length > 0 ? '#aaa' : '#333'), fontWeight: '600' }}>{subject}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Classes Assigned</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
              {CLASSES.map(cls => (
                <TouchableOpacity
                  key={cls}
                  style={{
                    backgroundColor: form.classes.includes(cls) ? '#2196F3' : '#f0f0f0',
                    borderRadius: 16,
                    paddingVertical: 6,
                    paddingHorizontal: 14,
                    margin: 4,
                  }}
                  onPress={() => setForm({ ...form, classes: toggleSelect(form.classes, cls) })}
                >
                  <Text style={{ color: form.classes.includes(cls) ? '#fff' : '#333', fontWeight: '600' }}>{cls}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
              <TouchableOpacity onPress={closeModal} style={{ backgroundColor: '#ccc', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 18 }}>
                <Text style={{ color: '#333', fontWeight: 'bold' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} style={{ backgroundColor: '#4CAF50', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 18, marginLeft: 8 }}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>{modalMode === 'add' ? 'Add' : 'Save'}</Text>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContainer: {
    padding: 16,
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
    backgroundColor: '#e8f5e8',
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
    color: '#333',
    marginBottom: 2,
  },
  teacherSubject: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
    marginBottom: 2,
  },
  teacherClass: {
    fontSize: 12,
    color: '#666',
  },
  teacherStats: {
    alignItems: 'center',
  },
  studentsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  studentsLabel: {
    fontSize: 10,
    color: '#666',
  },
  attendanceText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 4,
  },
  attendanceLabel: {
    fontSize: 10,
    color: '#666',
  },
  teacherActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
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
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  teacherSalary: {
    fontSize: 13,
    color: '#795548',
    marginTop: 2,
  },
  teacherQualification: {
    fontSize: 13,
    color: '#607D8B',
    marginBottom: 2,
  },
});

export default ManageTeachers; 