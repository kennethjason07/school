import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Alert,
  TextInput,
  Modal,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import Header from '../../components/Header';
import { supabase, TABLES } from '../../utils/supabase';
import { format } from 'date-fns';

export default function ExamMarksEntry({ route, navigation }) {
  const { classData, subjectData } = route.params;
  
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  // Create exam modal states
  const [showCreateExamModal, setShowCreateExamModal] = useState(false);
  const [newExamName, setNewExamName] = useState('');
  const [newExamStartDate, setNewExamStartDate] = useState(new Date());
  const [newExamEndDate, setNewExamEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  // Load data on component mount
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load exams for the class
      await loadExamsForClass();
      
      // Load students for the class
      await loadStudentsForClass();
      
    } catch (err) {
      setError(err.message);
      console.error('Error loading initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load exams for selected class
  const loadExamsForClass = async () => {
    try {
      const { data: examsData, error: examsError } = await supabase
        .from(TABLES.EXAMS)
        .select('*')
        .eq('class_id', classData.id)
        .order('start_date', { ascending: false });

      if (examsError) throw examsError;
      setExams(examsData || []);
    } catch (err) {
      console.error('Error loading exams:', err);
      setExams([]);
    }
  };

  // Load students for the class
  const loadStudentsForClass = async () => {
    try {
      const { data: studentsData, error: studentsError } = await supabase
        .from(TABLES.STUDENTS)
        .select(`
          id,
          name,
          roll_no,
          classes(class_name, section)
        `)
        .eq('class_id', classData.id)
        .order('roll_no');

      if (studentsError) throw studentsError;
      setStudents(studentsData || []);
    } catch (err) {
      console.error('Error loading students:', err);
      setStudents([]);
    }
  };

  // Load existing marks for selected exam and subject
  const loadExistingMarks = async (examId) => {
    if (!examId) return;
    
    try {
      const { data: marksData, error: marksError } = await supabase
        .from(TABLES.MARKS)
        .select('student_id, marks_obtained')
        .eq('exam_id', examId)
        .eq('subject_id', subjectData.id);

      if (marksError) throw marksError;
      
      const marksMap = {};
      marksData?.forEach(mark => {
        marksMap[mark.student_id] = mark.marks_obtained?.toString() || '';
      });
      setMarks(marksMap);
    } catch (err) {
      console.error('Error loading existing marks:', err);
      setMarks({});
    }
  };

  const handleExamSelect = (examId) => {
    setSelectedExam(examId);
    setMarks({});
    loadExistingMarks(examId);
  };

  // Date picker handlers
  const handleStartDateChange = (event, selectedDate) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setNewExamStartDate(selectedDate);
      if (newExamEndDate < selectedDate) {
        setNewExamEndDate(selectedDate);
      }
    }
  };

  const handleEndDateChange = (event, selectedDate) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      if (selectedDate >= newExamStartDate) {
        setNewExamEndDate(selectedDate);
      } else {
        Alert.alert('Error', 'End date cannot be before start date');
      }
    }
  };

  // Create new exam
  const handleCreateExam = async () => {
    if (!newExamName.trim()) {
      Alert.alert('Error', 'Please enter exam name');
      return;
    }

    if (newExamEndDate < newExamStartDate) {
      Alert.alert('Error', 'End date cannot be before start date');
      return;
    }

    try {
      setSaving(true);
      
      const examData = {
        name: newExamName.trim(),
        class_id: classData.id,
        academic_year: '2024-25',
        start_date: format(newExamStartDate, 'yyyy-MM-dd'),
        end_date: format(newExamEndDate, 'yyyy-MM-dd'),
        remarks: null
      };

      const { data: newExam, error: examError } = await supabase
        .from(TABLES.EXAMS)
        .insert(examData)
        .select()
        .single();

      if (examError) throw examError;

      // Refresh exams list
      await loadExamsForClass();
      setSelectedExam(newExam.id);
      
      // Reset form
      setNewExamName('');
      setNewExamStartDate(new Date());
      setNewExamEndDate(new Date());
      setShowCreateExamModal(false);
      
      Alert.alert('Success', 'Exam created successfully!');
      
    } catch (err) {
      Alert.alert('Error', err.message);
      console.error('Error creating exam:', err);
    } finally {
      setSaving(false);
    }
  };

  // Save marks
  const handleSaveMarks = async () => {
    if (!selectedExam) {
      Alert.alert('Error', 'Please select an exam first');
      return;
    }

    const studentsWithMarks = students.filter(student => 
      marks[student.id] && !isNaN(marks[student.id]) && marks[student.id] !== ''
    );

    if (studentsWithMarks.length === 0) {
      Alert.alert('Error', 'Please enter marks for at least one student');
      return;
    }

    try {
      setSaving(true);

      const marksData = studentsWithMarks.map(student => ({
        student_id: student.id,
        exam_id: selectedExam,
        subject_id: subjectData.id,
        marks_obtained: parseFloat(marks[student.id]),
        max_marks: 100,
        grade: calculateGrade(parseFloat(marks[student.id])),
        remarks: null
      }));

      const { error: upsertError } = await supabase
        .from(TABLES.MARKS)
        .upsert(marksData, { 
          onConflict: 'student_id,exam_id,subject_id',
          ignoreDuplicates: false 
        });

      if (upsertError) throw upsertError;

      Alert.alert('Success', 'Marks saved successfully!');
      
    } catch (err) {
      Alert.alert('Error', err.message);
      console.error('Error saving marks:', err);
    } finally {
      setSaving(false);
    }
  };

  // Helper function to calculate grade
  const calculateGrade = (marks) => {
    if (marks >= 90) return 'A+';
    if (marks >= 80) return 'A';
    if (marks >= 70) return 'B+';
    if (marks >= 60) return 'B';
    if (marks >= 50) return 'C';
    if (marks >= 40) return 'D';
    return 'F';
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header 
          title={`${subjectData.name} - ${classData.name}`} 
          showBack={true} 
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1976d2" />
          <Text style={styles.loadingText}>Loading exam data...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Header 
          title={`${subjectData.name} - ${classData.name}`} 
          showBack={true} 
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadInitialData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header 
        title={`${subjectData.name} - ${classData.name}`} 
        showBack={true} 
        onBackPress={() => navigation.goBack()}
      />
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.content}>
          {/* Class and Subject Info */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="school" size={20} color="#1976d2" />
              <Text style={styles.infoText}>Class: {classData.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="book" size={20} color="#4CAF50" />
              <Text style={styles.infoText}>Subject: {subjectData.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="people" size={20} color="#FF9800" />
              <Text style={styles.infoText}>Students: {students.length}</Text>
            </View>
          </View>

          {/* Exam Selection */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Select Exam</Text>
              <TouchableOpacity
                style={styles.createExamButton}
                onPress={() => setShowCreateExamModal(true)}
              >
                <Ionicons name="add" size={16} color="#1976d2" />
                <Text style={styles.createExamText}>Create Exam</Text>
              </TouchableOpacity>
            </View>

            {exams.length === 0 ? (
              <View style={styles.noExamsContainer}>
                <Ionicons name="calendar-outline" size={48} color="#ccc" />
                <Text style={styles.noExamsText}>No exams found</Text>
                <Text style={styles.noExamsSubtext}>Create an exam to start entering marks</Text>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {exams.map(exam => (
                  <TouchableOpacity
                    key={exam.id}
                    style={[
                      styles.examCard,
                      selectedExam === exam.id && styles.selectedExamCard
                    ]}
                    onPress={() => handleExamSelect(exam.id)}
                  >
                    <Text style={[
                      styles.examText,
                      selectedExam === exam.id && styles.selectedExamText
                    ]}>
                      {exam.name}
                    </Text>
                    <Text style={[
                      styles.examDate,
                      selectedExam === exam.id && styles.selectedExamDate
                    ]}>
                      {format(new Date(exam.start_date), 'dd MMM yyyy')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Students Marks Entry */}
          {selectedExam && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Enter Marks (Max: 100)</Text>
              {students.map(student => (
                <View key={student.id} style={styles.studentRow}>
                  <View style={styles.studentInfo}>
                    <Text style={styles.studentName}>{student.name}</Text>
                    <Text style={styles.studentRoll}>Roll: {student.roll_no}</Text>
                  </View>
                  <View style={styles.marksInputContainer}>
                    <TextInput
                      style={styles.marksInput}
                      value={marks[student.id]?.toString() || ''}
                      onChangeText={(value) => {
                        if (value === '' || (!isNaN(value) && parseFloat(value) >= 0 && parseFloat(value) <= 100)) {
                          setMarks(prev => ({ ...prev, [student.id]: value }));
                        }
                      }}
                      keyboardType="numeric"
                      maxLength={3}
                      placeholder="0-100"
                      selectTextOnFocus={true}
                    />
                    {marks[student.id] && !isNaN(marks[student.id]) && (
                      <Text style={styles.gradeText}>
                        {calculateGrade(parseFloat(marks[student.id]))}
                      </Text>
                    )}
                  </View>
                </View>
              ))}

              <TouchableOpacity
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleSaveMarks}
                disabled={saving}
              >
                <Ionicons name="save" size={20} color="#fff" />
                <Text style={styles.saveButtonText}>
                  {saving ? 'Saving...' : 'Save Marks'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Create Exam Modal */}
      <Modal
        visible={showCreateExamModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateExamModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Exam</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowCreateExamModal(false)}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Exam Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={newExamName}
                  onChangeText={setNewExamName}
                  placeholder="Enter exam name (e.g., Mid Term, Final Exam)"
                  maxLength={50}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Start Date</Text>
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <Text style={styles.dateInputText}>
                    {format(newExamStartDate, 'dd MMM yyyy')}
                  </Text>
                  <Ionicons name="calendar" size={20} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>End Date</Text>
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => setShowEndDatePicker(true)}
                >
                  <Text style={styles.dateInputText}>
                    {format(newExamEndDate, 'dd MMM yyyy')}
                  </Text>
                  <Ionicons name="calendar" size={20} color="#666" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowCreateExamModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.createButton, saving && styles.createButtonDisabled]}
                onPress={handleCreateExam}
                disabled={saving || !newExamName.trim()}
              >
                <Text style={styles.createButtonText}>
                  {saving ? 'Creating...' : 'Create Exam'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Date Pickers */}
      {showStartDatePicker && (
        <DateTimePicker
          value={newExamStartDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleStartDateChange}
          minimumDate={new Date()}
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
          value={newExamEndDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleEndDateChange}
          minimumDate={newExamStartDate}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
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
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  createExamButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  createExamText: {
    color: '#1976d2',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  noExamsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 1,
  },
  noExamsText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
    marginTop: 12,
  },
  noExamsSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  examCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    minWidth: 120,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedExamCard: {
    backgroundColor: '#4CAF50',
  },
  examText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  selectedExamText: {
    color: '#fff',
  },
  examDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  selectedExamDate: {
    color: '#fff',
    opacity: 0.9,
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  studentRoll: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  marksInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  marksInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 8,
    width: 80,
    textAlign: 'center',
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  gradeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
    minWidth: 24,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1976d2',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    elevation: 2,
    shadowColor: '#1976d2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  dateInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fafafa',
  },
  dateInputText: {
    fontSize: 16,
    color: '#333',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  createButton: {
    backgroundColor: '#1976d2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonDisabled: {
    backgroundColor: '#ccc',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
