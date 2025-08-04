import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Header from '../../components/Header';
import { Picker } from '@react-native-picker/picker';
import { supabase, dbHelpers, TABLES } from '../../utils/supabase';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Print from 'expo-print';
import { formatDate } from '../../utils/helpers';

const ManageStudents = ({ route }) => {
  const navigation = useNavigation();
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('All');
  const [selectedGender, setSelectedGender] = useState('All');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('All');

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Date picker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerField, setDatePickerField] = useState('');

  // Form state for adding/editing students
  const [form, setForm] = useState({
    admission_no: '',
    name: '',
    dob: '',
    aadhar_no: '',
    place_of_birth: '',
    nationality: 'Indian',
    gender: 'Male',
    religion: '',
    caste: 'OC',
    address: '',
    pin_code: '',
    blood_group: '',
    mother_tongue: '',
    identification_mark_1: '',
    identification_mark_2: '',
    academic_year: '2024-25',
    general_behaviour: 'Normal',
    remarks: '',
    roll_no: '',
    parent_id: '',
    class_id: ''
  });

  // Statistics
  const [stats, setStats] = useState({
    totalStudents: 0,
    maleStudents: 0,
    femaleStudents: 0,
    averageAttendance: 0,
    totalClasses: 0
  });

  useEffect(() => {
    // Handle pre-selected class from navigation params first
    const { preSelectedClass, openAddModal } = route?.params || {};
    if (preSelectedClass) {
      setSelectedClass(preSelectedClass);
    }

    // Load data
    loadAllData();

    // Open modal after data is loaded if needed
    if (openAddModal) {
      setTimeout(() => {
        setForm(prev => ({ ...prev, class_id: preSelectedClass }));
        setModalVisible(true);
      }, 500);
    }
  }, []);

  useEffect(() => {
    if (selectedClass !== 'All') {
      loadAllData();
    }
  }, [selectedClass, selectedGender, selectedAcademicYear]);

  // Load all data
  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadStudents(),
        loadClasses(),
        loadParents()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Refresh data
  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  // Load students with full details
  const loadStudents = async () => {
    try {
      console.log('Loading students from table:', TABLES.STUDENTS);

      // Optimized query with joins for faster loading
      const { data: studentsData, error } = await supabase
        .from(TABLES.STUDENTS)
        .select(`
          *,
          classes(class_name, section),
          users!students_parent_id_fkey(full_name, phone)
        `)
        .order('created_at', { ascending: false });

      console.log('Raw students data:', studentsData, 'Error:', error);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      if (!studentsData || studentsData.length === 0) {
        console.log('No students found in database');
        setStudents([]);
        setStats({
          totalStudents: 0,
          maleStudents: 0,
          femaleStudents: 0,
          averageAttendance: 0,
          totalClasses: 0
        });
        return;
      }

      // Process students data quickly using joined data
      const studentsWithDetails = studentsData.map(student => ({
        ...student,
        attendancePercentage: 85, // Default value for speed
        className: student.classes?.class_name || 'N/A',
        section: student.classes?.section || 'N/A',
        parentName: student.users?.full_name || 'N/A',
        parentPhone: student.users?.phone || 'N/A'
      }));

      setStudents(studentsWithDetails);
      console.log('Loaded students with details:', studentsWithDetails.length, studentsWithDetails);

      // Calculate statistics
      const totalStudents = studentsWithDetails.length;
      const maleStudents = studentsWithDetails.filter(s => s.gender === 'Male').length;
      const femaleStudents = studentsWithDetails.filter(s => s.gender === 'Female').length;
      const avgAttendance = totalStudents > 0
        ? Math.round(studentsWithDetails.reduce((sum, s) => sum + s.attendancePercentage, 0) / totalStudents)
        : 0;

      setStats({
        totalStudents,
        maleStudents,
        femaleStudents,
        averageAttendance: avgAttendance,
        totalClasses: [...new Set(studentsWithDetails.map(s => s.class_id))].filter(Boolean).length
      });

    } catch (error) {
      console.error('Error loading students:', error);
      throw error;
    }
  };

  // Load classes
  const loadClasses = async () => {
    try {
      const { data: classData, error } = await supabase
        .from(TABLES.CLASSES)
        .select('*')
        .order('class_name');

      if (error) throw error;
      setClasses(classData || []);
    } catch (error) {
      console.error('Error loading classes:', error);
      throw error;
    }
  };

  // Load parents (users with parent role)
  const loadParents = async () => {
    try {
      const { data: parentData, error } = await supabase
        .from(TABLES.USERS)
        .select('id, full_name, phone')
        .eq('role_id', 3) // Assuming role_id 3 is for parents
        .order('full_name');

      if (error) throw error;
      setParents(parentData || []);
    } catch (error) {
      console.error('Error loading parents:', error);
      throw error;
    }
  };

  // Helper function to format date
  const formatDateForDisplay = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-IN');
    } catch (error) {
      return dateStr;
    }
  };

  // Helper function to calculate age
  const calculateAge = (dob) => {
    if (!dob) return 'N/A';
    try {
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    } catch (error) {
      return 'N/A';
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

      setClasses(classData || []);
    } catch (error) {
      console.error('Error loading classes and sections:', error);
    }
  };

  // Reset form to initial state
  const resetForm = () => {
    setForm({
      admission_no: '',
      name: '',
      dob: '',
      aadhar_no: '',
      place_of_birth: '',
      nationality: 'Indian',
      gender: 'Male',
      religion: '',
      caste: 'OC',
      address: '',
      pin_code: '',
      blood_group: '',
      mother_tongue: '',
      identification_mark_1: '',
      identification_mark_2: '',
      academic_year: '2024-25',
      general_behaviour: 'Normal',
      remarks: '',
      roll_no: '',
      parent_id: '',
      class_id: ''
    });
  };

  const handleAddStudent = () => {
    resetForm();
    setModalVisible(true);
  };

  // Debug function to add a test student
  const addTestStudent = async () => {
    try {
      const testStudent = {
        admission_no: `TEST${Date.now()}`,
        name: 'Test Student',
        dob: '2010-01-01',
        gender: 'Male',
        nationality: 'Indian',
        academic_year: '2024-25',
        general_behaviour: 'Normal'
      };

      const { error } = await supabase
        .from(TABLES.STUDENTS)
        .insert(testStudent);

      if (error) throw error;

      Alert.alert('Success', 'Test student added successfully');
      await loadAllData();
    } catch (error) {
      console.error('Error adding test student:', error);
      Alert.alert('Error', 'Failed to add test student: ' + error.message);
    }
  };

  const handleFormChange = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  // Date picker handler
  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate && datePickerField) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setForm({ ...form, [datePickerField]: formattedDate });
    }
    setDatePickerField('');
  };

  const openDatePicker = (field) => {
    setDatePickerField(field);
    setShowDatePicker(true);
  };

  // Generate unique admission number
  const generateAdmissionNumber = async () => {
    try {
      // Get the highest admission number
      const { data, error } = await supabase
        .from(TABLES.STUDENTS)
        .select('admission_no')
        .order('admission_no', { ascending: false })
        .limit(1);

      if (error) throw error;

      let nextAdmissionNo = 1;
      if (data && data.length > 0 && data[0].admission_no) {
        const lastAdmissionNo = parseInt(data[0].admission_no);
        if (!isNaN(lastAdmissionNo)) {
          nextAdmissionNo = lastAdmissionNo + 1;
        }
      }

      return nextAdmissionNo.toString();
    } catch (error) {
      console.error('Error generating admission number:', error);
      // Fallback to timestamp-based number
      return Date.now().toString().slice(-6);
    }
  };

  const handleSubmit = async () => {
    try {
      // Validate required fields
      if (!form.name || !form.dob || !form.gender || !form.academic_year || !form.class_id) {
        Alert.alert('Error', 'Please fill in all required fields (Name, Date of Birth, Gender, Academic Year, and Class)');
        return;
      }

      // Handle admission number - generate if not provided
      let admissionNo = form.admission_no;
      if (!admissionNo) {
        admissionNo = await generateAdmissionNumber();
        console.log('Generated admission number:', admissionNo);
      }

      const { error } = await supabase
        .from(TABLES.STUDENTS)
        .insert({
          admission_no: admissionNo,
          name: form.name,
          dob: form.dob,
          aadhar_no: form.aadhar_no || null,
          place_of_birth: form.place_of_birth || null,
          nationality: form.nationality,
          gender: form.gender,
          religion: form.religion || null,
          caste: form.caste,
          address: form.address || null,
          pin_code: form.pin_code || null,
          blood_group: form.blood_group || null,
          mother_tongue: form.mother_tongue || null,
          identification_mark_1: form.identification_mark_1 || null,
          identification_mark_2: form.identification_mark_2 || null,
          academic_year: form.academic_year,
          general_behaviour: form.general_behaviour,
          remarks: form.remarks || null,
          roll_no: form.roll_no ? parseInt(form.roll_no) : null,
          parent_id: form.parent_id || null,
          class_id: form.class_id || null
        });

      if (error) throw error;

      Alert.alert('Success', 'Student added successfully');
      await loadAllData();
      resetForm();
      setModalVisible(false);
    } catch (error) {
      console.error('Error adding student:', error);

      // Handle specific error cases
      if (error.code === '23505') {
        if (error.message.includes('admission_no')) {
          Alert.alert('Error', 'This admission number already exists. Please try again with a different number.');
        } else if (error.message.includes('roll_no')) {
          Alert.alert('Error', 'This roll number already exists in the selected class. Please use a different roll number.');
        } else {
          Alert.alert('Error', 'A student with this information already exists.');
        }
      } else {
        Alert.alert('Error', 'Failed to add student: ' + error.message);
      }
    }
  };

  const handleDelete = async (id) => {
    Alert.alert(
      'Delete Student',
      'Are you sure you want to delete this student? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from(TABLES.STUDENTS)
                .delete()
                .eq('id', id);

              if (error) throw error;

              Alert.alert('Success', 'Student deleted successfully');
              await loadAllData();
            } catch (error) {
              console.error('Error deleting student:', error);
              Alert.alert('Error', 'Failed to delete student: ' + error.message);
            }
          }
        }
      ]
    );
  };

  const handleEdit = (student) => {
    setSelectedStudent(student);
    setForm({
      admission_no: student.admission_no || '',
      name: student.name || '',
      dob: student.dob || '',
      aadhar_no: student.aadhar_no || '',
      place_of_birth: student.place_of_birth || '',
      nationality: student.nationality || 'Indian',
      gender: student.gender || 'Male',
      religion: student.religion || '',
      caste: student.caste || 'OC',
      address: student.address || '',
      pin_code: student.pin_code || '',
      blood_group: student.blood_group || '',
      mother_tongue: student.mother_tongue || '',
      identification_mark_1: student.identification_mark_1 || '',
      identification_mark_2: student.identification_mark_2 || '',
      academic_year: student.academic_year || '2024-25',
      general_behaviour: student.general_behaviour || 'Normal',
      remarks: student.remarks || '',
      roll_no: student.roll_no?.toString() || '',
      parent_id: student.parent_id || '',
      class_id: student.class_id || ''
    });
    setEditModalVisible(true);
  };

  const handleEditSave = async () => {
    try {
      // Validate required fields
      if (!form.admission_no || !form.name || !form.dob || !form.gender || !form.academic_year) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      const { error } = await supabase
        .from(TABLES.STUDENTS)
        .update({
          admission_no: form.admission_no,
          name: form.name,
          dob: form.dob,
          aadhar_no: form.aadhar_no || null,
          place_of_birth: form.place_of_birth || null,
          nationality: form.nationality,
          gender: form.gender,
          religion: form.religion || null,
          caste: form.caste,
          address: form.address || null,
          pin_code: form.pin_code || null,
          blood_group: form.blood_group || null,
          mother_tongue: form.mother_tongue || null,
          identification_mark_1: form.identification_mark_1 || null,
          identification_mark_2: form.identification_mark_2 || null,
          academic_year: form.academic_year,
          general_behaviour: form.general_behaviour,
          remarks: form.remarks || null,
          roll_no: form.roll_no ? parseInt(form.roll_no) : null,
          parent_id: form.parent_id || null,
          class_id: form.class_id || null
        })
        .eq('id', selectedStudent.id);

      if (error) throw error;

      Alert.alert('Success', 'Student updated successfully');
      await loadAllData();
      setEditModalVisible(false);
      setSelectedStudent(null);
      resetForm();
    } catch (error) {
      console.error('Error updating student:', error);
      Alert.alert('Error', 'Failed to update student: ' + error.message);
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
        <h3 style="text-align:center;">Class: ${selectedStudent.class}</h3>
        
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

  // Filter students based on selected criteria
  const filteredStudents = students.filter(student => {
    const matchesSearch = search === '' ||
      student.name?.toLowerCase().includes(search.toLowerCase()) ||
      student.admission_no?.toLowerCase().includes(search.toLowerCase()) ||
      (student.roll_no && student.roll_no.toString().includes(search));

    const matchesClass = selectedClass === 'All' || student.class_id === selectedClass;
    const matchesGender = selectedGender === 'All' || student.gender === selectedGender;
    // Make academic year filter more flexible - show all if no academic year is set
    const matchesAcademicYear = selectedAcademicYear === 'All' ||
      !student.academic_year ||
      student.academic_year === selectedAcademicYear;

    return matchesSearch && matchesClass && matchesGender && matchesAcademicYear;
  });

  console.log('Filter Debug:', {
    totalStudents: students.length,
    filteredStudents: filteredStudents.length,
    selectedClass,
    selectedGender,
    selectedAcademicYear,
    search
  });

  // Academic year options
  const academicYearOptions = ['All', '2024-25', '2023-24', '2022-23'];

  // Gender options
  const genderOptions = ['All', 'Male', 'Female'];

  // Caste options
  const casteOptions = ['OC', 'BC', 'SC', 'ST', 'Other'];

  // Behaviour options
  const behaviourOptions = ['Mild', 'Normal', 'Hyperactive'];

  // Blood group options
  const bloodGroupOptions = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const renderStudent = ({ item, index }) => (
    <View style={styles.studentCard}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => handleViewProfile(item)}
        style={styles.cardContent}
      >
        {/* Student Main Info */}
        <View style={styles.studentMainRow}>
          <View style={styles.studentLeft}>
            <View style={[styles.avatarContainer, {
              backgroundColor: item.gender === 'Female' ? '#FCE4EC' : '#E3F2FD'
            }]}>
              <Ionicons
                name={item.gender === 'Female' ? 'woman' : 'man'}
                size={20}
                color={item.gender === 'Female' ? '#E91E63' : '#2196F3'}
              />
            </View>
            <View style={styles.studentBasicInfo}>
              <Text style={styles.studentName}>{item.name}</Text>
              <Text style={styles.studentId}>#{item.admission_no}</Text>
            </View>
          </View>

          <View style={styles.studentRight}>
            <View style={styles.attendanceBadge}>
              <Text style={styles.attendanceText}>{item.attendancePercentage}%</Text>
            </View>
            {index === 0 && (
              <View style={styles.topBadge}>
                <Ionicons name="star" size={10} color="#FFD700" />
              </View>
            )}
          </View>
        </View>

        {/* Student Details */}
        <View style={styles.studentDetailsRow}>
          <View style={styles.detailItem}>
            <Ionicons name="school" size={14} color="#4CAF50" />
            <Text style={styles.detailText}>
              {item.className}{item.section && `-${item.section}`}
              {item.roll_no && ` • ${item.roll_no}`}
            </Text>
          </View>

          <View style={styles.detailItem}>
            <Ionicons name="person" size={14} color="#666" />
            <Text style={styles.detailText}>{item.parentName}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={[styles.quickActionBtn, styles.viewBtn]}
          onPress={() => handleViewProfile(item)}
        >
          <Ionicons name="eye" size={16} color="#2196F3" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickActionBtn, styles.editBtn]}
          onPress={() => handleEdit(item)}
        >
          <Ionicons name="create" size={16} color="#FF9800" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickActionBtn, styles.deleteBtn]}
          onPress={() => handleDelete(item.id)}
        >
          <Ionicons name="trash" size={16} color="#f44336" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Manage Students" showBack={true} onBack={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Loading students...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Manage Students" showBack={true} onBack={() => navigation.goBack()} />

      {/* Modern Statistics Cards */}
      <View style={styles.statsSection}>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}>
            <View style={styles.statIcon}>
              <Ionicons name="people" size={24} color="#1976D2" />
            </View>
            <Text style={styles.statNumber}>{stats.totalStudents}</Text>
            <Text style={styles.statTitle}>Total Students</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#E8F5E8' }]}>
            <View style={styles.statIcon}>
              <Ionicons name="checkmark-circle" size={24} color="#388E3C" />
            </View>
            <Text style={styles.statNumber}>{stats.averageAttendance}%</Text>
            <Text style={styles.statTitle}>Attendance</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}>
            <View style={styles.statIcon}>
              <Ionicons name="man" size={24} color="#1976D2" />
            </View>
            <Text style={styles.statNumber}>{stats.maleStudents}</Text>
            <Text style={styles.statTitle}>Male</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#FCE4EC' }]}>
            <View style={styles.statIcon}>
              <Ionicons name="woman" size={24} color="#C2185B" />
            </View>
            <Text style={styles.statNumber}>{stats.femaleStudents}</Text>
            <Text style={styles.statTitle}>Female</Text>
          </View>
        </View>
      </View>

      {/* Modern Filters & Search */}
      <View style={styles.controlsSection}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search students..."
              value={search}
              onChangeText={setSearch}
              placeholderTextColor="#999"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
          <View style={styles.filterChips}>
            <View style={styles.filterChip}>
              <Text style={styles.filterChipLabel}>Class:</Text>
              <Picker
                selectedValue={selectedClass}
                onValueChange={setSelectedClass}
                style={styles.filterPicker}
              >
                <Picker.Item label="All" value="All" />
                {classes.map(cls => (
                  <Picker.Item
                    key={cls.id}
                    label={`${cls.class_name}-${cls.section}`}
                    value={cls.id}
                  />
                ))}
              </Picker>
            </View>

            <View style={styles.filterChip}>
              <Text style={styles.filterChipLabel}>Gender:</Text>
              <Picker
                selectedValue={selectedGender}
                onValueChange={setSelectedGender}
                style={styles.filterPicker}
              >
                {genderOptions.map(gender => (
                  <Picker.Item key={gender} label={gender} value={gender} />
                ))}
              </Picker>
            </View>

            <View style={styles.filterChip}>
              <Text style={styles.filterChipLabel}>Year:</Text>
              <Picker
                selectedValue={selectedAcademicYear}
                onValueChange={setSelectedAcademicYear}
                style={styles.filterPicker}
              >
                {academicYearOptions.map(year => (
                  <Picker.Item key={year} label={year} value={year} />
                ))}
              </Picker>
            </View>
          </View>
        </ScrollView>

        {/* Results Count */}
        <Text style={styles.resultsCount}>
          {filteredStudents.length} of {students.length} students
        </Text>
      </View>



      {/* Students List */}
      <FlatList
        data={filteredStudents}
        keyExtractor={(item) => item.id}
        renderItem={renderStudent}
        contentContainerStyle={{ paddingBottom: 80, paddingHorizontal: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="school-outline" size={80} color="#e0e0e0" />
            </View>
            <Text style={styles.emptyTitle}>
              {students.length === 0 ? 'No Students Yet' : 'No Results Found'}
            </Text>
            <Text style={styles.emptySubtext}>
              {students.length === 0
                ? 'Start building your student database by adding your first student.'
                : 'Try adjusting your search terms or filters to find students.'
              }
            </Text>

            {/* Action Buttons */}
            <View style={styles.emptyActions}>
              {students.length === 0 ? (
                <>
                  <TouchableOpacity
                    style={styles.emptyActionButton}
                    onPress={handleAddStudent}
                  >
                    <Ionicons name="add-circle" size={20} color="#fff" />
                    <Text style={styles.emptyActionText}>Add First Student</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.emptySecondaryButton}
                    onPress={addTestStudent}
                  >
                    <Ionicons name="flask" size={16} color="#2196F3" />
                    <Text style={styles.emptySecondaryText}>Add Test Data</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={styles.emptyActionButton}
                  onPress={() => {
                    setSearch('');
                    setSelectedClass('All');
                    setSelectedGender('All');
                    setSelectedAcademicYear('All');
                  }}
                >
                  <Ionicons name="refresh" size={20} color="#fff" />
                  <Text style={styles.emptyActionText}>Clear Filters</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Debug Info */}
            <Text style={styles.debugText}>
              Total: {students.length} • Filtered: {filteredStudents.length}
            </Text>
          </View>
        }
      />

      {/* Simple FAB */}
      <TouchableOpacity style={styles.fab} onPress={handleAddStudent}>
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
      {/* Add/Edit Student Modal */}
      <Modal
        visible={modalVisible || editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setModalVisible(false);
          setEditModalVisible(false);
          resetForm();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editModalVisible ? 'Edit Student' : 'Add New Student'}
            </Text>
            <Text style={styles.requiredNote}>
              Fields marked with * are required
            </Text>
            <ScrollView style={styles.modalScrollView}>
              {/* Basic Information */}
              <Text style={styles.sectionTitle}>Basic Information</Text>

              <Text style={styles.inputLabel}>Admission Number (Auto-generated if empty)</Text>
              <TextInput
                style={styles.input}
                placeholder="Leave empty to auto-generate"
                value={form.admission_no}
                onChangeText={(text) => handleFormChange('admission_no', text)}
                keyboardType="numeric"
              />

              <Text style={styles.inputLabel}>Full Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Student Full Name"
                value={form.name}
                onChangeText={(text) => handleFormChange('name', text)}
              />

              <Text style={styles.inputLabel}>Date of Birth *</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => openDatePicker('dob')}
              >
                <Text style={form.dob ? styles.dateText : styles.datePlaceholder}>
                  {form.dob ? formatDateForDisplay(form.dob) : 'Select Date of Birth'}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#666" />
              </TouchableOpacity>

              <Text style={styles.inputLabel}>Gender *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={form.gender}
                  style={styles.picker}
                  onValueChange={(value) => handleFormChange('gender', value)}
                >
                  <Picker.Item label="Male" value="Male" />
                  <Picker.Item label="Female" value="Female" />
                </Picker>
              </View>

              <Text style={styles.inputLabel}>Academic Year *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={form.academic_year}
                  style={styles.picker}
                  onValueChange={(value) => handleFormChange('academic_year', value)}
                >
                  {academicYearOptions.map(year => (
                    <Picker.Item key={year} label={year} value={year} />
                  ))}
                </Picker>
              </View>

              <Text style={styles.inputLabel}>Class & Section *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={form.class_id}
                  style={styles.picker}
                  onValueChange={(value) => handleFormChange('class_id', value)}
                >
                  <Picker.Item label="Select Class & Section" value="" />
                  {classes.map(classItem => (
                    <Picker.Item
                      key={classItem.id}
                      label={`${classItem.class_name} - ${classItem.section}`}
                      value={classItem.id}
                    />
                  ))}
                </Picker>
              </View>

              <Text style={styles.inputLabel}>Roll Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Roll Number (optional)"
                value={form.roll_no}
                onChangeText={(text) => handleFormChange('roll_no', text)}
                keyboardType="numeric"
              />

              <Text style={styles.inputLabel}>Parent/Guardian</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={form.parent_id}
                  style={styles.picker}
                  onValueChange={(value) => handleFormChange('parent_id', value)}
                >
                  <Picker.Item label="Select Parent/Guardian (optional)" value="" />
                  {parents.map(parent => (
                    <Picker.Item
                      key={parent.id}
                      label={`${parent.full_name} (${parent.phone || 'No phone'})`}
                      value={parent.id}
                    />
                  ))}
                </Picker>
              </View>

              {/* Personal Details */}
              <Text style={styles.sectionTitle}>Personal Details</Text>

              <Text style={styles.inputLabel}>Aadhar Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Aadhar Number"
                value={form.aadhar_no}
                onChangeText={(text) => handleFormChange('aadhar_no', text)}
                keyboardType="number-pad"
                maxLength={12}
              />

              <Text style={styles.inputLabel}>Place of Birth</Text>
              <TextInput
                style={styles.input}
                placeholder="Place of Birth"
                value={form.place_of_birth}
                onChangeText={(text) => handleFormChange('place_of_birth', text)}
              />

              <Text style={styles.inputLabel}>Nationality</Text>
              <TextInput
                style={styles.input}
                placeholder="Nationality"
                value={form.nationality}
                onChangeText={(text) => handleFormChange('nationality', text)}
              />

              <Text style={styles.inputLabel}>Religion</Text>
              <TextInput
                style={styles.input}
                placeholder="Religion"
                value={form.religion}
                onChangeText={(text) => handleFormChange('religion', text)}
              />

              <Text style={styles.inputLabel}>Caste</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={form.caste}
                  style={styles.picker}
                  onValueChange={(value) => handleFormChange('caste', value)}
                >
                  {casteOptions.map(caste => (
                    <Picker.Item key={caste} label={caste} value={caste} />
                  ))}
                </Picker>
              </View>

              <Text style={styles.inputLabel}>Mother Tongue</Text>
              <TextInput
                style={styles.input}
                placeholder="Mother Tongue"
                value={form.mother_tongue}
                onChangeText={(text) => handleFormChange('mother_tongue', text)}
              />

              <Text style={styles.inputLabel}>Blood Group</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={form.blood_group}
                  style={styles.picker}
                  onValueChange={(value) => handleFormChange('blood_group', value)}
                >
                  <Picker.Item label="Select Blood Group" value="" />
                  {bloodGroupOptions.map(bg => (
                    <Picker.Item key={bg} label={bg} value={bg} />
                  ))}
                </Picker>
              </View>
            </ScrollView>

            {/* Date Picker */}
            {showDatePicker && (
              <DateTimePicker
                value={form.dob ? new Date(form.dob) : new Date()}
                mode="date"
                display="default"
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={editModalVisible ? handleEditSave : handleSubmit}
              >
                <Text style={styles.modalButtonText}>
                  {editModalVisible ? 'Update' : 'Add'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#aaa' }]}
                onPress={() => {
                  setModalVisible(false);
                  setEditModalVisible(false);
                  resetForm();
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* View Student Profile Modal */}
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
              <ScrollView style={styles.modalScrollView}>
                {/* Basic Information */}
                <View style={styles.profileSection}>
                  <Text style={styles.profileSectionTitle}>Basic Information</Text>
                  <View style={styles.profileRow}>
                    <Text style={styles.profileLabel}>Name:</Text>
                    <Text style={styles.profileValue}>{selectedStudent.name}</Text>
                  </View>
                  <View style={styles.profileRow}>
                    <Text style={styles.profileLabel}>Admission No:</Text>
                    <Text style={styles.profileValue}>{selectedStudent.admission_no}</Text>
                  </View>
                  <View style={styles.profileRow}>
                    <Text style={styles.profileLabel}>Roll Number:</Text>
                    <Text style={styles.profileValue}>{selectedStudent.roll_no || 'Not assigned'}</Text>
                  </View>
                  <View style={styles.profileRow}>
                    <Text style={styles.profileLabel}>Class:</Text>
                    <Text style={styles.profileValue}>{selectedStudent.className} {selectedStudent.section}</Text>
                  </View>
                  <View style={styles.profileRow}>
                    <Text style={styles.profileLabel}>Gender:</Text>
                    <Text style={styles.profileValue}>{selectedStudent.gender}</Text>
                  </View>
                  <View style={styles.profileRow}>
                    <Text style={styles.profileLabel}>Date of Birth:</Text>
                    <Text style={styles.profileValue}>{formatDateForDisplay(selectedStudent.dob)}</Text>
                  </View>
                  <View style={styles.profileRow}>
                    <Text style={styles.profileLabel}>Age:</Text>
                    <Text style={styles.profileValue}>{calculateAge(selectedStudent.dob)} years</Text>
                  </View>
                </View>

                {/* Personal Details */}
                <View style={styles.profileSection}>
                  <Text style={styles.profileSectionTitle}>Personal Details</Text>
                  <View style={styles.profileRow}>
                    <Text style={styles.profileLabel}>Nationality:</Text>
                    <Text style={styles.profileValue}>{selectedStudent.nationality || 'N/A'}</Text>
                  </View>
                  <View style={styles.profileRow}>
                    <Text style={styles.profileLabel}>Religion:</Text>
                    <Text style={styles.profileValue}>{selectedStudent.religion || 'N/A'}</Text>
                  </View>
                  <View style={styles.profileRow}>
                    <Text style={styles.profileLabel}>Caste:</Text>
                    <Text style={styles.profileValue}>{selectedStudent.caste || 'N/A'}</Text>
                  </View>
                  <View style={styles.profileRow}>
                    <Text style={styles.profileLabel}>Blood Group:</Text>
                    <Text style={styles.profileValue}>{selectedStudent.blood_group || 'N/A'}</Text>
                  </View>
                  <View style={styles.profileRow}>
                    <Text style={styles.profileLabel}>Mother Tongue:</Text>
                    <Text style={styles.profileValue}>{selectedStudent.mother_tongue || 'N/A'}</Text>
                  </View>
                </View>

                {/* Contact Information */}
                <View style={styles.profileSection}>
                  <Text style={styles.profileSectionTitle}>Contact Information</Text>
                  <View style={styles.profileRow}>
                    <Text style={styles.profileLabel}>Parent Name:</Text>
                    <Text style={styles.profileValue}>{selectedStudent.parentName}</Text>
                  </View>
                  <View style={styles.profileRow}>
                    <Text style={styles.profileLabel}>Parent Phone:</Text>
                    <Text style={styles.profileValue}>{selectedStudent.parentPhone}</Text>
                  </View>
                  <View style={styles.profileRow}>
                    <Text style={styles.profileLabel}>Address:</Text>
                    <Text style={styles.profileValue}>{selectedStudent.address || 'N/A'}</Text>
                  </View>
                  <View style={styles.profileRow}>
                    <Text style={styles.profileLabel}>Pin Code:</Text>
                    <Text style={styles.profileValue}>{selectedStudent.pin_code || 'N/A'}</Text>
                  </View>
                </View>

                {/* Academic Information */}
                <View style={styles.profileSection}>
                  <Text style={styles.profileSectionTitle}>Academic Information</Text>
                  <View style={styles.profileRow}>
                    <Text style={styles.profileLabel}>Academic Year:</Text>
                    <Text style={styles.profileValue}>{selectedStudent.academic_year}</Text>
                  </View>
                  <View style={styles.profileRow}>
                    <Text style={styles.profileLabel}>Attendance:</Text>
                    <Text style={[styles.profileValue, { color: '#4CAF50', fontWeight: 'bold' }]}>
                      {selectedStudent.attendancePercentage}%
                    </Text>
                  </View>
                  <View style={styles.profileRow}>
                    <Text style={styles.profileLabel}>Behaviour:</Text>
                    <Text style={styles.profileValue}>{selectedStudent.general_behaviour}</Text>
                  </View>
                  {selectedStudent.remarks && (
                    <View style={styles.profileRow}>
                      <Text style={styles.profileLabel}>Remarks:</Text>
                      <Text style={styles.profileValue}>{selectedStudent.remarks}</Text>
                    </View>
                  )}
                </View>
              </ScrollView>
            )}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setViewModalVisible(false)}
              >
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  // Modern Statistics Section
  statsSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#333',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  // Modern Controls Section
  controlsSection: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  filtersScroll: {
    marginBottom: 12,
  },
  filterChips: {
    flexDirection: 'row',
    paddingHorizontal: 4,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  filterChipLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginRight: 4,
  },
  filterPicker: {
    height: 30,
    minWidth: 80,
    color: '#333',
  },
  resultsCount: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  // Modern Student Cards
  studentCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 16,
  },
  studentMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  studentLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  studentBasicInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 2,
  },
  studentId: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
  },
  studentRight: {
    alignItems: 'flex-end',
  },
  attendanceBadge: {
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 4,
  },
  attendanceText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4CAF50',
  },
  topBadge: {
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    padding: 4,
  },
  studentDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
    flex: 1,
  },
  quickActions: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  quickActionBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 8,
  },
  viewBtn: {
    backgroundColor: '#E3F2FD',
  },
  editBtn: {
    backgroundColor: '#FFF3E0',
  },
  deleteBtn: {
    backgroundColor: '#FFEBEE',
  },
  // Enhanced Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyActions: {
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  emptyActionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  emptySecondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  emptySecondaryText: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  debugText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    fontFamily: 'monospace',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },

  // Modern FAB
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    backgroundColor: '#2196F3',
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
    color: '#333',
  },
  requiredNote: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  modalScrollView: {
    maxHeight: 400,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2196F3',
    marginTop: 16,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    paddingBottom: 4,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#f8f9fa',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  datePlaceholder: {
    fontSize: 16,
    color: '#999',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#f8f9fa',
    height: 48,
    justifyContent: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  modalButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'center',
  },
  // Profile Modal Styles
  profileSection: {
    marginBottom: 20,
  },
  profileSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2196F3',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    paddingBottom: 4,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  profileLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    flex: 1,
  },
  profileValue: {
    fontSize: 14,
    color: '#333',
    flex: 2,
    textAlign: 'right',
  },
});

export default ManageStudents;