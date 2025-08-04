import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import { supabase, TABLES, dbHelpers } from '../../utils/supabase';
import { useAuth } from '../../utils/AuthContext';

export default function MarksEntry({ navigation }) {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  // Load teacher's assigned classes and subjects
  const loadTeacherData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get teacher info using the helper function
      const { data: teacherData, error: teacherError } = await dbHelpers.getTeacherByUserId(user.id);

      if (teacherError || !teacherData) throw new Error('Teacher not found');

      // Get assigned classes and subjects through proper relationships
      const { data: assignedData, error: assignedError } = await supabase
        .from(TABLES.TEACHER_SUBJECTS)
        .select(`
          *,
          subjects(
            id,
            name,
            class_id,
            academic_year,
            classes(
              id,
              class_name,
              section,
              academic_year
            )
          )
        `)
        .eq('teacher_id', teacherData.id);

      if (assignedError) throw assignedError;

      // Organize data by class
      const classMap = new Map();

      assignedData.forEach(assignment => {
        if (!assignment.subjects?.classes) return; // Skip if no class data

        const classKey = assignment.subjects.classes.id;

        if (!classMap.has(classKey)) {
          classMap.set(classKey, {
            id: assignment.subjects.classes.id,
            name: `${assignment.subjects.classes.class_name} - ${assignment.subjects.classes.section}`,
            classId: assignment.subjects.classes.id,
            academicYear: assignment.subjects.classes.academic_year,
            subjects: [],
            students: []
          });
        }

        const classData = classMap.get(classKey);
        if (!classData.subjects.find(s => s.id === assignment.subjects.id)) {
          classData.subjects.push({
            id: assignment.subjects.id,
            name: assignment.subjects.name,
            academicYear: assignment.subjects.academic_year
          });
        }
      });

      // Get students for each class
      for (const [classKey, classData] of classMap) {
        const { data: studentsData, error: studentsError } = await supabase
          .from(TABLES.STUDENTS)
          .select(`
            id,
            name,
            roll_no,
            classes(class_name, section)
          `)
          .eq('class_id', classData.classId)
          .order('roll_no');

        if (studentsError) throw studentsError;
        classData.students = studentsData || [];
      }

      setClasses(Array.from(classMap.values()));
      
    } catch (err) {
      setError(err.message);
      console.error('Error loading teacher data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Subscribe to real-time updates
  useEffect(() => {
    loadTeacherData();

    const subscription = supabase
      .channel('marks-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: TABLES.MARKS
      }, () => {
        loadTeacherData();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);



  const handleClassSelect = (classId) => {
    setSelectedClass(classId);
  };

  const handleSubjectSelect = (subjectId) => {
    const selectedClassData = classes.find(c => c.id === selectedClass);
    const selectedSubjectData = selectedClassData?.subjects.find(s => s.id === subjectId);

    if (selectedClassData && selectedSubjectData) {
      // Navigate to the new ExamMarksEntry screen
      navigation.navigate('ExamMarksEntry', {
        classData: {
          id: selectedClassData.id,
          name: selectedClassData.name,
          academicYear: selectedClassData.academicYear
        },
        subjectData: {
          id: selectedSubjectData.id,
          name: selectedSubjectData.name,
          academicYear: selectedSubjectData.academicYear
        }
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Marks Entry" showBack={true} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1976d2" />
          <Text style={styles.loadingText}>Loading classes...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Header title="Marks Entry" showBack={true} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadTeacherData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Marks Entry" showBack={true} />
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadTeacherData().finally(() => setRefreshing(false));
            }}
          />
        }
      >
        <View style={styles.content}>
          {classes.length === 0 ? (
            <View style={styles.noDataContainer}>
              <Ionicons name="book-outline" size={48} color="#ccc" />
              <Text style={styles.noDataText}>No classes assigned</Text>
              <Text style={styles.noDataSubtext}>Contact administrator to assign classes</Text>
            </View>
          ) : (
            <>
              {/* Class Selection */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Select Class</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {classes.map(classItem => (
                    <TouchableOpacity
                      key={classItem.id}
                      style={[
                        styles.classCard,
                        selectedClass === classItem.id && styles.selectedClassCard
                      ]}
                      onPress={() => handleClassSelect(classItem.id)}
                    >
                      <Text style={[
                        styles.classText,
                        selectedClass === classItem.id && styles.selectedClassText
                      ]}>
                        {classItem.name}
                      </Text>
                      <Text style={styles.studentCount}>
                        {classItem.students.length} students
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Subject Selection */}
              {selectedClass && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Select Subject</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {classes.find(c => c.id === selectedClass)?.subjects.map(subject => (
                      <TouchableOpacity
                        key={subject.id}
                        style={styles.subjectCard}
                        onPress={() => handleSubjectSelect(subject.id)}
                      >
                        <Text style={styles.subjectText}>
                          {subject.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Instructions */}
              {selectedClass && (
                <View style={styles.instructionCard}>
                  <Ionicons name="information-circle" size={24} color="#2196F3" />
                  <Text style={styles.instructionText}>
                    Select a subject to open the marks entry screen where you can create exams and enter marks for students.
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  classCard: {
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
  selectedClassCard: {
    backgroundColor: '#1976d2',
  },
  classText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  selectedClassText: {
    color: '#fff',
  },
  studentCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  subjectCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    minWidth: 100,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  subjectText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dateText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
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
  instructionCard: {
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  instructionText: {
    fontSize: 14,
    color: '#1976d2',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  // New styles for exam selection and modal
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 1,
  },
  noExamsText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
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
  marksInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gradeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
    minWidth: 24,
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