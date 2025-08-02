import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Platform,
  Pressable,
} from 'react-native';
import Header from '../../components/Header';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { supabase, dbHelpers, TABLES } from '../../utils/supabase';
import { format, parseISO } from 'date-fns';
import { CrossPlatformPieChart, CrossPlatformBarChart } from '../../components/CrossPlatformChart';
import { formatCurrency, parseDate, formatDateForDb, fixInvalidDate } from '../../utils/helpers';
import * as Animatable from 'react-native-animatable';

const FeeManagement = () => {
  const navigation = useNavigation();
  const [tab, setTab] = useState('structure');
  const [classes, setClasses] = useState([]);
  const [feeStructures, setFeeStructures] = useState([]);
  const [students, setStudents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Function to fix invalid dates in the database using raw SQL
  const fixInvalidDatesInDatabase = async () => {
    try {
      console.log('🔧 Fixing invalid dates in database using SQL...');

      let totalFixed = 0;

      // Fix invalid dates using raw SQL to bypass date validation
      const fixQueries = [
        // Fix fee_structure table
        {
          table: 'fee_structure',
          query: `UPDATE fee_structure SET due_date = '2025-07-31' WHERE due_date = '2025-07-32'`,
          description: 'fee_structure.due_date'
        },
        {
          table: 'fee_structure',
          query: `UPDATE fee_structure SET created_at = '2025-07-31' WHERE created_at LIKE '%2025-07-32%'`,
          description: 'fee_structure.created_at'
        },
        // Fix student_fees table
        {
          table: 'student_fees',
          query: `UPDATE student_fees SET payment_date = '2025-07-31' WHERE payment_date = '2025-07-32'`,
          description: 'student_fees.payment_date'
        },
        {
          table: 'student_fees',
          query: `UPDATE student_fees SET due_date = '2025-07-31' WHERE due_date = '2025-07-32'`,
          description: 'student_fees.due_date'
        },
        {
          table: 'student_fees',
          query: `UPDATE student_fees SET created_at = '2025-07-31' WHERE created_at LIKE '%2025-07-32%'`,
          description: 'student_fees.created_at'
        },
        // Fix other common invalid dates
        {
          table: 'fee_structure',
          query: `UPDATE fee_structure SET due_date = '2025-06-30' WHERE due_date = '2025-06-31'`,
          description: 'fee_structure.due_date (June 31)'
        },
        {
          table: 'student_fees',
          query: `UPDATE student_fees SET payment_date = '2025-06-30' WHERE payment_date = '2025-06-31'`,
          description: 'student_fees.payment_date (June 31)'
        }
      ];

      // Try a simpler approach - get all records and fix them individually
      console.log('🔧 Attempting to fix fee_structure table...');

      // Fix fee_structure table by selecting all and updating invalid dates
      try {
        // Use a simple select to get IDs and dates as text
        const { data: feeRecords, error: feeSelectError } = await supabase
          .from('fee_structure')
          .select('id, due_date, created_at');

        if (!feeSelectError && feeRecords) {
          for (const record of feeRecords) {
            const updates = {};
            let needsUpdate = false;

            // Check due_date
            if (record.due_date && typeof record.due_date === 'string' && record.due_date.includes('2025-07-32')) {
              updates.due_date = '2025-07-31';
              needsUpdate = true;
              console.log(`🔧 Fixing due_date for fee_structure ${record.id}`);
            }

            // Check created_at
            if (record.created_at && typeof record.created_at === 'string' && record.created_at.includes('2025-07-32')) {
              updates.created_at = record.created_at.replace('2025-07-32', '2025-07-31');
              needsUpdate = true;
              console.log(`🔧 Fixing created_at for fee_structure ${record.id}`);
            }

            if (needsUpdate) {
              const { error: updateError } = await supabase
                .from('fee_structure')
                .update(updates)
                .eq('id', record.id);

              if (!updateError) {
                totalFixed++;
              } else {
                console.error('Update error:', updateError);
              }
            }
          }
        }
      } catch (error) {
        console.warn('Could not fix fee_structure:', error.message);
      }

      console.log('🔧 Attempting to fix student_fees table...');

      // Fix student_fees table
      try {
        const { data: paymentRecords, error: paymentSelectError } = await supabase
          .from('student_fees')
          .select('id, payment_date, due_date, created_at');

        if (!paymentSelectError && paymentRecords) {
          for (const record of paymentRecords) {
            const updates = {};
            let needsUpdate = false;

            // Check all date fields
            ['payment_date', 'due_date', 'created_at'].forEach(field => {
              if (record[field] && typeof record[field] === 'string' && record[field].includes('2025-07-32')) {
                updates[field] = record[field].replace('2025-07-32', '2025-07-31');
                needsUpdate = true;
                console.log(`🔧 Fixing ${field} for student_fees ${record.id}`);
              }
            });

            if (needsUpdate) {
              const { error: updateError } = await supabase
                .from('student_fees')
                .update(updates)
                .eq('id', record.id);

              if (!updateError) {
                totalFixed++;
              } else {
                console.error('Update error:', updateError);
              }
            }
          }
        }
      } catch (error) {
        console.warn('Could not fix student_fees:', error.message);
      }

      // Fix invalid dates in fee_structure table
      const { data: feeStructures, error: feeError } = await supabase
        .from(TABLES.FEE_STRUCTURE)
        .select('id, due_date, created_at');

      if (feeError) {
        console.error('❌ Error fetching fee structures:', feeError);
        return;
      }

      for (const fee of feeStructures || []) {
        const updates = {};
        let needsUpdate = false;

        // Check due_date
        if (fee.due_date) {
          for (const [invalid, valid] of Object.entries(DATE_FIXES)) {
            if (fee.due_date.includes(invalid)) {
              console.log(`🔧 Fixing due_date in fee structure ${fee.id}: ${invalid} → ${valid}`);
              updates.due_date = fee.due_date.replace(invalid, valid);
              needsUpdate = true;
              break;
            }
          }
        }

        if (needsUpdate) {
          const { error: updateError } = await supabase
            .from(TABLES.FEE_STRUCTURE)
            .update(updates)
            .eq('id', fee.id);

          if (updateError) {
            console.error('❌ Error updating fee structure:', updateError);
          } else {
            totalFixed++;
          }
        }
      }

      // Fix invalid dates in student_fees table
      const { data: studentFees, error: studentFeeError } = await supabase
        .from(TABLES.STUDENT_FEES)
        .select('id, payment_date, due_date, created_at');

      if (studentFeeError) {
        console.error('❌ Error fetching student fees:', studentFeeError);
        return;
      }

      for (const payment of studentFees || []) {
        const updates = {};
        let needsUpdate = false;

        // Check all date fields
        ['payment_date', 'due_date', 'created_at'].forEach(field => {
          if (payment[field]) {
            for (const [invalid, valid] of Object.entries(DATE_FIXES)) {
              if (payment[field].includes(invalid)) {
                console.log(`🔧 Fixing ${field} in student fees ${payment.id}: ${invalid} → ${valid}`);
                updates[field] = payment[field].replace(invalid, valid);
                needsUpdate = true;
                break;
              }
            }
          }
        });

        if (needsUpdate) {
          const { error: updateError } = await supabase
            .from(TABLES.STUDENT_FEES)
            .update(updates)
            .eq('id', payment.id);

          if (updateError) {
            console.error('❌ Error updating student fees:', updateError);
          } else {
            totalFixed++;
          }
        }
      }

      console.log(`✅ Finished fixing invalid dates. Total records fixed: ${totalFixed}`);

      if (totalFixed > 0) {
        Alert.alert(
          'Success',
          `Fixed ${totalFixed} invalid dates in the database. The app should now work properly.`,
          [{ text: 'OK', onPress: () => loadAllData() }]
        );
      }

    } catch (error) {
      console.error('❌ Error fixing invalid dates:', error);
      Alert.alert('Error', `Failed to fix invalid dates: ${error.message}`);
    }
  };
  const [feeModal, setFeeModal] = useState({ 
    visible: false, 
    classId: '', 
    fee: { 
      id: '', 
      type: '', 
      amount: '', 
      dueDate: '', 
      description: '' 
    } 
  });
  const [editFeeId, setEditFeeId] = useState(null);
  const [expandedClass, setExpandedClass] = useState(null);
  const [paymentModal, setPaymentModal] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [feeStructureModal, setFeeStructureModal] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [paymentDate, setPaymentDate] = useState(new Date());
  const [paymentAmount, setPaymentAmount] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedFee, setSelectedFee] = useState(null);
  const [newFeeStructure, setNewFeeStructure] = useState({
    type: '',
    amount: '',
    dueDate: '',
    description: ''
  });
  const [feeStats, setFeeStats] = useState({ 
    totalDue: 0, 
    totalPaid: 0, 
    pendingStudents: 0 
  });

  // Helper function to calculate total fees for a student
  // Calculate fee statistics
  const calculateFeeStats = async () => {
    try {
      const { data: feeStructures, error: feeError } = await supabase
        .from(TABLES.FEE_STRUCTURE)
        .select('amount');

      if (feeError) throw feeError;

      const { data: studentFees, error: paymentError } = await supabase
        .from(TABLES.STUDENT_FEES)
        .select('amount_paid, status');

      if (paymentError) throw paymentError;

      const totalDue = feeStructures.reduce((sum, fee) => sum + Number(fee.amount), 0);
      const totalPaid = studentFees.reduce((sum, payment) => sum + Number(payment.amount_paid), 0);
      const pendingStudents = studentFees.filter(fee => fee.status === 'unpaid' || fee.status === 'partial').length;

      setFeeStats({ totalDue, totalPaid, pendingStudents });
    } catch (error) {
      console.error('Error calculating fee statistics:', error);
      setFeeStats({ totalDue: 0, totalPaid: 0, pendingStudents: 0 });
    }
  };

  // Helper function to get pending fees for a student
  const getPendingFees = async (studentId, classId) => {
    try {
      const { data: fees, error } = await supabase
        .from(TABLES.STUDENT_FEES)
        .select(`
          *,
          fee_structure(*)
        `)
        .eq('student_id', studentId)
        .in('status', ['unpaid', 'partial']);

      if (error) throw error;
      return fees || [];
    } catch (error) {
      console.error('Error getting pending fees:', error);
      return [];
    }
  };

  // Load all data from Supabase
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setRefreshing(true);

      // Load classes
      const { data: classesData, error: classesError } = await supabase
        .from(TABLES.CLASSES)
        .select('*');

      if (classesError) throw classesError;
      setClasses(classesData || []);

      // Load fee structures with class information - use raw SQL to handle invalid dates
      let feeStructuresData = [];
      try {
        const { data, error: feeStructuresError } = await supabase
          .from(TABLES.FEE_STRUCTURE)
          .select(`
            *,
            classes:${TABLES.CLASSES}(id, class_name)
          `);

        if (feeStructuresError) {
          console.error('Error loading fee structures:', feeStructuresError);
          // If there's a date error, try to fix it first
          if (feeStructuresError.message && feeStructuresError.message.includes('date/time field value out of range')) {
            console.log('🔧 Detected invalid date error, attempting to fix...');
            await fixInvalidDatesInDatabase();
            // Try loading again after fix
            const { data: retryData, error: retryError } = await supabase
              .from(TABLES.FEE_STRUCTURE)
              .select(`
                *,
                classes:${TABLES.CLASSES}(id, class_name)
              `);

            if (retryError) {
              throw retryError;
            }
            feeStructuresData = retryData || [];
          } else {
            throw feeStructuresError;
          }
        } else {
          feeStructuresData = data || [];
        }
      } catch (error) {
        console.error('Failed to load fee structures:', error);
        feeStructuresData = [];
      }
      
      // Process fee structures to group by class
      const processedFeeStructures = [];
      
      // Group fee structures by class_id
      const groupedByClass = {};
      feeStructuresData.forEach(fee => {
        if (!groupedByClass[fee.class_id]) {
          groupedByClass[fee.class_id] = {
            classId: fee.class_id,
            name: fee.classes?.class_name || 'Unknown Class',
            fees: []
          };
        }
        
        // Fix invalid dates before adding to the group
        let fixedDueDate = fee.due_date;
        if (fixedDueDate) {
          const parsedDate = parseDate(fixedDueDate);
          if (parsedDate) {
            fixedDueDate = formatDateForDb(parsedDate);
          } else {
            console.warn('Invalid due_date found:', fee.due_date, 'for fee:', fee.id);
            fixedDueDate = null;
          }
        }

        groupedByClass[fee.class_id].fees.push({
          id: fee.id,
          type: fee.type,
          amount: fee.amount,
          dueDate: fixedDueDate,
          description: fee.description
        });
      });
      
      // Convert grouped object to array
      Object.values(groupedByClass).forEach(classGroup => {
        processedFeeStructures.push(classGroup);
      });
      
      setFeeStructures(processedFeeStructures || []);

      // Load students
      const { data: studentsData, error: studentsError } = await supabase
        .from(TABLES.STUDENTS)
        .select(`
          *,
          classes:${TABLES.CLASSES}(class_name)
        `);

      if (studentsError) throw studentsError;
      setStudents(studentsData || []);

      // Load payments - handle invalid dates
      let paymentsData = [];
      try {
        const { data, error: paymentsError } = await supabase
          .from(TABLES.STUDENT_FEES)
          .select(`
            *,
            students:${TABLES.STUDENTS}(full_name),
            fee_structure:${TABLES.FEE_STRUCTURE}(*)
          `);

        if (paymentsError) {
          console.error('Error loading payments:', paymentsError);
          // If there's a date error, try to fix it first
          if (paymentsError.message && paymentsError.message.includes('date/time field value out of range')) {
            console.log('🔧 Detected invalid date error in payments, attempting to fix...');
            await fixInvalidDatesInDatabase();
            // Try loading again after fix
            const { data: retryData, error: retryError } = await supabase
              .from(TABLES.STUDENT_FEES)
              .select(`
                *,
                students:${TABLES.STUDENTS}(full_name),
                fee_structure:${TABLES.FEE_STRUCTURE}(*)
              `);

            if (retryError) {
              console.error('Still failed after fix:', retryError);
              paymentsData = [];
            } else {
              paymentsData = retryData || [];
            }
          } else {
            throw paymentsError;
          }
        } else {
          paymentsData = data || [];
        }
      } catch (error) {
        console.error('Failed to load payments:', error);
        paymentsData = [];
      }

      // Process payments to fix invalid dates
      const processedPayments = (paymentsData || []).map(payment => {
        let fixedPaymentDate = payment.payment_date;
        if (fixedPaymentDate) {
          const parsedDate = parseDate(fixedPaymentDate);
          if (parsedDate) {
            fixedPaymentDate = formatDateForDb(parsedDate);
          } else {
            console.warn('Invalid payment_date found:', payment.payment_date, 'for payment:', payment.id);
            fixedPaymentDate = null;
          }
        }

        return {
          ...payment,
          payment_date: fixedPaymentDate
        };
      });

      setPayments(processedPayments);

      // Calculate fee statistics
      await calculateFeeStats();

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle fee operations (add/edit)
  const handleFeeOperation = async (operation, feeData) => {
    if (!feeData || !feeData.type || !feeData.amount) {
      Alert.alert('Error', 'Missing required fee information');
      return;
    }
    
    try {
      setPaymentLoading(true);
      
      const { error } = await supabase
        .from(TABLES.FEE_STRUCTURE)
        .upsert([
          {
            id: operation === 'edit' ? feeData.id : undefined,
            class_id: operation === 'edit' ? feeData.classId : selectedClassId,
            type: operation === 'edit' ? feeData.type : newFeeStructure.type,
            amount: operation === 'edit' ? feeData.amount : newFeeStructure.amount,
            due_date: operation === 'edit' ? feeData.dueDate : newFeeStructure.dueDate,
            description: operation === 'edit' ? feeData.description : newFeeStructure.description
          }
        ])
        .select();

      if (error) throw error;
      
      await loadAllData();
      if (operation === 'edit') {
        setFeeModal({ visible: false, classId: '', fee: { type: '', amount: '', dueDate: '', description: '' } });
        setEditFeeId(null);
        Alert.alert('Success', 'Fee updated successfully');
      } else {
        setFeeStructureModal(false);
        setNewFeeStructure({ type: '', amount: '', dueDate: '', description: '' });
        Alert.alert('Success', 'Fee added successfully');
      }

    } catch (error) {
      console.error('Error handling fee operation:', error);
      Alert.alert('Error', operation === 'edit' ? 'Failed to update fee' : 'Failed to add fee');
    } finally {
      setPaymentLoading(false);
    }
  };
  
  // Handle edit fee
  const handleEditFee = async (classId, feeId, fee) => {
    if (!feeId || !fee.type || !fee.amount) {
      Alert.alert('Error', 'Missing required fee information');
      return;
    }
    
    try {
      setPaymentLoading(true);
      
      const { error } = await supabase
        .from(TABLES.FEE_STRUCTURE)
        .update({
          type: fee.type,
          amount: fee.amount,
          due_date: fee.dueDate,
          description: fee.description
        })
        .eq('id', feeId);

      if (error) throw error;
      
      await loadAllData();
      setFeeModal({ visible: false, classId: '', fee: { type: '', amount: '', dueDate: '', description: '' } });
      setEditFeeId(null);
      Alert.alert('Success', 'Fee updated successfully');

    } catch (error) {
      console.error('Error editing fee:', error);
      Alert.alert('Error', 'Failed to update fee');
    } finally {
      setPaymentLoading(false);
    }
  };

  // Handle payment
  const handlePayment = async (studentId, feeId, amount) => {
    if (!studentId || !amount) {
      Alert.alert('Error', 'Missing required payment information');
      return;
    }
    
    try {
      setPaymentLoading(true);
      
      // First check if there's an existing record
      const { data: existingFee, error: checkError } = await supabase
        .from(TABLES.STUDENT_FEES)
        .select('*')
        .eq('student_id', studentId)
        .eq('fee_id', feeId)
        .single();
        
      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is the error code for no rows returned
        throw checkError;
      }
      
      // Get the fee structure to know the total amount
      const { data: feeStructure, error: feeStructureError } = await supabase
        .from(TABLES.FEE_STRUCTURE)
        .select('amount')
        .eq('id', feeId)
        .single();
        
      if (feeStructureError) throw feeStructureError;
      
      const totalAmount = feeStructure.amount;
      const amountPaid = parseFloat(amount);
      let status = 'partial';
      
      // If payment is complete
      if (amountPaid >= totalAmount) {
        status = 'paid';
      }
      
      // If there's an existing record, update it
      if (existingFee) {
        const newAmountPaid = existingFee.amount_paid + amountPaid;
        const newStatus = newAmountPaid >= totalAmount ? 'paid' : 'partial';
        
        const { error: updateError } = await supabase
          .from(TABLES.STUDENT_FEES)
          .update({
            amount_paid: newAmountPaid,
            payment_date: paymentDate.toISOString(),
            status: newStatus
          })
          .eq('id', existingFee.id);
          
        if (updateError) throw updateError;
      } else {
        // Create a new payment record
        const { error: insertError } = await supabase
          .from(TABLES.STUDENT_FEES)
          .insert([
            {
              student_id: studentId,
              fee_id: feeId,
              amount_paid: amountPaid,
              payment_date: paymentDate.toISOString(),
              status: status
            }
          ]);

        if (insertError) throw insertError;
      }

      // Refresh data
      await loadAllData();
      Alert.alert('Success', 'Payment recorded successfully');
      setPaymentModal(false);
      setSelectedStudent(null);
      setSelectedFee(null);
      setPaymentAmount('');
      setPaymentDate(new Date());

    } catch (error) {
      console.error('Error adding payment:', error);
      Alert.alert('Error', 'Failed to record payment');
    } finally {
      setPaymentLoading(false);
    }
  };

  // Open fee modal
  const openFeeModal = (classId, fee = null) => {
    if (!classId) {
      Alert.alert('Error', 'Class ID is required');
      return;
    }
    
    if (fee) {
      // Edit existing fee
      setFeeModal({
        visible: true,
        classId,
        fee: {
          id: fee.id,
          type: fee.type,
          amount: fee.amount.toString(),
          dueDate: fee.dueDate,
          description: fee.description || ''
        }
      });
      setEditFeeId(fee.id);
    } else {
      // Add new fee
      setFeeModal({
        visible: true,
        classId,
        fee: { type: '', amount: '', dueDate: '', description: '' }
      });
      setEditFeeId(null);
    }
  };

  // Handle date change
  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      // Ensure we have a valid date
      const validDate = parseDate(selectedDate);
      if (!validDate) {
        Alert.alert('Error', 'Invalid date selected');
        return;
      }

      if (paymentModal) {
        setPaymentDate(validDate);
      } else if (feeModal.visible) {
        setFeeModal(prev => ({
          ...prev,
          fee: {
            ...prev.fee,
            dueDate: formatDateForDb(validDate)
          }
        }));
      } else if (feeStructureModal) {
        setNewFeeStructure(prev => ({
          ...prev,
          dueDate: formatDateForDb(validDate)
        }));
      }
    }
  };

  // Handle delete structure
  const handleDeleteStructure = async (feeId) => {
    if (!feeId) {
      Alert.alert('Error', 'Invalid fee structure ID');
      return;
    }
    
    try {
      setPaymentLoading(true);
      
      // First check if there are any student fees associated with this fee structure
      const { data: associatedFees, error: checkError } = await supabase
        .from(TABLES.STUDENT_FEES)
        .select('id')
        .eq('fee_id', feeId);
        
      if (checkError) throw checkError;
      
      if (associatedFees && associatedFees.length > 0) {
        Alert.alert(
          'Cannot Delete', 
          'This fee structure has associated student payments. Please remove those first.'
        );
        return;
      }
      
      // If no associated fees, proceed with deletion
      const { error } = await supabase
        .from(TABLES.FEE_STRUCTURE)
        .delete()
        .eq('id', feeId);

      if (error) throw error;

      // Refresh data
      await loadAllData();
      Alert.alert('Success', 'Fee structure deleted successfully');

    } catch (error) {
      console.error('Error deleting fee structure:', error);
      Alert.alert('Error', 'Failed to delete fee structure');
    } finally {
      setPaymentLoading(false);
    }
  };
  
  // Handle delete fee
  const handleDeleteFee = async (fee) => {
    if (!fee || !fee.id) {
      Alert.alert('Error', 'Invalid fee ID');
      return;
    }
    
    try {
      setPaymentLoading(true);
      
      // First check if there are any student fees associated with this fee
      const { data: associatedFees, error: checkError } = await supabase
        .from(TABLES.STUDENT_FEES)
        .select('id')
        .eq('fee_id', fee.id);
        
      if (checkError) throw checkError;
      
      if (associatedFees && associatedFees.length > 0) {
        Alert.alert(
          'Cannot Delete', 
          'This fee has associated student payments. Please remove those first.'
        );
        return;
      }
      
      // If no associated fees, proceed with deletion
      const { error } = await supabase
        .from(TABLES.FEE_STRUCTURE)
        .delete()
        .eq('id', fee.id);

      if (error) throw error;

      // Refresh data
      await loadAllData();
      Alert.alert('Success', 'Fee deleted successfully');

    } catch (error) {
      console.error('Error deleting fee:', error);
      Alert.alert('Error', 'Failed to delete fee');
    } finally {
      setPaymentLoading(false);
    }
  };

  // Handle add fee structure
  const handleAddFeeStructure = async () => {
    if (!selectedClassId || !newFeeStructure.type || !newFeeStructure.amount || !newFeeStructure.dueDate) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }
    
    try {
      setPaymentLoading(true);
      const { error } = await supabase
        .from(TABLES.FEE_STRUCTURE)
        .insert({
          class_id: selectedClassId,
          type: newFeeStructure.type,
          amount: parseFloat(newFeeStructure.amount),
          due_date: newFeeStructure.dueDate,
          description: newFeeStructure.description
        });

      if (error) throw error;

      // Refresh data
      await loadAllData();
      setFeeStructureModal(false);
      setNewFeeStructure({
        type: '',
        amount: '',
        dueDate: '',
        description: ''
      });
      Alert.alert('Success', 'Fee structure added successfully');

    } catch (error) {
      console.error('Error adding fee structure:', error);
      Alert.alert('Error', 'Failed to add fee structure');
    } finally {
      setPaymentLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Fee Management" navigation={navigation} />

      {/* Temporary Debug Button - Remove after fixing dates */}
      <TouchableOpacity
        style={styles.debugButton}
        onPress={fixInvalidDatesInDatabase}
      >
        <Ionicons name="build" size={16} color="#fff" />
        <Text style={styles.debugButtonText}>Fix Invalid Dates</Text>
      </TouchableOpacity>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1976d2" />
        </View>
      ) : (
        <View style={styles.contentWrapper}>
          <ScrollView
            style={styles.scrollView}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={loadAllData}
              />
            }
          >
            {/* Tab Navigation */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, tab === 'structure' && styles.activeTab]}
                onPress={() => setTab('structure')}
              >
                <Text style={tab === 'structure' ? styles.activeTabText : styles.tabText}>Fee Structure</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, tab === 'payments' && styles.activeTab]}
                onPress={() => setTab('payments')}
              >
                <Text style={tab === 'payments' ? styles.activeTabText : styles.tabText}>Payments</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, tab === 'pending' && styles.activeTab]}
                onPress={() => setTab('pending')}
              >
                <Text style={tab === 'pending' ? styles.activeTabText : styles.tabText}>Pending Fees</Text>
              </TouchableOpacity>
            </View>

            {/* Tab Content */}
            <Animatable.View 
              style={styles.tabContent}
              animation="fadeInUp"
              duration={800}
            >
              {tab === 'structure' ? (
                <View style={styles.content}>
                  <Text style={styles.sectionTitle}>Fee Structure</Text>
                  <TouchableOpacity style={styles.addButton} onPress={() => setFeeStructureModal(true)}>
                    <Text style={styles.addButtonText}>Add Fee Structure</Text>
                  </TouchableOpacity>
                  <FlatList
                    data={feeStructures}
                    keyExtractor={(item) => item.classId}
                    renderItem={({ item }) => (
                      <TouchableOpacity 
                        style={[styles.classItem, expandedClass === item.classId && styles.expanded]}
                        onPress={() => setExpandedClass(expandedClass === item.classId ? null : item.classId)}
                      >
                        <View style={styles.classHeader}>
                          <Text style={styles.className}>{item.name}</Text>
                          <Ionicons 
                            name={expandedClass === item.classId ? "chevron-up" : "chevron-down"} 
                            size={24} 
                            color="#666"
                          />
                        </View>
                        {expandedClass === item.classId && (
                          <View style={styles.feesList}>
                            {item.fees && item.fees.map((fee, feeIndex) => (
                              <View key={feeIndex} style={styles.feeItem}>
                                <View>
                                  <Text style={styles.feeType}>{fee.type}</Text>
                                  <Text>{fee.description}</Text>
                                  <Text>Due: {
                                    (() => {
                                      try {
                                        const dueDate = fee.dueDate || fee.due_date;
                                        if (!dueDate) return 'No due date';
                                        const parsedDate = parseDate(dueDate);
                                        return parsedDate ? format(parsedDate, 'dd MMM yyyy') : 'Invalid date';
                                      } catch (error) {
                                        return 'Invalid date';
                                      }
                                    })()
                                  }</Text>
                                </View>
                                <View style={styles.feeAmount}>
                                  <Text>{formatCurrency(fee.amount)}</Text>
                                </View>
                                <View style={styles.feeActions}>
                                  <TouchableOpacity onPress={() => openFeeModal(item.classId, fee)}>
                                     <Ionicons name="pencil" size={24} color="#4CAF50" />
                                   </TouchableOpacity>
                                  <TouchableOpacity onPress={() => handleDeleteFee(fee)}>
                                     <Ionicons name="trash" size={24} color="#F44336" />
                                   </TouchableOpacity>
                                </View>
                              </View>
                            ))}
                            <TouchableOpacity 
                              style={styles.addFeeButton} 
                              onPress={() => {
                                setFeeModal({
                                  visible: true,
                                  classId: item.classId,
                                  fee: {
                                    id: '',
                                    type: '',
                                    amount: '',
                                    dueDate: '',
                                    description: ''
                                  }
                                });
                                setEditFeeId(null);
                              }}
                            >
                              <Ionicons name="add" size={20} color="#fff" />
                              <Text style={styles.addFeeButtonText}>Add Fee</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </TouchableOpacity>
                    )}
                  />
                </View>
              ) : tab === 'payments' ? (
                <View style={styles.content}>
                  <Text style={styles.sectionTitle}>Payments</Text>
                  <View style={styles.paymentsContainer}>
                    {/* Payments content will go here */}
                  </View>
                </View>
              ) : (
                <View style={styles.content}>
                  <Text style={styles.sectionTitle}>Pending Fees</Text>
                  <FlatList
                    data={students}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => {
                      const classFees = feeStructures.find(cls => cls.classId === item.class_id)?.fees || [];
                      const totalFee = classFees.reduce((sum, fee) => sum + (fee.amount || 0), 0);
                      const studentPayments = payments.filter(payment => payment.student_id === item.id);
                      const paidAmount = studentPayments.reduce((sum, payment) => sum + (payment.amount_paid || 0), 0);
                      const pendingAmount = totalFee - paidAmount;

                      if (pendingAmount <= 0) return null;

                      return (
                        <TouchableOpacity
                          style={styles.studentItem}
                          onPress={() => {
                            setSelectedStudent(item);
                            setSelectedFee(classFees[0]);
                            setPaymentAmount('');
                            setPaymentDate(new Date());
                            setPaymentModal(true);
                          }}
                        >
                          <View style={styles.studentHeader}>
                            <Text style={styles.studentName}>{item.full_name}</Text>
                            <Text style={styles.studentClass}>{item.classes?.class_name || 'Unknown Class'}</Text>
                          </View>
                          <View style={styles.studentFooter}>
                            <Text style={styles.studentPending}>Pending: {formatCurrency(pendingAmount)}</Text>
                            <Text style={styles.studentPaid}>Paid: {formatCurrency(paidAmount)}</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    }}
                  />
                </View>
              )}
            </Animatable.View>

            {/* Fee Collection Chart */}
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Fee Collection Overview</Text>
              <CrossPlatformPieChart
                data={[
                  { name: 'Paid', population: feeStats.totalPaid, color: '#2196F3', legendFontColor: '#333' },
                  { name: 'Pending', population: feeStats.totalDue - feeStats.totalPaid, color: '#F44336', legendFontColor: '#333' }
                ]}
                width={Dimensions.get('window').width - 32}
                height={200}
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                }}
                style={{
                  borderRadius: 16,
                }}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
              />
            </View>
          </ScrollView>
        </View>
      )}

    {/* Modal for Payment, Fee Edit/Add, and Fee Structure */}
    <Modal
      animationType="slide"
      transparent={true}
      visible={paymentModal || feeModal.visible || feeStructureModal}
      onRequestClose={() => {
        if (paymentModal) {
          setPaymentModal(false);
        } else if (feeModal.visible) {
          setFeeModal({ visible: false, classId: '', fee: { type: '', amount: '', dueDate: '', description: '' } });
        } else {
          setFeeStructureModal(false);
        }
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {paymentModal ? (
            <Text style={styles.modalTitle}>Make Payment</Text>
          ) : feeModal.visible ? (
            <Text style={styles.modalTitle}>
              {editFeeId ? 'Edit Fee' : 'Add New Fee'}
            </Text>
          ) : (
            <Text style={styles.modalTitle}>Add New Fee Structure</Text>
          )}
          {paymentModal ? (
            <View>
              <Text style={styles.studentInfo}>Student: {selectedStudent?.name}</Text>
              <Text style={styles.studentInfo}>Fee: {selectedFee?.type}</Text>
              <Text style={styles.studentInfo}>Amount: {formatCurrency(paymentAmount)}</Text>
              <Text style={styles.studentInfo}>Payment Date: {format(paymentDate, 'MMM dd, yyyy')}</Text>
              <TextInput
                style={styles.input}
                value={paymentAmount}
                onChangeText={setPaymentAmount}
                placeholder="Enter payment amount"
                keyboardType="numeric"
              />
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateButtonText}>Select Payment Date</Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={paymentDate}
                  mode="date"
                  is24Hour={true}
                  display="default"
                  onChange={handleDateChange}
                />
              )}
            </View>
          ) : feeModal.visible ? (
            <View>
              <TextInput
                style={styles.input}
                placeholder="Fee Type"
                value={feeModal.fee.type}
                onChangeText={text => {
                  setFeeModal(prev => ({
                    ...prev,
                    fee: {
                      ...prev.fee,
                      type: text
                    }
                  }));
                }}
              />
              <TextInput
                style={styles.input}
                placeholder="Amount"
                value={feeModal.fee.amount}
                onChangeText={text => {
                  setFeeModal(prev => ({
                    ...prev,
                    fee: {
                      ...prev.fee,
                      amount: text
                    }
                  }));
                }}
                keyboardType="numeric"
              />
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateButtonText}>
                  {feeModal.fee.dueDate
                    ? format(new Date(feeModal.fee.dueDate), 'dd MMM yyyy')
                    : 'Select Due Date'}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={feeModal.fee.dueDate ? new Date(feeModal.fee.dueDate) : new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) {
                      setFeeModal(prev => ({
                        ...prev,
                        fee: {
                          ...prev.fee,
                          dueDate: selectedDate.toISOString()
                        }
                      }));
                    }
                  }}
                />
              )}
              <TextInput
                style={styles.input}
                placeholder="Description"
                value={feeModal.fee.description}
                onChangeText={text => {
                  setFeeModal(prev => ({
                    ...prev,
                    fee: {
                      ...prev.fee,
                      description: text
                    }
                  }));
                }}
                multiline
                numberOfLines={3}
              />
            </View>
          ) : (
            <View>
              <TextInput
                style={styles.input}
                placeholder="Fee Type"
                value={newFeeStructure.type}
                onChangeText={(text) => setNewFeeStructure({ ...newFeeStructure, type: text })}
              />
              <TextInput
                style={styles.input}
                placeholder="Amount"
                value={newFeeStructure.amount}
                onChangeText={(text) => setNewFeeStructure({ ...newFeeStructure, amount: text })}
                keyboardType="numeric"
                />
                <TouchableOpacity
                      style={styles.dateButton}
                      onPress={() => setShowDatePicker(true)}
                    >
                      <Text style={styles.dateButtonText}>
                        {newFeeStructure.dueDate ? format(new Date(newFeeStructure.dueDate), 'dd MMM yyyy') : 'Select Due Date'}
                      </Text>
                    </TouchableOpacity>
                    {showDatePicker && (
                      <DateTimePicker
                        value={newFeeStructure.dueDate ? new Date(newFeeStructure.dueDate) : new Date()}
                        mode="date"
                        display="default"
                        onChange={(event, selectedDate) => {
                          setShowDatePicker(false);
                          if (selectedDate) {
                            setNewFeeStructure({
                              ...newFeeStructure,
                              dueDate: selectedDate.toISOString()
                            });
                          }
                        }}
                      />
                    )}
                    <TextInput
                      style={styles.input}
                      placeholder="Description"
                      value={newFeeStructure.description}
                      onChangeText={(text) => setNewFeeStructure({ ...newFeeStructure, description: text })}
                      multiline
                    />
                  </View>
                )}
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => {
                      if (paymentModal) {
                        setPaymentModal(false);
                      } else if (feeModal.visible) {
                        setFeeModal({ visible: false, classId: '', fee: { type: '', amount: '', dueDate: '', description: '' } });
                      } else {
                        setFeeStructureModal(false);
                      }
                    }}
                  >
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.saveButton]}
                    onPress={() => {
                      if (paymentModal) {
                        handlePayment(selectedStudent?.id, selectedFee?.id, paymentAmount);
                      } else if (feeModal.visible) {
                        if (editFeeId) {
                          handleEditFee(feeModal.classId, editFeeId, feeModal.fee);
                        } else {
                          handleFeeOperation('add', feeModal.fee);
                        }
                      } else {
                        if (!selectedClassId || !newFeeStructure.type || !newFeeStructure.amount || !newFeeStructure.dueDate) {
                          Alert.alert('Error', 'Please fill all required fields');
                          return;
                        }
                        handleAddFeeStructure();
                      }
                    }}>
                    <Text style={styles.buttonText}>
                      {paymentModal
                        ? 'Pay'
                        : feeModal.visible
                        ? editFeeId
                          ? 'Update'
                          : 'Save'
                        : 'Add'}
                    </Text>
                  </TouchableOpacity>
                </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f8f8f8',
    marginRight: 8,
  },
  statCardLast: {
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  tabButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: '#1976d2',
  },
  tabActive: {
    backgroundColor: '#1976d2',
  },
  tabContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 14,
  },
  classList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  className: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  feeList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  feeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  feeType: {
    fontSize: 16,
    color: '#333',
  },
  feeAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976d2',
  },
  feeActions: {
    flexDirection: 'row',
    gap: 8,
  },
  addFeeButton: {
    backgroundColor: '#1976d2',
    padding: 8,
    borderRadius: 4,
  },
  addButton: {
    backgroundColor: '#1976d2',
    padding: 8,
    borderRadius: 4,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    width: '90%',
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
  },
  studentInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  dateButtonText: {
    fontSize: 14,
    color: '#666',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 24,
    gap: 12,
  },
  modalButton: {
    padding: 12,
    borderRadius: 8,
    minWidth: 100,
    marginRight: 8,
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  saveButton: {
    backgroundColor: '#2196F3',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
  studentInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  // Debug button styles (temporary)
  debugButton: {
    backgroundColor: '#FF5722',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  debugButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default FeeManagement;