import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import { useRef } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { dbHelpers } from '../../utils/supabase';

const ChatWithTeacher = () => {
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const flatListRef = useRef(null);
  const { user } = useAuth();

  // Fetch teachers and chat data
  const fetchTeachersAndChats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get parent data
      const parentData = await dbHelpers.read('parents', { user_id: user.id });
      if (!parentData || parentData.length === 0) {
        throw new Error('Parent data not found');
      }
      const parent = parentData[0];

      // Get student data
      const studentData = await dbHelpers.getStudentById(parent.student_id);
      if (!studentData) {
        throw new Error('Student data not found');
      }

      // Get teachers for the student's class
      const classTeachers = await dbHelpers.getTeacherSubjects(studentData.class_id);
      
      // Get chat messages for the parent
      const chatMessages = await dbHelpers.read('chat_messages', { 
        parent_id: parent.id 
      });

      // Organize messages by teacher
      const messagesByTeacher = {};
      chatMessages.forEach(msg => {
        if (!messagesByTeacher[msg.teacher_id]) {
          messagesByTeacher[msg.teacher_id] = [];
        }
        messagesByTeacher[msg.teacher_id].push({
          id: msg.id,
          sender: msg.sender_type,
          text: msg.message,
          timestamp: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: msg.message_type || 'text',
          uri: msg.attachment_url,
          fileName: msg.file_name,
          created_at: msg.created_at
        });
      });

      // Sort messages by timestamp
      Object.keys(messagesByTeacher).forEach(teacherId => {
        messagesByTeacher[teacherId].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      });

      // Combine teacher data with their messages
      const teachersWithChats = classTeachers.map(teacher => ({
        id: teacher.teacher_id,
        name: teacher.teacher_name,
        subject: teacher.subject_name,
        messages: messagesByTeacher[teacher.teacher_id] || []
      }));

      setTeachers(teachersWithChats);
    } catch (err) {
      console.error('Error fetching teachers and chats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Reset teacher selection and messages on screen focus
  useFocusEffect(
    React.useCallback(() => {
      setSelectedTeacher(null);
      setMessages([]);
      fetchTeachersAndChats();
    }, [])
  );

  // Select a teacher and load chat
  const handleSelectTeacher = (teacher) => {
    setSelectedTeacher(teacher);
    setMessages(teacher.messages || []);
  };

  // Send a message
  const handleSend = async () => {
    if (!input.trim() || !selectedTeacher) return;
    
    try {
      const newMsg = {
        id: Date.now().toString(),
        sender: 'parent',
        text: input,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'text',
        created_at: new Date().toISOString()
      };

      // Add message to local state immediately for better UX
      setMessages(prev => [...prev, newMsg]);
      setInput('');

      // Save message to database
      const parentData = await dbHelpers.read('parents', { user_id: user.id });
      const parent = parentData[0];

      await dbHelpers.create('chat_messages', {
        parent_id: parent.id,
        teacher_id: selectedTeacher.id,
        message: input,
        sender_type: 'parent',
        message_type: 'text',
        created_at: new Date().toISOString()
      });

    } catch (err) {
      console.error('Error sending message:', err);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    }
  };

  // Attachment handler
  const handleAttach = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access media library is required!');
        return;
      }
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
        quality: 1,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const isImage = asset.type && asset.type.startsWith('image');
        
        // For now, we'll just show the file in the chat
        // In a real app, you'd upload the file to storage and get a URL
        const newMsg = {
          id: Date.now().toString(),
          sender: 'parent',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: isImage ? 'image' : 'file',
          uri: asset.uri,
          fileName: asset.fileName || asset.uri.split('/').pop(),
          created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, newMsg]);
      }
    } catch (e) {
      alert('Failed to pick file: ' + e.message);
    }
  };

  // Go back to teacher list
  const handleBack = () => {
    setSelectedTeacher(null);
    setMessages([]);
  };

  // Sort teachers by most recent chat (latest message timestamp)
  const getSortedTeachers = () => {
    return [...teachers].sort((a, b) => {
      const aMsgs = a.messages || [];
      const bMsgs = b.messages || [];
      const aTime = aMsgs.length ? new Date(aMsgs[aMsgs.length - 1].created_at) : new Date(0);
      const bTime = bMsgs.length ? new Date(bMsgs[bMsgs.length - 1].created_at) : new Date(0);
      return bTime - aTime;
    });
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  }, [messages]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Chat With Teacher" showBack={true} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1976d2" />
          <Text style={styles.loadingText}>Loading teachers...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Header title="Chat With Teacher" showBack={true} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchTeachersAndChats}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Chat With Teacher" showBack={true} />
      {!selectedTeacher ? (
        <View style={styles.teacherListContainer}>
          <Text style={styles.sectionTitle}>Your Child's Teachers</Text>
          {teachers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No teachers found for your child's class.</Text>
            </View>
          ) : (
            <FlatList
              data={getSortedTeachers()}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.teacherCard} onPress={() => handleSelectTeacher(item)}>
                  <Ionicons name="person-circle" size={36} color="#1976d2" style={{ marginRight: 12 }} />
                  <View>
                    <Text style={styles.teacherName}>{item.name}</Text>
                    <Text style={styles.teacherSubject}>{item.subject}</Text>
                  </View>
                  <Ionicons name="chatbubbles" size={22} color="#9c27b0" style={{ marginLeft: 'auto' }} />
                </TouchableOpacity>
              )}
              contentContainerStyle={{ padding: 16 }}
            />
          )}
        </View>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={80}
        >
          <View style={styles.chatHeader}>
            <TouchableOpacity onPress={handleBack} style={{ marginRight: 10 }}>
              <Ionicons name="arrow-back" size={24} color="#1976d2" />
            </TouchableOpacity>
            <Ionicons name="person-circle" size={32} color="#1976d2" style={{ marginRight: 8 }} />
            <View>
              <Text style={styles.teacherName}>{selectedTeacher.name}</Text>
              <Text style={styles.teacherSubject}>{selectedTeacher.subject}</Text>
            </View>
          </View>
          <FlatList
            ref={flatListRef}
            data={[...messages]}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={[styles.messageRow, item.sender === 'parent' ? styles.messageRight : styles.messageLeft]}>
                <View style={[styles.messageBubble, item.sender === 'parent' ? styles.bubbleParent : styles.bubbleTeacher]}>
                  {item.type === 'image' && (
                    <Image source={{ uri: item.uri }} style={styles.chatImage} />
                  )}
                  {item.type === 'file' && (
                    <View style={styles.fileRow}>
                      <Ionicons name="document" size={20} color="#1976d2" style={{ marginRight: 6 }} />
                      <Text style={styles.fileName}>{item.fileName}</Text>
                    </View>
                  )}
                  {(!item.type || item.type === 'text') && (
                    <Text style={styles.messageText}>{item.text}</Text>
                  )}
                  <Text style={styles.messageTime}>{item.timestamp}</Text>
                </View>
              </View>
            )}
            contentContainerStyle={styles.chatList}
          />
          <View style={styles.inputRow}>
            <TouchableOpacity style={styles.attachBtn} onPress={handleAttach}>
              <Ionicons name="attach" size={22} color="#1976d2" />
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              value={input}
              onChangeText={setInput}
              onSubmitEditing={handleSend}
              returnKeyType="send"
            />
            <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
              <Ionicons name="send" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  teacherListContainer: { flex: 1 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1976d2', margin: 16 },
  teacherCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 12, elevation: 2 },
  teacherName: { fontSize: 16, fontWeight: 'bold', color: '#222' },
  teacherSubject: { fontSize: 14, color: '#666' },
  chatHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderBottomWidth: 1, borderColor: '#eee' },
  chatList: { flexGrow: 1, justifyContent: 'flex-end', padding: 16 },
  messageRow: { flexDirection: 'row', marginBottom: 10 },
  messageLeft: { justifyContent: 'flex-start' },
  messageRight: { justifyContent: 'flex-end' },
  messageBubble: { maxWidth: '75%', padding: 12, borderRadius: 16 },
  bubbleParent: { backgroundColor: '#e3f2fd', alignSelf: 'flex-end' },
  bubbleTeacher: { backgroundColor: '#f1f8e9', alignSelf: 'flex-start' },
  messageText: { fontSize: 15, color: '#222' },
  messageTime: { fontSize: 11, color: '#888', marginTop: 4, textAlign: 'right' },
  inputRow: { flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#eee' },
  attachBtn: { marginRight: 8 },
  input: { flex: 1, backgroundColor: '#f5f5f5', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, fontSize: 15, marginRight: 8 },
  sendBtn: { backgroundColor: '#1976d2', borderRadius: 20, padding: 10 },
  chatImage: {
    width: 160,
    height: 120,
    borderRadius: 10,
    marginBottom: 6,
    backgroundColor: '#eee',
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  fileName: {
    fontSize: 14,
    color: '#1976d2',
    textDecorationLine: 'underline',
    maxWidth: 120,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#1976d2',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default ChatWithTeacher; 