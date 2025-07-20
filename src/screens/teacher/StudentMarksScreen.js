import React from 'react';
import { View, Text, StyleSheet, SectionList, TouchableOpacity } from 'react-native';

const mockExamMarks = [
  {
    exam: 'FA-1',
    data: [
      { subject: 'Math', marks: 18 },
      { subject: 'Science', marks: 19 },
      { subject: 'English', marks: 17 },
      { subject: 'Social', marks: 20 },
    ],
  },
  {
    exam: 'FA-2',
    data: [
      { subject: 'Math', marks: 20 },
      { subject: 'Science', marks: 18 },
      { subject: 'English', marks: 19 },
      { subject: 'Social', marks: 18 },
    ],
  },
  {
    exam: 'SEM-1',
    data: [
      { subject: 'Math', marks: 85 },
      { subject: 'Science', marks: 88 },
      { subject: 'English', marks: 82 },
      { subject: 'Social', marks: 90 },
    ],
  },
  {
    exam: 'FA-3',
    data: [
      { subject: 'Math', marks: 19 },
      { subject: 'Science', marks: 20 },
      { subject: 'English', marks: 18 },
      { subject: 'Social', marks: 19 },
    ],
  },
  {
    exam: 'FA-4',
    data: [
      { subject: 'Math', marks: 20 },
      { subject: 'Science', marks: 19 },
      { subject: 'English', marks: 20 },
      { subject: 'Social', marks: 20 },
    ],
  },
  {
    exam: 'SEM-2',
    data: [
      { subject: 'Math', marks: 90 },
      { subject: 'Science', marks: 92 },
      { subject: 'English', marks: 88 },
      { subject: 'Social', marks: 94 },
    ],
  },
];

const StudentMarksScreen = ({ navigation, route }) => {
  const { student } = route.params;
  // Assume each subject is out of 20 for FA, out of 100 for SEM
  const getExamTotals = (exam, data) => {
    let maxPerSubject = exam.startsWith('FA') ? 20 : 100;
    let total = data.reduce((sum, s) => sum + s.marks, 0);
    let maxTotal = data.length * maxPerSubject;
    let percent = maxTotal ? ((total / maxTotal) * 100).toFixed(2) : '0.00';
    return { total, maxTotal, percent };
  };
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Text style={styles.backText}>{'< Back'}</Text>
      </TouchableOpacity>
      <Text style={styles.title}>{student.name}'s Marks</Text>
      <SectionList
        sections={mockExamMarks}
        keyExtractor={(item, index) => item.subject + index}
        renderSectionHeader={({ section: { exam, data } }) => {
          const { total, maxTotal, percent } = getExamTotals(exam, data);
          return (
            <View>
              <Text style={styles.examHeader}>{exam}</Text>
              <Text style={styles.examSummary}>Total: {total} / {maxTotal}   |   Percentage: {percent}%</Text>
            </View>
          );
        }}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.subject}>{item.subject}</Text>
            <Text style={styles.marks}>{item.marks}</Text>
          </View>
        )}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  backBtn: { marginBottom: 12 },
  backText: { color: '#1976d2', fontWeight: 'bold', fontSize: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#222', marginBottom: 20, textAlign: 'center' },
  list: { paddingBottom: 20 },
  examHeader: { fontSize: 18, fontWeight: 'bold', color: '#1976d2', marginTop: 16, marginBottom: 8 },
  examSummary: { fontSize: 15, color: '#555', marginBottom: 4, marginLeft: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', padding: 14, borderRadius: 8, marginBottom: 8, elevation: 1 },
  subject: { fontSize: 16, color: '#333' },
  marks: { fontSize: 16, color: '#1976d2', fontWeight: 'bold' },
});

export default StudentMarksScreen; 