import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, CommonActions } from '@react-navigation/native';
import Header from '../../components/Header';
import { Picker } from '@react-native-picker/picker';
import { supabase, dbHelpers, TABLES } from '../../utils/supabase';

const ManageClasses = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [sections, setSections] = useState(['A', 'B', 'C', 'D']);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [newClass, setNewClass] = useState({
    class_name: '',
    academic_year: '2024-25',
    section: '',
    class_teacher_id: '',
  });
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    totalTeachers: 0,
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);

      // Get all classes using schema-based query
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select(`
          id,
          class_name,
          section,
          academic_year,
          class_teacher_id,
          created_at,
          teachers (
            id,
            name,
            email,
            phone
          )
        `)
        .order('class_name', { ascending: true });

      if (classesError) {
        console.error('Error loading classes:', classesError);
        Alert.alert('Error', 'Failed to load classes');
        return;
      }

      setClasses(classesData || []);

      // Get all teachers using schema-based query
      const { data: teachersData, error: teachersError } = await supabase
        .from('teachers')
        .select('id, name, email, phone, subject, qualification')
        .order('name', { ascending: true });

      if (teachersError) {
        console.error('Error loading teachers:', teachersError);
      } else {
        setTeachers(teachersData || []);
      }

      // Calculate stats
      const totalClasses = classesData?.length || 0;

      // Get total students count
      const { count: studentsCount, error: studentsError } = await supabase
        .from('students')
        .select('id', { count: 'exact' });

      // Get total teachers count
      const { count: teachersCount, error: teachersCountError } = await supabase
        .from('teachers')
        .select('id', { count: 'exact' });

      setStats({
        totalClasses,
        totalStudents: studentsCount || 0,
        totalTeachers: teachersCount || 0,
      });

      // Get all classes with teacher information - using improved helper
      const { data: classData, error: classError } = await dbHelpers.getClasses();

      if (classError) throw classError;

      // Get student count and subject count for each class
      const classesWithCounts = await Promise.all(
        classData.map(async (cls) => {
          // Get student count
          const { count: studentCount } = await supabase
            .from(TABLES.STUDENTS)
            .select('*', { count: 'exact', head: true })
            .eq('class_id', cls.id);

          // Get subject count
          const { count: subjectCount } = await supabase
            .from(TABLES.SUBJECTS)
            .select('*', { count: 'exact', head: true })
            .eq('class_id', cls.id);

          return {
            ...cls,
            students_count: studentCount || 0,
            subjects_count: subjectCount || 0,
            teacher_name: cls.teachers?.name || 'No Teacher Assigned'
          };
        })
      );

      console.log('Fetched classes with details:', classesWithCounts);
      setClasses(classesWithCounts);

      // Get all teachers - as specified in easy.txt
      const { data: teacherData, error: teacherError } = await dbHelpers.getTeachers();

      if (teacherError) throw teacherError;
      setTeachers(teacherData || []);

      // Calculate stats
      const totalStudents = classesWithCounts.reduce((sum, cls) => sum + cls.students_count, 0);
      setStats({
        totalClasses: classesWithCounts.length,
        totalStudents,
        totalTeachers: teacherData?.length || 0,
      });

    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load classes and teachers');
    } finally {
      setLoading(false);
    }
  };

  // Refresh data function
  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  const handleAddClass = async () => {
    try {
      if (!newClass.class_name || !newClass.section || !newClass.class_teacher_id) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      // Check if class with same name and section already exists using schema
      const { data: existingClass, error: checkError } = await supabase
        .from('classes')
        .select('id')
        .eq('class_name', newClass.class_name)
        .eq('section', newClass.section)
        .eq('academic_year', newClass.academic_year);

      if (checkError) {
        console.error('Error checking existing class:', checkError);
        Alert.alert('Error', 'Failed to check existing classes');
        return;
      }

      if (existingClass && existingClass.length > 0) {
        Alert.alert('Error', 'A class with this name and section already exists for this academic year');
        return;
      }

      // Insert a new class using schema-based query
      const { data, error } = await supabase
        .from('classes')
        .insert({
          class_name: newClass.class_name,
          section: newClass.section,
          academic_year: newClass.academic_year,
          class_teacher_id: newClass.class_teacher_id,
        })
        .select();

      if (error) {
        console.error('Error inserting class:', error);
        throw error;
      }

      // Refresh data
      await loadAllData();
      setNewClass({
        class_name: '',
        academic_year: '2024-25',
        section: '',
        class_teacher_id: ''
      });
      setIsAddModalVisible(false);
      Alert.alert('Success', 'Class added successfully!');
    } catch (error) {
      console.error('Error adding class:', error);
      Alert.alert('Error', `Failed to add class: ${error.message}`);
    }
  };

  const handleEditClass = async () => {
    try {
      if (!selectedClass.class_name || !selectedClass.section || !selectedClass.class_teacher_id) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      // Check if another class with same name and section already exists using schema
      const { data: existingClass, error: checkError } = await supabase
        .from('classes')
        .select('id')
        .eq('class_name', selectedClass.class_name)
        .eq('section', selectedClass.section)
        .eq('academic_year', selectedClass.academic_year)
        .neq('id', selectedClass.id);

      if (checkError) {
        console.error('Error checking existing class:', checkError);
        Alert.alert('Error', 'Failed to check existing classes');
        return;
      }

      if (existingClass && existingClass.length > 0) {
        Alert.alert('Error', 'A class with this name and section already exists for this academic year');
        return;
      }

      // Update a class using schema-based query
      const { data, error } = await supabase
        .from('classes')
        .update({
          class_name: selectedClass.class_name,
          section: selectedClass.section,
          academic_year: selectedClass.academic_year,
          class_teacher_id: selectedClass.class_teacher_id,
        })
        .eq('id', selectedClass.id)
        .select();

      if (error) {
        console.error('Error updating class:', error);
        throw error;
      }

      // Refresh data
      await loadAllData();
      setIsEditModalVisible(false);
      setSelectedClass(null);
      Alert.alert('Success', 'Class updated successfully!');
    } catch (error) {
      console.error('Error updating class:', error);
      Alert.alert('Error', `Failed to update class: ${error.message}`);
    }
  };

  const handleDeleteClass = async (classId, className) => {
    Alert.alert(
      'Delete Class',
      `Are you sure you want to delete "${className}"? This will:\n\n• Remove the class permanently\n• Unassign all students from this class\n• Delete all subjects for this class\n• Remove all related data\n\nThis action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // 1. Delete attendance records for this class
              const { error: attendanceError } = await supabase
                .from('student_attendance')
                .delete()
                .eq('class_id', classId);
              if (attendanceError) throw attendanceError;

              // 2. Set class_id to null for all students in this class
              const { error: updateError } = await supabase
                .from('students')
                .select('id, name')
                .eq('class_id', classId);

              // 3. Delete the class
              const { error: classDeleteError } = await supabase
                .from('classes')
                .delete()
                .eq('id', classId);

              if (classDeleteError) {
                console.error('Error deleting class:', classDeleteError);
                throw classDeleteError;
              }

              await loadAllData();
              Alert.alert('Success', 'Class deleted successfully!');
            } catch (error) {
              console.error('Error deleting class:', error);
              Alert.alert('Error', `Failed to delete class: ${error.message}`);
            }
          },
        },
      ]
    );
  };

  const openEditModal = (classItem) => {
    setSelectedClass({
      ...classItem,
      teacher_name: classItem.teacher_name || 'Unknown'
    });
    setIsEditModalVisible(true);
  };

  const handleAddStudent = (classItem) => {
    // Use dispatch to navigate to the stack screen
    navigation.dispatch(
      CommonActions.navigate({
        name: 'ManageStudents',
        params: {
          preSelectedClass: classItem.id,
          className: `${classItem.class_name}-${classItem.section}`,
          openAddModal: true
        }
      })
    );
  };

  const renderClassItem = ({ item }) => {
    return (
      <View style={styles.classCard}>
        <View style={styles.classHeader}>
          <View style={styles.classInfo}>
            <Text style={styles.className}>{item.class_name}</Text>
            <Text style={styles.classDetails}>
              Section {item.section} • {item.academic_year}
            </Text>
            <Text style={styles.classTeacher}>
              Teacher: {item.teacher_name}
            </Text>
          </View>
          <View style={styles.classStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{item.students_count || 0}</Text>
              <Text style={styles.statLabel}>Students</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{item.subjects_count || 0}</Text>
              <Text style={styles.statLabel}>Subjects</Text>
            </View>
          </View>
        </View>

        {/* Primary Actions Row */}
        <View style={styles.classActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.viewButton]}
            onPress={() => navigation.dispatch(
              CommonActions.navigate({
                name: 'StudentList',
                params: { classId: item.id }
              })
            )}
          >
            <Ionicons name="people" size={16} color="#2196F3" />
            <Text style={styles.viewButtonText}>View Students</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.addStudentButton]}
            onPress={() => handleAddStudent(item)}
          >
            <Ionicons name="person-add" size={16} color="#4CAF50" />
            <Text style={styles.addStudentButtonText}>Add Student</Text>
          </TouchableOpacity>
        </View>

        {/* Secondary Actions Row */}
        <View style={styles.secondaryActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => openEditModal(item)}
          >
            <Ionicons name="create" size={16} color="#FF9800" />
            <Text style={styles.editButtonText}>Edit Class</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteClass(item.id, `${item.class_name}-${item.section}`)}
          >
            <Ionicons name="trash" size={16} color="#f44336" />
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderModal = (isVisible, isEdit = false) => (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => {
        setIsAddModalVisible(false);
        setIsEditModalVisible(false);
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isEdit ? 'Edit Class' : 'Add New Class'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setIsAddModalVisible(false);
                  setIsEditModalVisible(false);
                }}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Class Name</Text>
                <TextInput
                  style={styles.input}
                  value={isEdit ? selectedClass?.class_name : newClass.class_name}
                  onChangeText={(text) => 
                    isEdit 
                      ? setSelectedClass({ ...selectedClass, class_name: text })
                      : setNewClass({ ...newClass, class_name: text })
                  }
                  placeholder="e.g., Class 1A"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Academic Year</Text>
                <TextInput
                  style={styles.input}
                  value={isEdit ? selectedClass?.academic_year : newClass.academic_year}
                  onChangeText={(text) => 
                    isEdit 
                      ? setSelectedClass({ ...selectedClass, academic_year: text })
                      : setNewClass({ ...newClass, academic_year: text })
                  }
                  placeholder="e.g., 2024-25"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Section</Text>
                <View style={styles.pickerDropdownContainer}>
                  <Picker
                    selectedValue={isEdit ? selectedClass?.section : newClass.section}
                    onValueChange={(itemValue) => 
                      isEdit 
                        ? setSelectedClass({ ...selectedClass, section: itemValue })
                        : setNewClass({ ...newClass, section: itemValue })
                    }
                    style={styles.pickerDropdown}
                  >
                    <Picker.Item label="Select Section" value="" />
                    {sections.map((section) => (
                      <Picker.Item key={section} label={section} value={section} />
                    ))}
                  </Picker>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Teacher</Text>
                <View style={styles.pickerDropdownContainer}>
                  <Picker
                    selectedValue={isEdit ? selectedClass?.class_teacher_id : newClass.class_teacher_id}
                    onValueChange={(itemValue) => 
                      isEdit 
                        ? setSelectedClass({ ...selectedClass, class_teacher_id: itemValue })
                        : setNewClass({ ...newClass, class_teacher_id: itemValue })
                    }
                    style={styles.pickerDropdown}
                  >
                    <Picker.Item label="Select Teacher" value="" />
                    {teachers.map((teacher) => (
                      <Picker.Item key={teacher.id} label={teacher.name} value={teacher.id} />
                    ))}
                  </Picker>
                </View>
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={isEdit ? handleEditClass : handleAddClass}
              >
                <Text style={styles.submitButtonText}>
                  {isEdit ? 'Update Class' : 'Add Class'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <Header title="Manage Classes" showBack={true} />
      
      {/* Statistics Section */}
      <View style={styles.statsSection}>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}>
            <View style={styles.statIcon}>
              <Ionicons name="school" size={24} color="#1976D2" />
            </View>
            <Text style={styles.statNumber}>{stats.totalClasses}</Text>
            <Text style={styles.statTitle}>Classes</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#E8F5E8' }]}>
            <View style={styles.statIcon}>
              <Ionicons name="people" size={24} color="#388E3C" />
            </View>
            <Text style={styles.statNumber}>{stats.totalStudents}</Text>
            <Text style={styles.statTitle}>Students</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#FFF3E0' }]}>
            <View style={styles.statIcon}>
              <Ionicons name="person" size={24} color="#F57C00" />
            </View>
            <Text style={styles.statNumber}>{stats.totalTeachers}</Text>
            <Text style={styles.statTitle}>Teachers</Text>
          </View>
        </View>
      </View>

      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Manage Classes</Text>
          <Text style={styles.headerSubtitle}>Academic Year: 2024-25</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setIsAddModalVisible(true)}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Loading classes...</Text>
        </View>
      ) : (
        <FlatList
          data={classes}
          renderItem={renderClassItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="school" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No classes found</Text>
              <Text style={styles.emptySubtext}>Add your first class to get started</Text>
              <TouchableOpacity
                style={styles.emptyActionButton}
                onPress={() => setIsAddModalVisible(true)}
              >
                <Ionicons name="add-circle" size={20} color="#fff" />
                <Text style={styles.emptyActionText}>Add First Class</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {renderModal(isAddModalVisible, false)}
      {renderModal(isEditModalVisible, true)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  // Statistics Section
  statsSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 4,
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
    backgroundColor: '#2196F3',
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyActionButton: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
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
  classCard: {
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
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  classInfo: {
    flex: 1,
  },
  className: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  classDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  classTeacher: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
  },
  classStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    marginLeft: 16,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  classActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
    marginBottom: 8,
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    flex: 1,
    marginHorizontal: 4,
    justifyContent: 'center',
  },
  viewButton: {
    backgroundColor: '#e3f2fd',
  },
  viewButtonText: {
    color: '#2196F3',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  addStudentButton: {
    backgroundColor: '#e8f5e8',
  },
  addStudentButtonText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  editButton: {
    backgroundColor: '#fff3e0',
  },
  editButtonText: {
    color: '#FF9800',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  deleteButton: {
    backgroundColor: '#ffebee',
  },
  deleteButtonText: {
    color: '#f44336',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  formContainer: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f9f9f9',
  },
  pickerDropdownContainer: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    marginBottom: 8,
    justifyContent: 'center',
    minHeight: 44,
  },
  pickerDropdown: {
    width: '100%',
    backgroundColor: 'transparent',
    color: '#333',
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ManageClasses; 