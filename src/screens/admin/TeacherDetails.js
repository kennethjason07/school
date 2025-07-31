import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Dimensions,
  TouchableOpacity,
  Alert
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { ActivityIndicator as PaperActivityIndicator } from 'react-native-paper';
import Header from '../../components/Header';
import { dbHelpers } from '../../utils/supabase';

const { width } = Dimensions.get('window');

const TeacherDetails = ({ route, navigation }) => {
  const { teacher } = route.params;
  const [teacherData, setTeacherData] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [classTeacherOf, setClassTeacherOf] = useState(null);
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
        const t = teachers.find(t => t.id === teacher.id);
        setTeacherData(t);
        // Fetch teacher subjects/classes
        const { data: teacherSubjects, error: tsError } = await dbHelpers.getTeacherSubjects(teacher.id);
        if (tsError) throw tsError;

        // Fetch class teacher info
        const { data: classTeacherData, error: ctError } = await dbHelpers.read('classes', { class_teacher_id: teacher.id });
        if (ctError) throw ctError;
        if (classTeacherData && classTeacherData.length > 0) {
          setClassTeacherOf(classTeacherData[0]);
        }

        // Deduplicate subject-class combinations
        const subjectClassPairs = new Set();
        const dedupedSubjects = [];
        const dedupedClasses = [];
        teacherSubjects?.forEach(ts => {
          const subjectName = ts.subjects?.name || '';
          const className = ts.classes?.class_name || '';
          const key = `${subjectName}|${className}`;
          if (subjectName && className && !subjectClassPairs.has(key)) {
            subjectClassPairs.add(key);
            dedupedSubjects.push(subjectName);
            dedupedClasses.push(className);
          }
        });

        setSubjects(dedupedSubjects);
        setClasses(dedupedClasses);
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
      <Header title="Teacher Profile" showBack={true} />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Header Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <MaterialIcons name="person" size={48} color="#fff" />
            </View>
            <View style={styles.onlineIndicator} />
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.teacherName}>{teacherData?.name || 'N/A'}</Text>
            <Text style={styles.teacherRole}>
              {classTeacherOf ? `Class Teacher - ${classTeacherOf.class_name}` : 'Subject Teacher'}
            </Text>

            {/* Quick Stats */}
            <View style={styles.quickStats}>
              <View style={styles.statItem}>
                <MaterialIcons name="class" size={20} color="#2196F3" />
                <Text style={styles.statNumber}>{classes.length}</Text>
                <Text style={styles.statLabel}>Classes</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <MaterialIcons name="book" size={20} color="#4CAF50" />
                <Text style={styles.statNumber}>{subjects.length}</Text>
                <Text style={styles.statLabel}>Subjects</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <MaterialIcons name="account_balance_wallet" size={20} color="#FF9800" />
                <Text style={styles.statNumber}>
                  {teacherData?.salary_amount ? `₹${(teacherData.salary_amount / 1000).toFixed(0)}K` : 'N/A'}
                </Text>
                <Text style={styles.statLabel}>Salary</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Information Cards */}
        <View style={styles.cardsContainer}>
          {/* Personal Information Card */}
          <View style={styles.infoCard}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="person_outline" size={24} color="#2196F3" />
              <Text style={styles.cardTitle}>Personal Information</Text>
            </View>

            <View style={styles.cardContent}>
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Full Name</Text>
                  <Text style={styles.infoValue}>{teacherData?.name || 'N/A'}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Qualification</Text>
                  <Text style={styles.infoValue}>{teacherData?.qualification || 'N/A'}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Salary</Text>
                  <Text style={styles.infoValue}>
                    {teacherData?.salary_amount ? `₹${parseFloat(teacherData.salary_amount).toLocaleString()}` : 'N/A'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Class Teacher Information */}
          {classTeacherOf && (
            <View style={styles.infoCard}>
              <View style={styles.cardHeader}>
                <MaterialIcons name="school" size={24} color="#4CAF50" />
                <Text style={styles.cardTitle}>Class Teacher</Text>
              </View>

              <View style={styles.cardContent}>
                <View style={styles.classTeacherBadge}>
                  <MaterialIcons name="star" size={20} color="#FFD700" />
                  <Text style={styles.classTeacherText}>{classTeacherOf.class_name}</Text>
                </View>
                <Text style={styles.classTeacherDescription}>
                  Responsible for overall class management and student welfare
                </Text>
              </View>
            </View>
          )}

          {/* Subject Assignments Card */}
          <View style={styles.infoCard}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="assignment" size={24} color="#FF9800" />
              <Text style={styles.cardTitle}>Subject Assignments</Text>
            </View>

            <View style={styles.cardContent}>
              {classes.length > 0 ? (
                <View style={styles.assignmentsContainer}>
                  {classes.map((cls, idx) => (
                    <View key={cls + idx} style={styles.assignmentItem}>
                      <View style={styles.assignmentHeader}>
                        <View style={styles.classChip}>
                          <MaterialIcons name="class" size={16} color="#2196F3" />
                          <Text style={styles.classChipText}>{cls}</Text>
                        </View>
                      </View>
                      <View style={styles.subjectChip}>
                        <MaterialIcons name="book" size={16} color="#4CAF50" />
                        <Text style={styles.subjectChipText}>{subjects[idx] || 'No subject assigned'}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <MaterialIcons name="assignment_late" size={48} color="#E0E0E0" />
                  <Text style={styles.emptyStateText}>No subject assignments</Text>
                  <Text style={styles.emptyStateSubtext}>This teacher has no assigned subjects yet</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('AssignTaskToTeacher', { teacher: teacherData })}
          >
            <MaterialIcons name="assignment_add" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Assign Task</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => Alert.alert('Feature Coming Soon', 'Edit teacher functionality will be available soon.')}
          >
            <MaterialIcons name="edit" size={20} color="#2196F3" />
            <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>Edit Details</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  // Profile Header Card
  profileCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 20,
    padding: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4CAF50',
    borderWidth: 3,
    borderColor: '#fff',
  },
  profileInfo: {
    alignItems: 'center',
    width: '100%',
  },
  teacherName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
    textAlign: 'center',
  },
  teacherRole: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 16,
  },
  // Cards Container
  cardsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 12,
  },
  cardContent: {
    padding: 20,
    paddingTop: 16,
  },
  infoRow: {
    marginBottom: 16,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  // Class Teacher Badge
  classTeacherBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  classTeacherText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#856404',
    marginLeft: 8,
  },
  classTeacherDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  // Subject Assignments
  assignmentsContainer: {
    gap: 12,
  },
  assignmentItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  assignmentHeader: {
    marginBottom: 8,
  },
  classChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  classChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976d2',
    marginLeft: 6,
  },
  subjectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  subjectChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2e7d32',
    marginLeft: 6,
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#2196F3',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.1,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  secondaryButtonText: {
    color: '#2196F3',
  },
});

export default TeacherDetails;