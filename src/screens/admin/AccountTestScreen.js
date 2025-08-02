import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import { supabase, TABLES, dbHelpers } from '../../utils/supabase';

const AccountTestScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState([]);

  const addTestResult = (test, result, details = '') => {
    setTestResults(prev => [...prev, { test, result, details, timestamp: new Date().toLocaleTimeString() }]);
  };

  const runAuthTests = async () => {
    setLoading(true);
    setTestResults([]);

    try {
      // Test 1: Check Supabase connection
      addTestResult('Supabase Connection', 'Testing...', 'Checking basic connection');
      const { session, error: authError } = await dbHelpers.testAuthConnection();
      if (authError) {
        addTestResult('Supabase Connection', 'Failed', authError.message);
      } else {
        addTestResult('Supabase Connection', 'Success', 'Connection established');
      }

      // Test 2: Check roles table
      addTestResult('Roles Table', 'Testing...', 'Checking if roles exist');
      const { data: roles, error: rolesError } = await supabase
        .from(TABLES.ROLES)
        .select('*');
      
      if (rolesError) {
        addTestResult('Roles Table', 'Failed', rolesError.message);
      } else {
        addTestResult('Roles Table', 'Success', `Found ${roles.length} roles: ${roles.map(r => r.role_name).join(', ')}`);
      }

      // Test 3: Check students table
      addTestResult('Students Table', 'Testing...', 'Checking students data');
      const { data: students, error: studentsError } = await supabase
        .from(TABLES.STUDENTS)
        .select('id, name, admission_no')
        .limit(5);
      
      if (studentsError) {
        addTestResult('Students Table', 'Failed', studentsError.message);
      } else {
        addTestResult('Students Table', 'Success', `Found ${students.length} students`);
      }

      // Test 4: Check users table
      addTestResult('Users Table', 'Testing...', 'Checking existing user accounts');
      const { data: users, error: usersError } = await supabase
        .from(TABLES.USERS)
        .select('id, email, role_id, linked_student_id, linked_teacher_id')
        .limit(10);
      
      if (usersError) {
        addTestResult('Users Table', 'Failed', usersError.message);
      } else {
        const studentAccounts = users.filter(u => u.linked_student_id);
        const teacherAccounts = users.filter(u => u.linked_teacher_id);
        addTestResult('Users Table', 'Success', `Found ${users.length} users (${studentAccounts.length} students, ${teacherAccounts.length} teachers)`);
      }

      // Test 5: Ensure roles exist
      addTestResult('Role Creation', 'Testing...', 'Ensuring default roles exist');
      const { success: roleSuccess, error: roleCreateError } = await dbHelpers.ensureRolesExist();
      
      if (!roleSuccess) {
        addTestResult('Role Creation', 'Failed', roleCreateError?.message || 'Unknown error');
      } else {
        addTestResult('Role Creation', 'Success', 'All default roles ensured');
      }

      // Test 6: Check parent accounts
      addTestResult('Parent Accounts', 'Testing...', 'Checking existing parent accounts');
      const { data: parentUsers, error: parentUsersError } = await supabase
        .from(TABLES.USERS)
        .select('id, email, role_id, linked_parent_of')
        .not('linked_parent_of', 'is', null);

      if (parentUsersError) {
        addTestResult('Parent Accounts', 'Failed', parentUsersError.message);
      } else {
        addTestResult('Parent Accounts', 'Success', `Found ${parentUsers.length} parent accounts`);
      }

    } catch (error) {
      addTestResult('General Error', 'Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const testStudentAccountCreation = async () => {
    setLoading(true);

    try {
      // Get a test student
      const { data: students, error: studentsError } = await supabase
        .from(TABLES.STUDENTS)
        .select('id, name')
        .limit(1);

      if (studentsError || !students.length) {
        Alert.alert('Error', 'No students found to test with');
        setLoading(false);
        return;
      }

      const testStudent = students[0];
      const testEmail = `test.student.${Date.now()}@school.edu`;
      const testPassword = 'TestPass123';

      addTestResult('Test Student Account', 'Testing...', `Creating account for ${testStudent.name}`);

      const { data: accountData, error: accountError } = await dbHelpers.createStudentAccount(
        { studentId: testStudent.id },
        {
          email: testEmail,
          password: testPassword,
          full_name: testStudent.name,
          phone: '1234567890'
        }
      );

      if (accountError) {
        addTestResult('Test Student Account', 'Failed', accountError.message || accountError);
      } else {
        addTestResult('Test Student Account', 'Success', `Account created with email: ${testEmail}`);

        // Verify the account
        const { data: verifyUser } = await supabase
          .from(TABLES.USERS)
          .select('*')
          .eq('email', testEmail)
          .single();

        if (verifyUser) {
          addTestResult('Student Account Verification', 'Success', `User found in database with ID: ${verifyUser.id}`);
        } else {
          addTestResult('Student Account Verification', 'Failed', 'User not found in database');
        }
      }

    } catch (error) {
      addTestResult('Test Student Account', 'Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const testParentAccountCreation = async () => {
    setLoading(true);

    try {
      // Get a test student
      const { data: students, error: studentsError } = await supabase
        .from(TABLES.STUDENTS)
        .select('id, name')
        .limit(1);

      if (studentsError || !students.length) {
        Alert.alert('Error', 'No students found to test with');
        setLoading(false);
        return;
      }

      const testStudent = students[0];
      const testEmail = `test.parent.${Date.now()}@school.edu`;
      const testPassword = 'TestPass123';

      addTestResult('Test Parent Account', 'Testing...', `Creating parent account for ${testStudent.name}`);

      const { data: accountData, error: accountError } = await dbHelpers.createParentAccount(
        { studentId: testStudent.id },
        {
          email: testEmail,
          password: testPassword,
          full_name: `${testStudent.name} Parent`,
          phone: '1234567890'
        }
      );

      if (accountError) {
        addTestResult('Test Parent Account', 'Failed', accountError.message || accountError);
      } else {
        addTestResult('Test Parent Account', 'Success', `Parent account created with email: ${testEmail}`);

        // Verify the account
        const { data: verifyUser } = await supabase
          .from(TABLES.USERS)
          .select('*')
          .eq('email', testEmail)
          .single();

        if (verifyUser) {
          addTestResult('Parent Account Verification', 'Success', `Parent user found in database with ID: ${verifyUser.id}`);
        } else {
          addTestResult('Parent Account Verification', 'Failed', 'Parent user not found in database');
        }
      }

    } catch (error) {
      addTestResult('Test Parent Account', 'Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <View style={styles.container}>
      <Header title="Account System Test" showBack={true} onBack={() => navigation.goBack()} />
      
      <ScrollView style={styles.content}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={runAuthTests}
            disabled={loading}
          >
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={styles.buttonText}>Run System Tests</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={testStudentAccountCreation}
            disabled={loading}
          >
            <Ionicons name="person-add" size={20} color="#fff" />
            <Text style={styles.buttonText}>Test Student Account</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.parentButton]}
            onPress={testParentAccountCreation}
            disabled={loading}
          >
            <Ionicons name="people" size={20} color="#fff" />
            <Text style={styles.buttonText}>Test Parent Account</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.clearButton]}
            onPress={clearResults}
            disabled={loading}
          >
            <Ionicons name="trash" size={20} color="#fff" />
            <Text style={styles.buttonText}>Clear Results</Text>
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2196F3" />
            <Text style={styles.loadingText}>Running tests...</Text>
          </View>
        )}

        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Test Results</Text>
          {testResults.map((result, index) => (
            <View key={index} style={styles.resultItem}>
              <View style={styles.resultHeader}>
                <Text style={styles.resultTest}>{result.test}</Text>
                <View style={[
                  styles.resultStatus,
                  result.result === 'Success' ? styles.successStatus :
                  result.result === 'Failed' ? styles.failedStatus :
                  styles.testingStatus
                ]}>
                  <Text style={styles.resultStatusText}>{result.result}</Text>
                </View>
              </View>
              {result.details && (
                <Text style={styles.resultDetails}>{result.details}</Text>
              )}
              <Text style={styles.resultTime}>{result.timestamp}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#2196F3',
  },
  secondaryButton: {
    backgroundColor: '#4CAF50',
  },
  parentButton: {
    backgroundColor: '#9C27B0',
  },
  clearButton: {
    backgroundColor: '#FF5722',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
    color: '#666',
  },
  resultsContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  resultItem: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  resultTest: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  resultStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  successStatus: {
    backgroundColor: '#4CAF50',
  },
  failedStatus: {
    backgroundColor: '#F44336',
  },
  testingStatus: {
    backgroundColor: '#FF9800',
  },
  resultStatusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  resultDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  resultTime: {
    fontSize: 12,
    color: '#999',
  },
});

export default AccountTestScreen;
