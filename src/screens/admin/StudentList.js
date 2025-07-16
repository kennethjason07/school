import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import Header from '../../components/Header';
import { Ionicons } from '@expo/vector-icons';

const dummyStudents = [
  { id: 1, name: 'Emma Johnson', rollNo: 15, attendance: '92%', fee: 'Paid', phone: '+91 98765 43210', parent: 'Mr. John Johnson' },
  { id: 2, name: 'Michael Brown', rollNo: 16, attendance: '88%', fee: 'Unpaid', phone: '+91 98765 43211', parent: 'Mrs. Sarah Brown' },
  { id: 3, name: 'Sophia Davis', rollNo: 17, attendance: '95%', fee: 'Paid', phone: '+91 98765 43212', parent: 'Mr. Robert Davis' },
  { id: 4, name: 'William Wilson', rollNo: 18, attendance: '90%', fee: 'Paid', phone: '+91 98765 43213', parent: 'Mrs. Lisa Wilson' },
  { id: 5, name: 'Olivia Taylor', rollNo: 19, attendance: '87%', fee: 'Unpaid', phone: '+91 98765 43214', parent: 'Mr. James Taylor' },
];

const StudentList = ({ route, navigation }) => {
  const { className } = route.params;
  // In a real app, filter students by className
  const students = dummyStudents; // For now, show all dummy students

  const renderStudent = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('StudentDetails', { student: item })}>
      <View style={styles.avatar}><Ionicons name="person" size={28} color="#2196F3" /></View>
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.detail}>Roll No: {item.rollNo}</Text>
        <Text style={styles.detail}>Attendance: {item.attendance}</Text>
        <Text style={styles.detail}>Fee: {item.fee}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#999" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header title={`Students of ${className}`} showBack={true} />
      <FlatList
        data={students}
        renderItem={renderStudent}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  list: {
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e3f2fd',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  detail: {
    fontSize: 13,
    color: '#666',
    marginBottom: 1,
  },
});

export default StudentList; 