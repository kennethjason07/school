import React, { useState, useEffect } from 'react';
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
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import { supabase, TABLES, dbHelpers } from '../../utils/supabase';

// Will be fetched from Supabase
const ManageTeachers = ({ navigation }) => {
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [form, setForm] = useState({ name: '', subjects: [], classes: [], salary: '', qualification: '' });
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);
  
  // Function to load all necessary data
  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Load teachers
      const { data: teachersData, error: teachersError } = await dbHelpers.getTeachers();
      if (teachersError) {
        console.error("Supabase error loading teachers:", teachersError);
        throw new Error('Failed to load teachers');
      }
      
      // Load classes
      const { data: classesData, error: classesError } = await dbHelpers.getClasses();
      if (classesError) throw new Error('Failed to load classes');
      
      // Load subjects
      const { data: subjectsData, error: subjectsError } = await supabase
        .from(TABLES.SUBJECTS)
        .select('*');
      if (subjectsError) throw new Error('Failed to load subjects');
      
      // Process teacher data to include subjects and classes
      const processedTeachers = await Promise.all(teachersData.map(async (teacher) => {
        // Get teacher subjects
        const { data: teacherSubjects, error: subjectsError } = await dbHelpers.getTeacherSubjects(teacher.id);
        if (subjectsError) console.error('Error loading teacher subjects:', subjectsError);
        
        // Extract subject names and class names
        const subjects = teacherSubjects?.map(ts => ts.subjects?.id || '') || [];
        const classIdsFromSubjects = new Set();
        teacherSubjects?.forEach(ts => {
            if (ts.subjects?.class_id) {
                classIdsFromSubjects.add(ts.subjects.class_id);
            }
        });
        const classes = Array.from(classIdsFromSubjects);
        
        return {
          ...teacher,
          subjects: subjects.filter(Boolean),
          classes: classes.filter(Boolean),
        };
      }));
      
      // Update state with loaded data
      setTeachers(processedTeachers);
      setClasses(classesData);
      setSubjects(subjectsData);
      
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
    setForm({ 
      name: teacher.name, 
      subjects: teacher.subjects, 
      classes: teacher.classes, 
      salary: teacher.salary_amount, 
      qualification: teacher.qualification 
    });
    setIsModalVisible(true);
  };
  const closeModal = () => {
    setIsModalVisible(false);
    setSelectedTeacher(null);
  };
  const handleSave = async () => {
    if (!form.name.trim() || form.subjects.length === 0 || form.classes.length === 0) {
      Alert.alert('Error', 'Please fill all fields and select at least one subject and class.');
      return;
    }
    
    setLoading(true);
    
    try {
      if (modalMode === 'add') {
        // Create new teacher in Supabase
        const teacherData = {
          name: form.name.trim(),
          qualification: form.qualification,
          salary_amount: parseFloat(form.salary) || 0,
          salary_type: 'monthly', // Default value
        };
        
        const { data: newTeacher, error } = await supabase
          .from(TABLES.TEACHERS)
          .insert(teacherData)
          .select()
          .single();
          
        if (error) throw new Error('Failed to create teacher');
        
        // Handle subject and class assignments
        await handleSubjectClassAssignments(newTeacher.id);
        
        // Reload data to get updated list
        await loadData();
        
      } else if (modalMode === 'edit' && selectedTeacher) {
        // Update teacher in Supabase
        const teacherData = {
          name: form.name.trim(),
          qualification: form.qualification,
          salary_amount: parseFloat(form.salary) || 0,
        };
        
        const { error } = await supabase
          .from(TABLES.TEACHERS)
          .update(teacherData)
          .eq('id', selectedTeacher.id);
          
        if (error) throw new Error('Failed to update teacher');
        
        // Handle subject and class assignments
        await handleSubjectClassAssignments(selectedTeacher.id);
        
        // Reload data to get updated list
        await loadData();
      }
      
      closeModal();
    } catch (err) {
      console.error('Error saving teacher:', err);
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to handle subject and class assignments
  const handleSubjectClassAssignments = async (teacherId) => {
    try {
      // First, get all existing assignments for this teacher
      const { data: existingAssignments, error: fetchError } = await supabase
        .from(TABLES.TEACHER_SUBJECTS)
        .select('*')
        .eq('teacher_id', teacherId);
        
      if (fetchError) throw new Error('Failed to fetch existing assignments');
      
      // Delete existing assignments
      if (existingAssignments.length > 0) {
        const { error: deleteError } = await supabase
          .from(TABLES.TEACHER_SUBJECTS)
          .delete()
          .eq('teacher_id', teacherId);
          
        if (deleteError) throw new Error('Failed to update assignments');
      }
      
      // Create new assignments based on form data
      const assignments = [];
      
      // For each subject ID
      for (const subjectId of form.subjects) {
        // For each class ID
        for (const classId of form.classes) {
          assignments.push({
            teacher_id: teacherId,
            subject_id: subjectId,
            class_id: classId,
          });
        }
      }
      
      // Insert new assignments if there are any
      if (assignments.length > 0) {
        const { error: insertError } = await supabase
          .from(TABLES.TEACHER_SUBJECTS)
          .insert(assignments);
          
        if (insertError) throw new Error('Failed to create assignments');
      }
    } catch (err) {
      console.error('Error handling assignments:', err);
      throw err; // Re-throw to be caught by the caller
    }
  };
  const handleDelete = async (teacher) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete ${teacher.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              // First delete teacher-subject assignments
              const { error: assignmentError } = await supabase
                .from(TABLES.TEACHER_SUBJECTS)
                .delete()
                .eq('teacher_id', teacher.id);
                
              if (assignmentError) throw new Error('Failed to delete teacher assignments');
              
              // Then delete the teacher
              const { error } = await supabase
                .from(TABLES.TEACHERS)
                .delete()
                .eq('id', teacher.id);
                
              if (error) throw new Error('Failed to delete teacher');
              
              // Update local state
              setTeachers(teachers.filter(t => t.id !== teacher.id));
            } catch (err) {
              console.error('Error deleting teacher:', err);
              Alert.alert('Error', err.message);
            } finally {
              setLoading(false);
            }
          } 
        }
      ]
    );
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
          <Text style={styles.teacherSubject}>{item.subjects.map(s => subjects.find(sub => sub.id === s)?.name || '').join(', ')}</Text>
          <Text style={styles.teacherClass}>{item.classes.map(c => classes.find(cls => cls.id === c)?.class_name || '').join(', ')}</Text>
          {/* Salary and Education */}
          <Text style={styles.teacherSalary}>
            Salary: {item.salary_amount ? `₹${parseFloat(item.salary_amount).toFixed(2)}` : 'N/A'}
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

  // Render loading state
  if (loading && teachers.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Header title="Manage Teachers" showBack={true} />
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading teachers...</Text>
      </View>
    );
  }
  
  // Render error state
  if (error && teachers.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Header title="Manage Teachers" showBack={true} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Header title="Manage Teachers" showBack={true} />
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      )}
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
              {subjects.map(subject => (
                <TouchableOpacity
                  key={subject.id}
                  style={{
                    backgroundColor: form.subjects.includes(subject.id) ? '#4CAF50' : (form.subjects.length > 0 ? '#e0e0e0' : '#f0f0f0'),
                    borderRadius: 16,
                    paddingVertical: 6,
                    paddingHorizontal: 14,
                    margin: 4,
                  }}
                  onPress={() => setForm({ ...form, subjects: toggleSelect(form.subjects, subject.id) })}
                >
                  <Text style={{ color: form.subjects.includes(subject.id) ? '#fff' : (form.subjects.length > 0 ? '#aaa' : '#333'), fontWeight: '600' }}>{subject.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Classes Assigned</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
              {classes.map(cls => (
                <TouchableOpacity
                  key={cls.id}
                  style={{
                    backgroundColor: form.classes.includes(cls.id) ? '#2196F3' : '#f0f0f0',
                    borderRadius: 16,
                    paddingVertical: 6,
                    paddingHorizontal: 14,
                    margin: 4,
                  }}
                  onPress={() => setForm({ ...form, classes: toggleSelect(form.classes, cls.id) })}
                >
                  <Text style={{ color: form.classes.includes(cls.id) ? '#fff' : '#333', fontWeight: '600' }}>{cls.class_name}</Text>
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
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    marginTop: 20,
    fontSize: 16,
    color: '#f44336',
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  retryButton: {
    marginTop: 15,
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
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