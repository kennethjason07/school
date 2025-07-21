import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

// Mock data for teacher's assigned classes and subjects
const TEACHER_ASSIGNMENTS = [
  { id: '1', class: '5A', subjects: ['Mathematics', 'Science'] },
  { id: '2', class: '6A', subjects: ['Mathematics', 'English'] },
  { id: '3', class: '7A', subjects: ['Mathematics'] },
];

// Mock data for students in each class
const STUDENTS_BY_CLASS = {
  '5A': [
    { id: '1', name: 'Amit Sharma', rollNo: '1' },
    { id: '2', name: 'Priya Singh', rollNo: '2' },
    { id: '3', name: 'Raj Patel', rollNo: '3' },
    { id: '4', name: 'Neha Gupta', rollNo: '4' },
    { id: '5', name: 'Karan Malhotra', rollNo: '5' },
    { id: '6', name: 'Sanya Kapoor', rollNo: '6' },
    { id: '7', name: 'Vivek Reddy', rollNo: '7' },
    { id: '8', name: 'Ishita Mehta', rollNo: '8' },
  ],
  '6A': [
    { id: '9', name: 'Rahul Kumar', rollNo: '1' },
    { id: '10', name: 'Sneha Verma', rollNo: '2' },
    { id: '11', name: 'Arjun Singh', rollNo: '3' },
    { id: '12', name: 'Kavya Patel', rollNo: '4' },
    { id: '13', name: 'Aditya Joshi', rollNo: '5' },
    { id: '14', name: 'Pooja Sharma', rollNo: '6' },
    { id: '15', name: 'Rishabh Gupta', rollNo: '7' },
    { id: '16', name: 'Tanvi Singh', rollNo: '8' },
  ],
  '7A': [
    { id: '17', name: 'Vikram Singh', rollNo: '1' },
    { id: '18', name: 'Anjali Sharma', rollNo: '2' },
    { id: '19', name: 'Rohan Kumar', rollNo: '3' },
    { id: '20', name: 'Zara Khan', rollNo: '4' },
    { id: '21', name: 'Dhruv Agarwal', rollNo: '5' },
    { id: '22', name: 'Aisha Khan', rollNo: '6' },
    { id: '23', name: 'Kartik Verma', rollNo: '7' },
    { id: '24', name: 'Nisha Reddy', rollNo: '8' },
  ],
};

// Initial mock data for previously uploaded homework
const INITIAL_HOMEWORK = [
  {
    id: 'hw1',
    title: 'Algebra Practice Problems',
    subject: 'Mathematics',
    class: '5A',
    dueDate: '22-12-2024',
    description: 'Complete exercises 1-10 from Chapter 3',
    instructions: 'Show all your work and submit by the due date.',
    status: 'active', // Will be determined by due date
    submissions: 12,
    totalStudents: 15,
    files: [
      { id: 'f1', name: 'algebra_worksheet.pdf', size: 1024000, type: 'application/pdf', uri: null },
      { id: 'f2', name: 'solutions_guide.pdf', size: 512000, type: 'application/pdf', uri: null },
    ],
    assignedStudents: ['1', '2', '3', '4', '5', '6', '7', '8'],
    createdAt: '2024-06-01T10:30:00Z',
  },
  {
    id: 'hw2',
    title: 'Science Lab Report',
    subject: 'Science',
    class: '5A',
    dueDate: '15-12-2024',
    description: 'Write a report on the photosynthesis experiment',
    instructions: 'Include hypothesis, methodology, results, and conclusion.',
    status: 'active', // Will be determined by due date
    submissions: 15,
    totalStudents: 15,
    files: [
      { id: 'f3', name: 'lab_procedure.pdf', size: 768000, type: 'application/pdf', uri: null },
      { id: 'f4', name: 'report_template.docx', size: 256000, type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', uri: null },
    ],
    assignedStudents: ['1', '2', '3', '4', '5', '6', '7', '8'],
    createdAt: '2024-05-28T14:15:00Z',
  },
  {
    id: 'hw3',
    title: 'English Essay Writing',
    subject: 'English',
    class: '6A',
    dueDate: '10-12-2024',
    description: 'Write a 500-word essay on your favorite book',
    instructions: 'Use proper grammar and include an introduction, body, and conclusion.',
    status: 'active', // Will be determined by due date
    submissions: 8,
    totalStudents: 12,
    files: [
      { id: 'f5', name: 'essay_guidelines.pdf', size: 384000, type: 'application/pdf', uri: null },
    ],
    assignedStudents: ['9', '10', '11', '12'],
    createdAt: '2024-06-05T09:45:00Z',
  },
];

const UploadHomework = () => {
  // Get today's date in dd-mm-yyyy format
  const getTodayDate = () => {
    const today = new Date();
    const day = today.getDate().toString().padStart(2, '0');
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const year = today.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Convert dd-mm-yyyy to yyyy-mm-dd for storage
  const convertToStorageFormat = (dateStr) => {
    if (!dateStr) return '';
    const [day, month, year] = dateStr.split('-');
    return `${year}-${month}-${day}`;
  };

  // Convert yyyy-mm-dd to dd-mm-yyyy for display
  const convertToDisplayFormat = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}-${month}-${year}`;
  };

  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [showClassModal, setShowClassModal] = useState(false);
  const [showHomeworkModal, setShowHomeworkModal] = useState(false);
  const [homeworkDetails, setHomeworkDetails] = useState({
    title: '',
    description: '',
    dueDate: getTodayDate(),
    instructions: '',
    assignedStudents: [],
    files: [],
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStudentSelection, setShowStudentSelection] = useState(false);
  const [showHomeworkDetails, setShowHomeworkDetails] = useState(false);
  const [showEditHomework, setShowEditHomework] = useState(false);
  const [selectedHomework, setSelectedHomework] = useState(null);
  const [editHomeworkData, setEditHomeworkData] = useState({});
  const [showSubmissionTracking, setShowSubmissionTracking] = useState(false);
  const [selectedHomeworkForTracking, setSelectedHomeworkForTracking] = useState(null);
  const [previousHomework, setPreviousHomework] = useState(INITIAL_HOMEWORK);
  const [submissionMark, setSubmissionMark] = useState({}); // { studentId: { status: 'submitted'|'not_submitted', grade: 'A'|'B'|... } }
  const [editSubmissionMode, setEditSubmissionMode] = useState({}); // { studentId: true|false }
  // --- Add state to track if submission has been finalized ---
  const [submissionFinalized, setSubmissionFinalized] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedStudentMark, setSelectedStudentMark] = useState({});
  const [showStudentPopup, setShowStudentPopup] = useState(false);
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  // Add state for edit due date picker
  const [showEditDueDatePicker, setShowEditDueDatePicker] = useState(false);

  // Get subjects for selected class
  const getSubjectsForClass = (className) => {
    const assignment = TEACHER_ASSIGNMENTS.find(a => a.class === className);
    return assignment ? assignment.subjects : [];
  };

  // Get students for selected class
  const getStudentsForClass = (className) => {
    return STUDENTS_BY_CLASS[className] || [];
  };

  // Handle class selection
  const handleClassSelect = (className) => {
    setSelectedClass(className);
    setSelectedSubject('');
    setShowClassModal(false);
  };

  // Handle subject selection
  const handleSubjectSelect = (subject, className) => {
    setSelectedClass(className);
    setSelectedSubject(subject);
    setHomeworkDetails({
      title: '',
      description: '',
      dueDate: '',
      instructions: '',
      assignedStudents: [],
      files: [],
    });
    setShowHomeworkModal(true);
  };

  // Handle homework submission
  const handleSubmitHomework = () => {
    if (!homeworkDetails.title || !homeworkDetails.description || !homeworkDetails.dueDate) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }
    
    // Create new homework object
    const newHomework = {
      id: `hw${Date.now()}`,
      title: homeworkDetails.title,
      subject: selectedSubject,
      class: selectedClass,
      dueDate: homeworkDetails.dueDate,
      description: homeworkDetails.description,
      instructions: homeworkDetails.instructions || '',
      status: getHomeworkStatus(homeworkDetails.dueDate),
      submissions: 0,
      totalStudents: homeworkDetails.assignedStudents.length || getStudentsForClass(selectedClass).length,
      files: homeworkDetails.files,
      assignedStudents: homeworkDetails.assignedStudents.length > 0 ? homeworkDetails.assignedStudents : getStudentsForClass(selectedClass).map(s => s.id),
      createdAt: new Date().toISOString(),
    };
    
    // Add to homework list
    setPreviousHomework(prev => [newHomework, ...prev]);
    
    Alert.alert('Success', 'Homework uploaded successfully!');
    setHomeworkDetails({
      title: '',
      description: '',
      dueDate: getTodayDate(),
      instructions: '',
      assignedStudents: [],
      files: [],
    });
    setShowHomeworkModal(false);
  };

  // Handle student selection
  const handleStudentSelection = (studentId) => {
    // Check if we're in edit mode
    if (showEditHomework) {
      const currentStudents = editHomeworkData.assignedStudents || [];
      if (currentStudents.includes(studentId)) {
        setEditHomeworkData({
          ...editHomeworkData,
          assignedStudents: currentStudents.filter(id => id !== studentId)
        });
      } else {
        setEditHomeworkData({
          ...editHomeworkData,
          assignedStudents: [...currentStudents, studentId]
        });
      }
    } else {
      // Upload mode
      const currentStudents = homeworkDetails.assignedStudents;
      if (currentStudents.includes(studentId)) {
        setHomeworkDetails({
          ...homeworkDetails,
          assignedStudents: currentStudents.filter(id => id !== studentId)
        });
      } else {
        setHomeworkDetails({
          ...homeworkDetails,
          assignedStudents: [...currentStudents, studentId]
        });
      }
    }
  };

  // Handle select all students
  const handleSelectAllStudents = () => {
    const currentClass = showEditHomework ? selectedHomework?.class : selectedClass;
    const allStudents = getStudentsForClass(currentClass).map(s => s.id);
    if (showEditHomework) {
      setEditHomeworkData({
        ...editHomeworkData,
        assignedStudents: allStudents
      });
    } else {
      setHomeworkDetails({
        ...homeworkDetails,
        assignedStudents: allStudents
      });
    }
  };

  // Handle clear all students
  const handleClearAllStudents = () => {
    if (showEditHomework) {
      setEditHomeworkData({
        ...editHomeworkData,
        assignedStudents: []
      });
    } else {
      setHomeworkDetails({
        ...homeworkDetails,
        assignedStudents: []
      });
    }
  };

  // Handle file upload from local storage
  const handleFileUpload = async () => {
    if (Platform.OS === 'web') {
      // For web, create a file input
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
          setHomeworkDetails({
            ...homeworkDetails,
            files: [...homeworkDetails.files, newFile]
          });
          Alert.alert('Success', `File "${file.name}" uploaded successfully!`);
        }
      };
      input.click();
    } else {
      // For mobile, use real document picker
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
          
          setHomeworkDetails({
            ...homeworkDetails,
            files: [...homeworkDetails.files, newFile]
          });
          
          Alert.alert('Success', `File "${file.name}" uploaded from your device!`);
        }
      } catch (error) {
        console.log('File upload error:', error);
        Alert.alert('Error', 'Failed to upload file. Please try again.');
      }
    }
  };

  // Handle image upload from local storage
  const handleImageUpload = async () => {
    if (Platform.OS === 'web') {
      // For web, create an image input
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
          setHomeworkDetails({
            ...homeworkDetails,
            files: [...homeworkDetails.files, newFile]
          });
          Alert.alert('Success', `Image "${file.name}" uploaded successfully!`);
        }
      };
      input.click();
    } else {
      // For mobile, use real image picker
      try {
        // Request permission first
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
          
          setHomeworkDetails({
            ...homeworkDetails,
            files: [...homeworkDetails.files, newFile]
          });
          
          Alert.alert('Success', 'Image uploaded from your gallery!');
        }
      } catch (error) {
        console.log('Image upload error:', error);
        Alert.alert('Error', 'Failed to upload image. Please try again.');
      }
    }
  };

  // Handle file removal
  const handleRemoveFile = (fileId) => {
    setHomeworkDetails({
      ...homeworkDetails,
      files: homeworkDetails.files.filter(file => file.id !== fileId)
    });
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get file icon based on type
  const getFileIcon = (fileType) => {
    if (fileType?.includes('pdf')) return 'document-text';
    if (fileType?.includes('image')) return 'image';
    if (fileType?.includes('word')) return 'document';
    return 'document-outline';
  };

  // Handle view homework details
  const handleViewHomework = (homework) => {
    setSelectedHomework(homework);
    setShowHomeworkDetails(true);
  };

  // Handle edit homework
  const handleEditHomework = (homework) => {
    setSelectedHomework(homework);
    setEditHomeworkData({
      title: homework.title,
      description: homework.description,
      instructions: homework.instructions,
      dueDate: homework.dueDate,
      assignedStudents: homework.assignedStudents,
      files: homework.files,
    });
    setShowEditHomework(true);
  };

  // Handle save edited homework
  const handleSaveEditHomework = () => {
    if (!editHomeworkData.title || !editHomeworkData.description || !editHomeworkData.dueDate) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }
    
    // Update the homework in the list
    setPreviousHomework(prev => 
      prev.map(homework => 
        homework.id === selectedHomework.id 
          ? {
              ...homework,
              title: editHomeworkData.title,
              description: editHomeworkData.description,
              instructions: editHomeworkData.instructions,
              dueDate: editHomeworkData.dueDate,
              files: editHomeworkData.files,
              assignedStudents: editHomeworkData.assignedStudents,
            }
          : homework
      )
    );
    
    Alert.alert('Success', 'Homework updated successfully!');
    setShowEditHomework(false);
    setEditHomeworkData({});
    setSelectedHomework(null);
  };

  // Handle delete homework
  const handleDeleteHomework = (homeworkId) => {
    Alert.alert(
      'Delete Homework',
      'Are you sure you want to delete this homework? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Remove the homework from the list
            setPreviousHomework(prev => {
              const updatedList = prev.filter(homework => homework.id !== homeworkId);
              if (updatedList.length === prev.length) {
                // If no homework was removed, show an error
                Alert.alert('Error', 'Homework not found or already deleted.');
                return prev;
              }
              return updatedList;
            });
            Alert.alert('Success', 'Homework deleted successfully!');
          },
        },
      ]
    );
  };

  // Update handleDownloadFiles to use expo-file-system for mobile
  const handleDownloadFiles = async (homework) => {
    if (Platform.OS === 'web') {
      Alert.alert('Download not supported on web yet.');
      return;
    }
    if (!homework.files || homework.files.length === 0) {
      Alert.alert('No files to download.');
      return;
    }
    try {
      const savedFiles = [];
      for (const file of homework.files) {
        let sourceUri = file.uri;
        const fileName = file.name || `file_${Date.now()}.pdf`;
        let localUri = FileSystem.cacheDirectory + fileName;
        // Prepare the file locally first
        if (sourceUri && sourceUri.startsWith('file://')) {
          await FileSystem.copyAsync({ from: sourceUri, to: localUri });
        } else if (sourceUri && (sourceUri.startsWith('http://') || sourceUri.startsWith('https://'))) {
          await FileSystem.downloadAsync(sourceUri, localUri);
        } else {
          // For mock files, create a dummy file
          const content = `Homework: ${homework.title}\nSubject: ${homework.subject}\nClass: ${homework.class}\nDescription: ${homework.description}\nDue Date: ${formatDate(homework.dueDate)}\nInstructions: ${homework.instructions || 'No specific instructions'}\n\nThis is a placeholder file for: ${file.name}`;
          await FileSystem.writeAsStringAsync(localUri, content);
        }
        // Now, move to public Downloads or share
        if (Platform.OS === 'android') {
          try {
            const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
            if (!permissions.granted) {
              Alert.alert('Permission required', 'Please grant storage permission to save files.');
              return;
            }
            
            // Try to create file in the selected directory
            const destUri = await FileSystem.StorageAccessFramework.createFileAsync(
              permissions.directoryUri,
              fileName,
              file.type || 'application/octet-stream'
            );
            const fileData = await FileSystem.readAsStringAsync(localUri, { encoding: FileSystem.EncodingType.Base64 });
            await FileSystem.writeAsStringAsync(destUri, fileData, { encoding: FileSystem.EncodingType.Base64 });
            savedFiles.push(fileName);
          } catch (error) {
            console.log('Storage access error:', error);
            // Fallback: save to app's document directory and show instructions
            const fallbackUri = FileSystem.documentDirectory + fileName;
            await FileSystem.copyAsync({ from: localUri, to: fallbackUri });
            savedFiles.push(fileName);
            Alert.alert(
              'File Saved', 
              `File saved to app directory: ${fileName}\n\nTo access: File Manager → Internal Storage → Android → data → Your App Package → files\n\nOr try downloading again and select a different folder.`
            );
            return;
          }
        } else if (Platform.OS === 'ios') {
          await Sharing.shareAsync(localUri);
          savedFiles.push(fileName);
        }
      }
      if (savedFiles.length > 0) {
        Alert.alert('Success', `Files saved: ${savedFiles.join(', ')}\nCheck your Downloads folder (Android) or chosen location (iOS).`);
      }
    } catch (error) {
      console.log('Download error:', error);
      Alert.alert('Error', 'Failed to save files. Please try again.');
    }
  };

  // Get student names for assigned students
  const getStudentNames = (studentIds, className) => {
    const students = getStudentsForClass(className);
    return studentIds.map(id => {
      const student = students.find(s => s.id === id);
      return student ? student.name : `Student ${id}`;
    });
  };

  // Mock submission data
  const getSubmissionData = (homeworkId) => {
    const submissions = {
      'hw1': [
        { studentId: '1', studentName: 'Amit Sharma', status: 'submitted', submittedAt: '2024-06-10T14:30:00Z', grade: 'A', feedback: 'Excellent work!' },
        { studentId: '2', studentName: 'Priya Singh', status: 'submitted', submittedAt: '2024-06-11T09:15:00Z', grade: 'B+', feedback: 'Good effort, minor errors' },
        { studentId: '3', studentName: 'Raj Patel', status: 'submitted', submittedAt: '2024-06-12T16:45:00Z', grade: 'A-', feedback: 'Well done!' },
        { studentId: '4', studentName: 'Neha Gupta', status: 'submitted', submittedAt: '2024-06-13T11:20:00Z', grade: 'B', feedback: 'Needs improvement' },
        { studentId: '5', studentName: 'Karan Malhotra', status: 'submitted', submittedAt: '2024-06-14T13:10:00Z', grade: 'A+', feedback: 'Outstanding work!' },
        { studentId: '6', studentName: 'Sanya Kapoor', status: 'submitted', submittedAt: '2024-06-15T08:30:00Z', grade: 'B-', feedback: 'Please review concepts' },
        { studentId: '7', studentName: 'Vivek Reddy', status: 'late', submittedAt: '2024-06-16T10:45:00Z', grade: 'C+', feedback: 'Submitted late' },
        { studentId: '8', studentName: 'Ishita Mehta', status: 'not_submitted', submittedAt: null, grade: null, feedback: null },
      ],
      'hw2': [
        { studentId: '1', studentName: 'Amit Sharma', status: 'submitted', submittedAt: '2024-06-08T15:20:00Z', grade: 'A', feedback: 'Excellent lab report!' },
        { studentId: '2', studentName: 'Priya Singh', status: 'submitted', submittedAt: '2024-06-09T12:30:00Z', grade: 'A-', feedback: 'Very good work' },
        { studentId: '3', studentName: 'Raj Patel', status: 'submitted', submittedAt: '2024-06-10T14:15:00Z', grade: 'B+', feedback: 'Good effort' },
        { studentId: '4', studentName: 'Neha Gupta', status: 'submitted', submittedAt: '2024-06-11T09:45:00Z', grade: 'A', feedback: 'Well done!' },
        { studentId: '5', studentName: 'Karan Malhotra', status: 'submitted', submittedAt: '2024-06-12T16:20:00Z', grade: 'A+', feedback: 'Outstanding!' },
        { studentId: '6', studentName: 'Sanya Kapoor', status: 'submitted', submittedAt: '2024-06-12T17:30:00Z', grade: 'B', feedback: 'Good work' },
        { studentId: '7', studentName: 'Vivek Reddy', status: 'submitted', submittedAt: '2024-06-12T18:15:00Z', grade: 'B-', feedback: 'Needs improvement' },
        { studentId: '8', studentName: 'Ishita Mehta', status: 'submitted', submittedAt: '2024-06-12T19:00:00Z', grade: 'C+', feedback: 'Basic understanding' },
      ],
      'hw3': [
        { studentId: '9', studentName: 'Rahul Kumar', status: 'submitted', submittedAt: '2024-06-18T14:30:00Z', grade: 'A', feedback: 'Excellent essay!' },
        { studentId: '10', studentName: 'Sneha Verma', status: 'submitted', submittedAt: '2024-06-19T10:15:00Z', grade: 'B+', feedback: 'Good writing' },
        { studentId: '11', studentName: 'Arjun Singh', status: 'submitted', submittedAt: '2024-06-19T16:45:00Z', grade: 'A-', feedback: 'Well structured' },
        { studentId: '12', studentName: 'Kavya Patel', status: 'submitted', submittedAt: '2024-06-20T09:20:00Z', grade: 'B', feedback: 'Good effort' },
      ]
    };
    
    // For new homework, return empty array (no submissions yet)
    if (!submissions[homeworkId]) {
      return [];
    }
    
    return submissions[homeworkId];
  };

  // Handle submission tracking
  const handleSubmissionTracking = (homework) => {
    setSelectedHomeworkForTracking(homework);
    setShowSubmissionTracking(true);
  };

  // Handle grade submission
  const handleGradeSubmission = (studentId, grade, feedback) => {
    Alert.alert('Success', `Grade and feedback saved for student ${studentId}`);
  };

  // Get submission statistics
  const getSubmissionStats = (homeworkId) => {
    const submissions = getSubmissionData(homeworkId);
    const total = submissions.length;
    const submitted = submissions.filter(s => s.status === 'submitted').length;
    const late = submissions.filter(s => s.status === 'late').length;
    const notSubmitted = submissions.filter(s => s.status === 'not_submitted').length;
    const graded = submissions.filter(s => s.grade).length;
    
    return {
      total,
      submitted,
      late,
      notSubmitted,
      graded,
      submissionRate: total > 0 ? Math.round((submitted / total) * 100) : 0,
      gradingRate: total > 0 ? Math.round((graded / total) * 100) : 0,
    };
  };

  // Get homework status based on due date
  const getHomeworkStatus = (dueDate) => {
    if (!dueDate) return 'active';
    
    const parseDate = (dateStr) => {
      const [day, month, year] = dateStr.split('-').map(Number);
      return new Date(year, month - 1, day);
    };
    
    const homeworkDate = parseDate(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return homeworkDate < today ? 'completed' : 'active';
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#4CAF50';
      case 'completed': return '#FF9800';
      default: return '#666';
    }
  };

  // Format date from yyyy-mm-dd to dd-mm-yyyy
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // Return original if invalid date
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}-${month}-${year}`;
  };

  // Check if homework is upcoming (due date is today or in the future)
  const isUpcomingHomework = (dueDate) => {
    if (!dueDate) return false;
    const parseDate = (dateStr) => {
      const [day, month, year] = dateStr.split('-').map(Number);
      return new Date(year, month - 1, day);
    };
    const homeworkDate = parseDate(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return homeworkDate >= today;
  };

  // Sort homework by upcoming dates first, then past dates
  const sortHomeworkByDate = (homeworkList) => {
    return homeworkList.sort((a, b) => {
      // Convert dd-mm-yyyy to Date objects for comparison
      const parseDate = (dateStr) => {
        if (!dateStr) return new Date(0);
        const [day, month, year] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day);
      };
      
      const dateA = parseDate(a.dueDate);
      const dateB = parseDate(b.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day
      
      const isUpcomingA = dateA >= today;
      const isUpcomingB = dateB >= today;
      
      // If both are upcoming or both are past, sort by date
      if (isUpcomingA === isUpcomingB) {
        return dateA - dateB;
      }
      
      // Upcoming dates come first
      return isUpcomingA ? -1 : 1;
    });
  };

  // Get grade color
  const getGradeColor = (grade) => {
    if (grade?.includes('A')) return '#4CAF50';
    if (grade?.includes('B')) return '#2196F3';
    if (grade?.includes('C')) return '#FF9800';
    if (grade?.includes('D') || grade?.includes('F')) return '#F44336';
    return '#666';
  };

  // --- Add helper to get assigned students for selected homework ---
  const getAssignedStudents = (homework) => {
    if (!homework) return [];
    return getStudentsForClass(homework.class).filter(s => homework.assignedStudents.includes(s.id));
  };

  // --- Add handler to start editing a student's submission ---
  const handleEditSubmission = (studentId) => {
    setEditSubmissionMode((prev) => ({ ...prev, [studentId]: true }));
  };

  // --- Add handler to set submission status ---
  const handleSetSubmissionStatus = (studentId, status) => {
    setSubmissionMark((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };

  // --- Add handler to set grade ---
  const handleSetGrade = (studentId, grade) => {
    setSubmissionMark((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        grade,
      },
    }));
  };

  // --- Add handler to submit all marks ---
  const handleSubmitManualMark = () => {
    setEditSubmissionMode({});
    setSubmissionFinalized(true);
    Alert.alert('Success', 'Submission status and grades saved!');
  };

  // --- Add summary stats helper ---
  const getManualSubmissionStats = (students) => {
    let submitted = 0, notSubmitted = 0, graded = 0;
    students.forEach(s => {
      const mark = submissionMark[s.id] || {};
      if (mark.status === 'submitted') submitted++;
      else notSubmitted++;
      if (mark.grade) graded++;
    });
    return { submitted, notSubmitted, graded, total: students.length };
  };

  // --- When opening the modal, reset submissionFinalized and make all rows editable ---
  useEffect(() => {
    if (showSubmissionTracking) {
      setSubmissionFinalized(false);
      // Make all rows editable at first
      if (selectedHomeworkForTracking) {
        const students = getAssignedStudents(selectedHomeworkForTracking);
        const editState = {};
        students.forEach(s => { editState[s.id] = true; });
        setEditSubmissionMode(editState);
      }
    }
  }, [showSubmissionTracking, selectedHomeworkForTracking]);

  // In UploadHomework component state:
  // Add a handler to update status for selectedHomework
  const handleStatusChange = (status) => {
    if (!selectedHomework) return;
    setPreviousHomework((prev) =>
      prev.map((hw) =>
        hw.id === selectedHomework.id ? { ...hw, status } : hw
      )
    );
    setSelectedHomework((prev) => prev ? { ...prev, status } : prev);
  };

  return (
    <View style={styles.container}>
      <Header title="Upload Homework" showBack={true} />
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
        bounces={true}
      >
      <View style={styles.content}>
          {/* Class/Subject Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Class & Subject</Text>
            <Text style={styles.sectionSubtitle}>Choose the class and subject to upload homework</Text>
            
            <View style={styles.classGrid}>
              {TEACHER_ASSIGNMENTS.map((assignment) => (
                <View key={assignment.id} style={styles.classCard}>
                  <Text style={styles.classTitle}>{assignment.class}</Text>
                  <Text style={styles.subjectCount}>{assignment.subjects.length} subject(s)</Text>
                  <View style={styles.subjectsList}>
                    {assignment.subjects.map((subject, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.subjectButton}
                        onPress={() => handleSubjectSelect(subject, assignment.class)}
                      >
                        <Ionicons name="book" size={16} color="#1976d2" />
                        <Text style={styles.subjectText}>{subject}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Previous Homework */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Previous Homework</Text>
            <Text style={styles.sectionSubtitle}>View and manage previously uploaded homework</Text>
            
            {sortHomeworkByDate(previousHomework).map((homework) => (
              <View key={homework.id} style={styles.homeworkItem}>
                <View style={styles.homeworkHeader}>
                  <Text style={styles.homeworkTitle}>{homework.title}</Text>
                  <View style={{
                    backgroundColor: homework.status === 'active' ? '#4CAF50' : '#FF9800',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 12,
                    marginLeft: 8,
                  }}>
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>{homework.status === 'active' ? 'Active' : 'Completed'}</Text>
                  </View>
                </View>
                <Text style={styles.homeworkSubject}>{homework.subject} - {homework.class}</Text>
                <Text style={styles.homeworkDescription}>{homework.description}</Text>
                
                {/* Files count */}
                {homework.files && homework.files.length > 0 && (
                  <View style={styles.filesInfo}>
                    <Ionicons name="document" size={14} color="#666" />
                    <Text style={styles.filesText}>{homework.files.length} file(s) attached</Text>
                  </View>
                )}
                
                <View style={styles.homeworkFooter}>
                  <Text style={styles.dueDate}>
                    Due: {homework.dueDate ? (() => { const [y, m, d] = homework.dueDate.split('-'); return `${d}-${m}-${y}`; })() : 'N/A'}
                  </Text>
                  <Text style={styles.submissionCount}>
                    {(() => {
                      const students = getAssignedStudents(homework);
                      const stats = getManualSubmissionStats(students);
                      return `${stats.submitted}/${stats.total} submitted`;
                    })()}
        </Text>
      </View>
                <View style={styles.homeworkActions}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleViewHomework(homework)}
                  >
                    <Ionicons name="eye" size={16} color="#1976d2" />
                    <Text style={styles.actionText}>View</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleEditHomework(homework)}
                  >
                    <Ionicons name="pencil" size={16} color="#FF9800" />
                    <Text style={styles.actionText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleDownloadFiles(homework)}
                  >
                    <Ionicons name="download" size={16} color="#4CAF50" />
                    <Text style={styles.actionText}>Download</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleDeleteHomework(homework.id)}
                  >
                    <Ionicons name="trash" size={16} color="#F44336" />
                    <Text style={styles.actionText}>Delete</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleSubmissionTracking(homework)}
                  >
                    <Ionicons name="analytics" size={16} color="#9C27B0" />
                    <Text style={styles.actionText}>Track</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

             {/* Homework Upload Modal */}
       <Modal visible={showHomeworkModal} animationType="slide" transparent>
         <View style={styles.modalOverlay}>
           <View style={styles.modalContent}>
             <View style={styles.modalHeader}>
               <Text style={styles.modalTitle}>Upload Homework</Text>
               <TouchableOpacity onPress={() => setShowHomeworkModal(false)}>
                 <Ionicons name="close" size={24} color="#666" />
               </TouchableOpacity>
             </View>
             
             <ScrollView 
               style={styles.modalScroll} 
               showsVerticalScrollIndicator={true}
               contentContainerStyle={styles.modalScrollContent}
               nestedScrollEnabled={true}
               keyboardShouldPersistTaps="handled"
               bounces={true}
             >
               <Text style={styles.modalSubtitle}>{selectedClass} - {selectedSubject}</Text>
               
               <Text style={styles.inputLabel}>Homework Title *</Text>
               <TextInput
                 style={styles.textInput}
                 value={homeworkDetails.title}
                 onChangeText={(text) => setHomeworkDetails({...homeworkDetails, title: text})}
                 placeholder="Enter homework title"
               />
               
               <Text style={styles.inputLabel}>Description *</Text>
               <TextInput
                 style={[styles.textInput, styles.textArea]}
                 value={homeworkDetails.description}
                 onChangeText={(text) => setHomeworkDetails({...homeworkDetails, description: text})}
                 placeholder="Enter homework description"
                 multiline
                 numberOfLines={3}
               />
               
               <Text style={styles.inputLabel}>Due Date *</Text>
               <TouchableOpacity
                 style={styles.dateInput}
                 onPress={() => setShowDueDatePicker(true)}
               >
                 <Text style={styles.dateText}>
                   {homeworkDetails.dueDate
                     ? (() => { const [y, m, d] = homeworkDetails.dueDate.split('-'); return `${d}-${m}-${y}`; })()
                     : 'Select Due Date'}
                 </Text>
                 <Ionicons name="calendar" size={20} color="#666" />
               </TouchableOpacity>
               
               <Text style={styles.inputLabel}>Additional Instructions</Text>
               <TextInput
                 style={[styles.textInput, styles.textArea]}
                 value={homeworkDetails.instructions}
                 onChangeText={(text) => setHomeworkDetails({...homeworkDetails, instructions: text})}
                 placeholder="Enter additional instructions (optional)"
                 multiline
                 numberOfLines={3}
               />
               
               <Text style={styles.inputLabel}>Upload Files</Text>
               
               {/* Upload Options */}
               <View style={styles.uploadOptions}>
                 <TouchableOpacity style={styles.uploadOptionButton} onPress={handleFileUpload}>
                   <Ionicons name="document" size={20} color="#1976d2" />
                   <Text style={styles.uploadOptionText}>Documents</Text>
                 </TouchableOpacity>
                 <TouchableOpacity style={styles.uploadOptionButton} onPress={handleImageUpload}>
                   <Ionicons name="image" size={20} color="#4CAF50" />
                   <Text style={styles.uploadOptionText}>Images</Text>
                 </TouchableOpacity>
               </View>
               
               {/* Uploaded Files List */}
               {homeworkDetails.files.length > 0 && (
                 <View style={styles.uploadedFilesContainer}>
                   <Text style={styles.uploadedFilesTitle}>Uploaded Files ({homeworkDetails.files.length})</Text>
                   {homeworkDetails.files.map((file) => (
                     <View key={file.id} style={styles.fileItem}>
                       <View style={styles.fileInfo}>
                         <Ionicons name={getFileIcon(file.type)} size={20} color="#1976d2" />
                         <View style={styles.fileDetails}>
                           <Text style={styles.fileName}>{file.name}</Text>
                           <Text style={styles.fileSize}>{formatFileSize(file.size)}</Text>
                         </View>
                       </View>
                       <TouchableOpacity 
                         style={styles.removeFileButton}
                         onPress={() => handleRemoveFile(file.id)}
                       >
                         <Ionicons name="close-circle" size={20} color="#F44336" />
                       </TouchableOpacity>
                     </View>
                   ))}
                 </View>
               )}
               
               <Text style={styles.inputLabel}>Assign to Students</Text>
               <TouchableOpacity
                 style={styles.studentSelectButton}
                 onPress={() => setShowStudentSelection(true)}
               >
                 <Text style={styles.studentSelectText}>
                   {homeworkDetails.assignedStudents.length > 0 
                     ? `${homeworkDetails.assignedStudents.length} student(s) selected`
                     : 'Select students (default: entire class)'
                   }
                 </Text>
                 <Ionicons name="chevron-down" size={20} color="#666" />
               </TouchableOpacity>
               
               {/* Add some padding at the bottom for better scrolling */}
               <View style={{ height: 20 }} />
             </ScrollView>
             
             <View style={styles.modalFooter}>
               <TouchableOpacity
                 style={styles.cancelButton}
                 onPress={() => setShowHomeworkModal(false)}
               >
                 <Text style={styles.cancelButtonText}>Cancel</Text>
               </TouchableOpacity>
               <TouchableOpacity
                 style={styles.submitButton}
                 onPress={handleSubmitHomework}
               >
                 <Text style={styles.submitButtonText}>Upload Homework</Text>
               </TouchableOpacity>
             </View>
           </View>
         </View>
       </Modal>

             {/* Date Picker */}
       {showDatePicker && (
         <DateTimePicker
           value={new Date()}
           mode="date"
           display="default"
           onChange={(event, selectedDate) => {
             setShowDatePicker(false);
             if (selectedDate && event.type !== 'dismissed') {
               const day = selectedDate.getDate().toString().padStart(2, '0');
               const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
               const year = selectedDate.getFullYear();
               const dateStr = `${day}-${month}-${year}`;
               
               // Update the appropriate state based on current mode
               if (showEditHomework) {
                 setEditHomeworkData({...editHomeworkData, dueDate: dateStr});
               } else {
                 setHomeworkDetails({...homeworkDetails, dueDate: dateStr});
               }
             }
           }}
         />
       )}

       {/* Homework Details Modal */}
       <Modal visible={showHomeworkDetails} animationType="slide" transparent>
         <View style={styles.modalOverlay}>
           <View style={styles.modalContent}>
             <View style={styles.modalHeader}>
               <Text style={styles.modalTitle}>Homework Details</Text>
               <TouchableOpacity onPress={() => setShowHomeworkDetails(false)}>
                 <Ionicons name="close" size={24} color="#666" />
               </TouchableOpacity>
             </View>
             
             <ScrollView 
               style={styles.modalScroll} 
               showsVerticalScrollIndicator={true}
               nestedScrollEnabled={true}
               keyboardShouldPersistTaps="handled"
               bounces={true}
             >
               {selectedHomework && (
                 <>
                   {/* Status Toggle */}
                   <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, justifyContent: 'center' }}>
                     <Text style={{ fontWeight: 'bold', marginRight: 12 }}>Status:</Text>
                     <TouchableOpacity
                       style={{
                         backgroundColor: selectedHomework.status === 'active' ? '#4CAF50' : '#f0f0f0',
                         paddingVertical: 6,
                         paddingHorizontal: 16,
                         borderRadius: 16,
                         marginRight: 8,
                       }}
                       onPress={() => handleStatusChange('active')}
                     >
                       <Text style={{ color: selectedHomework.status === 'active' ? '#fff' : '#333', fontWeight: 'bold' }}>Active</Text>
                     </TouchableOpacity>
                     <TouchableOpacity
                       style={{
                         backgroundColor: selectedHomework.status === 'completed' ? '#FF9800' : '#f0f0f0',
                         paddingVertical: 6,
                         paddingHorizontal: 16,
                         borderRadius: 16,
                       }}
                       onPress={() => handleStatusChange('completed')}
                     >
                       <Text style={{ color: selectedHomework.status === 'completed' ? '#fff' : '#333', fontWeight: 'bold' }}>Completed</Text>
                     </TouchableOpacity>
                   </View>
                   {/* Homework Name */}
                   <Text style={styles.detailTitle}>{selectedHomework.title}</Text>
                   {/* Description */}
                   <View style={styles.detailSection}>
                     <Text style={styles.sectionTitle}>Description</Text>
                     <Text style={styles.detailText}>{selectedHomework.description}</Text>
                   </View>
                   {/* Due Date */}
                   <View style={styles.detailSection}>
                     <Text style={styles.sectionTitle}>Due Date</Text>
                     <Text style={styles.detailText}>{formatDate(selectedHomework.dueDate)}</Text>
                   </View>
                   {/* Submissions */}
                   <View style={styles.detailSection}>
                     <Text style={styles.sectionTitle}>Submissions</Text>
                     <Text style={styles.detailText}>{selectedHomework.submissions}/{selectedHomework.totalStudents} students submitted</Text>
                   </View>
                   {/* Assigned Students */}
                   <View style={styles.detailSection}>
                     <Text style={styles.sectionTitle}>Assigned Students</Text>
                     <Text style={styles.detailText}>
                       {getStudentNames(selectedHomework.assignedStudents, selectedHomework.class).join(', ')}
                     </Text>
                   </View>
                   {/* Attached Files */}
                   {selectedHomework.files && selectedHomework.files.length > 0 && (
                     <View style={styles.detailSection}>
                       <Text style={styles.sectionTitle}>Attached Files</Text>
                       {selectedHomework.files.map((file) => (
                         <View key={file.id} style={styles.fileItem}>
                           <Ionicons name={getFileIcon(file.type)} size={16} color="#1976d2" />
                           <View style={styles.fileDetails}>
                             <Text style={styles.fileName}>{file.name}</Text>
                             <Text style={styles.fileSize}>{formatFileSize(file.size)}</Text>
                           </View>
                         </View>
                       ))}
                     </View>
                   )}
                   {/* Created Date */}
                   <View style={styles.detailSection}>
                     <Text style={styles.sectionTitle}>Created</Text>
                     <Text style={styles.detailText}>{new Date(selectedHomework.createdAt).toLocaleDateString()}</Text>
                   </View>
                 </>
               )}
             </ScrollView>
           </View>
         </View>
       </Modal>

       {/* Edit Homework Modal */}
       <Modal visible={showEditHomework} animationType="slide" transparent>
         <View style={styles.modalOverlay}>
           <View style={styles.modalContent}>
             <View style={styles.modalHeader}>
               <Text style={styles.modalTitle}>Edit Homework</Text>
               <TouchableOpacity onPress={() => setShowEditHomework(false)}>
                 <Ionicons name="close" size={24} color="#666" />
               </TouchableOpacity>
             </View>
             
             {selectedHomework && (
               <View style={styles.editHeaderInfo}>
                 <Text style={styles.editClassInfo}>{selectedHomework.subject} - {selectedHomework.class}</Text>
               </View>
             )}
             
             <ScrollView 
               style={styles.modalScroll} 
               showsVerticalScrollIndicator={true}
               nestedScrollEnabled={true}
               keyboardShouldPersistTaps="handled"
               bounces={true}
               contentContainerStyle={styles.modalScrollContent}
             >
               <Text style={styles.inputLabel}>Homework Title *</Text>
               <TextInput
                 style={styles.textInput}
                 value={editHomeworkData.title}
                 onChangeText={(text) => setEditHomeworkData({...editHomeworkData, title: text})}
                 placeholder="Enter homework title"
               />
               
               <Text style={styles.inputLabel}>Description *</Text>
               <TextInput
                 style={[styles.textInput, styles.textArea]}
                 value={editHomeworkData.description}
                 onChangeText={(text) => setEditHomeworkData({...editHomeworkData, description: text})}
                 placeholder="Enter homework description"
                 multiline
                 numberOfLines={3}
               />
               
               <Text style={styles.inputLabel}>Due Date *</Text>
               <TouchableOpacity
                 style={styles.dateInput}
                 onPress={() => setShowEditDueDatePicker(true)}
               >
                 <Text style={styles.dateText}>
                   {editHomeworkData.dueDate
                     ? (() => { const [y, m, d] = editHomeworkData.dueDate.split('-'); return `${d}-${m}-${y}`; })()
                     : 'Select Due Date'}
                 </Text>
                 <Ionicons name="calendar" size={20} color="#666" />
               </TouchableOpacity>
               {showEditDueDatePicker && (
                 <DateTimePicker
                   value={editHomeworkData.dueDate ? new Date(editHomeworkData.dueDate) : new Date()}
                   mode="date"
                   display="default"
                   onChange={(event, selectedDate) => {
                     setShowEditDueDatePicker(false);
                     if (selectedDate) {
                       const dd = String(selectedDate.getDate()).padStart(2, '0');
                       const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
                       const yyyy = selectedDate.getFullYear();
                       setEditHomeworkData({ ...editHomeworkData, dueDate: `${yyyy}-${mm}-${dd}` });
                     }
                   }}
                 />
               )}
               
               <Text style={styles.inputLabel}>Instructions</Text>
               <TextInput
                 style={[styles.textInput, styles.textArea]}
                 value={editHomeworkData.instructions}
                 onChangeText={(text) => setEditHomeworkData({...editHomeworkData, instructions: text})}
                 placeholder="Enter additional instructions"
                 multiline
                 numberOfLines={3}
               />
               
               {/* File Upload Section */}
               <Text style={styles.inputLabel}>Files</Text>
               
               {/* Current Files */}
               {editHomeworkData.files && editHomeworkData.files.length > 0 && (
                 <View style={styles.detailSection}>
                   <Text style={styles.sectionSubtitle}>Current Files</Text>
                   {editHomeworkData.files.map((file) => (
                     <View key={file.id} style={styles.fileItem}>
                       <Ionicons name={getFileIcon(file.type)} size={16} color="#1976d2" />
                       <View style={styles.fileDetails}>
                         <Text style={styles.fileName}>{file.name}</Text>
                         <Text style={styles.fileSize}>{formatFileSize(file.size)}</Text>
                       </View>
                       <TouchableOpacity
                         style={styles.removeFileButton}
                         onPress={() => {
                           const updatedFiles = editHomeworkData.files.filter(f => f.id !== file.id);
                           setEditHomeworkData({...editHomeworkData, files: updatedFiles});
                         }}
                       >
                         <Ionicons name="close-circle" size={20} color="#f44336" />
                       </TouchableOpacity>
                     </View>
                   ))}
                 </View>
               )}
               
               {/* Add New Files */}
               <View style={styles.fileUploadSection}>
                 <Text style={styles.sectionSubtitle}>Add New Files</Text>
                 <View style={styles.fileUploadButtons}>
                   <TouchableOpacity
                     style={styles.uploadButton}
                     onPress={async () => {
                       try {
                         if (Platform.OS === 'web') {
                           const input = document.createElement('input');
                           input.type = 'file';
                           input.accept = '.pdf,.doc,.docx,.txt,.xls,.xlsx';
                           input.onchange = (event) => {
                             const file = event.target.files[0];
                             if (file) {
                               const newFile = {
                                 id: `file_${Date.now()}`,
                                 name: file.name,
                                 size: file.size,
                                 type: file.type,
                                 uri: URL.createObjectURL(file)
                               };
                               const currentFiles = editHomeworkData.files || [];
                               setEditHomeworkData({
                                 ...editHomeworkData,
                                 files: [...currentFiles, newFile]
                               });
                             }
                           };
                           input.click();
                         } else {
                           const result = await DocumentPicker.getDocumentAsync({
                             type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
                             copyToCacheDirectory: true,
                           });
                           
                           if (!result.canceled && result.assets && result.assets.length > 0) {
                             const file = result.assets[0];
                             const newFile = {
                               id: `file_${Date.now()}`,
                               name: file.name,
                               size: file.size,
                               type: file.mimeType,
                               uri: file.uri
                             };
                             const currentFiles = editHomeworkData.files || [];
                             setEditHomeworkData({
                               ...editHomeworkData,
                               files: [...currentFiles, newFile]
                             });
                           }
                         }
                       } catch (error) {
                         console.log('File upload error:', error);
                         Alert.alert('Error', 'Failed to upload file. Please try again.');
                       }
                     }}
                   >
                     <Ionicons name="document" size={20} color="#1976d2" />
                     <Text style={styles.uploadButtonText}>Upload Document</Text>
                   </TouchableOpacity>
                   
                   <TouchableOpacity
                     style={styles.uploadButton}
                     onPress={async () => {
                       try {
                         if (Platform.OS === 'web') {
                           const input = document.createElement('input');
                           input.type = 'file';
                           input.accept = 'image/*';
                           input.onchange = (event) => {
                             const file = event.target.files[0];
                             if (file) {
                               const newFile = {
                                 id: `file_${Date.now()}`,
                                 name: file.name,
                                 size: file.size,
                                 type: file.type,
                                 uri: URL.createObjectURL(file)
                               };
                               const currentFiles = editHomeworkData.files || [];
                               setEditHomeworkData({
                                 ...editHomeworkData,
                                 files: [...currentFiles, newFile]
                               });
                             }
                           };
                           input.click();
                         } else {
                           const result = await ImagePicker.launchImageLibraryAsync({
                             mediaTypes: ImagePicker.MediaTypeOptions.Images,
                             allowsEditing: true,
                             aspect: [4, 3],
                             quality: 0.8,
                             allowsMultipleSelection: false,
                           });
                           
                           if (!result.canceled && result.assets && result.assets.length > 0) {
                             const asset = result.assets[0];
                             const newFile = {
                               id: `file_${Date.now()}`,
                               name: `image_${Date.now()}.jpg`,
                               size: asset.fileSize || 1024000,
                               type: 'image/jpeg',
                               uri: asset.uri
                             };
                             const currentFiles = editHomeworkData.files || [];
                             setEditHomeworkData({
                               ...editHomeworkData,
                               files: [...currentFiles, newFile]
                             });
                           }
                         }
                       } catch (error) {
                         console.log('Image upload error:', error);
                         Alert.alert('Error', 'Failed to upload image. Please try again.');
                       }
                     }}
                   >
                     <Ionicons name="image" size={20} color="#4CAF50" />
                     <Text style={styles.uploadButtonText}>Upload Image</Text>
                   </TouchableOpacity>
                 </View>
               </View>
               
               {/* Student Assignment Section */}
               <Text style={styles.inputLabel}>Assigned Students</Text>
               <TouchableOpacity
                 style={styles.studentSelectionButton}
                 onPress={() => {
                   // Show student selection modal for edit
                   setShowStudentSelection(true);
                 }}
               >
                 <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                   <Ionicons name="people" size={16} color="#1976d2" style={{ marginRight: 8 }} />
                   <Text style={styles.studentSelectionText}>
                     {editHomeworkData.assignedStudents && editHomeworkData.assignedStudents.length > 0
                       ? `${editHomeworkData.assignedStudents.length} student(s) selected`
                       : 'Select students to assign homework'}
                   </Text>
                 </View>
                 <Ionicons name="chevron-down" size={20} color="#666" />
               </TouchableOpacity>
               
               {editHomeworkData.assignedStudents && editHomeworkData.assignedStudents.length > 0 && (
                 <View style={styles.selectedStudentsContainer}>
                   <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                     <Ionicons name="checkmark-circle" size={16} color="#4CAF50" style={{ marginRight: 6 }} />
                     <Text style={styles.selectedStudentsTitle}>Selected Students ({editHomeworkData.assignedStudents.length})</Text>
                   </View>
                   <Text style={styles.selectedStudentsList}>
                     {getStudentNames(editHomeworkData.assignedStudents, selectedHomework?.class || '').join(', ')}
                   </Text>
                 </View>
               )}
               
               {/* Add some padding at the bottom for better scrolling */}
               <View style={{ height: 20 }} />
             </ScrollView>
             
             <View style={styles.modalFooter}>
               <TouchableOpacity
                 style={styles.cancelButton}
                 onPress={() => setShowEditHomework(false)}
               >
                 <Text style={styles.cancelButtonText}>Cancel</Text>
               </TouchableOpacity>
               <TouchableOpacity
                 style={styles.submitButton}
                 onPress={handleSaveEditHomework}
               >
                 <Text style={styles.submitButtonText}>Save Changes</Text>
               </TouchableOpacity>
             </View>
           </View>
         </View>
       </Modal>

       {/* Submission Tracking Modal */}
       <Modal visible={showSubmissionTracking} animationType="slide" transparent>
         <View style={styles.modalOverlay}>
           <View style={styles.modalContent}>
             <View style={styles.modalHeader}>
               <Text style={styles.modalTitle}>Track Homework</Text>
               <TouchableOpacity onPress={() => setShowSubmissionTracking(false)}>
                 <Ionicons name="close" size={24} color="#666" />
               </TouchableOpacity>
             </View>
             
             <ScrollView 
               style={styles.modalScroll} 
               showsVerticalScrollIndicator={true}
               nestedScrollEnabled={true}
               keyboardShouldPersistTaps="handled"
               bounces={true}
               contentContainerStyle={{ paddingBottom: 20 }}
             >
               {selectedHomeworkForTracking && (
                 <>
                   <Text style={styles.detailTitle}>{selectedHomeworkForTracking.title}</Text>
                   <Text style={styles.detailSubject}>{selectedHomeworkForTracking.subject} - {selectedHomeworkForTracking.class}</Text>
                   
                   {/* Statistics Cards */}
                   {(() => {
                     const students = getAssignedStudents(selectedHomeworkForTracking);
                     const manualStats = getManualSubmissionStats(students);
                     const totalStudents = students.length;
                     const submissionRate = totalStudents > 0 ? Math.round((manualStats.submitted / totalStudents) * 100) : 0;
                     const gradingRate = totalStudents > 0 ? Math.round((manualStats.graded / totalStudents) * 100) : 0;
                     
                     return (
                       <View style={styles.statsContainer}>
                         <View style={styles.statCard}>
                           <Text style={styles.statNumber}>{submissionRate}%</Text>
                           <Text style={styles.statLabel}>Submission Rate</Text>
                         </View>
                         <View style={styles.statCard}>
                           <Text style={styles.statNumber}>{gradingRate}%</Text>
                           <Text style={styles.statLabel}>Grading Rate</Text>
                         </View>
                         <View style={styles.statCard}>
                           <Text style={styles.statNumber}>{manualStats.submitted}</Text>
                           <Text style={styles.statLabel}>Submitted</Text>
                         </View>
                         <View style={styles.statCard}>
                           <Text style={styles.statNumber}>{manualStats.notSubmitted}</Text>
                           <Text style={styles.statLabel}>Pending</Text>
                         </View>
                       </View>
                     );
                   })()}
                   
                   {/* Student Profile Blocks */}
                   <Text style={styles.sectionTitle}>Student Submissions</Text>
                   <View style={styles.studentBlocksContainer}>
                     {getAssignedStudents(selectedHomeworkForTracking).map((student) => {
                       const mark = submissionMark[student.id] || {};
                       const status = mark.status || 'not_submitted';
                       const grade = mark.grade || '';
                       
                       return (
                         <TouchableOpacity
                           key={student.id}
                           style={styles.studentBlock}
                           onPress={() => {
                             setSelectedStudent(student);
                             setSelectedStudentMark(mark);
                             setShowStudentPopup(true);
                           }}
                         >
                           <View style={styles.studentBlockHeader}>
                             <View style={styles.studentAvatar}>
                               <Text style={styles.avatarText}>
                                 {student.name.split(' ').map(n => n[0]).join('')}
                               </Text>
                             </View>
                             <View style={styles.studentBlockInfo}>
                               <Text style={styles.studentBlockName}>{student.name}</Text>
                               <Text style={styles.studentBlockRoll}>Roll No: {student.rollNo}</Text>
                             </View>
                             <View style={styles.studentBlockStatus}>
                               {status === 'submitted' ? (
                                 <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                               ) : (
                                 <Ionicons name="close-circle" size={24} color="#F44336" />
                               )}
                             </View>
                           </View>
                           <View style={styles.studentBlockFooter}>
                             <Text style={styles.studentBlockStatusText}>
                               {status === 'submitted' ? 'Submitted' : 'Not Submitted'}
                             </Text>
                             {grade && (
                               <Text style={[styles.studentBlockGrade, { color: getGradeColor(grade) }]}>
                                 Grade: {grade}
                               </Text>
                             )}
                           </View>
                         </TouchableOpacity>
                       );
                     })}
                   </View>
                 </>
               )}
             </ScrollView>
           </View>
         </View>
       </Modal>

       {/* Individual Student Popup */}
       <Modal visible={showStudentPopup} animationType="slide" transparent>
         <View style={styles.modalOverlay}>
           <View style={styles.studentPopupContent}>
             <View style={styles.studentPopupHeader}>
               <Text style={styles.studentPopupTitle}>Mark Student</Text>
               <TouchableOpacity onPress={() => setShowStudentPopup(false)}>
                 <Ionicons name="close" size={24} color="#666" />
               </TouchableOpacity>
             </View>
             
             {selectedStudent && (
               <>
                 <View style={styles.studentPopupInfo}>
                   <View style={styles.studentPopupAvatar}>
                     <Text style={styles.studentPopupAvatarText}>
                       {selectedStudent.name.split(' ').map(n => n[0]).join('')}
                     </Text>
                   </View>
                   <View style={styles.studentPopupDetails}>
                     <Text style={styles.studentPopupName}>{selectedStudent.name}</Text>
                     <Text style={styles.studentPopupRoll}>Roll No: {selectedStudent.rollNo}</Text>
                     <Text style={styles.studentPopupClass}>Class: {selectedHomeworkForTracking?.class}</Text>
                   </View>
                   <TouchableOpacity style={styles.editIconButton}>
                     <Ionicons name="pencil" size={20} color="#1976d2" />
                   </TouchableOpacity>
                 </View>
                 
                 <View style={styles.studentPopupSection}>
                   <Text style={styles.sectionTitle}>Submission Status</Text>
                   <View style={styles.studentPopupActions}>
                     <TouchableOpacity 
                       style={[styles.actionButton, { backgroundColor: selectedStudentMark.status === 'submitted' ? '#4CAF50' : '#e8f5e8' }]}
                       onPress={() => setSelectedStudentMark({...selectedStudentMark, status: 'submitted'})}
                     >
                       <Ionicons name="checkmark-circle" size={20} color={selectedStudentMark.status === 'submitted' ? '#fff' : '#4CAF50'} />
                       <Text style={[styles.actionButtonText, { color: selectedStudentMark.status === 'submitted' ? '#fff' : '#4CAF50' }]}>Mark Correct</Text>
                     </TouchableOpacity>
                     
                     <TouchableOpacity 
                       style={[styles.actionButton, { backgroundColor: selectedStudentMark.status === 'not_submitted' ? '#F44336' : '#ffebee' }]}
                       onPress={() => setSelectedStudentMark({...selectedStudentMark, status: 'not_submitted'})}
                     >
                       <Ionicons name="close-circle" size={20} color={selectedStudentMark.status === 'not_submitted' ? '#fff' : '#F44336'} />
                       <Text style={[styles.actionButtonText, { color: selectedStudentMark.status === 'not_submitted' ? '#fff' : '#F44336' }]}>Mark Wrong</Text>
                     </TouchableOpacity>
                   </View>
                 </View>
                 
                 <View style={styles.studentPopupSection}>
                   <Text style={styles.sectionTitle}>Grade Assignment</Text>
                   <View style={styles.studentPopupGrade}>
                     <Text style={styles.gradeLabel}>Select Grade:</Text>
                     <View style={styles.gradePickerContainer}>
                       <Picker
                         selectedValue={selectedStudentMark.grade || ''}
                         style={styles.gradePicker}
                         onValueChange={(value) => setSelectedStudentMark({...selectedStudentMark, grade: value})}
                       >
                         <Picker.Item label="Select Grade" value="" />
                         <Picker.Item label="A+" value="A+" />
                         <Picker.Item label="A" value="A" />
                         <Picker.Item label="B+" value="B+" />
                         <Picker.Item label="B" value="B" />
                         <Picker.Item label="C" value="C" />
                         <Picker.Item label="D" value="D" />
                         <Picker.Item label="F" value="F" />
                       </Picker>
                     </View>
                     {selectedStudentMark.grade && (
                       <View style={styles.gradeDisplay}>
                         <Text style={[styles.gradeText, { color: getGradeColor(selectedStudentMark.grade) }]}>
                           Grade: {selectedStudentMark.grade}
                         </Text>
                       </View>
                     )}
                   </View>
                 </View>
                 
                 <View style={styles.studentPopupFooter}>
                   <TouchableOpacity 
                     style={styles.cancelButton}
                     onPress={() => setShowStudentPopup(false)}
                   >
                     <Text style={styles.cancelButtonText}>Cancel</Text>
                   </TouchableOpacity>
                   <TouchableOpacity 
                     style={styles.submitButton}
                     onPress={() => {
                       setSubmissionMark(prev => ({
                         ...prev,
                         [selectedStudent.id]: selectedStudentMark
                       }));
                       setShowStudentPopup(false);
                       Alert.alert('Success', 'Student marked successfully!');
                     }}
                   >
                     <Text style={styles.submitButtonText}>Submit</Text>
                   </TouchableOpacity>
                 </View>
               </>
             )}
           </View>
         </View>
       </Modal>

       {/* Student Selection Modal */}
       <Modal visible={showStudentSelection} animationType="slide" transparent>
         <View style={styles.modalOverlay}>
           <View style={styles.modalContent}>
             <View style={styles.modalHeader}>
               <Text style={styles.modalTitle}>Assign to Students</Text>
               <TouchableOpacity onPress={() => setShowStudentSelection(false)}>
                 <Ionicons name="close" size={24} color="#666" />
               </TouchableOpacity>
             </View>
             
             <ScrollView 
               style={styles.modalScroll} 
               showsVerticalScrollIndicator={true}
               contentContainerStyle={styles.modalScrollContent}
               nestedScrollEnabled={true}
               keyboardShouldPersistTaps="handled"
               bounces={true}
             >
               <Text style={styles.modalSubtitle}>Class: {showEditHomework ? selectedHomework?.class : selectedClass}</Text>
               
               {/* Quick Actions */}
               <View style={styles.quickActions}>
                 <TouchableOpacity 
                   style={styles.quickActionButton}
                   onPress={handleSelectAllStudents}
                 >
                   <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                   <Text style={styles.quickActionText}>Select All</Text>
                 </TouchableOpacity>
                 <TouchableOpacity 
                   style={styles.quickActionButton}
                   onPress={handleClearAllStudents}
                 >
                   <Ionicons name="close-circle" size={16} color="#F44336" />
                   <Text style={styles.quickActionText}>Clear All</Text>
                 </TouchableOpacity>
               </View>
               
               <Text style={styles.studentListTitle}>Students in {showEditHomework ? selectedHomework?.class : selectedClass}</Text>
               
               {getStudentsForClass(showEditHomework ? selectedHomework?.class : selectedClass).map((student) => {
                 const isSelected = showEditHomework 
                   ? (editHomeworkData.assignedStudents || []).includes(student.id)
                   : homeworkDetails.assignedStudents.includes(student.id);
                 
                 return (
                   <TouchableOpacity
                     key={student.id}
                     style={[
                       styles.studentItem,
                       isSelected && styles.studentItemSelected
                     ]}
                     onPress={() => handleStudentSelection(student.id)}
                   >
                     <View style={styles.studentInfo}>
                       <View style={styles.studentAvatar}>
                         <Text style={styles.avatarText}>
                           {student.name.split(' ').map(n => n[0]).join('')}
                         </Text>
                       </View>
                       <View style={styles.studentDetails}>
                         <Text style={styles.studentName}>{student.name}</Text>
                         <Text style={styles.studentRoll}>Roll No: {student.rollNo}</Text>
                       </View>
                     </View>
                     <View style={styles.selectionIndicator}>
                       {isSelected ? (
                         <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                       ) : (
                         <Ionicons name="ellipse-outline" size={24} color="#ccc" />
                       )}
                     </View>
                   </TouchableOpacity>
                 );
               })}
               
               <View style={styles.selectionSummary}>
                 <Text style={styles.summaryText}>
                   {showEditHomework 
                     ? (editHomeworkData.assignedStudents || []).length 
                     : homeworkDetails.assignedStudents.length
                   } of {getStudentsForClass(showEditHomework ? selectedHomework?.class : selectedClass).length} students selected
                 </Text>
               </View>
               
               {/* Add some padding at the bottom for better scrolling */}
               <View style={{ height: 20 }} />
             </ScrollView>
             
             <View style={styles.modalFooter}>
               <TouchableOpacity
                 style={styles.cancelButton}
                 onPress={() => setShowStudentSelection(false)}
               >
                 <Text style={styles.cancelButtonText}>Cancel</Text>
               </TouchableOpacity>
               <TouchableOpacity
                 style={styles.submitButton}
                 onPress={() => setShowStudentSelection(false)}
               >
                 <Text style={styles.submitButtonText}>Confirm Selection</Text>
               </TouchableOpacity>
             </View>
           </View>
         </View>
       </Modal>

       {/* Due Date Picker */}
       {showDueDatePicker && (
         <DateTimePicker
           value={homeworkDetails.dueDate ? new Date(homeworkDetails.dueDate) : new Date()}
           mode="date"
           display="default"
           onChange={(event, selectedDate) => {
             setShowDueDatePicker(false);
             if (selectedDate) {
               const dd = String(selectedDate.getDate()).padStart(2, '0');
               const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
               const yyyy = selectedDate.getFullYear();
               setHomeworkDetails({ ...homeworkDetails, dueDate: `${yyyy}-${mm}-${dd}` });
             }
           }}
         />
       )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  classGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  classCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    width: '48%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  classTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 4,
  },
  subjectCount: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  subjectsList: {
    gap: 8,
  },
  subjectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  subjectText: {
    color: '#1976d2',
    fontWeight: '600',
    marginLeft: 6,
  },
  homeworkItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10, // reduced from 16
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  homeworkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  homeworkTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  homeworkSubject: {
    fontSize: 14,
    color: '#1976d2',
    marginBottom: 8,
  },
  homeworkDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  homeworkFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 2,
  },
  dueDate: {
    fontSize: 11, // smaller
    color: '#666',
    marginBottom: 2,
  },
  submissionCount: {
    fontSize: 11, // smaller
    color: '#888',
    marginBottom: 2,
  },
  homeworkActions: {
    flexDirection: 'row',
    flexWrap: 'wrap', // allow wrapping
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    paddingVertical: 4, // reduced
    paddingHorizontal: 8, // reduced
    marginRight: 6,
    marginBottom: 6, // add margin for wrapping
  },
  actionText: {
    fontSize: 12, // reduced
    marginLeft: 4,
    color: '#1976d2',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 8, // Reduced from 16 to 8 for a tighter look
    width: '90%',
    maxHeight: '98%', // Increased from 90% to 98% to use almost all vertical space
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
  modalScroll: {
    padding: 20,
    maxHeight: '100%', // Allow scroll area to use all available space
    paddingBottom: 0, // Reduced bottom padding
  },
  modalScrollContent: {
    paddingBottom: 0, // Reduced or removed excess bottom padding
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  dateInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  dateText: {
    fontSize: 14,
    color: '#333',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#1976d2',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 20,
    backgroundColor: '#f8f9fa',
  },
  uploadText: {
    color: '#1976d2',
    fontWeight: '600',
    marginLeft: 8,
  },
  studentSelectButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  studentSelectText: {
    fontSize: 14,
    color: '#333',
  },
  studentSelectionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  studentSelectionText: {
    fontSize: 14,
    color: '#333',
  },
  selectedStudentsContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  selectedStudentsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  selectedStudentsList: {
    fontSize: 14,
    color: '#333',
    lineHeight: 18,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 8, // Reduced from 20 to 8 for a smaller footer
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#1976d2',
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  // Student Selection Modal Styles
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  studentListTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  studentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  studentItemSelected: {
    backgroundColor: '#e8f5e8',
    borderColor: '#4CAF50',
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1976d2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  studentRoll: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  selectionIndicator: {
    marginLeft: 12,
  },
  selectionSummary: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976d2',
  },
  // File Upload Styles
  uploadOptions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  uploadOptionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  uploadOptionText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    color: '#333',
  },
  uploadedFilesContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  uploadedFilesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fileDetails: {
    marginLeft: 10,
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  fileSize: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  removeFileButton: {
    marginLeft: 10,
  },
  // Homework Management Styles
  filesInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  filesText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  detailSubject: {
    fontSize: 16,
    color: '#1976d2',
    marginBottom: 20,
  },
  detailSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  // Submission Tracking Styles
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    width: '48%',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statusSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  submissionCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  submissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  submissionDetails: {
    marginBottom: 8,
  },
  submissionTime: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  gradeSection: {
    marginBottom: 4,
  },
  gradeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  feedbackText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  submissionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  gradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  gradeButtonText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 4,
  },
  remindButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  remindButtonText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '600',
    marginLeft: 4,
  },
  editHeaderInfo: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  editClassInfo: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  studentBlockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1976d2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  studentBlockInfo: {
    flex: 1,
  },
  studentBlockName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  studentBlockRoll: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  studentBlockStatus: {
    marginLeft: 12,
  },
  studentBlockStatusText: {
    fontSize: 12,
    color: '#666',
  },
  studentBlockGrade: {
    fontSize: 14,
    fontWeight: '600',
  },
  studentBlockFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  studentPopupContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    padding: 20,
  },
  studentPopupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: 20,
  },
  studentPopupTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  studentPopupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  studentPopupAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1976d2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  studentPopupAvatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  studentPopupDetails: {
    flex: 1,
  },
  studentPopupName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  studentPopupRoll: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  studentPopupClass: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  studentPopupActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  studentPopupGrade: {
    marginBottom: 10,
  },
  gradeLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  gradePicker: {
    width: '100%',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  studentPopupFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  editClassInfo: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  studentBlocksContainer: {
    gap: 12,
  },
  studentBlock: {
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
  editIconButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
  studentPopupSection: {
    marginBottom: 20,
  },
  gradePickerContainer: {
    marginBottom: 10,
  },
  gradeDisplay: {
    marginTop: 5,
  },
});

export default UploadHomework; 