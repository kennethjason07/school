import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Dimensions, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';

const TeacherDetails = ({ route, navigation }) => {
  const { teacher } = route.params;
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#2196F3" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Teacher Details</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Name:</Text>
        <Text style={styles.value}>{teacher.name}</Text>
        {/* Salary and Education */}
        <Text style={styles.label}>Salary:</Text>
        <Text style={styles.value}>{teacher.salary ? `₹${parseFloat(teacher.salary).toFixed(2)}` : 'N/A'}</Text>
        <Text style={styles.label}>Education:</Text>
        <Text style={styles.value}>{teacher.qualification || 'N/A'}</Text>
        <Text style={styles.label}>Subjects Assigned for Classes:</Text>
        {teacher.classes.map((cls, idx) => (
          <View key={cls} style={styles.classRow}>
            <Text style={styles.className}>{cls}:</Text>
            <Text style={styles.subjectName}>{teacher.subjects[0]}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 48,
    minHeight: Platform.OS === 'web' ? '100vh' : Dimensions.get('window').height,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  backButton: {
    marginRight: 8,
    padding: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    padding: 20,
    maxWidth: 900,
    alignSelf: 'center',
    width: '100%',
    paddingTop: 12,
    paddingBottom: 32,
  },
  label: {
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: 12,
    marginBottom: 4,
    color: '#333',
  },
  value: {
    fontSize: 16,
    marginBottom: 12,
    color: '#444',
  },
  classRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  className: {
    fontSize: 15,
    color: '#2196F3',
    marginRight: 8,
    fontWeight: '600',
  },
  subjectName: {
    fontSize: 15,
    color: '#4CAF50',
    fontWeight: '600',
  },
});

export default TeacherDetails; 