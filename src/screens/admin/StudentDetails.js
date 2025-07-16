import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Header from '../../components/Header';

const StudentDetails = ({ route }) => {
  const { student } = route.params;
  // Dummy data for fee and phone
  const feeStatus = 'Paid';
  const phoneNumber = '+91 98765 43210';

  return (
    <View style={styles.container}>
      <Header title="Student Details" showBack={true} />
      <View style={styles.card}>
        <Text style={styles.name}>{student.name}</Text>
        <Text style={styles.detail}>Class: {student.class}</Text>
        <Text style={styles.detail}>Roll No: {student.rollNo}</Text>
        <Text style={styles.detail}>Attendance: {student.attendance}</Text>
        <Text style={styles.detail}>Fee Status: {feeStatus}</Text>
        <Text style={styles.detail}>Phone: {phoneNumber}</Text>
        <Text style={styles.detail}>Parent: {student.parent}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    margin: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 12,
  },
  detail: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
});

export default StudentDetails; 