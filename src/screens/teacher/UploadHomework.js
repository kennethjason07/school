import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert, Platform, Linking, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useAuth } from '../../utils/AuthContext';
import { supabase, TABLES } from '../../utils/supabase';

const UploadHomework = () => {
  const [classes, setClasses] = useState([]);
  const [homework, setHomework] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [homeworkTitle, setHomeworkTitle] = useState('');
  const [homeworkDescription, setHomeworkDescription] = useState('');
  const [homeworkInstructions, setHomeworkInstructions] = useState('');
  const [dueDate, setDueDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingHomework, setEditingHomework] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const { user } = useAuth();

  // Fetch teacher's assigned classes and subjects
  const fetchTeacherData = async () => {
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
          classes(id, class_name, section),
          subjects(id, name)
        `)
        .eq('teacher_id', teacherData.id);

      if (assignedError) throw assignedError;

      // Organize data by class
      const classMap = new Map();
      
      assignedData.forEach(assignment => {
        const classKey = assignment.classes.id;
        
        if (!classMap.has(classKey)) {
          classMap.set(classKey, {
            id: assignment.classes.id,
            name: `${assignment.classes.class_name} - ${assignment.classes.section}`,
            classId: assignment.classes.id,
            section: assignment.classes.section,
            subjects: [],
            students: []
          });
        }
        
        const classData = classMap.get(classKey);
        if (!classData.subjects.find(s => s.id === assignment.subjects.id)) {
          classData.subjects.push({
            id: assignment.subjects.id,
            name: assignment.subjects.name
          });
        }
      });

      // Get students for each class
      for (const [classKey, classData] of classMap) {
        const { data: studentsData, error: studentsError } = await supabase
          .from(TABLES.STUDENTS)
          .select(`
            id,
            full_name,
            roll_no
          `)
          .eq('class_id', classData.classId)
          .order('roll_no');

        if (studentsError) throw studentsError;
        classData.students = studentsData || [];
      }

      setClasses(Array.from(classMap.values()));

    } catch (err) {
      setError(err.message);
      console.error('Error fetching teacher data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch homework assignments
  const fetchHomework = async () => {
    try {
      const { data: homeworkData, error: homeworkError } = await supabase
        .from(TABLES.HOMEWORK)
        .select(`
          *,
          classes(class_name, section),
          subjects(name)
        `)
        .order('created_at', { ascending: false });

      if (homeworkError) throw homeworkError;

      setHomework(homeworkData || []);

    } catch (err) {
      console.error('Error fetching homework:', err);
    }
  };

  useEffect(() => {
    fetchTeacherData();
    fetchHomework();
  }, []);

  const handleClassSelect = (classId) => {
    setSelectedClass(classId);
    setSelectedSubject('');
    setSelectedStudents([]);
    
    const selectedClassData = classes.find(c => c.id === classId);
    if (selectedClassData) {
      setStudents(selectedClassData.students);
    }
  };

  const handleSubjectSelect = (subjectId) => {
    setSelectedSubject(subjectId);
  };

  const handleStudentSelection = (studentId) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAllStudents = () => {
    setSelectedStudents(students.map(s => s.id));
  };

  const handleClearAllStudents = () => {
    setSelectedStudents([]);
  };

  const handleFileUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      const fileInfo = {
        id: Date.now().toString(),
        name: file.name,
        size: file.size,
        type: file.mimeType,
        uri: file.uri,
      };

      setUploadedFiles(prev => [...prev, fileInfo]);
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handleImageUpload = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to access your photo library');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      const fileInfo = {
        id: Date.now().toString(),
        name: `image_${Date.now()}.jpg`,
        size: asset.fileSize || 0,
        type: 'image/jpeg',
        uri: asset.uri,
      };

      setUploadedFiles(prev => [...prev, fileInfo]);
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleRemoveFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const handleSubmitHomework = async () => {
    if (!selectedClass || !selectedSubject || !homeworkTitle.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (selectedStudents.length === 0) {
      Alert.alert('Error', 'Please select at least one student');
      return;
    }

    try {
      const selectedClassData = classes.find(c => c.id === selectedClass);
      if (!selectedClassData) {
        Alert.alert('Error', 'Selected class not found.');
        return;
      }

      const homeworkData = {
        title: homeworkTitle,
        description: homeworkDescription,
        instructions: homeworkInstructions,
        due_date: dueDate.toISOString().split('T')[0],
        class_id: selectedClassData.id,
        section: selectedClassData.section,
        subject_id: selectedSubject,
        teacher_id: user.id,
        assigned_students: selectedStudents,
        files: uploadedFiles,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error: insertError } = await supabase
        .from(TABLES.HOMEWORK)
        .insert(homeworkData);

      if (insertError) throw insertError;

      Alert.alert('Success', 'Homework assigned successfully!');
      
      // Reset form
      setHomeworkTitle('');
      setHomeworkDescription('');
      setHomeworkInstructions('');
      setSelectedStudents([]);
      setUploadedFiles([]);
      setShowModal(false);
      
      // Refresh homework list
      await fetchHomework();

    } catch (err) {
      Alert.alert('Error', err.message);
      console.error('Error submitting homework:', err);
    }
  };

  const handleDeleteHomework = async (homeworkId) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this homework assignment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from(TABLES.HOMEWORK)
                .delete()
                .eq('id', homeworkId);

              if (error) throw error;

              Alert.alert('Success', 'Homework deleted successfully!');
              await fetchHomework();

            } catch (err) {
              Alert.alert('Error', err.message);
              console.error('Error deleting homework:', err);
            }
          }
        }
      ]
    );
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType) => {
    if (fileType?.includes('pdf')) return 'document-text';
    if (fileType?.includes('image')) return 'image';
    if (fileType?.includes('word')) return 'document';
    return 'document';
  };

  const getHomeworkStatus = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    return today > due ? 'overdue' : 'active';
  };

  const getStatusColor = (status) => {
    return status === 'active' ? '#4CAF50' : '#f44336';
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Upload Homework" showBack={true} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1976d2" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Header title="Upload Homework" showBack={true} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchTeacherData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Upload Homework" showBack={true} />
      
      <ScrollView style={styles.content}>
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
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedClass}
                  onValueChange={handleClassSelect}
                  style={styles.picker}
                >
                  <Picker.Item label="Select a class" value="" />
                  {classes.map(classItem => (
                    <Picker.Item 
                      key={classItem.id} 
                      label={classItem.name} 
                      value={classItem.id} 
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Subject Selection */}
            {selectedClass && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Select Subject</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={selectedSubject}
                    onValueChange={handleSubjectSelect}
                    style={styles.picker}
                  >
                    <Picker.Item label="Select a subject" value="" />
                    {classes.find(c => c.id === selectedClass)?.subjects.map(subject => (
                      <Picker.Item 
                        key={subject.id} 
                        label={subject.name} 
                        value={subject.id} 
                      />
                    ))}
                  </Picker>
                </View>
              </View>
            )}

            {/* Student Selection */}
            {selectedClass && students.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Select Students</Text>
                <View style={styles.studentActions}>
                  <TouchableOpacity style={styles.actionButton} onPress={handleSelectAllStudents}>
                    <Text style={styles.actionButtonText}>Select All</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton} onPress={handleClearAllStudents}>
                    <Text style={styles.actionButtonText}>Clear All</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.studentList}>
                  {students.map(student => (
                    <TouchableOpacity
                      key={student.id}
                      style={[
                        styles.studentItem,
                        selectedStudents.includes(student.id) && styles.selectedStudentItem
                      ]}
                      onPress={() => handleStudentSelection(student.id)}
                    >
                      <Text style={styles.studentName}>{student.name}</Text>
                      <Text style={styles.studentRoll}>Roll: {student.roll_no}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Upload Button */}
            {selectedClass && selectedSubject && selectedStudents.length > 0 && (
              <TouchableOpacity style={styles.uploadButton} onPress={() => setShowModal(true)}>
                <Ionicons name="add" size={24} color="#fff" />
                <Text style={styles.uploadButtonText}>Upload Homework</Text>
              </TouchableOpacity>
            )}

            {/* Homework List */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Homework</Text>
              {homework.length === 0 ? (
                <Text style={styles.noHomeworkText}>No homework assignments yet</Text>
              ) : (
                homework.map(hw => (
                  <View key={hw.id} style={styles.homeworkCard}>
                    <View style={styles.homeworkHeader}>
                      <Text style={styles.homeworkTitle}>{hw.title}</Text>
                      <View style={styles.homeworkActions}>
                        <TouchableOpacity onPress={() => handleDeleteHomework(hw.id)}>
                          <Ionicons name="trash" size={20} color="#f44336" />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <Text style={styles.homeworkDetails}>
                      {hw.classes?.class_name} - {hw.classes?.section} | {hw.subjects?.name}
                    </Text>
                    <Text style={styles.homeworkDescription}>{hw.description}</Text>
                    <Text style={styles.homeworkDueDate}>Due: {hw.due_date}</Text>
                    <View style={styles.homeworkStatus}>
                      <Text style={[
                        styles.statusText,
                        { color: getStatusColor(getHomeworkStatus(hw.due_date)) }
                      ]}>
                        {getHomeworkStatus(hw.due_date)}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Upload Modal */}
      <Modal visible={showModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Upload Homework</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color="#1976d2" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <TextInput
                style={styles.input}
                placeholder="Homework Title"
                value={homeworkTitle}
                onChangeText={setHomeworkTitle}
              />
              
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Description"
                value={homeworkDescription}
                onChangeText={setHomeworkDescription}
                multiline
                numberOfLines={3}
              />
              
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Instructions"
                value={homeworkInstructions}
                onChangeText={setHomeworkInstructions}
                multiline
                numberOfLines={3}
              />

              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar" size={20} color="#1976d2" />
                <Text style={styles.dateButtonText}>
                  Due Date: {dueDate.toLocaleDateString()}
                </Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={dueDate}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) setDueDate(selectedDate);
                  }}
                />
              )}

              <View style={styles.fileSection}>
                <Text style={styles.fileSectionTitle}>Attachments</Text>
                <View style={styles.fileButtons}>
                  <TouchableOpacity style={styles.fileButton} onPress={handleFileUpload}>
                    <Ionicons name="document" size={20} color="#1976d2" />
                    <Text style={styles.fileButtonText}>Add Document</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.fileButton} onPress={handleImageUpload}>
                    <Ionicons name="image" size={20} color="#1976d2" />
                    <Text style={styles.fileButtonText}>Add Image</Text>
                  </TouchableOpacity>
                </View>

                {uploadedFiles.map(file => (
                  <View key={file.id} style={styles.fileItem}>
                    <Ionicons name={getFileIcon(file.type)} size={20} color="#666" />
                    <View style={styles.fileInfo}>
                      <Text style={styles.fileName}>{file.name}</Text>
                      <Text style={styles.fileSize}>{formatFileSize(file.size)}</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleRemoveFile(file.id)}>
                      <Ionicons name="close" size={20} color="#f44336" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              <TouchableOpacity style={styles.submitButton} onPress={handleSubmitHomework}>
                <Text style={styles.submitButtonText}>Submit Homework</Text>
              </TouchableOpacity>
            </ScrollView>
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  picker: {
    height: 50,
  },
  studentActions: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  actionButton: {
    backgroundColor: '#1976d2',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  studentList: {
    maxHeight: 200,
  },
  studentItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    elevation: 1,
  },
  selectedStudentItem: {
    backgroundColor: '#e3f2fd',
    borderColor: '#1976d2',
    borderWidth: 1,
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
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    elevation: 2,
  },
  uploadButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  homeworkCard: {
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
  homeworkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  homeworkTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  homeworkActions: {
    flexDirection: 'row',
  },
  homeworkDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  homeworkDescription: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  homeworkDueDate: {
    fontSize: 14,
    color: '#1976d2',
    fontWeight: 'bold',
  },
  homeworkStatus: {
    marginTop: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
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
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  dateButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#1976d2',
  },
  fileSection: {
    marginBottom: 24,
  },
  fileSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  fileButtons: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  fileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
  },
  fileButtonText: {
    marginLeft: 8,
    color: '#1976d2',
    fontWeight: 'bold',
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  fileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  fileName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  fileSize: {
    fontSize: 12,
    color: '#666',
  },
  submitButton: {
    backgroundColor: '#1976d2',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
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
  noHomeworkText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 16,
    fontStyle: 'italic',
  },
});

export default UploadHomework; 