import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Modal, Pressable, Linking, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

const DUMMY_ASSIGNMENTS = [
  {
    id: 'a1',
    subject: 'Mathematics',
    title: 'Algebra Homework',
    description: 'Solve all problems from Chapter 3.',
    dueDate: '2024-07-10',
    files: [{ name: 'worksheet.pdf', url: '#' }],
    status: 'not_submitted',
  },
  {
    id: 'a2',
    subject: 'Mathematics',
    title: 'Geometry Worksheet',
    description: 'Complete the worksheet on triangles.',
    dueDate: '2024-07-15',
    files: [{ name: 'triangles.pdf', url: '#' }],
    status: 'submitted',
  },
  {
    id: 'a3',
    subject: 'Science',
    title: 'Lab Report',
    description: 'Write a report on the photosynthesis experiment.',
    dueDate: '2024-07-12',
    files: [{ name: 'lab_instructions.pdf', url: '#' }],
    status: 'graded',
  },
  {
    id: 'a4',
    subject: 'English',
    title: 'Essay Writing',
    description: 'Write an essay on your favorite book.',
    dueDate: '2024-07-09',
    files: [],
    status: 'not_submitted',
  },
  {
    id: 'a5',
    subject: 'Science',
    title: 'Chapter 5 Questions',
    description: 'Answer all questions from Chapter 5.',
    dueDate: '2024-07-14',
    files: [],
    status: 'submitted',
  },
];

const groupBySubject = (assignments) => {
  const groups = {};
  assignments.forEach(a => {
    if (!groups[a.subject]) groups[a.subject] = [];
    groups[a.subject].push(a);
  });
  return Object.entries(groups);
};

const statusColors = {
  not_submitted: '#F44336',
  submitted: '#FF9800',
  graded: '#4CAF50',
};

const statusLabels = {
  not_submitted: 'Not Submitted',
  submitted: 'Submitted',
  graded: 'Graded',
};

// Add helpers for file icon and size
const formatFileSize = (bytes) => {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
const getFileIcon = (fileType) => {
  if (fileType?.includes('pdf')) return 'document-text';
  if (fileType?.includes('image')) return 'image';
  if (fileType?.includes('word')) return 'document';
  return 'document-outline';
};

// Add dummy feedback/grade for demonstration
const getFeedbackAndGrade = (assignment) => {
  if (assignment.status === 'graded') {
    // Example dummy feedback/grade
    return {
      grade: assignment.grade || 'A',
      feedback: assignment.feedback || 'Excellent work! Keep it up.',
    };
  }
  return null;
};

// Dummy teacher files for demonstration
const getTeacherFiles = (assignment) => {
  // Real, downloadable files from the internet
  return [
    {
      id: 't1',
      name: 'Sample PDF Document.pdf',
      url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    },
    {
      id: 't2',
      name: 'Sample Word Document.docx',
      url: 'https://file-examples.com/storage/fe6b6e2e6e6e6e6e6e6e6e6e6e6e6e6e/doc-file.docx',
    },
    {
      id: 't3',
      name: 'Sample Excel Spreadsheet.xlsx',
      url: 'https://file-examples.com/storage/fe6b6e2e6e6e6e6e6e6e6e6e6e6e6e6e/xls-file.xlsx',
    },
    {
      id: 't4',
      name: 'Sample Image.jpg',
      url: 'https://www.w3schools.com/w3images/lights.jpg',
    },
  ];
};

const ViewAssignments = () => {
  // Use local state for assignments to allow status updates
  const [assignments, setAssignments] = useState(DUMMY_ASSIGNMENTS);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const grouped = groupBySubject(assignments);

  // When opening modal, set uploadedFiles to assignment's files if any
  const openAssignmentModal = (assignment) => {
    setSelectedAssignment(assignment);
    setUploadedFiles(assignment.files || []);
    setIsEditing(assignment.status === 'not_submitted');
  };

  // Handler to mark as submitted
  const handleMarkAsSubmitted = () => {
    if (!selectedAssignment) return;
    setAssignments(prev =>
      prev.map(a =>
        a.id === selectedAssignment.id ? { ...a, status: 'submitted', files: uploadedFiles } : a
      )
    );
    setSelectedAssignment(null);
    setUploadedFiles([]);
    setIsEditing(false);
  };

  // Handler to enable editing (re-upload)
  const handleEditFiles = () => {
    setIsEditing(true);
  };

  // File upload (documents)
  const handleFileUpload = async () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.pdf,.doc,.docx,.txt,.xls,.xlsx';
      input.onchange = (event) => {
        const file = event.target.files[0];
        if (file) {
          const newFile = {
            id: Date.now().toString(),
            name: file.name,
            size: file.size,
            type: file.type,
            uri: URL.createObjectURL(file),
            uploadTime: new Date().toISOString(),
          };
          setUploadedFiles(prev => [...prev, newFile]);
          Alert.alert('Success', `File "${file.name}" uploaded successfully!`);
        }
      };
      input.click();
    } else {
      try {
        const result = await DocumentPicker.getDocumentAsync({
          type: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          ],
          copyToCacheDirectory: true,
          multiple: false,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          const file = result.assets[0];
          const newFile = {
            id: Date.now().toString(),
            name: file.name,
            size: file.size || 0,
            type: file.mimeType || 'application/octet-stream',
            uri: file.uri,
            uploadTime: new Date().toISOString(),
          };
          setUploadedFiles(prev => [...prev, newFile]);
          Alert.alert('Success', `File "${file.name}" uploaded from your device!`);
        }
      } catch (error) {
        console.log('File upload error:', error);
        Alert.alert('Error', 'Failed to upload file. Please try again.');
      }
    }
  };

  // Image upload
  const handleImageUpload = async () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (event) => {
        const file = event.target.files[0];
        if (file) {
          const newFile = {
            id: Date.now().toString(),
            name: file.name,
            size: file.size,
            type: file.type,
            uri: URL.createObjectURL(file),
            uploadTime: new Date().toISOString(),
          };
          setUploadedFiles(prev => [...prev, newFile]);
          Alert.alert('Success', `Image "${file.name}" uploaded successfully!`);
        }
      };
      input.click();
    } else {
      try {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
          Alert.alert('Permission Required', 'Please grant permission to access your photo library.');
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
          allowsMultipleSelection: false,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          const image = result.assets[0];
          const newFile = {
            id: Date.now().toString(),
            name: `image_${Date.now()}.jpg`,
            size: image.fileSize || 0,
            type: 'image/jpeg',
            uri: image.uri,
            uploadTime: new Date().toISOString(),
          };
          setUploadedFiles(prev => [...prev, newFile]);
          Alert.alert('Success', 'Image uploaded from your gallery!');
        }
      } catch (error) {
        console.log('Image upload error:', error);
        Alert.alert('Error', 'Failed to upload image. Please try again.');
      }
    }
  };

  // Placeholder for file removal logic
  const handleRemoveFile = (id) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== id));
  };

  return (
    <>
      <ScrollView style={styles.container}>
        <Text style={styles.header}>Assignments</Text>
        {grouped.map(([subject, assignments]) => (
          <View key={subject} style={styles.subjectGroup}>
            <Text style={styles.subjectTitle}>{subject}</Text>
            {assignments.map(assignment => (
              <TouchableOpacity key={assignment.id} style={styles.assignmentCard} activeOpacity={0.85} onPress={() => openAssignmentModal(assignment)}>
                <View style={styles.assignmentHeader}>
                  <Text style={styles.assignmentTitle}>{assignment.title}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusColors[assignment.status] }]}> 
                    <Text style={styles.statusText}>{statusLabels[assignment.status]}</Text>
                  </View>
                </View>
                <Text style={styles.dueDate}>Due: {assignment.dueDate}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>
      {/* Assignment Details Modal */}
      <Modal
        visible={!!selectedAssignment}
        animationType="slide"
        transparent
        onRequestClose={() => { setSelectedAssignment(null); setUploadedFiles([]); setIsEditing(false); }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedAssignment && (
              <>
                <Text style={styles.modalTitle}>{selectedAssignment.title}</Text>
                <Text style={styles.modalSubject}>{selectedAssignment.subject}</Text>
                <View style={[styles.statusBadge, { backgroundColor: statusColors[selectedAssignment.status], alignSelf: 'flex-start', marginBottom: 8 }]}> 
                  <Text style={styles.statusText}>{statusLabels[selectedAssignment.status]}</Text>
                </View>
                <Text style={styles.modalLabel}>Due Date:</Text>
                <Text style={styles.modalValue}>{selectedAssignment.dueDate}</Text>
                <Text style={styles.modalLabel}>Description:</Text>
                <Text style={styles.modalValue}>{selectedAssignment.description}</Text>
                {/* Assignment resources section */}
                <Text style={styles.modalLabel}>Assignment Resources:</Text>
                {getTeacherFiles(selectedAssignment).length > 0 ? (
                  <View style={{ marginBottom: 8 }}>
                    {getTeacherFiles(selectedAssignment).map((file) => (
                      <Pressable key={file.id || file.name} onPress={() => Linking.openURL(file.url)} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                        <Ionicons name="document-text" size={18} color="#1976d2" style={{ marginRight: 6 }} />
                        <Text style={styles.fileLink}>{file.name}</Text>
                      </Pressable>
                    ))}
                  </View>
                ) : (
                  <Text style={{ color: '#888', fontStyle: 'italic', marginBottom: 8 }}>No files provided by teacher.</Text>
                )}
                {/* Upload section - always visible */}
                <View style={{ marginTop: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <Text style={styles.modalLabel}>Your Submission:</Text>
                    {selectedAssignment.status === 'submitted' && !isEditing && (
                      <TouchableOpacity onPress={handleEditFiles} style={{ marginLeft: 8 }}>
                        <Ionicons name="pencil" size={18} color="#2196F3" />
                      </TouchableOpacity>
                    )}
                  </View>
                  <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                    <TouchableOpacity
                      style={[styles.uploadButton, { opacity: isEditing ? 1 : 0.5 }]}
                      onPress={handleFileUpload}
                      disabled={!isEditing}
                    >
                      <Ionicons name="document-text" size={18} color="#fff" style={{ marginRight: 6 }} />
                      <Text style={styles.uploadButtonText}>Upload File</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.uploadButton, { backgroundColor: '#FF9800', marginLeft: 8, opacity: isEditing ? 1 : 0.5 }]}
                      onPress={handleImageUpload}
                      disabled={!isEditing}
                    >
                      <Ionicons name="image" size={18} color="#fff" style={{ marginRight: 6 }} />
                      <Text style={styles.uploadButtonText}>Upload Image</Text>
                    </TouchableOpacity>
                  </View>
                  {/* Divider and label for uploaded files/images */}
                  <View style={{ borderBottomWidth: 1, borderBottomColor: '#e0e0e0', marginBottom: 8 }} />
                  <Text style={{ color: '#1976d2', fontWeight: 'bold', marginBottom: 6 }}>Uploaded Files & Images</Text>
                  {uploadedFiles.length > 0 ? (
                    <View style={{ marginBottom: 8 }}>
                      {uploadedFiles.map((file) => (
                        <View key={file.id || file.name} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, backgroundColor: '#f4f6fa', borderRadius: 8, padding: 8 }}>
                          <Ionicons name={getFileIcon(file.type)} size={22} color="#1976d2" style={{ marginRight: 10 }} />
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: '#333', fontWeight: 'bold' }}>{file.name}</Text>
                            <Text style={{ color: '#888', fontSize: 12 }}>{formatFileSize(file.size)}</Text>
                          </View>
                          {isEditing && (
                            <TouchableOpacity onPress={() => handleRemoveFile(file.id)}>
                              <Ionicons name="close-circle" size={20} color="#F44336" />
                            </TouchableOpacity>
                          )}
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={{ color: '#888', fontStyle: 'italic', marginBottom: 8 }}>No files or images uploaded yet.</Text>
                  )}
                </View>
                {/* Submission status and submit button */}
                {isEditing ? (
                  <TouchableOpacity style={styles.submitButton} onPress={handleMarkAsSubmitted} disabled={uploadedFiles.length === 0}>
                    <Text style={styles.submitButtonText}>{uploadedFiles.length === 0 ? 'Upload File(s) to Submit' : 'Submit Assignment'}</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={{ marginTop: 12, alignItems: 'center' }}>
                    <Text style={{ color: '#4CAF50', fontWeight: 'bold', fontSize: 16 }}>Submitted</Text>
                  </View>
                )}
                {/* Feedback/Grade section */}
                <View style={{ marginTop: 18 }}>
                  <Text style={styles.modalLabel}>Teacher Feedback & Grade:</Text>
                  {selectedAssignment.status === 'graded' ? (
                    (() => {
                      const fg = getFeedbackAndGrade(selectedAssignment);
                      return (
                        <View style={{ backgroundColor: '#e8f5e9', borderRadius: 10, padding: 12, marginTop: 6 }}>
                          <Text style={{ color: '#388e3c', fontWeight: 'bold', fontSize: 16 }}>Grade: {fg.grade}</Text>
                          <Text style={{ color: '#333', marginTop: 4 }}>{fg.feedback}</Text>
                        </View>
                      );
                    })()
                  ) : (
                    <Text style={{ color: '#888', fontStyle: 'italic', marginTop: 6 }}>Awaiting grading/feedback from teacher.</Text>
                  )}
                </View>
                <TouchableOpacity style={styles.closeButton} onPress={() => { setSelectedAssignment(null); setUploadedFiles([]); setIsEditing(false); }}>
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
      </View>
    </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    padding: 16,
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 18,
    letterSpacing: 0.5,
  },
  subjectGroup: {
    marginBottom: 28,
  },
  subjectTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#388e3c',
    marginBottom: 10,
    letterSpacing: 0.2,
    paddingLeft: 4,
  },
  assignmentCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    elevation: 3,
    shadowColor: '#1976d2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#e3eaf2',
    flexDirection: 'column',
  },
  assignmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  assignmentTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#222',
    flex: 1,
    letterSpacing: 0.1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginLeft: 10,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  statusText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 0.2,
  },
  dueDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    marginTop: 2,
    fontWeight: '500',
  },
  detailsButton: {
    alignSelf: 'flex-end',
    backgroundColor: '#1976d2',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 10,
    marginTop: 6,
    shadowColor: '#1976d2',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.10,
    shadowRadius: 2,
  },
  detailsButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 0.2,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '92%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    elevation: 6,
    shadowColor: '#1976d2',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  modalSubject: {
    fontSize: 16,
    color: '#388e3c',
    marginBottom: 10,
    fontWeight: 'bold',
  },
  modalLabel: {
    fontWeight: 'bold',
    color: '#555',
    marginTop: 10,
    fontSize: 15,
  },
  modalValue: {
    color: '#333',
    marginBottom: 4,
    fontSize: 15,
  },
  fileLink: {
    color: '#2196F3',
    textDecorationLine: 'underline',
    marginBottom: 4,
    fontSize: 15,
  },
  closeButton: {
    marginTop: 18,
    backgroundColor: '#1976d2',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#1976d2',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.10,
    shadowRadius: 2,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.2,
  },
  submitButton: {
    marginTop: 16,
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.10,
    shadowRadius: 2,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.2,
  },
  uploadButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
    backgroundColor: '#2196F3',
    shadowColor: '#1976d2',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  uploadButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 0.1,
  },
});

export default ViewAssignments; 