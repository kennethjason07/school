import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView, ActivityIndicator, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import StatCard from '../../components/StatCard';
import { Picker } from '@react-native-picker/picker';
import { supabase, dbHelpers } from '../../utils/supabase';
import CrossPlatformPieChart from '../../components/CrossPlatformPieChart';
import * as Print from 'expo-print';

const ManageStudents = () => {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [marksHistory, setMarksHistory] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [communicationHistory, setCommunicationHistory] = useState([]);
  const classOptions = ['All', ...classes.map(cls => cls.class_name)];
  const sectionOptions = ['All', ...sections.map(section => section.section_name)];
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ 
    roll: '', 
    name: '', 
    class: '', 
    section: '', 
    parent: '', 
    contact: '', 
    marks: '', 
    fees: '',
    academic_year: '',
    behavior: 'Good',
    achievements: []
  });
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editForm, setEditForm] = useState({ 
    roll: '', 
    name: '', 
    class: '', 
    section: '', 
    parent: '', 
    contact: '', 
    marks: '', 
    fees: '',
    academic_year: '',
    behavior: 'Good',
    achievements: []
  });
  const [scoreModalVisible, setScoreModalVisible] = useState(false);
  const [scoreStudent, setScoreStudent] = useState(null);
  const [selectedClass, setSelectedClass] = useState('All');
  const [selectedSection, setSelectedSection] = useState('All');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('Current');
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);

  useEffect(() => {
    loadStudents();
    loadClassesAndSections();
    loadAcademicYears();
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      loadStudentDetails(selectedStudent.id);
    }
  }, [selectedStudent]);

  const loadStudents = async () => {
    try {
      const { data: studentsData, error } = await dbHelpers.getStudentsByClass(null, null);
      if (error) throw error;
      
      const formattedStudents = studentsData.map(student => ({
        id: student.id,
        roll: student.roll_no,
        name: student.full_name,
        class: student.class_id,
        section: student.section_id,
        parent: student.parent_id,
        contact: student.phone,
        attendance: '0%', // This would need to be calculated from attendance records
        marks: '0', // This would need to be calculated from marks records
        fees: 'Paid', // This would need to be checked from fees records
        academic_year: student.academic_year,
        behavior: student.behavior || 'Good',
        achievements: student.achievements || []
      }));
      
      setStudents(formattedStudents);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAcademicYears = async () => {
    try {
      const { data, error } = await supabase
        .from('academic_years')
        .select('*');
      if (error) throw error;
      setAcademicYears(['Current', ...data.map(year => year.year)]);
    } catch (error) {
      console.error('Error loading academic years:', error);
    }
  };

  const loadStudentDetails = async (studentId) => {
    try {
      // Load attendance history
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', studentId)
        .order('attendance_date', { ascending: false });
      if (attendanceError) throw attendanceError;
      setAttendanceHistory(attendanceData || []);

      // Load marks history
      const { data: marksData, error: marksError } = await supabase
        .from('marks')
        .select('*')
        .eq('student_id', studentId)
        .order('exam_date', { ascending: false });
      if (marksError) throw marksError;
      setMarksHistory(marksData || []);

      // Load documents
      const { data: docsData, error: docsError } = await supabase
        .from('documents')
        .select('*')
        .eq('student_id', studentId);
      if (docsError) throw docsError;
      setDocuments(docsData || []);

      // Load achievements
      const { data: achievementsData, error: achievementsError } = await supabase
        .from('achievements')
        .select('*')
        .eq('student_id', studentId)
        .order('date', { ascending: false });
      if (achievementsError) throw achievementsError;
      setAchievements(achievementsData || []);

      // Load communication history
      const { data: commData, error: commError } = await supabase
        .from('communication_history')
        .select('*')
        .eq('student_id', studentId)
        .order('date', { ascending: false });
      if (commError) throw commError;
      setCommunicationHistory(commData || []);
    } catch (error) {
      console.error('Error loading student details:', error);
    }
  };

  const loadClassesAndSections = async () => {
    try {
      const { data: classData, error: classError } = await dbHelpers.getClasses();
      if (classError) throw classError;

      const { data: sectionData, error: sectionError } = await dbHelpers.getSectionsByClass(null);
      if (sectionError) throw sectionError;

      setClasses(classData || []);
      setSections(sectionData || []);
    } catch (error) {
      console.error('Error loading classes and sections:', error);
    }
  };

  const handleAddStudent = () => {
    setForm({
      roll: '',
      name: '',
      class: '',
      section: '',
      parent: '',
      contact: '',
      marks: '',
      fees: ''
    });
    setModalVisible(true);
  };

  const handleFormChange = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  const handleSubmit = async () => {
    try {
      if (!form.roll || !form.name || !form.class || !form.section || !form.parent || !form.contact) return;

      const { error } = await supabase
        .from('students')
        .insert({
          full_name: form.name,
          roll_no: parseInt(form.roll),
          class_id: form.class,
          section_id: form.section,
          parent_id: form.parent,
          phone: form.contact
        });

      if (error) throw error;

      await loadStudents();
      setForm({ roll: '', name: '', class: '', section: '', parent: '', contact: '', marks: '', fees: '' });
      setModalVisible(false);
    } catch (error) {
      console.error('Error adding student:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadStudents();
    } catch (error) {
      console.error('Error deleting student:', error);
    }
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

  const handleEditSave = async () => {
    try {
      if (!editForm.roll || !editForm.name || !editForm.class || !editForm.section || !editForm.parent || !editForm.contact) return;

      const { error } = await supabase
        .from('students')
        .update({
          full_name: editForm.name,
          roll_no: parseInt(editForm.roll),
          class_id: editForm.class,
          section_id: editForm.section,
          parent_id: editForm.parent,
          phone: editForm.contact
        })
        .eq('id', selectedStudent.id);

      if (error) throw error;

      await loadStudents();
      setEditModalVisible(false);
      setSelectedStudent(null);
    } catch (error) {
      console.error('Error updating student:', error);
    }
  };

  const handleViewProfile = (student) => {
    setSelectedStudent(student);
    setViewModalVisible(true);
  };

  const handleViewDocuments = (student) => {
    setSelectedStudent(student);
    setShowDocumentModal(true);
  };

  const exportStudentData = async () => {
    try {
      const html = `
        <h2 style="text-align:center;">Student Profile - ${selectedStudent.name}</h2>
        <h3 style="text-align:center;">Roll No: ${selectedStudent.roll}</h3>
        <h3 style="text-align:center;">Class: ${selectedStudent.class} - Section: ${selectedStudent.section}</h3>
        
        <div style="margin:20px 0;">
          <h3>Basic Information</h3>
          <table border="1" style="border-collapse:collapse;width:100%;margin-top:10px;">
            <tr>
              <th style="text-align:left;padding:8px;">Parent Name</th>
              <td style="text-align:left;padding:8px;">${selectedStudent.parent}</td>
            </tr>
            <tr>
              <th style="text-align:left;padding:8px;">Contact</th>
              <td style="text-align:left;padding:8px;">${selectedStudent.contact}</td>
            </tr>
            <tr>
              <th style="text-align:left;padding:8px;">Behavior</th>
              <td style="text-align:left;padding:8px;">${selectedStudent.behavior}</td>
            </tr>
          </table>
        </div>

        <div style="margin:20px 0;">
          <h3>Academic History</h3>
          <table border="1" style="border-collapse:collapse;width:100%;margin-top:10px;">
            <tr>
              <th style="text-align:center;padding:8px;">Subject</th>
              <th style="text-align:center;padding:8px;">Marks</th>
              <th style="text-align:center;padding:8px;">Grade</th>
              <th style="text-align:center;padding:8px;">Exam Date</th>
            </tr>
            ${marksHistory
              .map(record => `
                <tr>
                  <td style="text-align:center;padding:8px;">${record.subject_name}</td>
                  <td style="text-align:center;padding:8px;">${record.marks}</td>
                  <td style="text-align:center;padding:8px;">${calculateGrade(record.marks)}</td>
                  <td style="text-align:center;padding:8px;">${formatDateDMY(record.exam_date)}</td>
                </tr>
              `)
              .join('')}
          </table>
        </div>

        <div style="margin:20px 0;">
          <h3>Attendance History</h3>
          <table border="1" style="border-collapse:collapse;width:100%;margin-top:10px;">
            <tr>
              <th style="text-align:center;padding:8px;">Date</th>
              <th style="text-align:center;padding:8px;">Status</th>
            </tr>
            ${attendanceHistory
              .map(record => `
                <tr>
                  <td style="text-align:center;padding:8px;">${formatDateDMY(record.attendance_date)}</td>
                  <td style="text-align:center;padding:8px;">${record.status}</td>
                </tr>
              `)
              .join('')}
          </table>
        </div>

        <div style="margin:20px 0;">
          <h3>Achievements</h3>
          <ul style="margin-top:10px;">
            ${achievements
              .map(achievement => `
                <li style="margin:5px 0;">${achievement.description} (${formatDateDMY(achievement.date)})</li>
              `)
              .join('')}
          </ul>
        </div>
      `;

      await Print.printAsync({ html });
    } catch (error) {
      console.error('Error exporting student data:', error);
      Alert.alert('Error', 'Failed to export student data');
    }
  };

  const calculateGrade = (marks) => {
    if (marks >= 90) return 'A+';
    if (marks >= 80) return 'A';
    if (marks >= 70) return 'B';
    if (marks >= 60) return 'C';
    if (marks >= 50) return 'D';
    return 'F';
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
            <Text style={styles.behaviorText}>Behavior: <Text style={styles.behaviorValue}>{item.behavior}</Text></Text>
          </View>
          <View style={styles.teacherStats}>
            <Text style={styles.attendanceText}>{item.attendance}</Text>
            <Text style={styles.attendanceLabel}>Attendance</Text>
          </View>
        </View>
      </TouchableOpacity>
      <View style={styles.studentActions}>
        <TouchableOpacity style={styles.viewScoreBtn} onPress={() => handleViewScore(item)}>
          <Ionicons name="trophy-outline" size={18} color="#FF9800" style={{ marginRight: 4 }} />
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
        <TouchableOpacity style={styles.actionButton} onPress={() => handleViewDocuments(item)}>
          <Ionicons name="document-text" size={16} color="#2196F3" />
          <Text style={styles.actionText}>Documents</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header title="Manage Students" showBack={true} />
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Total Students: {students.length}</Text>
          <Text style={styles.headerSubtitle}>All enrolled students</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleAddStudent}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      <View style={styles.filterRow}>
        <View style={[styles.filterCol, styles.filterColMargin]}>
          <Text style={styles.filterLabel}>Class</Text>
          <View style={styles.filterBox}>
            <Picker
              selectedValue={selectedClass}
              onValueChange={setSelectedClass}
              style={styles.picker}
            >
              <Picker.Item key="All" label="All Classes" value="All" />
              {classes.map(cls => (
                <Picker.Item key={cls.id} label={`Class ${cls.class_name}`} value={cls.id} />
              ))}
            </Picker>
          </View>
        </View>
        <View style={styles.filterCol}>
          <Text style={styles.filterLabel}>Section</Text>
          <View style={styles.filterBox}>
            <Picker
              selectedValue={selectedSection}
              onValueChange={setSelectedSection}
              style={styles.picker}
            >
              <Picker.Item key="All" label="All Sections" value="All" />
              {sections.map(section => (
                <Picker.Item key={section.id} label={section.section_name} value={section.id} />
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
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Student</Text>
            <ScrollView>
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
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={form.class}
                  style={styles.picker}
                  onValueChange={(itemValue) => handleFormChange('class', itemValue)}
                >
                  {classOptions.filter(opt => opt !== 'All').map(opt => (
                    <Picker.Item key={opt} label={`Class ${opt}`} value={opt} />
                  ))}
                </Picker>
              </View>
              <Text style={styles.inputLabel}>Section</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={form.section}
                  style={styles.picker}
                  onValueChange={(itemValue) => handleFormChange('section', itemValue)}
                >
                  {sectionOptions.filter(opt => opt !== 'All').map(opt => (
                    <Picker.Item key={opt} label={opt} value={opt} />
                  ))}
                </Picker>
              </View>
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
                placeholder="Fees (e.g., Paid)"
                value={form.fees}
                onChangeText={(text) => handleFormChange('fees', text)}
              />
            </ScrollView>
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
            <ScrollView>
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
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={editForm.class}
                  style={styles.picker}
                  onValueChange={(itemValue) => handleEditFormChange('class', itemValue)}
                >
                  {classOptions.filter(opt => opt !== 'All').map(opt => (
                    <Picker.Item key={opt} label={`Class ${opt}`} value={opt} />
                  ))}
                </Picker>
              </View>
              <Text style={styles.inputLabel}>Section</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={editForm.section}
                  style={styles.picker}
                  onValueChange={(itemValue) => handleEditFormChange('section', itemValue)}
                >
                  {sectionOptions.filter(opt => opt !== 'All').map(opt => (
                    <Picker.Item key={opt} label={opt} value={opt} />
                  ))}
                </Picker>
              </View>
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
                placeholder="Fees (e.g., Paid)"
                value={editForm.fees}
                onChangeText={(text) => handleEditFormChange('fees', text)}
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
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterCol: {
    flex: 1,
    marginRight: 8,
  },
  filterColMargin: {
    marginRight: 8,
  },
  filterLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 5,
  },
  profileBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#2196F3',
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
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
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    marginBottom: 12,
    justifyContent: 'center',
    height: 50,
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
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
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
    marginTop: 12,
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
    marginRight: 10,
  },
  filterLabel: {
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 4,
    marginLeft: 2,
    fontSize: 14,
  },
  filterBox: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    height: 50,
    justifyContent: 'center',
  },
  picker: {
    width: '100%',
    height: 50,
    color: '#333',
  },
  topStudentCard: {
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