import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import { validateDatabaseDates, cleanupDatabaseDates } from '../../utils/databaseCleanup';

const DatabaseCleanup = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [validationReport, setValidationReport] = useState(null);
  const [cleanupResults, setCleanupResults] = useState(null);

  const handleValidateDates = async () => {
    try {
      setLoading(true);
      const report = await validateDatabaseDates();
      setValidationReport(report);
      
      const totalIssues = report.feeStructures.invalid.length + report.studentFees.invalid.length;
      
      if (totalIssues === 0) {
        Alert.alert('Validation Complete', 'No date issues found in the database!');
      } else {
        Alert.alert(
          'Validation Complete', 
          `Found ${totalIssues} records with date issues. Check the report below for details.`
        );
      }
    } catch (error) {
      console.error('Error validating dates:', error);
      Alert.alert('Error', 'Failed to validate database dates');
    } finally {
      setLoading(false);
    }
  };

  const handleCleanupDates = async () => {
    if (!validationReport) {
      Alert.alert('Error', 'Please run validation first to identify issues');
      return;
    }

    const totalIssues = validationReport.feeStructures.invalid.length + validationReport.studentFees.invalid.length;
    
    if (totalIssues === 0) {
      Alert.alert('No Issues', 'No date issues found to fix');
      return;
    }

    Alert.alert(
      'Confirm Cleanup',
      `This will attempt to fix ${totalIssues} records with invalid dates. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Fix Issues', onPress: performCleanup }
      ]
    );
  };

  const performCleanup = async () => {
    try {
      setLoading(true);
      const results = await cleanupDatabaseDates();
      setCleanupResults(results);
      
      const totalFixed = results.feeStructures.fixed + results.studentFees.fixed;
      const totalFailed = results.feeStructures.failed + results.studentFees.failed;
      
      Alert.alert(
        'Cleanup Complete',
        `Fixed: ${totalFixed} records\nFailed: ${totalFailed} records\n\nCheck the results below for details.`
      );
      
      // Refresh validation after cleanup
      setTimeout(() => {
        handleValidateDates();
      }, 1000);
      
    } catch (error) {
      console.error('Error during cleanup:', error);
      Alert.alert('Error', 'Failed to cleanup database dates');
    } finally {
      setLoading(false);
    }
  };

  const renderValidationReport = () => {
    if (!validationReport) return null;

    return (
      <View style={styles.reportContainer}>
        <Text style={styles.reportTitle}>Validation Report</Text>
        
        <View style={styles.reportSection}>
          <Text style={styles.sectionTitle}>Fee Structures</Text>
          <Text style={styles.reportText}>Total: {validationReport.feeStructures.total}</Text>
          <Text style={styles.reportText}>Valid: {validationReport.feeStructures.valid}</Text>
          <Text style={[styles.reportText, { color: validationReport.feeStructures.invalid.length > 0 ? '#F44336' : '#4CAF50' }]}>
            Invalid: {validationReport.feeStructures.invalid.length}
          </Text>
        </View>

        <View style={styles.reportSection}>
          <Text style={styles.sectionTitle}>Student Fees</Text>
          <Text style={styles.reportText}>Total: {validationReport.studentFees.total}</Text>
          <Text style={styles.reportText}>Valid: {validationReport.studentFees.valid}</Text>
          <Text style={[styles.reportText, { color: validationReport.studentFees.invalid.length > 0 ? '#F44336' : '#4CAF50' }]}>
            Invalid: {validationReport.studentFees.invalid.length}
          </Text>
        </View>
      </View>
    );
  };

  const renderCleanupResults = () => {
    if (!cleanupResults) return null;

    return (
      <View style={styles.reportContainer}>
        <Text style={styles.reportTitle}>Cleanup Results</Text>
        
        <View style={styles.reportSection}>
          <Text style={styles.sectionTitle}>Fee Structures</Text>
          <Text style={styles.reportText}>Found: {cleanupResults.feeStructures.found}</Text>
          <Text style={[styles.reportText, { color: '#4CAF50' }]}>Fixed: {cleanupResults.feeStructures.fixed}</Text>
          <Text style={[styles.reportText, { color: '#F44336' }]}>Failed: {cleanupResults.feeStructures.failed}</Text>
        </View>

        <View style={styles.reportSection}>
          <Text style={styles.sectionTitle}>Student Fees</Text>
          <Text style={styles.reportText}>Found: {cleanupResults.studentFees.found}</Text>
          <Text style={[styles.reportText, { color: '#4CAF50' }]}>Fixed: {cleanupResults.studentFees.fixed}</Text>
          <Text style={[styles.reportText, { color: '#F44336' }]}>Failed: {cleanupResults.studentFees.failed}</Text>
        </View>

        {cleanupResults.errors.length > 0 && (
          <View style={styles.reportSection}>
            <Text style={styles.sectionTitle}>Errors</Text>
            {cleanupResults.errors.slice(0, 5).map((error, index) => (
              <Text key={index} style={[styles.reportText, { color: '#F44336', fontSize: 12 }]}>
                {error}
              </Text>
            ))}
            {cleanupResults.errors.length > 5 && (
              <Text style={[styles.reportText, { color: '#666', fontSize: 12 }]}>
                ... and {cleanupResults.errors.length - 5} more errors
              </Text>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header 
        title="Database Cleanup" 
        showBack={true} 
        onBack={() => navigation.goBack()} 
      />

      <ScrollView style={styles.content}>
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={24} color="#2196F3" />
          <Text style={styles.infoText}>
            This tool helps identify and fix invalid dates in the database that may cause errors when loading fees.
          </Text>
        </View>

        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[styles.button, styles.validateButton]}
            onPress={handleValidateDates}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="search" size={20} color="#fff" />
                <Text style={styles.buttonText}>Validate Dates</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.cleanupButton]}
            onPress={handleCleanupDates}
            disabled={loading || !validationReport}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="build" size={20} color="#fff" />
                <Text style={styles.buttonText}>Fix Issues</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {renderValidationReport()}
        {renderCleanupResults()}
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
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#1976D2',
    lineHeight: 20,
  },
  actionContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  validateButton: {
    backgroundColor: '#2196F3',
  },
  cleanupButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  reportContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  reportSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#555',
  },
  reportText: {
    fontSize: 14,
    marginBottom: 4,
    color: '#666',
  },
});

export default DatabaseCleanup;
