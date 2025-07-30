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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import { Picker } from '@react-native-picker/picker';
import { supabase, dbHelpers } from '../../utils/supabase';

const ManageClasses = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      // Load classes
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('*, students(count)')
        .order('class_name', { ascending: true });
      if (classError) throw classError;

      const classesWithCounts = classData.map(c => ({ ...c, students_count: c.students[0].count }));

      console.log('Fetched classes:', classesWithCounts);
      setClasses(classesWithCounts);

      // Load teachers
      const { data: teacherData, error: teacherError } = await supabase
        .from('teachers')
        .select('*')
        .order('name', { ascending: true });
      if (teacherError) throw teacherError;
      setTeachers(teacherData);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const handleAddClass = async () => {
    try {
      if (!newClass.class_name || !newClass.section || !newClass.class_teacher_id) {
        Alert.alert('Error', 'Please fill in all fields');
        return;
      }

      const { error } = await supabase
        .from('classes')
        .insert({
          class_name: newClass.class_name,
          academic_year: newClass.academic_year,
          section: newClass.section,
          class_teacher_id: newClass.class_teacher_id,
        });

      if (error) throw error;

      // Refresh data
      await loadAllData();
      setNewClass({ name: '', academic_year: '2024-25', section: '', teacher_id: '' });
      setIsAddModalVisible(false);
      Alert.alert('Success', 'Class added successfully!');
    } catch (error) {
      console.error('Error adding class:', error);
      Alert.alert('Error', 'Failed to add class');
    }
  };

  const handleEditClass = async () => {
    try {
      if (!selectedClass.class_name || !selectedClass.section || !selectedClass.class_teacher_id) {
        Alert.alert('Error', 'Please fill in all fields');
        return;
      }

      const { error } = await supabase
        .from('classes')
        .update({
          class_name: selectedClass.class_name,
          academic_year: selectedClass.academic_year,
          section: selectedClass.section,
          class_teacher_id: selectedClass.class_teacher_id,
        })
        .eq('id', selectedClass.id);

      if (error) throw error;

      // Refresh data
      await loadAllData();
      setIsEditModalVisible(false);
      setSelectedClass(null);
      Alert.alert('Success', 'Class updated successfully!');
    } catch (error) {
      console.error('Error updating class:', error);
      Alert.alert('Error', 'Failed to update class');
    }
  };

  const handleDeleteClass = async (classId) => {
    Alert.alert(
      'Delete Class',
      'Are you sure you want to delete this class? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('classes')
                .delete()
                .eq('id', classId);

              if (error) throw error;

              // Refresh data
              await loadAllData();
              Alert.alert('Success', 'Class deleted successfully!');
            } catch (error) {
              console.error('Error deleting class:', error);
              Alert.alert('Error', 'Failed to delete class');
            }
          },
        },
      ]
    );
  };

  const openEditModal = (classItem) => {
    // Find teacher name for display
    const teacher = teachers.find(t => t.id === classItem.class_teacher_id);
    setSelectedClass({ 
      ...classItem,
      teacher_name: teacher?.name || 'Unknown'
    });
    setIsEditModalVisible(true);
  };

  const renderClassItem = ({ item }) => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
        </View>
      );
    }

    return (
      <View style={styles.classCard}>
        <View style={styles.classHeader}>
          <View style={styles.classInfo}>
            <Text style={styles.className}>{item.class_name}</Text>
            <Text style={styles.classDetails}>
              Section {item.section} • {item.academic_year}
            </Text>
            <Text style={styles.classTeacher}>Teacher: {item.teacher_name || 'Unknown'}</Text>
          </View>
          <View style={styles.classStats}>
            <View style={styles.classStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{item.students ? item.students[0].count : 0}</Text>
              <Text style={styles.statLabel}>Students</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{item.subjects_count || 0}</Text>
              <Text style={styles.statLabel}>Subjects</Text>
            </View>
          </View>
          </View>
        </View>
        
        <View style={styles.classActions}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.viewButton]}
            onPress={() => navigation.navigate('StudentList', { classId: item.id })}
          >
            <Ionicons name="people" size={16} color="#2196F3" />
            <Text style={styles.viewButtonText}>View Students</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.editButton]}
            onPress={() => openEditModal(item)}
          >
            <Ionicons name="create" size={16} color="#FF9800" />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteClass(item.id)}
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
              <Picker
                selectedValue={isEdit ? selectedClass?.section : newClass.section}
                onValueChange={(itemValue) => 
                  isEdit 
                    ? setSelectedClass({ ...selectedClass, section: itemValue })
                    : setNewClass({ ...newClass, section: itemValue })
                }
              >
                {sections.map((section) => (
                  <Picker.Item key={section} label={section} value={section} />
                ))}
              </Picker>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Teacher</Text>
              <Picker
                selectedValue={isEdit ? selectedClass?.class_teacher_id : newClass.class_teacher_id}
                onValueChange={(itemValue) => 
                  isEdit 
                    ? setSelectedClass({ ...selectedClass, class_teacher_id: itemValue })
                    : setNewClass({ ...newClass, class_teacher_id: itemValue })
                }
              >
                {teachers.map((teacher) => (
                  <Picker.Item key={teacher.id} label={teacher.name} value={teacher.id} />
                ))}
              </Picker>
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
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <Header title="Manage Classes" showBack={true} />
      
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Total Classes: {classes.length}</Text>
          <Text style={styles.headerSubtitle}>Academic Year: 2024-25</Text>
        </View>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setIsAddModalVisible(true)}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={classes}
        renderItem={renderClassItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

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
    overflow: 'hidden', // fix: prevent overflow
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
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  pickerOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginRight: 8,
    marginBottom: 8,
  },
  pickerOptionSelected: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  pickerOptionText: {
    fontSize: 14,
    color: '#666',
  },
  pickerOptionTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    flexWrap: 'wrap', // allow vertical stacking if needed
    gap: 8, // add gap between buttons
  },
  cancelButton: {
    flex: 1,
    minWidth: 0, // fix: allow flex shrink
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    minWidth: 0, // fix: allow flex shrink
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  pickerDropdownContainer: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    backgroundColor: '#f9f9f9',
    marginBottom: 8,
    justifyContent: 'center',
    minHeight: 44,
    borderWidth: 1, // ensure enough height for Picker text
  },
  pickerDropdown: {
    width: '100%',
    backgroundColor: '#fff',
    color: '#222',
    fontSize: 16,
    textAlignVertical: 'center',
    // removed height and paddingHorizontal for best compatibility
  },
});

export default ManageClasses; 