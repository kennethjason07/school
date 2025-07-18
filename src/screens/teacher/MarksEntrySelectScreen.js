import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Mock data: flat, unique list of subjects
const SUBJECTS = ['Maths', 'Science', 'English'];

export default function MarksEntrySelectScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.title}>Select Subject</Text>
        {SUBJECTS.map(subj => (
          <TouchableOpacity
            key={subj}
            style={styles.subjectCard}
            onPress={() => navigation.navigate('MarksEntryStudentsScreen', { subject: subj })}
          >
            <Ionicons name="book" size={20} color="#1976d2" style={{ marginRight: 10 }} />
            <Text style={styles.subjectText}>{subj}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1976d2', marginBottom: 18 },
  subjectCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e3f2fd', borderRadius: 10, paddingHorizontal: 18, paddingVertical: 14, marginBottom: 14, elevation: 2 },
  subjectText: { color: '#1976d2', fontWeight: 'bold', fontSize: 17 },
}); 