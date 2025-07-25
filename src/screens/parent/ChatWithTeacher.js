import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import { useRef, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';

// Mock teachers assigned to the child
const mockTeachers = [
  { id: 't1', name: 'Mrs. Sarah Johnson', subject: 'Mathematics' },
  { id: 't2', name: 'Mr. David Wilson', subject: 'English' },
  { id: 't3', name: 'Ms. Emily Brown', subject: 'Science' },
];

// Mock chat history per teacher
const mockChats = {
  t1: [
    { id: 'm1', sender: 'parent', text: 'Hello Mrs. Johnson!', timestamp: '09:00 AM' },
    { id: 'm2', sender: 'teacher', text: 'Hello! How can I help you?', timestamp: '09:01 AM' },
  ],
  t2: [
    { id: 'm1', sender: 'teacher', text: 'PTM is on Friday.', timestamp: '08:00 AM' },
    { id: 'm2', sender: 'parent', text: 'Thank you!', timestamp: '08:01 AM' },
  ],
  t3: [],
};

const ChatWithTeacher = () => {
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const flatListRef = useRef(null);

  // Reset teacher selection and messages on screen focus
  useFocusEffect(
    React.useCallback(() => {
      setSelectedTeacher(null);
      setMessages([]);
    }, [])
  );

  // Select a teacher and load chat
  const handleSelectTeacher = (teacher) => {
    setSelectedTeacher(teacher);
    setMessages(mockChats[teacher.id] || []);
  };

  // Send a message
  const handleSend = () => {
    if (!input.trim()) return;
    const newMsg = {
      id: 'm' + (messages.length + 1),
      sender: 'parent',
      text: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'text',
    };
    setMessages([...messages, newMsg]);
    setInput('');
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
        const newMsg = {
          id: 'm' + (messages.length + 1),
          sender: 'parent',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: isImage ? 'image' : 'file',
          uri: asset.uri,
          fileName: asset.fileName || asset.uri.split('/').pop(),
        };
        setMessages([...messages, newMsg]);
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
    return [...mockTeachers].sort((a, b) => {
      const aMsgs = mockChats[a.id] || [];
      const bMsgs = mockChats[b.id] || [];
      const aTime = aMsgs.length ? new Date('1970/01/01 ' + aMsgs[aMsgs.length - 1].timestamp) : new Date(0);
      const bTime = bMsgs.length ? new Date('1970/01/01 ' + bMsgs[bMsgs.length - 1].timestamp) : new Date(0);
      return bTime - aTime;
    });
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  }, [messages]);

  return (
    <View style={styles.container}>
      <Header title="Chat With Teacher" showBack={true} />
      {!selectedTeacher ? (
        <View style={styles.teacherListContainer}>
          <Text style={styles.sectionTitle}>Your Child's Teachers</Text>
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
});

export default ChatWithTeacher; 