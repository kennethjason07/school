import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import Header from '../../components/Header';
import { Ionicons } from '@expo/vector-icons';
import { dbHelpers } from '../../utils/supabase';

const StudentList = ({ route, navigation }) => {
  const { classId } = route.params;
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await dbHelpers.getStudentsByClass(classId);
        if (error) throw error;
        setStudents(data || []);
      } catch (err) {
        setError('Failed to load students.');
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [classId]);

  const renderStudent = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('StudentDetails', { student: item })}>
      <View style={styles.avatar}><Ionicons name="person" size={28} color="#2196F3" /></View>
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.detail}>Roll No: {item.roll_no || 'N/A'}</Text>
        <Text style={styles.detail}>Attendance: -</Text>
        <Text style={styles.detail}>Fee: -</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#999" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Students" showBack={true} />
        <ActivityIndicator size="large" color="#2196F3" style={{ marginTop: 40 }} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Header title="Students" showBack={true} />
        <Text style={{ color: 'red', margin: 24 }}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Students" showBack={true} />
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