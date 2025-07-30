import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Dimensions, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator as PaperActivityIndicator } from 'react-native-paper';
import Header from '../../components/Header';
import { dbHelpers } from '../../utils/supabase';

const TeacherDetails = ({ route, navigation }) => {
  const { teacher } = route.params;
  const [teacherData, setTeacherData] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTeacherDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch teacher details (get all, then filter by id)
        const { data: teachers, error: teacherError } = await dbHelpers.getTeachers();
        if (teacherError) throw teacherError;
        // Use correct column names from schema.txt
        // teachers table: id, name, qualification, age, salary_type, salary_amount, address, is_class_teacher, assigned_class_id
        const t = teachers.find(t => t.id === teacher.id);
        setTeacherData(t);
        // Fetch teacher subjects/classes
        const { data: teacherSubjects, error: tsError } = await dbHelpers.getTeacherSubjects(teacher.id);
        if (tsError) throw tsError;
        setSubjects(teacherSubjects?.map(ts => ts.subjects?.name || '').filter(Boolean) || []);
        setClasses(teacherSubjects?.map(ts => ts.classes?.class_name || '').filter(Boolean) || []);
      } catch (err) {
        setError('Failed to load teacher details.');
      } finally {
        setLoading(false);
      }
    };
    fetchTeacherDetails();
  }, [teacher.id]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Teacher Details" showBack={true} />
        <PaperActivityIndicator animating={true} size="large" color="#2196F3" style={{ marginTop: 40 }} />
      </View>
    );
  }

  if (error || !teacherData) {
    return (
      <View style={styles.container}>
        <Header title="Teacher Details" showBack={true} />
        <Text style={{ color: 'red', margin: 24 }}>{error || 'No data found.'}</Text>
      </View>
    );
  }

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
        <Text style={styles.value}>{teacherData?.name || 'N/A'}</Text>
        {/* Salary and Education */}
        <Text style={styles.label}>Salary:</Text>
        <Text style={styles.value}>{teacherData?.salary_amount ? `₹${parseFloat(teacherData.salary_amount).toFixed(2)}` : 'N/A'}</Text>
        <Text style={styles.label}>Education:</Text>
        <Text style={styles.value}>{teacherData?.qualification || 'N/A'}</Text>
        <Text style={styles.label}>Subjects Assigned for Classes:</Text>
        {classes.length > 0 ? classes.map((cls, idx) => (
          <View key={cls + idx} style={styles.classRow}>
            <Text style={styles.className}>{cls}:</Text>
            <Text style={styles.subjectName}>{subjects[idx] || '-'}</Text>
          </View>
        )) : <Text style={styles.value}>No assignments</Text>}
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