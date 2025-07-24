import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, Modal, TextInput, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import DateTimePicker from '@react-native-community/datetimepicker';

const DUMMY_EXAMS = [
  {
    id: '1',
    name: 'Mid Term Exam',
    date: '2024-05-10',
    class: '5',
    subjects: ['Maths', 'Science', 'Social', 'Kannada', 'English'],
  },
  {
    id: '2',
    name: 'Final Exam',
    date: '2024-12-15',
    class: '6',
    subjects: ['Maths', 'Science', 'Social', 'Kannada', 'English'],
  },
  {
    id: '3',
    name: 'Unit Test 1',
    date: '2024-03-01',
    class: '7',
    subjects: ['Maths', 'Science', 'Social', 'Kannada', 'English'],
  },
];

// Dummy students for marks entry
const DUMMY_STUDENTS = [
  { id: '1', name: 'Amit Sharma', roll: '101', class: '5' },
  { id: '2', name: 'Priya Singh', roll: '102', class: '5' },
  { id: '3', name: 'Rahul Verma', roll: '103', class: '5' },
  { id: '4', name: 'Sneha Gupta', roll: '104', class: '5' },
  { id: '5', name: 'Rajesh Kumar', roll: '105', class: '5' },
  { id: '6', name: 'Anjali Patel', roll: '106', class: '5' },
  { id: '7', name: 'Vikas Singh', roll: '107', class: '5' },
  { id: '8', name: 'Meena Kumari', roll: '108', class: '5' },
  { id: '9', name: 'Suresh Yadav', roll: '109', class: '5' },
  { id: '10', name: 'Pooja Sharma', roll: '110', class: '5' },
  { id: '11', name: 'Anjali Patel', roll: '111', class: '6' },
  { id: '12', name: 'Rohit Sinha', roll: '112', class: '6' },
  { id: '13', name: 'Sunil Kumar', roll: '113', class: '7' },
  { id: '14', name: 'Kavita Joshi', roll: '114', class: '7' },
];

const ExamsMarks = () => {
  const [exams, setExams] = useState(DUMMY_EXAMS);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [marksModalVisible, setMarksModalVisible] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', date: '', class: '', subjects: '' });
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', date: '', class: '', subjects: '' });
  const [marksData, setMarksData] = useState({}); // { examId: { studentId: { subject: mark } } }
  const [allClasses, setAllClasses] = useState(Array.from(new Set(DUMMY_STUDENTS.map(s => s.class))));
  const [selectedMarksClass, setSelectedMarksClass] = useState(allClasses[0]);
  const [addClassInput, setAddClassInput] = useState('');
  const [showAddClassInput, setShowAddClassInput] = useState(false);
  const [addSubjectInput, setAddSubjectInput] = useState('');
  const [showAddSubjectInput, setShowAddSubjectInput] = useState(false);
  const [addStudentInput, setAddStudentInput] = useState({ name: '', roll: '' });
  const [showAddStudentInput, setShowAddStudentInput] = useState(false);
  const [students, setStudents] = useState(DUMMY_STUDENTS);
  const [reportCardModalVisible, setReportCardModalVisible] = useState(false);
  const [reportCardStudent, setReportCardStudent] = useState(null);
  const [allReportCardsModalVisible, setAllReportCardsModalVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleEdit = (exam) => {
    setSelectedExam(exam);
    setEditForm({
      name: exam.name,
      date: exam.date,
      class: exam.class,
      subjects: exam.subjects.join(', '),
    });
    setEditModalVisible(true);
  };

  const handleEditFormChange = (field, value) => {
    setEditForm({ ...editForm, [field]: value });
  };

  const handleEditSave = () => {
    setExams(exams.map(e =>
      e.id === selectedExam.id
        ? { ...e, ...editForm, subjects: editForm.subjects.split(',').map(s => s.trim()) }
        : e
    ));
    setEditModalVisible(false);
    setSelectedExam(null);
  };

  const handleDelete = (exam) => {
    Alert.alert(
      'Delete Exam',
      `Are you sure you want to delete "${exam.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: () => setExams(exams.filter(e => e.id !== exam.id)),
        },
      ]
    );
  };

  // Get students for the selected exam's class (dummy filter for now)
  const getStudentsForExam = (exam, classValue) => {
    if (!exam) return [];
    return students.filter(s => s.class === classValue);
  };

  const getInitialMarks = (exam) => {
    if (!exam) return {};
    return marksData[exam.id] || {};
  };

  const [marksForm, setMarksForm] = useState({});
  // When opening marks modal, initialize marksForm
  const handleMarks = (exam) => {
    setSelectedExam(exam);
    setSelectedMarksClass(allClasses[0]);
    setMarksForm(getInitialMarks(exam));
    setMarksModalVisible(true);
  };
  // Update mark change to handle subject-wise
  const handleMarkChange = (studentId, subject, value) => {
    setMarksForm(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [subject]: value,
      },
    }));
  };
  // Save marks for all subjects
  const handleMarksSave = () => {
    setMarksData({ ...marksData, [selectedExam.id]: marksForm });
    setMarksModalVisible(false);
  };

  // When opening add exam modal, set default subjects
  const handleAddExam = () => {
    setAddForm({ name: '', date: '', class: '', subjects: 'Maths, Science, Social, Kannada, English' });
    setAddModalVisible(true);
  };

  const handleAddFormChange = (field, value) => {
    setAddForm({ ...addForm, [field]: value });
  };

  const handleAddSave = () => {
    const newExam = {
      id: (Date.now()).toString(),
      name: addForm.name,
      date: addForm.date,
      class: addForm.class,
      subjects: addForm.subjects.split(',').map(s => s.trim()),
    };
    setExams([newExam, ...exams]);
    setAddModalVisible(false);
  };

  // Add subject to selected exam
  const handleAddSubject = () => {
    if (!addSubjectInput.trim()) return;
    setExams(exams => exams.map(e =>
      e.id === selectedExam.id
        ? { ...e, subjects: [...e.subjects, addSubjectInput.trim()] }
        : e
    ));
    // Update selectedExam in state as well
    setSelectedExam(prev => prev ? { ...prev, subjects: [...prev.subjects, addSubjectInput.trim()] } : prev);
    setAddSubjectInput('');
    setShowAddSubjectInput(false);
  };

  // Add student to selected class
  const handleAddStudent = () => {
    if (!addStudentInput.name.trim() || !addStudentInput.roll.trim()) return;
    setStudents(prev => [
      ...prev,
      {
        id: (Date.now()).toString(),
        name: addStudentInput.name.trim(),
        roll: addStudentInput.roll.trim(),
        class: selectedMarksClass,
      },
    ]);
    setAddStudentInput({ name: '', roll: '' });
    setShowAddStudentInput(false);
  };

  // Helper to calculate total, average, and grade
  const getReportCardStats = (studentId) => {
    if (!selectedExam) return { total: 0, average: 0, grade: '-' };
    const marks = marksForm[studentId] || {};
    const values = selectedExam.subjects.map(sub => parseFloat(marks[sub] || 0));
    const total = values.reduce((a, b) => a + b, 0);
    const average = values.length ? total / values.length : 0;
    let grade = '-';
    if (average >= 90) grade = 'A+';
    else if (average >= 80) grade = 'A';
    else if (average >= 70) grade = 'B';
    else if (average >= 60) grade = 'C';
    else if (average > 0) grade = 'D';
    return { total, average, grade };
  };

  // Delete subject from selected exam
  const handleDeleteSubject = (subject) => {
    Alert.alert(
      'Delete Subject',
      `Are you sure you want to delete the subject "${subject}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: () => {
            setExams(exams => exams.map(e =>
              e.id === selectedExam.id
                ? { ...e, subjects: e.subjects.filter(s => s !== subject) }
                : e
            ));
            setSelectedExam(prev => prev ? { ...prev, subjects: prev.subjects.filter(s => s !== subject) } : prev);
            // Remove marks for this subject from marksForm
            setMarksForm(prev => {
              const updated = { ...prev };
              Object.keys(updated).forEach(studentId => {
                if (updated[studentId] && updated[studentId][subject] !== undefined) {
                  const { [subject]: _, ...rest } = updated[studentId];
                  updated[studentId] = rest;
                }
              });
              return updated;
            });
          },
        },
      ]
    );
  };

  // Delete student from selected class
  const handleDeleteStudent = (studentId) => {
    Alert.alert(
      'Delete Student',
      'Are you sure you want to delete this student from this class?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: () => {
            setStudents(prev => prev.filter(s => s.id !== studentId));
            setMarksForm(prev => {
              const updated = { ...prev };
              delete updated[studentId];
              return updated;
            });
          },
        },
      ]
    );
  };

  // Delete class (and all its students from marks table)
  const handleDeleteClass = (classValue) => {
    Alert.alert(
      'Delete Class',
      `Are you sure you want to delete class ${classValue} and all its students from this exam?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: () => {
            setAllClasses(prev => prev.filter(c => c !== classValue));
            setStudents(prev => prev.filter(s => s.class !== classValue));
            // Remove marks for students in this class
            setMarksForm(prev => {
              const updated = { ...prev };
              Object.keys(updated).forEach(studentId => {
                const student = students.find(s => s.id === studentId);
                if (student && student.class === classValue) {
                  delete updated[studentId];
                }
              });
              return updated;
            });
            // If the deleted class was selected, switch to another class
            setSelectedMarksClass(prev => prev === classValue ? (allClasses.find(c => c !== classValue) || allClasses[0] || '') : prev);
          },
        },
      ]
    );
  };

  const renderExam = ({ item }) => (
    <View style={styles.examCard}>
      <View style={styles.examHeader}>
        <Text style={styles.examName}>{item.name}</Text>
        <Text style={styles.examDate}>{item.date}</Text>
      </View>
      <Text style={styles.examClass}>Class: {item.class}</Text>
      <Text style={styles.examSubjects}>Subjects: {item.subjects.join(', ')}</Text>
      <View style={styles.examActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleEdit(item)}>
          <Ionicons name="create" size={16} color="#FF9800" />
          <Text style={styles.actionBtnText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item)}>
          <Ionicons name="trash" size={16} color="#f44336" />
          <Text style={styles.actionBtnText}>Delete</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleMarks(item)}>
          <Ionicons name="document-text" size={16} color="#2196F3" />
          <Text style={styles.actionBtnText}>Marks</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Print handler for report card
  const handlePrintReportCard = () => {
    if (Platform.OS === 'web') {
      window.print();
    } else {
      Alert.alert('Print not supported', 'Printing is only supported on web in this demo.');
    }
  };

  // Date picker handler
  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const d = new Date(selectedDate);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      setAddForm(f => ({ ...f, date: dateStr }));
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Exams & Marks" showBack={true} />
      <FlatList
        data={exams}
        keyExtractor={(item) => item.id}
        renderItem={renderExam}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      />
      {/* Add Exam Floating Button */}
      <TouchableOpacity style={styles.fab} onPress={handleAddExam}>
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>
      {/* Add Exam Modal */}
      <Modal
        visible={addModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Exam</Text>
            <ScrollView>
              <Text style={styles.inputLabel}>Exam Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Exam Name"
                value={addForm.name}
                onChangeText={text => handleAddFormChange('name', text)}
              />
              <Text style={styles.inputLabel}>Date</Text>
              {Platform.OS === 'web' ? (
                <input
                  type="date"
                  style={{ ...styles.input, width: '100%', fontSize: 16, padding: 10, marginBottom: 12 }}
                  value={addForm.date}
                  onChange={e => setAddForm(f => ({ ...f, date: e.target.value }))}
                />
              ) : (
                <TouchableOpacity onPress={() => setShowDatePicker(true)} style={[styles.input, { justifyContent: 'center', height: 44 }]}> 
                  <Text style={{ fontSize: 16, color: addForm.date ? '#333' : '#888' }}>{addForm.date || 'Select Date'}</Text>
                </TouchableOpacity>
              )}
              {showDatePicker && (
                <DateTimePicker
                  value={addForm.date ? new Date(addForm.date) : new Date()}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                />
              )}
              <Text style={styles.inputLabel}>Class</Text>
              <TextInput
                style={styles.input}
                placeholder="Class"
                value={addForm.class}
                onChangeText={text => handleAddFormChange('class', text)}
              />
              <Text style={styles.inputLabel}>Subjects (comma separated)</Text>
              <TextInput
                style={styles.input}
                placeholder="Subjects"
                value={addForm.subjects}
                onChangeText={text => handleAddFormChange('subjects', text)}
              />
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalButton} onPress={handleAddSave}>
                <Text style={styles.modalButtonText}>Add</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#aaa' }]} onPress={() => setAddModalVisible(false)}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Edit Exam Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Exam</Text>
            <ScrollView>
              <Text style={styles.inputLabel}>Exam Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Exam Name"
                value={editForm.name}
                onChangeText={text => handleEditFormChange('name', text)}
              />
              <Text style={styles.inputLabel}>Date</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={editForm.date}
                onChangeText={text => handleEditFormChange('date', text)}
              />
              <Text style={styles.inputLabel}>Class</Text>
              <TextInput
                style={styles.input}
                placeholder="Class"
                value={editForm.class}
                onChangeText={text => handleEditFormChange('class', text)}
              />
              <Text style={styles.inputLabel}>Subjects (comma separated)</Text>
              <TextInput
                style={styles.input}
                placeholder="Subjects"
                value={editForm.subjects}
                onChangeText={text => handleEditFormChange('subjects', text)}
              />
            </ScrollView>
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
      {/* Marks Modal */}
      <Modal
        visible={marksModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setMarksModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Marks for {selectedExam?.name}</Text>
            {/* View All Report Cards Button */}
            <TouchableOpacity onPress={() => setAllReportCardsModalVisible(true)} style={{ alignSelf: 'flex-end', backgroundColor: '#1976d2', borderRadius: 8, paddingVertical: 7, paddingHorizontal: 16, marginBottom: 8 }}>
              <Ionicons name="list" size={18} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14, marginLeft: 6 }}>View All Report Cards</Text>
            </TouchableOpacity>
            {/* Class Tabs - improved UI */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16, flexDirection: 'row', paddingVertical: 4, backgroundColor: '#f8fafd', borderRadius: 10, shadowColor: '#2196F3', shadowOpacity: 0.08, shadowRadius: 2, elevation: 2, borderWidth: 1, borderColor: '#e3f2fd' }}>
              {allClasses.map(cls => (
                <TouchableOpacity
                  key={cls}
                  style={[
                    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 8, borderRadius: 22, marginRight: 10, backgroundColor: selectedMarksClass === cls ? '#1976d2' : '#e3f2fd', borderWidth: selectedMarksClass === cls ? 2 : 1, borderColor: selectedMarksClass === cls ? '#1976d2' : '#b3e5fc', shadowColor: selectedMarksClass === cls ? '#1976d2' : undefined, shadowOpacity: selectedMarksClass === cls ? 0.12 : 0, elevation: selectedMarksClass === cls ? 2 : 0 },
                  ]}
                  onPress={() => setSelectedMarksClass(cls)}
                >
                  <Ionicons name="school" size={18} color={selectedMarksClass === cls ? '#fff' : '#1976d2'} style={{ marginRight: 6 }} />
                  <Text style={{ fontWeight: 'bold', fontSize: 16, color: selectedMarksClass === cls ? '#fff' : '#1976d2' }}>Class {cls}</Text>
                  <TouchableOpacity onPress={() => handleDeleteClass(cls)} style={{ marginLeft: 8, padding: 2 }}>
                    <Ionicons name="trash" size={16} color="#f44336" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
              {/* Add Class Button - styled like a tab */}
              <TouchableOpacity onPress={() => setShowAddClassInput(true)} style={{ backgroundColor: '#4CAF50', borderRadius: 22, paddingHorizontal: 14, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', borderWidth: 0, marginRight: 2 }}>
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15, marginLeft: 2 }}>Add</Text>
              </TouchableOpacity>
            </ScrollView>
            {/* Add Class Input */}
            {showAddClassInput && (
              <View style={styles.addClassInputRow}>
                <TextInput
                  style={styles.addClassInput}
                  placeholder="New Class"
                  value={addClassInput}
                  onChangeText={setAddClassInput}
                  keyboardType="number-pad"
                />
                <TouchableOpacity
                  style={styles.addClassSaveBtn}
                  onPress={() => {
                    if (addClassInput && !allClasses.includes(addClassInput)) {
                      setAllClasses([...allClasses, addClassInput]);
                      setSelectedMarksClass(addClassInput);
                    }
                    setAddClassInput('');
                    setShowAddClassInput(false);
                  }}
                >
                  <Ionicons name="checkmark" size={20} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.addClassCancelBtn}
                  onPress={() => {
                    setAddClassInput('');
                    setShowAddClassInput(false);
                  }}
                >
                  <Ionicons name="close" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
            {/* Subject-wise marks table with add student/subject buttons and improved style */}
            <ScrollView horizontal style={{ marginBottom: 8 }}>
              <View>
                {/* Header Row */}
                <View style={{ flexDirection: 'row', backgroundColor: '#e3f2fd', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 6, alignItems: 'center', marginBottom: 2, shadowColor: '#2196F3', shadowOpacity: 0.08, shadowRadius: 2, elevation: 1 }}>
                  <Text style={{ width: 120, fontWeight: 'bold', color: '#1976d2', fontSize: 16, paddingLeft: 4 }}>Student</Text>
                  {/* Add Student Button */}
                  <TouchableOpacity onPress={() => setShowAddStudentInput(true)} style={{ marginLeft: 4, backgroundColor: '#4CAF50', borderRadius: 16, padding: 4 }}>
                    <Ionicons name="add" size={20} color="#fff" />
                  </TouchableOpacity>
                  {selectedExam?.subjects.map(subject => (
                    <View key={subject} style={{ width: 100, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontWeight: 'bold', color: '#1976d2', fontSize: 16, textAlign: 'center' }}>{subject}</Text>
                      <TouchableOpacity onPress={() => handleDeleteSubject(subject)} style={{ marginLeft: 4, padding: 2 }}>
                        <Ionicons name="trash" size={16} color="#f44336" />
                      </TouchableOpacity>
                    </View>
                  ))}
                  {/* Plus button for adding subject */}
                  <TouchableOpacity onPress={() => setShowAddSubjectInput(true)} style={{ marginLeft: 8, backgroundColor: '#4CAF50', borderRadius: 16, padding: 4 }}>
                    <Ionicons name="add" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
                {/* Add Student Input Row */}
                {showAddStudentInput && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, marginTop: 4 }}>
                    <TextInput
                      style={[styles.input, { width: 120, marginRight: 8, height: 36, fontSize: 15 }]}
                      placeholder="Student Name"
                      value={addStudentInput.name}
                      onChangeText={text => setAddStudentInput(input => ({ ...input, name: text }))}
                    />
                    <TextInput
                      style={[styles.input, { width: 80, marginRight: 8, height: 36, fontSize: 15 }]}
                      placeholder="Roll No."
                      value={addStudentInput.roll}
                      onChangeText={text => setAddStudentInput(input => ({ ...input, roll: text }))}
                      keyboardType="number-pad"
                    />
                    <TouchableOpacity onPress={handleAddStudent} style={{ backgroundColor: '#2196F3', borderRadius: 16, padding: 6, marginRight: 4 }}>
                      <Ionicons name="checkmark" size={18} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => { setAddStudentInput({ name: '', roll: '' }); setShowAddStudentInput(false); }} style={{ backgroundColor: '#f44336', borderRadius: 16, padding: 6 }}>
                      <Ionicons name="close" size={18} color="#fff" />
                    </TouchableOpacity>
                  </View>
                )}
                {/* Add Subject Input Row */}
                {showAddSubjectInput && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, marginTop: 4 }}>
                    <TextInput
                      style={[styles.input, { width: 160, marginRight: 8, height: 36, fontSize: 15 }]}
                      placeholder="New Subject"
                      value={addSubjectInput}
                      onChangeText={setAddSubjectInput}
                    />
                    <TouchableOpacity onPress={handleAddSubject} style={{ backgroundColor: '#2196F3', borderRadius: 16, padding: 6, marginRight: 4 }}>
                      <Ionicons name="checkmark" size={18} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => { setAddSubjectInput(''); setShowAddSubjectInput(false); }} style={{ backgroundColor: '#f44336', borderRadius: 16, padding: 6 }}>
                      <Ionicons name="close" size={18} color="#fff" />
                    </TouchableOpacity>
                  </View>
                )}
                {/* Student Rows */}
                <ScrollView style={{ maxHeight: 300 }}>
                  {getStudentsForExam(selectedExam, selectedMarksClass).map((student, idx) => (
                    <View key={student.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, backgroundColor: idx % 2 === 0 ? '#f8fafd' : '#fff', borderRadius: 8, paddingVertical: 7, paddingHorizontal: 2 }}>
                      <Text style={{ width: 120, color: '#333', fontSize: 15, paddingLeft: 4 }}>{student.name} (#{student.roll})</Text>
                      {selectedExam?.subjects.map(subject => (
                        <TextInput
                          key={subject}
                          style={[
                            styles.marksInput,
                            { width: 100, marginHorizontal: 4, height: 38, borderRadius: 8, backgroundColor: '#fff', borderColor: '#b3e5fc', borderWidth: 1, fontSize: 15, textAlign: 'center', color: '#1976d2' },
                          ]}
                          placeholder={subject}
                          keyboardType="number-pad"
                          value={marksForm[student.id]?.[subject] || ''}
                          onChangeText={text => handleMarkChange(student.id, subject, text)}
                        />
                      ))}
                      {/* Delete Student Button */}
                      <TouchableOpacity onPress={() => handleDeleteStudent(student.id)} style={{ marginLeft: 8, padding: 2 }}>
                        <Ionicons name="trash" size={16} color="#f44336" />
                      </TouchableOpacity>
                      {/* View Report Card Button */}
                      <TouchableOpacity onPress={() => { setReportCardStudent(student); setReportCardModalVisible(true); }} style={{ marginLeft: 8, backgroundColor: '#1976d2', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10 }}>
                        <Ionicons name="document-text" size={18} color="#fff" />
                        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13, marginLeft: 4 }}>Report</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalButton} onPress={handleMarksSave}>
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#aaa' }]} onPress={() => setMarksModalVisible(false)}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Report Card Modal */}
      <Modal
        visible={reportCardModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setReportCardModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 400 }]}>
            <Text style={[styles.modalTitle, { marginBottom: 8 }]}>Report Card</Text>
            {reportCardStudent && selectedExam && (
              <>
                <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#1976d2', marginBottom: 2 }}>{reportCardStudent.name} (#{reportCardStudent.roll})</Text>
                <Text style={{ color: '#555', marginBottom: 2 }}>Class: {selectedMarksClass}</Text>
                <Text style={{ color: '#555', marginBottom: 2 }}>Exam: {selectedExam.name} ({selectedExam.date})</Text>
                <View style={{ height: 1, backgroundColor: '#e3f2fd', marginVertical: 8 }} />
                {/* Subject-wise marks */}
                <View style={{ flexDirection: 'row', marginBottom: 4 }}>
                  <Text style={{ width: 120, fontWeight: 'bold', color: '#1976d2' }}>Subject</Text>
                  <Text style={{ width: 80, fontWeight: 'bold', color: '#1976d2', textAlign: 'center' }}>Marks</Text>
                </View>
                {selectedExam.subjects.map(subject => (
                  <View key={subject} style={{ flexDirection: 'row', marginBottom: 2 }}>
                    <Text style={{ width: 120 }}>{subject}</Text>
                    <Text style={{ width: 80, textAlign: 'center', color: '#1976d2', fontWeight: 'bold' }}>{marksForm[reportCardStudent.id]?.[subject] || '-'}</Text>
                  </View>
                ))}
                <View style={{ height: 1, backgroundColor: '#e3f2fd', marginVertical: 8 }} />
                {/* Total, Average, Grade */}
                {(() => { const stats = getReportCardStats(reportCardStudent.id); return (
                  <>
                    <Text style={{ fontWeight: 'bold', color: '#333', marginBottom: 2 }}>Total: <Text style={{ color: '#1976d2' }}>{stats.total}</Text></Text>
                    <Text style={{ fontWeight: 'bold', color: '#333', marginBottom: 2 }}>Average: <Text style={{ color: '#1976d2' }}>{stats.average.toFixed(2)}</Text></Text>
                    <Text style={{ fontWeight: 'bold', color: '#333', marginBottom: 2 }}>Grade: <Text style={{ color: '#1976d2' }}>{stats.grade}</Text></Text>
                  </>
                ); })()}
              </>
            )}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 }}>
              <TouchableOpacity style={[styles.modalButton, { flex: 1, marginRight: 8 }]} onPress={handlePrintReportCard}>
                <Ionicons name="print" size={18} color="#fff" />
                <Text style={styles.modalButtonText}>Print</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#aaa', flex: 1 }]} onPress={() => setReportCardModalVisible(false)}>
                <Text style={styles.modalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* All Report Cards Modal */}
      <Modal
        visible={allReportCardsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAllReportCardsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 700, width: '98%' }]}>
            <Text style={[styles.modalTitle, { marginBottom: 8 }]}>Class Mark Sheet</Text>
            <Text style={{ color: '#555', marginBottom: 2 }}>Class: {selectedMarksClass}</Text>
            <Text style={{ color: '#555', marginBottom: 8 }}>Exam: {selectedExam?.name} ({selectedExam?.date})</Text>
            <ScrollView horizontal>
              <View>
                {/* Header Row */}
                <View style={{ flexDirection: 'row', backgroundColor: '#e3f2fd', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 6, alignItems: 'center', marginBottom: 2 }}>
                  <Text style={{ width: 120, fontWeight: 'bold', color: '#1976d2', fontSize: 15 }}>Name</Text>
                  <Text style={{ width: 70, fontWeight: 'bold', color: '#1976d2', fontSize: 15 }}>Roll</Text>
                  {selectedExam?.subjects.map(subject => (
                    <Text key={subject} style={{ width: 90, fontWeight: 'bold', color: '#1976d2', fontSize: 15, textAlign: 'center' }}>{subject}</Text>
                  ))}
                  <Text style={{ width: 70, fontWeight: 'bold', color: '#1976d2', fontSize: 15, textAlign: 'center' }}>Total</Text>
                  <Text style={{ width: 80, fontWeight: 'bold', color: '#1976d2', fontSize: 15, textAlign: 'center' }}>Average</Text>
                  <Text style={{ width: 70, fontWeight: 'bold', color: '#1976d2', fontSize: 15, textAlign: 'center' }}>Grade</Text>
                </View>
                {/* Student Rows */}
                <ScrollView style={{ maxHeight: 350 }}>
                  {getStudentsForExam(selectedExam, selectedMarksClass).map((student, idx) => {
                    const marks = marksForm[student.id] || {};
                    const values = selectedExam.subjects.map(sub => parseFloat(marks[sub] || 0));
                    const total = values.reduce((a, b) => a + b, 0);
                    const average = values.length ? total / values.length : 0;
                    let grade = '-';
                    if (average >= 90) grade = 'A+';
                    else if (average >= 80) grade = 'A';
                    else if (average >= 70) grade = 'B';
                    else if (average >= 60) grade = 'C';
                    else if (average > 0) grade = 'D';
                    return (
                      <View key={student.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, backgroundColor: idx % 2 === 0 ? '#f8fafd' : '#fff', borderRadius: 8, paddingVertical: 7, paddingHorizontal: 2 }}>
                        <Text style={{ width: 120, color: '#333', fontSize: 15 }}>{student.name}</Text>
                        <Text style={{ width: 70, color: '#333', fontSize: 15 }}>{student.roll}</Text>
                        {selectedExam.subjects.map(subject => (
                          <Text key={subject} style={{ width: 90, textAlign: 'center', color: '#1976d2', fontWeight: 'bold', fontSize: 15 }}>{marks[subject] || '-'}</Text>
                        ))}
                        <Text style={{ width: 70, textAlign: 'center', color: '#1976d2', fontWeight: 'bold', fontSize: 15 }}>{total}</Text>
                        <Text style={{ width: 80, textAlign: 'center', color: '#1976d2', fontWeight: 'bold', fontSize: 15 }}>{average.toFixed(2)}</Text>
                        <Text style={{ width: 70, textAlign: 'center', color: '#1976d2', fontWeight: 'bold', fontSize: 15 }}>{grade}</Text>
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            </ScrollView>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 }}>
              <TouchableOpacity style={[styles.modalButton, { flex: 1, marginRight: 8 }]} onPress={handlePrintReportCard}>
                <Ionicons name="print" size={18} color="#fff" />
                <Text style={styles.modalButtonText}>Print</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#aaa', flex: 1 }]} onPress={() => setAllReportCardsModalVisible(false)}>
                <Text style={styles.modalButtonText}>Close</Text>
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
  examCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  examHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  examName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  examDate: {
    fontSize: 14,
    color: '#888',
  },
  examClass: {
    fontSize: 15,
    color: '#333',
    marginBottom: 2,
  },
  examSubjects: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  examActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginLeft: 8,
  },
  actionBtnText: {
    color: '#1976d2',
    fontWeight: 'bold',
    marginLeft: 5,
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
  inputLabel: {
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 2,
    marginLeft: 2,
    fontSize: 14,
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
  marksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  marksStudent: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  marksInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 8,
    width: 70,
    fontSize: 15,
    marginLeft: 10,
    backgroundColor: '#f5f5f5',
  },
  classTab: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: '#e3f2fd',
    marginRight: 10,
  },
  classTabActive: {
    backgroundColor: '#1976d2',
  },
  classTabText: {
    color: '#1976d2',
    fontWeight: 'bold',
    fontSize: 15,
  },
  classTabTextActive: {
    color: '#fff',
  },
  addClassTab: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginLeft: 2,
  },
  addClassInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginLeft: 4,
  },
  addClassInput: {
    borderWidth: 1,
    borderColor: '#4CAF50',
    borderRadius: 6,
    padding: 8,
    width: 90,
    fontSize: 15,
    marginRight: 8,
    backgroundColor: '#fff',
  },
  addClassSaveBtn: {
    backgroundColor: '#4CAF50',
    borderRadius: 6,
    padding: 6,
    marginRight: 4,
  },
  addClassCancelBtn: {
    backgroundColor: '#f44336',
    borderRadius: 6,
    padding: 6,
  },
});

export default ExamsMarks; 