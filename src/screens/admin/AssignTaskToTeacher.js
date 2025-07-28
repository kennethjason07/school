import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Button, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import DateTimePicker from '@react-native-community/datetimepicker';
import DropDownPicker from 'react-native-dropdown-picker';
import { supabase, dbHelpers } from '../../utils/supabase';

// Priorities and statuses
const priorities = ['Low', 'Medium', 'High'];
const statuses = ['Pending', 'In Progress', 'Completed'];

const AssignTaskToTeacher = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'Medium',
    status: 'Pending',
    teacher_ids: []
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [teacherSearch, setTeacherSearch] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      // Load tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .order('due_date', { ascending: true });
      if (tasksError) throw tasksError;
      setTasks(tasksData);

      // Load teachers
      const { data: teachersData, error: teachersError } = await supabase
        .from('teachers')
        .select('*')
        .order('name', { ascending: true });
      if (teachersError) throw teachersError;
      setTeachers(teachersData);

    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load tasks and teachers');
    } finally {
      setLoading(false);
    }
  };

  // Helper to format date as DD-MM-YYYY
  function formatDateDMY(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  // Filtered tasks
  const filteredTasks = tasks.filter(task => {
    const matchesStatus = filterStatus === 'All' || task.status === filterStatus;
    const matchesSearch = task.title.toLowerCase().includes(search.toLowerCase()) ||
      task.teachers.some(tid => teachers.find(t => t.id === tid)?.name.toLowerCase().includes(search.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  // Filtered teachers for selection
  const filteredTeachers = teachers.filter(t => t.name.toLowerCase().includes(teacherSearch.toLowerCase()));

  // Open modal for new/edit task
  const openModal = (task = null) => {
    setEditTask(task);
    if (task) {
      setForm({ 
        ...task,
        teacher_ids: task.teacher_ids || [],
        dueDate: task.due_date
      });
    } else {
      setForm({
        title: '',
        description: '',
        dueDate: '',
        priority: 'Medium',
        status: 'Pending',
        teacher_ids: []
      });
    }
    setModalVisible(true);
  };

  // Save (add/edit) task
  const handleSave = async () => {
    if (!form.title.trim() || !form.dueDate || form.teacher_ids.length === 0) {
      Alert.alert('Error', 'Please fill all required fields and select at least one teacher.');
      return;
    }

    try {
      if (editTask) {
        // Update existing task
        const { error: updateError } = await supabase
          .from('tasks')
          .update({
            title: form.title,
            description: form.description,
            due_date: form.dueDate,
            priority: form.priority,
            status: form.status,
            teacher_ids: form.teacher_ids
          })
          .eq('id', editTask.id);

        if (updateError) throw updateError;
      } else {
        // Create new task
        const { error: insertError } = await supabase
          .from('tasks')
          .insert({
            title: form.title,
            description: form.description,
            due_date: form.dueDate,
            priority: form.priority,
            status: form.status,
            teacher_ids: form.teacher_ids
          });

        if (insertError) throw insertError;
      }

      // Refresh data
      await loadAllData();
      setModalVisible(false);
      setEditTask(null);
      setForm({
        title: '',
        description: '',
        dueDate: '',
        priority: 'Medium',
        status: 'Pending',
        teacher_ids: []
      });

      Alert.alert('Success', editTask ? 'Task updated successfully!' : 'Task created successfully!');
    } catch (error) {
      console.error('Error saving task:', error);
      Alert.alert('Error', 'Failed to save task. Please try again.');
    }
  };

  // Delete task
  const handleDelete = async (taskId) => {
    try {
      Alert.alert(
        'Delete Task',
        'Are you sure you want to delete this task?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              const { error } = await supabase
                .from('tasks')
                .delete()
                .eq('id', taskId);

              if (error) throw error;

              // Refresh data
              await loadAllData();
              Alert.alert('Success', 'Task deleted successfully!');
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error deleting task:', error);
      Alert.alert('Error', 'Failed to delete task');
    }
  };

  // Toggle teacher selection
  const toggleTeacher = (teacherId) => {
    setForm(f => f.teacher_ids.includes(teacherId) 
      ? { ...f, teacher_ids: f.teacher_ids.filter(id => id !== teacherId) }
      : { ...f, teacher_ids: [...f.teacher_ids, teacherId] }
    );
  };

  // Date picker
  const handleDateChange = (event, date) => {
    setShowDatePicker(false);
    if (date) {
      setForm(f => ({ ...f, dueDate: date.toISOString().split('T')[0] }));
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Assign Task to Teacher" showBack={true} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Loading tasks and teachers...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Header title="Assign Task to Teacher" showBack={true} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadAllData}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Assign Task to Teacher" showBack={true} />
      {/* Search Bar */}
      <View style={styles.filterRowPolished}>
        <View style={styles.searchInputWrapper}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search tasks or teacher..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#aaa"
          />
          <Ionicons name="search" size={20} color="#888" style={styles.searchIconRight} />
        </View>
      </View>
      {/* Status Filter Row */}
      <View style={styles.statusFilterRowOuter}>
        <View style={styles.statusFilterRowInner}>
          <Text style={styles.filterLabel}>Status:</Text>
          <View style={styles.statusBtnRow}>
            {['All', ...statuses].map(item => (
              <TouchableOpacity
                key={item}
                onPress={() => setFilterStatus(item)}
                style={[styles.statusBtn, filterStatus === item && styles.statusBtnActive]}
                activeOpacity={0.8}
              >
                <Text style={filterStatus === item ? styles.statusBtnTextActive : styles.statusBtnText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
      {/* Task List */}
      <FlatList
        data={filteredTasks}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.taskCard} onPress={() => openModal(item)} activeOpacity={0.85}>
            <View style={styles.taskHeader}>
              <Text style={styles.taskTitle}>{item.title}</Text>
              <View style={styles.taskActions}>
                {/* Edit button removed, whole card is clickable */}
                <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}><Ionicons name="trash" size={26} color="#f44336" /></TouchableOpacity>
              </View>
            </View>
            <Text style={styles.taskDesc}>{item.description}</Text>
            <Text style={styles.taskMeta}>Due: {formatDateDMY(item.due_date)} | Priority: {item.priority} | <Text style={[styles.statusText, styles['statusText' + item.status.replace(/ /g, '')]]}>{item.status}</Text></Text>
            <Text style={styles.taskMeta}>Teachers: {item.teachers.map(tid => teachers.find(t => t.id === tid)?.name).join(', ')}</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        ListEmptyComponent={<Text style={styles.emptyText}>No tasks found.</Text>}
      />
      {/* Floating Add Button (FAB) */}
      <TouchableOpacity style={styles.fab} onPress={() => openModal()}>
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>
      {/* Add/Edit Task Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editTask ? 'Edit Task' : 'Assign New Task'}</Text>
            <TextInput
              style={styles.input}
              placeholder="Task Title*"
              value={form.title}
              onChangeText={text => setForm(f => ({ ...f, title: text }))}
            />
            <TextInput
              style={[styles.input, { height: 60 }]}
              placeholder="Description"
              value={form.description}
              onChangeText={text => setForm(f => ({ ...f, description: text }))}
              multiline
            />
            <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
              <Ionicons name="calendar" size={18} color="#1976d2" style={{ marginRight: 8 }} />
              <Text style={{ color: form.dueDate ? '#222' : '#aaa' }}>{form.dueDate ? formatDateDMY(form.dueDate) : 'Due Date*'}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={form.dueDate ? new Date(form.dueDate) : new Date()}
                mode="date"
                display="default"
                onChange={handleDateChange}
              />
            )}
            {/* Priority row */}
            <View style={styles.pickerColFull}>
              <Text style={styles.pickerLabel}>Priority</Text>
              <View style={styles.pickerRow}>
                {priorities.map(p => (
                  <TouchableOpacity key={p} style={[styles.pickerBtn, form.priority === p && styles.pickerBtnActive]} onPress={() => setForm(f => ({ ...f, priority: p }))}>
                    <Text style={form.priority === p ? styles.pickerBtnTextActive : styles.pickerBtnText}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            {/* Status row below priority */}
            <View style={styles.pickerColFull}>
              <Text style={styles.pickerLabel}>Status</Text>
              <View style={styles.pickerRow}>
                {statuses.map(s => (
                  <TouchableOpacity key={s} style={[styles.pickerBtn, form.status === s && styles.pickerBtnActive]} onPress={() => setForm(f => ({ ...f, status: s }))}>
                    <Text style={form.status === s ? styles.pickerBtnTextActive : styles.pickerBtnText}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            {/* Dropdown for assigning teachers */}
            <Text style={styles.pickerLabel}>Assign to Teacher(s)</Text>
            <DropDownPicker
              open={false}
              value={form.teacher_ids}
              items={teachers.map(t => ({ label: t.name, value: t.id }))}
              setOpen={() => {}}
              setValue={vals => setForm(f => ({ ...f, teacher_ids: vals }))}
              setItems={() => {}}
              multiple={true}
              min={1}
              placeholder="Select teacher(s)"
              style={styles.dropdown}
              containerStyle={styles.dropdownContainer}
              zIndex={3000}
            />
            <View style={styles.modalActions}>
              <Button title="Cancel" onPress={() => setModalVisible(false)} color="#888" />
              <Button title={editTask ? 'Update' : 'Assign'} onPress={handleSave} color="#1976d2" />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#f44336',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  filterRowPolished: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  searchIconRight: {
    marginRight: 8,
  },
  statusFilterRowOuter: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  statusFilterRowInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 16,
    color: '#333',
  },
  statusBtnRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statusBtn: {
    padding: 8,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#f0f0f0',
    backgroundColor: '#eee',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 0,
    flex: 1,
    alignItems: 'center',
  },
  statusBtnActive: { backgroundColor: '#1976d2' },
  statusBtnText: { color: '#1976d2', fontWeight: 'bold' },
  statusBtnTextActive: { color: '#fff', fontWeight: 'bold' },
  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1976d2', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10, alignSelf: 'flex-end', marginTop: 8 },
  addBtnText: { color: '#fff', fontWeight: 'bold', marginLeft: 6 },
  taskCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 14, elevation: 2 },
  taskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  taskTitle: { fontSize: 17, fontWeight: 'bold', color: '#222' },
  taskActions: { flexDirection: 'row' },
  editBtn: { marginRight: 10 },
  deleteBtn: {},
  taskDesc: { fontSize: 15, color: '#555', marginBottom: 4 },
  taskMeta: { fontSize: 13, color: '#888', marginBottom: 2 },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 40, fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 20, width: '92%', maxWidth: 420 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1976d2', marginBottom: 14 },
  input: { backgroundColor: '#f0f0f0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, marginBottom: 10 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  pickerCol: { flex: 1 },
  pickerLabel: { fontSize: 15, color: '#1976d2', marginBottom: 4, fontWeight: 'bold' },
  pickerRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 4 },
  pickerBtn: { backgroundColor: '#eee', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginRight: 6, marginBottom: 4 },
  pickerBtnActive: { backgroundColor: '#1976d2' },
  pickerBtnText: { color: '#333' },
  pickerBtnTextActive: { color: '#fff', fontWeight: 'bold' },
  teacherSelectRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  teacherChip: { backgroundColor: '#eee', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 7, marginRight: 8, marginBottom: 8 },
  teacherChipActive: { backgroundColor: '#1976d2' },
  teacherChipText: { color: '#333' },
  teacherChipTextActive: { color: '#fff', fontWeight: 'bold' },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    backgroundColor: '#1976d2',
    borderRadius: 32,
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#1976d2',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  statusPill: {
    backgroundColor: '#eee',
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    color: '#fff',
    fontSize: 13,
    overflow: 'hidden',
    marginLeft: 4,
    borderWidth: 2,
    borderColor: '#000',
  },
  statusPillPending: { backgroundColor: '#e53935' }, // red
  statusPillInProgress: { backgroundColor: '#1976d2' }, // blue
  statusPillCompleted: { backgroundColor: '#43a047' }, // green
  addBtnRow: {
    alignItems: 'center',
    marginBottom: 8,
  },
  addBtnModern: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1976d2',
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingVertical: 12,
    elevation: 2,
    shadowColor: '#1976d2',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  statusFilterList: {
    alignItems: 'center',
    paddingVertical: 2,
    paddingLeft: 0,
    paddingRight: 0,
  },
  addBtnRowPolished: {
    alignItems: 'center',
    marginBottom: 18,
    marginTop: 10,
  },
  addBtnModernPolished: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1976d2',
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingVertical: 12,
    elevation: 4,
    shadowColor: '#1976d2',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    marginBottom: 0,
  },
  filterRowPolished: {
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#eee',
    marginBottom: 8,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingVertical: 6,
  },
  searchIconRight: {
    marginLeft: 8,
  },
  dropdown: {
    borderColor: '#e0e0e0',
    borderRadius: 8,
    minHeight: 44,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  dropdownContainer: {
    marginBottom: 8,
    zIndex: 3000,
  },
  pickerColFull: {
    width: '100%',
    marginBottom: 12,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
    borderWidth: 2,
    borderColor: '#000',
    display: 'inline-block',
  },
  statusDotPending: { backgroundColor: '#e53935' }, // red
  statusDotInProgress: { backgroundColor: '#1976d2' }, // blue
  statusDotCompleted: { backgroundColor: '#43a047' }, // green
  statusText: {
    fontWeight: 'bold',
    marginLeft: 4,
  },
  statusTextPending: { color: '#e53935' }, // red
  statusTextInProgress: { color: '#1976d2' }, // blue
  statusTextCompleted: { color: '#43a047' }, // green
});

export default AssignTaskToTeacher; 