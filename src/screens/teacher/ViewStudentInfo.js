import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Modal, ScrollView, Button, Platform, Animated, Easing, Pressable, ActivityIndicator, Alert } from 'react-native';
import Header from '../../components/Header';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import DropDownPicker from 'react-native-dropdown-picker';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../utils/AuthContext';
import { supabase, TABLES } from '../../utils/supabase';

const ViewStudentInfo = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedClass, setSelectedClass] = useState('All');
  const [classes, setClasses] = useState([]);
  const { user } = useAuth();
  const navigation = useNavigation();

  // Fetch teacher's students
  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get teacher info
      const { data: teacherData, error: teacherError } = await supabase
        .from(TABLES.TEACHERS)
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (teacherError) throw new Error('Teacher not found');

      // Get assigned classes and subjects
      const { data: assignedData, error: assignedError } = await supabase
        .from(TABLES.TEACHER_SUBJECTS)
        .select(`
          *,
          classes(id, class_name),
          sections(id, section_name)
        `)
        .eq('teacher_id', teacherData.id);

      if (assignedError) throw assignedError;

      // Get unique classes
      const uniqueClasses = [...new Set(assignedData.map(a => a.classes.class_name))];
      setClasses(['All', ...uniqueClasses]);

      // Get students from assigned classes
      const studentPromises = assignedData.map(assignment => 
        supabase
          .from(TABLES.STUDENTS)
          .select(`
            id,
            full_name,
            roll_no,
            email,
            phone,
            address,
            date_of_birth,
            gender,
            classes(class_name),
            sections(section_name),
            parents(full_name, phone, email)
          `)
          .eq('class_id', assignment.classes.id)
          .eq('section_id', assignment.sections.id)
          .order('roll_no')
      );

      const studentResults = await Promise.all(studentPromises);
      const allStudents = [];

      studentResults.forEach((result, index) => {
        if (result.data) {
          const classSection = `${assignedData[index].classes.class_name}-${assignedData[index].sections.section_name}`;
          result.data.forEach(student => {
            allStudents.push({
              ...student,
              classSection,
              className: assignedData[index].classes.class_name,
              sectionName: assignedData[index].sections.section_name
            });
          });
        }
      });

      // Remove duplicates
      const uniqueStudents = allStudents.filter((student, index, self) => 
        index === self.findIndex(s => s.id === student.id)
      );

      setStudents(uniqueStudents);
      setFilteredStudents(uniqueStudents);

    } catch (err) {
      setError(err.message);
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch student statistics
  const fetchStudentStats = async (studentId) => {
    try {
      // Get attendance statistics
      const { data: attendanceData, error: attendanceError } = await supabase
        .from(TABLES.STUDENT_ATTENDANCE)
        .select('*')
        .eq('student_id', studentId);

      if (attendanceError) throw attendanceError;

      const totalDays = attendanceData.length;
      const presentDays = attendanceData.filter(a => a.status === 'Present').length;
      const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

      // Get marks statistics
      const { data: marksData, error: marksError } = await supabase
        .from(TABLES.MARKS)
        .select('*')
        .eq('student_id', studentId);

      if (marksError) throw marksError;

      const totalMarks = marksData.length;
      const averageMarks = totalMarks > 0 
        ? Math.round(marksData.reduce((sum, m) => sum + (m.marks_obtained || 0), 0) / totalMarks)
        : 0;

      return {
        attendance: attendancePercentage,
        marks: averageMarks,
        attendanceHistory: attendanceData.slice(-4).map(a => a.status === 'Present' ? 100 : 0),
        marksHistory: marksData.slice(-4).map(m => m.marks_obtained || 0)
      };

    } catch (err) {
      console.error('Error fetching student stats:', err);
      return {
        attendance: 0,
        marks: 0,
        attendanceHistory: [0, 0, 0, 0],
        marksHistory: [0, 0, 0, 0]
      };
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Filter students based on search and class
  useEffect(() => {
    let filtered = students;

    // Filter by class
    if (selectedClass !== 'All') {
      filtered = filtered.filter(student => student.className === selectedClass);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(student =>
        student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.roll_no.toString().includes(searchQuery) ||
        student.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredStudents(filtered);
  }, [students, searchQuery, selectedClass]);

  const openModal = async (student) => {
    setSelectedStudent(student);
    setModalVisible(true);
    
    // Fetch student statistics
    const stats = await fetchStudentStats(student.id);
    setSelectedStudent({ ...student, ...stats });
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedStudent(null);
  };

  const handleExportCSV = async () => {
    try {
      const csvData = [
        ['Name', 'Roll No', 'Class', 'Section', 'Email', 'Phone', 'Attendance %', 'Average Marks'],
        ...filteredStudents.map(student => [
          student.full_name,
          student.roll_no,
          student.className,
          student.sectionName,
          student.email || '',
          student.phone || '',
          student.attendance || 0,
          student.marks || 0
        ])
      ].map(row => row.join(',')).join('\n');

      const fileName = `students_${new Date().toISOString().split('T')[0]}.csv`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(fileUri, csvData);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Success', 'CSV file saved successfully!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to export CSV');
      console.error('CSV export error:', error);
    }
  };

  const handleExportPDF = async () => {
    try {
      const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .student-card { border: 1px solid #ddd; margin: 10px 0; padding: 15px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Student Information Report</h1>
              <p>Generated on: ${new Date().toLocaleDateString()}</p>
            </div>
            ${filteredStudents.map(student => `
              <div class="student-card">
                <h3>${student.full_name}</h3>
                <p><strong>Roll No:</strong> ${student.roll_no}</p>
                <p><strong>Class:</strong> ${student.className} - ${student.sectionName}</p>
                <p><strong>Email:</strong> ${student.email || 'N/A'}</p>
                <p><strong>Phone:</strong> ${student.phone || 'N/A'}</p>
                <p><strong>Parent:</strong> ${student.parents?.full_name || 'N/A'}</p>
              </div>
            `).join('')}
          </body>
        </html>
      `;

      await Print.printAsync({ html: htmlContent });
    } catch (error) {
      Alert.alert('Error', 'Failed to generate PDF');
      console.error('PDF export error:', error);
    }
  };

  const renderStudent = ({ item }) => (
    <TouchableOpacity
      style={styles.studentCard}
      onPress={() => openModal(item)}
    >
      <View style={styles.studentHeader}>
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>{item.full_name}</Text>
          <Text style={styles.studentDetails}>
            Roll: {item.roll_no} | {item.classSection}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#666" />
      </View>
      
      <View style={styles.studentStats}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Email</Text>
          <Text style={styles.statValue}>{item.email || 'N/A'}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Parent</Text>
          <Text style={styles.statValue}>{item.parents?.full_name || 'N/A'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="View Student Info" showBack={true} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1976d2" />
          <Text style={styles.loadingText}>Loading students...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Header title="View Student Info" showBack={true} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchStudents}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="View Student Info" showBack={true} />
      
      <View style={styles.content}>
        {/* Search and Filter */}
        <View style={styles.searchSection}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search students..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          
          <View style={styles.filterContainer}>
            <Text style={styles.filterLabel}>Class:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {classes.map(cls => (
                <TouchableOpacity
                  key={cls}
                  style={[
                    styles.filterButton,
                    selectedClass === cls && styles.selectedFilterButton
                  ]}
                  onPress={() => setSelectedClass(cls)}
                >
                  <Text style={[
                    styles.filterButtonText,
                    selectedClass === cls && styles.selectedFilterButtonText
                  ]}>
                    {cls}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Export Buttons */}
        <View style={styles.exportSection}>
          <TouchableOpacity style={styles.exportButton} onPress={handleExportCSV}>
            <Ionicons name="document-text" size={20} color="#fff" />
            <Text style={styles.exportButtonText}>Export CSV</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.exportButton} onPress={handleExportPDF}>
            <Ionicons name="print" size={20} color="#fff" />
            <Text style={styles.exportButtonText}>Export PDF</Text>
          </TouchableOpacity>
        </View>

        {/* Students List */}
        {filteredStudents.length === 0 ? (
          <View style={styles.noDataContainer}>
            <Ionicons name="people-outline" size={48} color="#ccc" />
            <Text style={styles.noDataText}>No students found</Text>
            <Text style={styles.noDataSubtext}>
              {searchQuery ? 'Try adjusting your search' : 'No students assigned to your classes'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredStudents}
            renderItem={renderStudent}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>

      {/* Student Detail Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Student Details</Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color="#1976d2" />
              </TouchableOpacity>
            </View>
            
            {selectedStudent && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.detailSection}>
                  <Text style={styles.detailTitle}>Personal Information</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Name:</Text>
                    <Text style={styles.detailValue}>{selectedStudent.full_name}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Roll No:</Text>
                    <Text style={styles.detailValue}>{selectedStudent.roll_no}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Class:</Text>
                    <Text style={styles.detailValue}>{selectedStudent.classSection}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Email:</Text>
                    <Text style={styles.detailValue}>{selectedStudent.email || 'N/A'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Phone:</Text>
                    <Text style={styles.detailValue}>{selectedStudent.phone || 'N/A'}</Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailTitle}>Parent Information</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Name:</Text>
                    <Text style={styles.detailValue}>{selectedStudent.parents?.name || 'N/A'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Phone:</Text>
                    <Text style={styles.detailValue}>{selectedStudent.parents?.phone || 'N/A'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Email:</Text>
                    <Text style={styles.detailValue}>{selectedStudent.parents?.email || 'N/A'}</Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailTitle}>Academic Performance</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Attendance:</Text>
                    <Text style={styles.detailValue}>{selectedStudent.attendance || 0}%</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Average Marks:</Text>
                    <Text style={styles.detailValue}>{selectedStudent.marks || 0}%</Text>
                  </View>
                </View>

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {
                      closeModal();
                      navigation.navigate('StudentMarksScreen', { student: selectedStudent });
                    }}
                  >
                    <Ionicons name="book" size={20} color="#1976d2" />
                    <Text style={styles.actionButtonText}>View Marks</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {
                      closeModal();
                      navigation.navigate('StudentAttendanceScreen', { student: selectedStudent });
                    }}
                  >
                    <Ionicons name="calendar" size={20} color="#1976d2" />
                    <Text style={styles.actionButtonText}>View Attendance</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
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
  content: {
    flex: 1,
    padding: 16,
  },
  searchSection: {
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 12,
  },
  filterButton: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    elevation: 1,
  },
  selectedFilterButton: {
    backgroundColor: '#1976d2',
  },
  filterButtonText: {
    color: '#333',
    fontWeight: '500',
  },
  selectedFilterButtonText: {
    color: '#fff',
  },
  exportSection: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
  },
  exportButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  studentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  studentDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  studentStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    padding: 20,
  },
  detailSection: {
    marginBottom: 24,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  actionButtonText: {
    color: '#1976d2',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#1976d2',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#1976d2',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  noDataText: {
    fontSize: 18,
    color: '#666',
    marginTop: 12,
    fontWeight: 'bold',
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  listContainer: {
    paddingBottom: 20,
  },
});

export default ViewStudentInfo; 