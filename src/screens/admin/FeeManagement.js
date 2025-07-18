import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Modal, TextInput, Button, Alert, ScrollView } from 'react-native';
import Header from '../../components/Header';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

const mockClasses = [
  { id: 'c1', name: 'Class 1', description: 'Grade 1 - Primary Section' },
  { id: 'c2', name: 'Class 2', description: 'Grade 2 - Primary Section' },
  { id: 'c3', name: 'Class 3', description: 'Grade 3 - Primary Section' },
];

// Update initialFeeStructures to support multiple fee types per class
const initialFeeStructures = [
  { classId: 'c1', fees: [
    { id: 'f1', type: 'Tuition Fee', amount: 2000, dueDate: '2024-07-01', description: 'Annual Tuition Fee' },
    { id: 'f2', type: 'Bus Fee', amount: 500, dueDate: '2024-07-10', description: 'Bus Transport Fee' },
  ] },
  { classId: 'c2', fees: [
    { id: 'f3', type: 'Tuition Fee', amount: 2500, dueDate: '2024-07-01', description: 'Annual Tuition Fee' },
    { id: 'f4', type: 'Mid Term Fee', amount: 800, dueDate: '2024-09-15', description: 'Mid Term Exam Fee' },
  ] },
  { classId: 'c3', fees: [] },
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

const FeeManagement = () => {
  const navigation = useNavigation();
  const [tab, setTab] = useState('structure');
  const [feeStructures, setFeeStructures] = useState(initialFeeStructures);
  const [feeModal, setFeeModal] = useState({ visible: false, classId: '', fee: { id: '', type: '', amount: '', dueDate: '', description: '' } });
  const [editFeeId, setEditFeeId] = useState(null);
  const [expandedClass, setExpandedClass] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Fee Structure CRUD
  const openAddStructure = () => {
    setEditClassId(null);
    setStructureModal({ visible: true, classId: mockClasses[0].id, amount: '', dueDate: '', description: '' });
  };
  const openEditStructure = (fs) => {
    setEditClassId(fs.classId);
    setStructureModal({ visible: true, ...fs });
  };
  const handleSaveStructure = () => {
    if (!structureModal.classId || !structureModal.amount || !structureModal.dueDate) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    if (editClassId) {
      setFeeStructures(feeStructures.map(fs => fs.classId === editClassId ? { ...structureModal } : fs));
    } else {
      setFeeStructures([...feeStructures, { ...structureModal }]);
    }
    setStructureModal({ visible: false, classId: '', amount: '', dueDate: '', description: '' });
    setEditClassId(null);
  };
  const handleDeleteStructure = (classId) => {
    Alert.alert('Delete Fee Structure', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => setFeeStructures(feeStructures.filter(fs => fs.classId !== classId)) },
    ]);
  };

  return (
    <View style={styles.container}>
      <Header title="Fee Management" showBack={true} />
      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tab, tab === 'structure' && styles.activeTab]} onPress={() => setTab('structure')}>
          <Text style={styles.tabText}>Fee Structure</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'payments' && styles.activeTab]} onPress={() => setTab('payments')}>
          <Text style={styles.tabText}>Payments</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'reports' && styles.activeTab]} onPress={() => setTab('reports')}>
          <Text style={styles.tabText}>Reports</Text>
        </TouchableOpacity>
      </View>
      {tab === 'structure' && (
        <View style={styles.content}>
          <FlatList
            data={mockClasses}
            keyExtractor={item => item.id}
            style={{ width: '100%', marginTop: 16 }}
            renderItem={({ item }) => {
              const classStructure = feeStructures.find(f => f.classId === item.id);
              const fees = classStructure ? classStructure.fees : [];
              const students = mockStudents.filter(s => s.classId === item.id);
              const payments = initialPayments.filter(p => students.some(stu => stu.id === p.studentId));
              const dueStudents = students.filter(stu => {
                const payment = initialPayments.find(p => p.studentId === stu.id);
                return !payment || payment.status !== 'Paid';
              });
              const totalDue = fees.reduce((sum, fee) => sum + Number(fee.amount), 0);
              return (
                <View style={styles.structureRow}>
                  <View style={styles.classHeaderRow}>
                    <Text style={styles.structureClass}>{item.name}</Text>
                    <View style={styles.iconRow}>
                      <TouchableOpacity onPress={() => { setEditFeeId(fee.id); setFeeModal({ visible: true, classId: item.id, fee }); }} style={styles.actionBtn}>
                        <Ionicons name="create-outline" size={20} color="#1976d2" style={styles.actionIcon} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.summaryRow}
                    onPress={() => navigation.navigate('FeeClassDetails', { classId: item.id })}
                  >
                    <Text style={styles.classDescription}>{item.description}</Text>
                    <Text style={styles.summaryText}>Due Students: {dueStudents.length}</Text>
                    <Text style={styles.summaryText}>Total Due: ₹{totalDue}</Text>
                  </TouchableOpacity>
                  {/* List all fee types for this class */}
                  {fees.length === 0 && <Text style={{ color: '#888', marginTop: 6 }}>No fee types defined.</Text>}
                  {fees.map(fee => (
                    <TouchableOpacity key={fee.id} style={styles.feeTypeRow} onPress={() => navigation.navigate('FeeClassDetails', { classId: item.id, feeId: fee.id })}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.feeTypeTitle}>{fee.type} <Text style={styles.feeTypeAmount}>₹{fee.amount}</Text></Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                          <Text style={styles.feeTypeDesc}>{fee.description}</Text>
                          <Text style={styles.feeTypeDate}>  📅 {fee.dueDate}</Text>
                        </View>
                      </View>
                      <View style={styles.iconRow}>
                        <TouchableOpacity onPress={e => { e.stopPropagation(); setEditFeeId(fee.id); setFeeModal({ visible: true, classId: item.id, fee }); }} style={styles.actionBtn}>
                          <Ionicons name="create-outline" size={20} color="#1976d2" style={styles.actionIcon} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={e => { e.stopPropagation(); setFeeStructures(feeStructures.map(cs => cs.classId === item.id ? { ...cs, fees: cs.fees.filter(f => f.id !== fee.id) } : cs)); }} style={styles.actionBtn}>
                          <Ionicons name="trash-outline" size={20} color="#d32f2f" style={styles.actionIcon} />
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  ))}
                  {/* Expanded student details */}
                  {expandedClass === item.id && classStructure && (
                    <View style={styles.expandedBox}>
                      <Text style={styles.expandedTitle}>Student Fee Details</Text>
                      {students.length === 0 && <Text style={{ color: '#888' }}>No students in this class.</Text>}
                      {students.map(stu => {
                        const payment = initialPayments.find(p => p.studentId === stu.id);
                        return (
                          <View key={stu.id} style={styles.studentRow}>
                            <Text style={styles.studentName}>{stu.name}</Text>
                            <Text style={styles.studentStatus}>{payment ? payment.status : 'Unpaid'}</Text>
                            <Text style={styles.studentAmount}>₹{payment ? payment.amount : 0}</Text>
                          </View>
                        );
                      })}
                      <View style={styles.totalsRow}>
                        <Text style={styles.totalsLabel}>Total Paid:</Text>
                        <Text style={styles.totalsValue}>₹{payments.reduce((sum, p) => sum + (p.status === 'Paid' || p.status === 'Partial' ? Number(p.amount) : 0), 0)}</Text>
                      </View>
                      <View style={styles.totalsRow}>
                        <Text style={styles.totalsLabel}>Total Due:</Text>
                        <Text style={styles.totalsValue}>₹{totalDue}</Text>
                      </View>
                    </View>
                  )}
                </View>
              );
            }}
          />
          <Modal visible={feeModal.visible} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>{editFeeId ? 'Edit Fee Type' : 'Add Fee Type'}</Text>
                <TextInput
                  placeholder="Fee Type (e.g., Tuition Fee, Bus Fee)"
                  value={feeModal.fee.type}
                  onChangeText={text => setFeeModal(f => ({ ...f, fee: { ...f.fee, type: text } }))}
                  style={styles.input}
                />
                <TextInput
                  placeholder="Amount (₹)"
                  value={feeModal.fee.amount.toString()}
                  onChangeText={text => setFeeModal(f => ({ ...f, fee: { ...f.fee, amount: text.replace(/[^0-9]/g, '') } }))}
                  style={styles.input}
                  keyboardType="numeric"
                />
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TextInput
                    placeholder="Due Date (YYYY-MM-DD)"
                    value={feeModal.fee.dueDate}
                    style={[styles.input, { flex: 1 }]}
                    editable={false}
                  />
                  <TouchableOpacity onPress={() => setShowDatePicker(true)} style={{ marginLeft: 8 }}>
                    <Text style={{ fontSize: 22 }}>📅</Text>
                  </TouchableOpacity>
                </View>
                {showDatePicker && (
                  <DateTimePicker
                    value={feeModal.fee.dueDate ? new Date(feeModal.fee.dueDate) : new Date()}
                    mode="date"
                    display="calendar"
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) {
                        const yyyy = selectedDate.getFullYear();
                        const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
                        const dd = String(selectedDate.getDate()).padStart(2, '0');
                        setFeeModal(f => ({ ...f, fee: { ...f.fee, dueDate: `${yyyy}-${mm}-${dd}` } }));
                      }
                    }}
                  />
                )}
                <TextInput
                  placeholder="Description"
                  value={feeModal.fee.description}
                  onChangeText={text => setFeeModal(f => ({ ...f, fee: { ...f.fee, description: text } }))}
                  style={styles.input}
                />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
                  <Button title="Cancel" onPress={() => { setFeeModal({ visible: false, classId: '', fee: { id: '', type: '', amount: '', dueDate: '', description: '' } }); setEditFeeId(null); }} />
                  <Button title="Save" onPress={() => {
                    if (!feeModal.fee.type || !feeModal.fee.amount || !feeModal.fee.dueDate) {
                      Alert.alert('Error', 'Please fill all fields');
                      return;
                    }
                    setFeeStructures(feeStructures => {
                      const idx = feeStructures.findIndex(cs => cs.classId === feeModal.classId);
                      if (idx === -1) {
                        // Class not present, add new
                        return [
                          ...feeStructures,
                          { classId: feeModal.classId, fees: [{ ...feeModal.fee, id: 'f' + Date.now() }] }
                        ];
                      }
                      return feeStructures.map(cs => {
                        if (cs.classId === feeModal.classId) {
                          let newFees;
                          if (editFeeId) {
                            newFees = cs.fees.map(f => f.id === editFeeId ? { ...feeModal.fee, id: editFeeId } : f);
                          } else {
                            newFees = [...(cs.fees || []), { ...feeModal.fee, id: 'f' + Date.now() }];
                          }
                          return { ...cs, fees: newFees };
                        }
                        return cs;
                      });
                    });
                    setFeeModal({ visible: false, classId: '', fee: { id: '', type: '', amount: '', dueDate: '', description: '' } });
                    setEditFeeId(null);
                  }} />
                </View>
              </View>
            </View>
          </Modal>
        </View>
      )}
      {tab === 'payments' && (
        <View style={styles.content}><Text style={styles.title}>Payments (Coming soon...)</Text></View>
      )}
      {tab === 'reports' && (
        <View style={styles.content}><Text style={styles.title}>Reports (Coming soon...)</Text></View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#007bff',
    backgroundColor: '#fff',
  },
  tabText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  structureRow: {
    flexDirection: 'column', // Changed to column for expanded content
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    elevation: 1,
  },
  structureClass: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  classDescription: {
    fontSize: 13,
    color: '#888',
    marginBottom: 2,
  },
  structureDetail: {
    fontSize: 14,
    color: '#666',
  },
  actionBtn: {
    marginLeft: 12,
    padding: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 8,
    width: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 8,
    marginTop: 8,
  },
  classBtn: {
    padding: 8,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    alignItems: 'center',
  },
  activeClassBtn: {
    backgroundColor: '#e3f2fd',
    borderColor: '#1976d2',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  expandedBox: {
    marginTop: 10,
    backgroundColor: '#f0f4ff',
    borderRadius: 8,
    padding: 12,
    width: '100%',
  },
  expandedTitle: {
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 6,
    color: '#1a237e',
  },
  studentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  studentName: {
    flex: 2,
    fontSize: 14,
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
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  totalsLabel: {
    fontWeight: 'bold',
    color: '#333',
  },
  totalsValue: {
    fontWeight: 'bold',
    color: '#1976d2',
  },
  summaryRow: {
    backgroundColor: '#f0f4ff',
    borderRadius: 8,
    padding: 10,
    marginVertical: 6,
  },
  summaryText: {
    fontSize: 14,
    color: '#1976d2',
    marginTop: 2,
  },
  icon: {
    fontSize: 20,
    textAlign: 'center',
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 2,
    gap: 8,
  },
  classHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  feeTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9ff',
    padding: 10,
    borderRadius: 6,
    marginTop: 8,
    marginBottom: 2,
    elevation: 1,
  },
  feeTypeTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1a237e',
  },
  feeTypeAmount: {
    fontSize: 15,
    color: '#1976d2',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  feeTypeDesc: {
    fontSize: 13,
    color: '#666',
  },
  feeTypeDate: {
    fontSize: 13,
    color: '#1976d2',
    marginLeft: 8,
  },
  actionIcon: {
    marginVertical: 2,
    marginBottom: 2,
  },
});

export default FeeManagement; 