import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, Modal, TextInput, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Print from 'expo-print';
import { supabase } from '../../utils/supabase';

const ExamsMarks = () => {
  const [exams, setExams] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedExam, setSelectedExam] = useState(null);
  const [selectedMarksClass, setSelectedMarksClass] = useState('');
  const [marksForm, setMarksForm] = useState({});
  const [addExamModalVisible, setAddExamModalVisible] = useState(false);
  const [editExamModalVisible, setEditExamModalVisible] = useState(false);
  const [marksModalVisible, setMarksModalVisible] = useState(false);
  const [reportCardModalVisible, setReportCardModalVisible] = useState(false);
  const [allReportCardsModalVisible, setAllReportCardsModalVisible] = useState(false);
  const [reportCardStudent, setReportCardStudent] = useState(null);
  const [addStudentInput, setAddStudentInput] = useState({ name: '', roll: '' });
  const [showAddStudentInput, setShowAddStudentInput] = useState(false);
  const [addSubjectInput, setAddSubjectInput] = useState('');
  const [showAddSubjectInput, setShowAddSubjectInput] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [editingExamIndex, setEditingExamIndex] = useState(null);
  const [allClasses, setAllClasses] = useState([]);
  const [addForm, setAddForm] = useState({ name: '', date: '', class: '', subjects: '' });
  const [editForm, setEditForm] = useState({ name: '', date: '', class: '', subjects: '' });
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [marksData, setMarksData] = useState({});
  const [addClassInput, setAddClassInput] = useState('');
  const [showAddClassInput, setShowAddClassInput] = useState(false);

  // Helper function to calculate grade based on average marks
  const calculateGrade = (average) => {
    if (average >= 90) return 'A+';
    if (average >= 80) return 'A';
    if (average >= 70) return 'B';
    if (average >= 60) return 'C';
    if (average > 0) return 'D';
    return 'F';
  };

  // Fetch exams, students, and marks from Supabase
  useEffect(() => {
  const fetchExams = async () => {
    try {
        setLoading(true);
        const { data: examsData, error: fetchError } = await supabase
        .from('exams')
          .select('*');
        if (fetchError) throw fetchError;
        const formattedExams = examsData.map(exam => ({
        ...exam,
        subjects: exam.subjects.split(',').map(s => s.trim())
      }));
        setExams(formattedExams);
        setAllClasses(Array.from(new Set(formattedExams.map(e => e.class))));
    } catch (error) {
        setError('Failed to fetch exams');
        console.error(error);
      } finally {
      setLoading(false);
    }
  };
  const fetchStudents = async () => {
    try {
        const { data: studentsData, error: fetchError } = await supabase
        .from('students')
          .select('*');
        if (fetchError) throw fetchError;
        setStudents(studentsData);
    } catch (error) {
        setError('Failed to fetch students');
        console.error(error);
    }
  };
    const fetchMarks = async () => {
    try {
        const { data: marksData, error: fetchError } = await supabase
        .from('exam_marks')
          .select('*');
        if (fetchError) throw fetchError;
        const formattedMarks = marksData.reduce((acc, mark) => {
          const parsedMarks = JSON.parse(mark.marks);
          acc[mark.exam_id] = {
            ...acc[mark.exam_id],
            [mark.student_id]: parsedMarks
          };
          return acc;
        }, {});
        setMarksData(formattedMarks);
      } catch (error) {
        console.error('Failed to fetch marks:', error);
      }
    };
    const fetchData = async () => {
      try {
        await Promise.all([fetchExams(), fetchStudents(), fetchMarks()]);
    } catch (error) {
        setError('Failed to load data');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Helper function to get students for a specific exam and class
  const getStudentsForExam = (exam, className) => {
    if (!exam || !className) return [];
    return students.filter(student => student.class === className);
  };

  // Helper function to get report card statistics
  const getReportCardStats = (studentId) => {
    if (!studentId || !selectedExam) return { total: 0, average: 0, grade: '-' };
    const marks = marksForm[studentId] || {};
    const values = selectedExam.subjects.map(sub => parseFloat(marks[sub] || 0));
    const total = values.reduce((a, b) => a + b, 0);
    const average = values.length ? total / values.length : 0;
    const grade = calculateGrade(average);
    return { total, average, grade };
  };

  // Add new exam
  const handleAddExam = async () => {
    try {
      const { data, error } = await supabase
        .from('exams')
        .insert([
          {
            name: editingExam?.name || '',
            date: editingExam?.date || new Date().toISOString(),
            class: editingExam?.class || '',
            subjects: editingExam?.subjects?.join(',') || '',
          },
        ])
        .select();

      if (error) throw error;

      const newExam = data[0];
      const updatedExams = [...exams];
      if (editingExamIndex !== null) {
        updatedExams[editingExamIndex] = {
          ...editingExam,
          id: newExam.id,
        };
      } else {
        updatedExams.unshift({
          ...newExam,
          subjects: newExam.subjects.split(',').map(s => s.trim()),
        });
      }

      setExams(updatedExams);
      setAddExamModalVisible(false);
      setEditExamModalVisible(false);
      setEditingExam(null);
      setEditingExamIndex(null);
      Alert.alert('Success', 'Exam saved successfully!');
    } catch (error) {
      console.error('Error adding exam:', error);
      Alert.alert('Error', 'Failed to save exam. Please try again.');
    }
  };

  // Edit exam
  const handleEditExam = (exam, index) => {
    setEditingExam(exam);
    setEditingExamIndex(index);
    setEditExamModalVisible(true);
  };

  // Delete exam
  const handleDeleteExam = async (exam) => {
    Alert.alert(
      'Delete Exam',
      'Are you sure you want to delete this exam?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error: deleteError } = await supabase
                .from('exams')
                .delete()
                .eq('id', exam.id);

              if (deleteError) throw deleteError;

              const updatedExams = exams.filter(e => e.id !== exam.id);
              setExams(updatedExams);
              Alert.alert('Success', 'Exam deleted successfully!');
            } catch (error) {
              console.error('Error deleting exam:', error);
              Alert.alert('Error', 'Failed to delete exam. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Handle mark change
  const handleMarkChange = (studentId, subject, value) => {
    setMarksForm(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [subject]: value,
      },
    }));
  };

  // Save marks for an exam
  const handleMarksSave = async () => {
    try {
      if (!selectedExam) return;

      const marksData = Object.entries(marksForm).map(([studentId, marks]) => ({
        exam_id: selectedExam.id,
        student_id: studentId,
        marks: JSON.stringify(marks),
      }));

      const { error } = await supabase
        .from('exam_marks')
        .upsert(marksData);

      if (error) throw error;

      Alert.alert('Success', 'Marks saved successfully!');
      setMarksModalVisible(false);
    } catch (error) {
      console.error('Error saving marks:', error);
      Alert.alert('Error', 'Failed to save marks. Please try again.');
    }
  };

  // Handle download report card
  const handleDownloadReportCard = async () => {
    try {
      if (!reportCardStudent || !selectedExam) return;

      const marks = marksForm[reportCardStudent.id] || {};
      const stats = getReportCardStats(reportCardStudent.id);

      const html = `
        <html>
          <head>
            <style>
              @media print {
                @page { margin: 0; }
                body { margin: 1.6cm; }
              }
              body { font-family: Arial, sans-serif; }
              .header { text-align: center; margin-bottom: 20px; }
              .student-info { margin-bottom: 20px; }
              .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              .stats { margin-top: 20px; }
              .stats div { margin: 10px 0; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Report Card</h1>
            </div>
            <div class="student-info">
              <p><strong>Name:</strong> ${reportCardStudent.name}</p>
              <p><strong>Roll No:</strong> #${reportCardStudent.roll}</p>
              <p><strong>Class:</strong> ${selectedMarksClass}</p>
              <p><strong>Exam:</strong> ${selectedExam.name}</p>
              <p><strong>Date:</strong> ${selectedExam.date}</p>
            </div>
            <table class="table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Marks</th>
                </tr>
              </thead>
              <tbody>
                ${selectedExam.subjects.map(subject => `
                  <tr>
                    <td>${subject}</td>
                    <td>${marks[subject] || '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="stats">
              <div><strong>Total:</strong> ${stats.total}</div>
              <div><strong>Average:</strong> ${stats.average.toFixed(2)}</div>
              <div><strong>Grade:</strong> ${stats.grade}</div>
            </div>
          </body>
        </html>
      `;

      const fileName = `report-card-${reportCardStudent.name}-${selectedExam.name}.pdf`;
      const pdf = await printToPDF({ html });
      await Share.share({ uri: pdf.uri });
    } catch (error) {
      console.error('Error generating report card:', error);
      Alert.alert('Error', 'Failed to generate report card. Please try again.');
    }
  };

  // Handle download all report cards
  const handleDownloadAllReportCards = async () => {
    try {
      if (!selectedExam) return;

      const studentsInClass = getStudentsForExam(selectedExam, selectedMarksClass);
      const html = `
        <html>
          <head>
            <style>
              @media print {
                @page { margin: 0; }
                body { margin: 1.6cm; }
              }
              body { font-family: Arial, sans-serif; }
              .header { text-align: center; margin-bottom: 20px; }
              .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              .stats { margin-top: 20px; }
              .stats div { margin: 10px 0; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Class Mark Sheet</h1>
            </div>
            <div class="student-info">
              <p><strong>Class:</strong> ${selectedMarksClass}</p>
              <p><strong>Exam:</strong> ${selectedExam.name}</p>
              <p><strong>Date:</strong> ${selectedExam.date}</p>
            </div>
            <table class="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Roll No</th>
                  ${selectedExam.subjects.map(subject => `<th>${subject}</th>`).join('')}
                  <th>Total</th>
                  <th>Average</th>
                  <th>Grade</th>
                </tr>
              </thead>
              <tbody>
                ${studentsInClass.map(student => {
                  const marks = marksForm[student.id] || {};
                  const values = selectedExam.subjects.map(sub => parseFloat(marks[sub] || 0));
                  const total = values.reduce((a, b) => a + b, 0);
                  const average = values.length ? total / values.length : 0;
                  const grade = calculateGrade(average);

                  return `
                    <tr>
                      <td>${student.name}</td>
                      <td>#${student.roll}</td>
                      ${selectedExam.subjects.map(subject => `<td>${marks[subject] || '-'}</td>`).join('')}
                      <td>${total}</td>
                      <td>${average.toFixed(2)}</td>
                      <td>${grade}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `;

      const fileName = `class-marksheet-${selectedMarksClass}-${selectedExam.name}.pdf`;
      const pdf = await printToPDF({ html });
      await Share.share({ uri: pdf.uri });
    } catch (error) {
      console.error('Error generating class mark sheet:', error);
      Alert.alert('Error', 'Failed to generate class mark sheet. Please try again.');
    }
  };

  // Add student
  const handleAddStudent = () => {
    if (!addStudentInput.name || !addStudentInput.roll) return;

    const newStudent = {
      name: addStudentInput.name,
      roll: addStudentInput.roll,
      class: selectedMarksClass,
    };

    setStudents(prev => [...prev, newStudent]);
    setAddStudentInput({ name: '', roll: '' });
    setShowAddStudentInput(false);
  };

  // Delete student
  const handleDeleteStudent = (studentId) => {
    Alert.alert(
      'Delete Student',
      'Are you sure you want to delete this student?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setStudents(prev => prev.filter(student => student.id !== studentId));
          },
        },
      ]
    );
  };

  // Add subject
  const handleAddSubject = () => {
    if (!addSubjectInput || !selectedExam) return;

    const newSubjects = [...selectedExam.subjects, addSubjectInput.trim()];
    const updatedExam = { ...selectedExam, subjects: newSubjects };

    setExams(prev => prev.map(exam =>
      exam.id === selectedExam.id ? updatedExam : exam
    ));

    setAddSubjectInput('');
    setShowAddSubjectInput(false);
  };

  // Initialize data on component mount
  useEffect(() => {
    fetchExams();
    fetchStudents();
  }, []);

  // ... rest of the component logic remains unchanged, but ensure no duplicate or mock data blocks exist ...

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
            <TouchableOpacity onPress={() => setAllReportCardsModalVisible(true)} style={styles.fullWidthButton}>
              <Ionicons name="reader-outline" size={18} color="#1976d2" />
              <Text style={styles.fullWidthButtonText}>View All Class Report Cards</Text>
            </TouchableOpacity>
            {/* Class Tabs - improved UI */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.classTabsContainer}>
              {allClasses.map(cls => (
                <TouchableOpacity
                  key={cls}
                  style={[styles.classTab, selectedMarksClass === cls && styles.classTabActive]}
                  onPress={() => setSelectedMarksClass(cls)}
                >
                  <Ionicons name="school-outline" size={18} color={selectedMarksClass === cls ? '#fff' : '#1976d2'} style={{ marginRight: 6 }} />
                  <Text style={[styles.classTabText, selectedMarksClass === cls && styles.classTabTextActive]}>Class {cls}</Text>
                  <TouchableOpacity onPress={() => handleDeleteClass(cls)} style={{ marginLeft: 8, padding: 2 }}>
                    <Ionicons name="close-circle" size={16} color={selectedMarksClass === cls ? '#fff' : '#f44336'} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
              {/* Add Class Button - styled like a tab */}
              <TouchableOpacity onPress={() => setShowAddClassInput(true)} style={styles.addClassTab}>
                <Ionicons name="add" size={20} color="#fff" />
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
                      <TouchableOpacity onPress={() => { setReportCardStudent(student); setReportCardModalVisible(true); }} style={styles.reportButton}>
                        <Ionicons name="reader-outline" size={18} color="#1976d2" />
                        <Text style={styles.reportButtonText}>Report</Text>
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
              <TouchableOpacity style={[styles.modalButton, { flex: 1, marginRight: 8, backgroundColor: '#4CAF50' }]} onPress={handleDownloadReportCard}>
                <Ionicons name="download-outline" size={18} color="#fff" />
                <Text style={styles.modalButtonText}>Download</Text>
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
              <TouchableOpacity style={[styles.modalButton, { flex: 1, marginRight: 8, backgroundColor: '#4CAF50' }]} onPress={handleDownloadAllReportCards}>
                <Ionicons name="download-outline" size={18} color="#fff" />
                <Text style={styles.modalButtonText}>Download</Text>
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
    paddingTop: 28,
    paddingBottom: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 18,
    color: '#333',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    marginBottom: 10,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
  },
  buttonContainer: {
    padding: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
  },
  addExamButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButton: {
    backgroundColor: '#F44336',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  printButton: {
    backgroundColor: '#2196F3',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 5,
  },
  listContainer: {
    padding: 10,
  },
  examItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  examInfo: {
    flex: 1,
  },
  examName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  examDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  examClass: {
    fontSize: 14,
    color: '#666',
  },
  examActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginLeft: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '90%',
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  datePickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  datePickerText: {
    fontSize: 16,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  classSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  classLabel: {
    marginRight: 10,
    fontSize: 16,
  },
  classButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
  },
  classButtonText: {
    fontSize: 16,
  },
  marksContainer: {
    maxHeight: '80%',
  },
  studentCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  studentName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  subjectLabel: {
    width: 100,
    fontSize: 14,
  },
  markInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginRight: 10,
    fontSize: 14,
  },
  marksList: {
    marginTop: 20,
  },
  markValue: {
    marginLeft: 10,
    fontSize: 14,
  },
  statsContainer: {
    marginTop: 20,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statLabel: {
    fontSize: 16,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  studentRoll: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  studentClass: {
    fontSize: 14,
    color: '#666',
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
  fullWidthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    paddingVertical: 12,
    marginBottom: 16,
  },
  fullWidthButtonText: {
    color: '#1976d2',
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 8,
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
  classTabsContainer: {
    marginBottom: 16,
    paddingVertical: 4,
  },
  classTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#e3f2fd',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#b3e5fc',
  },
  classTabActive: {
    backgroundColor: '#1976d2',
    borderColor: '#1976d2',
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
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
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
    marginRight: 8,
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    borderRadius: 6,
    padding: 8,
    marginLeft: 8,
  },
  reportButtonText: {
    color: '#1976d2',
    fontWeight: 'bold',
    marginLeft: 5,
    fontSize: 14,
  },
});

export default ExamsMarks; 