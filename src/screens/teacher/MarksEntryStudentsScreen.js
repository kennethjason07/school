import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Mock data: all students
const MOCK_STUDENTS = [
  { id: 's1', name: 'Amit Sharma', roll: 1 },
  { id: 's2', name: 'Priya Singh', roll: 2 },
  { id: 's3', name: 'Rahul Verma', roll: 3 },
  { id: 's4', name: 'Sneha Gupta', roll: 4 },
  { id: 's5', name: 'Ravi Kumar', roll: 5 },
];

export default function MarksEntryStudentsScreen({ navigation, route }) {
  const { subject } = route.params;
  const students = MOCK_STUDENTS;
  const [marks, setMarks] = useState({});

  function handleMarkChange(studentId, value) {
    if (!/^\d*$/.test(value)) return;
    setMarks(m => ({ ...m, [studentId]: value }));
  }

  function handleSave() {
    for (let s of students) {
      if (!marks[s.id]) {
        Alert.alert('Validation Error', `Please enter marks for ${s.name}`);
        return;
      }
    }
    Alert.alert('Success', 'Marks saved successfully!');
    setMarks({});
  }

  // Summary statistics
  const allMarks = Object.values(marks).map(Number).filter(m => !isNaN(m));
  const avg = allMarks.length ? (allMarks.reduce((a, b) => a + b, 0) / allMarks.length).toFixed(1) : '-';
  const max = allMarks.length ? Math.max(...allMarks) : '-';
  const min = allMarks.length ? Math.min(...allMarks) : '-';

  return (
    <View style={styles.container}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, marginBottom: 8 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 10 }}>
          <Ionicons name="arrow-back" size={24} color="#1976d2" />
        </TouchableOpacity>
        <Text style={styles.title}>Marks Entry: {subject}</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Marks Entry Table */}
        <View style={styles.tableBox}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, { flex: 2 }]}>Student</Text>
            <Text style={styles.tableCell}>Roll</Text>
            <Text style={styles.tableCell}>Marks</Text>
          </View>
          {students.map(s => (
            <View key={s.id} style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 2 }]}>{s.name}</Text>
              <Text style={styles.tableCell}>{s.roll}</Text>
              <TextInput
                style={styles.marksInput}
                value={marks[s.id] || ''}
                onChangeText={v => handleMarkChange(s.id, v)}
                keyboardType="numeric"
                maxLength={3}
                placeholder="--"
              />
            </View>
          ))}
        </View>
        {/* Summary Stats */}
        <View style={styles.statsRowBox}>
          <Text style={styles.statsText}>Average: <Text style={styles.statsValue}>{avg}</Text></Text>
          <Text style={styles.statsText}>Highest: <Text style={styles.statsValue}>{max}</Text></Text>
          <Text style={styles.statsText}>Lowest: <Text style={styles.statsValue}>{min}</Text></Text>
        </View>
        {/* Save Button */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Ionicons name="save" size={20} color="#fff" style={{ marginRight: 6 }} />
          <Text style={styles.saveBtnText}>Save Marks</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1976d2', marginBottom: 8 },
  tableBox: { backgroundColor: '#fff', borderRadius: 10, marginTop: 10, marginBottom: 18, elevation: 2 },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#e0e0e0', backgroundColor: '#e3f2fd', borderTopLeftRadius: 10, borderTopRightRadius: 10 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#f0f0f0', alignItems: 'center' },
  tableCell: { flex: 1, padding: 10, fontSize: 15, color: '#333' },
  marksInput: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, padding: 6, width: 60, textAlign: 'center', fontSize: 15, backgroundColor: '#fafafa' },
  statsRowBox: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, marginBottom: 10 },
  statsText: { fontSize: 15, color: '#333' },
  statsValue: { fontWeight: 'bold', color: '#1976d2' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1976d2', borderRadius: 10, padding: 14, marginTop: 8, marginBottom: 18, alignSelf: 'center', elevation: 2 },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
}); 