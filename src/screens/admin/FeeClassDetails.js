import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import Header from '../../components/Header';
import { useRoute, useNavigation } from '@react-navigation/native';

const mockClasses = [
  { id: 'c1', name: 'Class 1', description: 'Grade 1 - Primary Section' },
  { id: 'c2', name: 'Class 2', description: 'Grade 2 - Primary Section' },
  { id: 'c3', name: 'Class 3', description: 'Grade 3 - Primary Section' },
];
const mockStudents = [
  { id: 's1', name: 'Alice', classId: 'c1' },
  { id: 's2', name: 'Bob', classId: 'c1' },
  { id: 's3', name: 'Carol', classId: 'c2' },
];
const initialPayments = [
  { studentId: 's1', amount: 2000, date: '2024-06-10', status: 'Paid' },
  { studentId: 's2', amount: 0, date: '', status: 'Unpaid' },
  { studentId: 's3', amount: 1000, date: '2024-06-09', status: 'Partial' },
];
const mockFeeStructures = [
  { classId: 'c1', fees: [
    { id: 'f1', type: 'Tuition Fee', amount: 2000, dueDate: '2024-07-01', description: 'Annual Tuition Fee' },
    { id: 'f2', type: 'Bus Fee', amount: 500, dueDate: '2024-07-10', description: 'Bus Transport Fee' },
  ] },
  { classId: 'c2', fees: [
    { id: 'f3', type: 'Tuition Fee', amount: 2500, dueDate: '2024-07-01', description: 'Annual Tuition Fee' },
    { id: 'f4', type: 'Mid Term Fee', amount: 800, dueDate: '2024-09-15', description: 'Mid Term Exam Fee' },
  ] },
];

export default function FeeClassDetails() {
  const route = useRoute();
  const navigation = useNavigation();
  const { classId, feeId } = route.params;
  const classInfo = mockClasses.find(c => c.id === classId);
  const students = mockStudents.filter(s => s.classId === classId);
  const classStructure = mockFeeStructures.find(f => f.classId === classId);
  const fee = classStructure && feeId ? classStructure.fees.find(f => f.id === feeId) : null;
  const allFees = classStructure ? classStructure.fees : [];
  // For demo, assume all students have same fee due for this fee type
  // Payment status is based on initialPayments (could be extended for per-fee payments)
  return (
    <View style={styles.container}>
      <Header title={classInfo ? classInfo.name : 'Class Details'} showBack={true} onBack={() => navigation.goBack()} />
      <Text style={styles.classDesc}>{classInfo?.description}</Text>
      {fee ? (
        <View style={styles.feeHeaderBox}>
          <Text style={styles.feeHeaderTitle}>{fee.type} <Text style={styles.feeHeaderAmount}>₹{fee.amount}</Text></Text>
          <Text style={styles.feeHeaderDesc}>{fee.description}</Text>
          <Text style={styles.feeHeaderDate}>📅 {fee.dueDate}</Text>
        </View>
      ) : null}
      {!fee && (
        <FlatList
          data={students}
          keyExtractor={item => item.id}
          style={{ marginTop: 12 }}
          ListHeaderComponent={<Text style={styles.listHeader}>All Fee Dues</Text>}
          renderItem={({ item }) => (
            <View style={styles.studentRowMulti}>
              <Text style={styles.studentNameMulti}>{item.name}</Text>
              <View style={{ flex: 1 }}>
                {allFees.map(feeType => {
                  const payment = initialPayments.find(p => p.studentId === item.id);
                  let status = payment ? payment.status : 'Unpaid';
                  let paidAmount = payment ? payment.amount : 0;
                  if (!payment || payment.amount < feeType.amount) {
                    status = payment && payment.amount > 0 ? 'Partial' : 'Unpaid';
                  } else {
                    status = 'Paid';
                  }
                  paidAmount = payment ? Math.min(payment.amount, feeType.amount) : 0;
                  return (
                    <View key={feeType.id} style={styles.feeTypeDueRow}>
                      <Text style={styles.feeTypeDueTitle}>{feeType.type}:</Text>
                      <Text style={styles.feeTypeDueAmount}>₹{paidAmount} / ₹{feeType.amount}</Text>
                      <Text style={styles.feeTypeDueStatus}>{status}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        />
      )}
      {fee && (
        <FlatList
          data={students}
          keyExtractor={item => item.id}
          style={{ marginTop: 12 }}
          ListHeaderComponent={<Text style={styles.listHeader}>Student Fee Details</Text>}
          renderItem={({ item }) => {
            const payment = initialPayments.find(p => p.studentId === item.id);
            let status = payment ? payment.status : 'Unpaid';
            let paidAmount = payment ? payment.amount : 0;
            if (fee) {
              if (!payment || payment.amount < fee.amount) {
                status = payment && payment.amount > 0 ? 'Partial' : 'Unpaid';
              } else {
                status = 'Paid';
              }
              paidAmount = payment ? Math.min(payment.amount, fee.amount) : 0;
            }
            return (
              <View style={styles.studentRow}>
                <Text style={styles.studentName}>{item.name}</Text>
                <Text style={styles.studentStatus}>{status}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                  <Text style={styles.studentAmount}>₹{paidAmount}</Text>
                  {payment && payment.date ? <Text style={styles.calendarIcon}> 📅</Text> : null}
                  {payment && payment.date ? <Text style={styles.paymentDate}>{payment.date}</Text> : null}
                </View>
              </View>
            );
          }}
          ListFooterComponent={
            fee ? (
              <View style={styles.totalsBox}>
                <Text style={styles.totalsLabel}>Total Due: <Text style={styles.totalsValue}>₹{students.length * fee.amount}</Text></Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  classDesc: {
    fontSize: 15,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  listHeader: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
    color: '#1a237e',
    textAlign: 'center',
  },
  studentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 6,
    marginBottom: 8,
    elevation: 1,
  },
  studentName: {
    flex: 2,
    fontSize: 15,
  },
  studentStatus: {
    flex: 1,
    fontSize: 13,
    color: '#1976d2',
    textAlign: 'center',
  },
  studentAmount: {
    flex: 1,
    fontSize: 13,
    color: '#333',
    textAlign: 'right',
  },
  totalsBox: {
    marginTop: 16,
    alignItems: 'center',
  },
  totalsLabel: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: 16,
  },
  totalsValue: {
    color: '#1976d2',
  },
  calendarIcon: {
    fontSize: 16,
    marginLeft: 6,
  },
  paymentDate: {
    fontSize: 12,
    color: '#888',
    marginLeft: 2,
  },
  feeHeaderBox: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    alignItems: 'center',
  },
  feeHeaderTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#1a237e',
  },
  feeHeaderAmount: {
    color: '#1976d2',
    fontWeight: 'bold',
  },
  feeHeaderDesc: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  feeHeaderDate: {
    fontSize: 13,
    color: '#1976d2',
    marginTop: 2,
  },
  studentRowMulti: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 6,
    marginBottom: 8,
    elevation: 1,
  },
  studentNameMulti: {
    flex: 1,
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1a237e',
  },
  feeTypeDueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  feeTypeDueTitle: {
    fontSize: 13,
    color: '#333',
    minWidth: 90,
  },
  feeTypeDueAmount: {
    fontSize: 13,
    color: '#1976d2',
    minWidth: 80,
  },
  feeTypeDueStatus: {
    fontSize: 13,
    color: '#666',
    marginLeft: 8,
  },
}); 