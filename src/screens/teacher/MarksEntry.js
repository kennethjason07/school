import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';

// Mock data: classes and their subjects
const MOCK_CLASSES = [
  { id: 'c1', name: '5A', subjects: ['Maths', 'Science'] },
  { id: 'c2', name: '6A', subjects: ['Maths', 'English'] },
];

export default function MarksEntry({ navigation }) {
  return (
    <View style={styles.container}>
      <Header title="Marks Entry" showBack={true} />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.title}>Select Class & Subject</Text>
      <Header title="Select Class & Subject" showBack={true} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {MOCK_CLASSES.map(cls => (
          <View key={cls.id} style={styles.classBox}>
            <Text style={styles.classTitle}>{cls.name}</Text>
            <View style={styles.subjectsRow}>
              {cls.subjects.map(subj => (
                <TouchableOpacity
                  key={subj}
                  style={styles.subjectCard}
                  onPress={() => navigation.navigate('MarksEntryStudentsScreen', { className: cls.name, subject: subj })}
                >
                  <Ionicons name="book" size={20} color="#1976d2" style={{ marginRight: 6 }} />
                  <Text style={styles.subjectText}>{subj}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scrollContent: {
    padding: 16,
    paddingTop: 24,
  },
  classBox: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 18, elevation: 2 },
  classTitle: { fontWeight: 'bold', color: '#388e3c', fontSize: 18, marginBottom: 8 },
  subjectsRow: { flexDirection: 'row', flexWrap: 'wrap' },
  subjectCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e3f2fd', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, marginRight: 10, marginBottom: 8, elevation: 1 },
  subjectText: { color: '#1976d2', fontWeight: 'bold', fontSize: 15 },
}); 