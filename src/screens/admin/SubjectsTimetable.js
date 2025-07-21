import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Modal, TextInput, Button, Alert, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Header from '../../components/Header';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import Ionicons from 'react-native-vector-icons/Ionicons';

const mockTeachers = [
  { id: 't1', name: 'Alice Smith' },
  { id: 't2', name: 'Bob Johnson' },
  { id: 't3', name: 'Carol Lee' },
];

const mockClasses = [
  { id: 'c1', name: 'Class 1' },
  { id: 'c2', name: 'Class 2' },
  { id: 'c3', name: 'Class 3' },
];

const initialSubjects = [
  { id: 's1', name: 'Mathematics', code: 'MATH101', teacherId: 't1' },
  { id: 's2', name: 'Science', code: 'SCI101', teacherId: 't2' },
];

// Update initialTimetables to new structure
const initialTimetables = {
  c1: {
    Monday: [
      { id: 'p1', type: 'subject', subjectId: 's1', startTime: '09:00', endTime: '09:55' },
      { id: 'p2', type: 'subject', subjectId: 's2', startTime: '09:55', endTime: '10:50' },
      { id: 'p3', type: 'break', label: 'Tea Break', startTime: '10:50', endTime: '11:10' },
      { id: 'p4', type: 'subject', subjectId: 's2', startTime: '11:10', endTime: '12:05' },
      { id: 'p5', type: 'subject', subjectId: 's1', startTime: '12:05', endTime: '13:00' },
      { id: 'p6', type: 'break', label: 'Lunch Break', startTime: '13:00', endTime: '14:00' },
      { id: 'p7', type: 'subject', subjectId: 's1', startTime: '14:00', endTime: '15:00' },
    ],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
  },
  c2: {},
  c3: {},
};

// Helper to calculate duration in minutes
function getDuration(start, end) {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return (eh * 60 + em) - (sh * 60 + sm);
}

// Helper to format time (24h to 12h)
function formatTime(t) {
  let [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m.toString().padStart(2, '0')} ${ampm}`;
}

const SubjectsTimetable = () => {
  const [tab, setTab] = useState('subjects');
  const [subjects, setSubjects] = useState(initialSubjects);
  const [modalVisible, setModalVisible] = useState(false);
  const [editSubject, setEditSubject] = useState(null);
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '', teacherId: mockTeachers[0].id });
  const [selectedClass, setSelectedClass] = useState(mockClasses[0].id);
  const [timetables, setTimetables] = useState(initialTimetables);
  const [periodModal, setPeriodModal] = useState({ visible: false, day: '', period: null });
  const [periodForm, setPeriodForm] = useState({ type: 'subject', subjectId: '', label: '', startTime: '', endTime: '' });
  const [showTimePicker, setShowTimePicker] = useState({ visible: false, field: '', value: new Date() });
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Subject CRUD
  const openAddSubject = () => {
    setEditSubject(null);
    setSubjectForm({ name: '', code: '', teacherId: mockTeachers[0].id });
    setModalVisible(true);
  };
  const openEditSubject = (subject) => {
    setEditSubject(subject);
    setSubjectForm({ name: subject.name, code: subject.code, teacherId: subject.teacherId });
    setModalVisible(true);
  };
  const handleSaveSubject = () => {
    if (!subjectForm.name || !subjectForm.code) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    if (editSubject) {
      setSubjects(subjects.map(s => s.id === editSubject.id ? { ...editSubject, ...subjectForm } : s));
    } else {
      setSubjects([...subjects, { id: 's' + (subjects.length + 1), ...subjectForm }]);
    }
    setModalVisible(false);
  };
  const handleDeleteSubject = (id) => {
    Alert.alert('Delete Subject', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => setSubjects(subjects.filter(s => s.id !== id)) },
    ]);
  };

  // Timetable helpers
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const periods = [1, 2, 3, 4, 5, 6];
  const getSubjectName = (subjectId) => {
    const subj = subjects.find(s => s.id === subjectId);
    return subj ? subj.name : '-';
  };
  const handleAssignSubject = (day, period, subjectId) => {
    setTimetables(prev => {
      const classTT = { ...prev[selectedClass] };
      const dayTT = classTT[day] ? [...classTT[day]] : [];
      const idx = dayTT.findIndex(p => p.period === period);
      if (idx >= 0) {
        dayTT[idx].subjectId = subjectId;
      } else {
        dayTT.push({ period, subjectId });
      }
      classTT[day] = dayTT;
      return { ...prev, [selectedClass]: classTT };
    });
  };

  // Open add/edit period modal
  const openAddPeriod = (day) => {
    setPeriodForm({ type: 'subject', subjectId: subjects[0]?.id || '', label: '', startTime: '', endTime: '' });
    setPeriodModal({ visible: true, day, period: null });
  };
  const openEditPeriod = (day, period) => {
    setPeriodForm({ ...period });
    setPeriodModal({ visible: true, day, period });
  };
  const handleSavePeriod = () => {
    const { type, subjectId, label, startTime, endTime } = periodForm;
    if (!startTime || !endTime || (type === 'subject' && !subjectId) || (type === 'break' && !label)) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    setTimetables(prev => {
      const classTT = { ...prev[selectedClass] };
      const dayTT = classTT[periodModal.day] ? [...classTT[periodModal.day]] : [];
      if (periodModal.period) {
        // Edit
        const idx = dayTT.findIndex(p => p.id === periodModal.period.id);
        dayTT[idx] = { ...periodForm, id: periodModal.period.id };
      } else {
        // Add
        dayTT.push({ ...periodForm, id: 'p' + (Date.now()) });
      }
      classTT[periodModal.day] = dayTT;
      return { ...prev, [selectedClass]: classTT };
    });
    setPeriodModal({ visible: false, day: '', period: null });
  };
  const handleDeletePeriod = (day, id) => {
    setTimetables(prev => {
      const classTT = { ...prev[selectedClass] };
      const dayTT = classTT[day] ? [...classTT[day]] : [];
      classTT[day] = dayTT.filter(p => p.id !== id);
      return { ...prev, [selectedClass]: classTT };
    });
  };

  // Helper to handle time picker
  const openTimePicker = (field, initial) => {
    let [h, m] = initial ? initial.split(':').map(Number) : [9, 0];
    const date = new Date();
    date.setHours(h);
    date.setMinutes(m);
    setShowTimePicker({ visible: true, field, value: date });
  };
  const onTimePicked = (event, selectedDate) => {
    if (event.type === 'dismissed') {
      setShowTimePicker({ ...showTimePicker, visible: false });
      return;
    }
    const date = selectedDate || showTimePicker.value;
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    setPeriodForm(f => ({ ...f, [showTimePicker.field]: `${h}:${m}` }));
    setShowTimePicker({ ...showTimePicker, visible: false });
  };

  // Helper to get day name from date
  function getDayName(date) {
    return days[date.getDay() === 0 ? 6 : date.getDay() - 1]; // 0=Sunday, 1=Monday...
  }

  return (
    <View style={styles.container}>
      <Header title="Subjects & Timetable" showBack={true} />
      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tab, tab === 'subjects' && styles.activeTab]} onPress={() => setTab('subjects')}>
          <Text style={styles.tabText}>Subjects</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'timetable' && styles.activeTab]} onPress={() => setTab('timetable')}>
          <Text style={styles.tabText}>Timetable</Text>
        </TouchableOpacity>
      </View>
      {tab === 'subjects' ? (
        <View style={styles.content}>
          <FlatList
            data={subjects}
            keyExtractor={item => item.id}
            style={{ width: '100%', marginTop: 16 }}
            renderItem={({ item }) => (
              <View style={styles.subjectRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.subjectName}>{item.name} ({item.code})</Text>
                  <Text style={styles.subjectTeacher}>Teacher: {mockTeachers.find(t => t.id === item.teacherId)?.name || '-'}</Text>
                </View>
                <TouchableOpacity onPress={() => openEditSubject(item)} style={styles.actionBtn}>
                  <Ionicons name="pencil" size={20} color="#1976d2" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteSubject(item.id)} style={styles.actionBtn}>
                  <Ionicons name="trash" size={20} color="#d32f2f" />
                </TouchableOpacity>
              </View>
            )}
          />
          <Modal visible={modalVisible} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>{editSubject ? 'Edit Subject' : 'Add Subject'}</Text>
                <TextInput
                  placeholder="Subject Name"
                  value={subjectForm.name}
                  onChangeText={text => setSubjectForm(f => ({ ...f, name: text }))}
                  style={styles.input}
                />
                <TextInput
                  placeholder="Subject Code"
                  value={subjectForm.code}
                  onChangeText={text => setSubjectForm(f => ({ ...f, code: text }))}
                  style={styles.input}
                />
                <Text style={{ marginTop: 8 }}>Assign Teacher:</Text>
                <Picker
                  selectedValue={subjectForm.teacherId}
                  style={styles.input}
                  onValueChange={itemValue => setSubjectForm(f => ({ ...f, teacherId: itemValue }))}
                >
                  {mockTeachers.map(t => (
                    <Picker.Item key={t.id} label={t.name} value={t.id} />
                  ))}
                </Picker>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
                  <Button title="Cancel" onPress={() => setModalVisible(false)} />
                  <Button title="Save" onPress={handleSaveSubject} />
                </View>
              </View>
            </View>
          </Modal>
          {/* Floating Add Button */}
          <TouchableOpacity style={styles.fab} onPress={openAddSubject}>
            <Text style={styles.fabIcon}>+</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.content}>
          <Text style={styles.title}>Class Timetable</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <TouchableOpacity onPress={() => setSelectedDate(d => { const nd = new Date(d); nd.setDate(nd.getDate() - 1); return nd; })}>
              <Text style={{ fontSize: 28, marginHorizontal: 12 }}>{'<'}</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 18, fontWeight: 'bold', minWidth: 120, textAlign: 'center' }}>{format(selectedDate, 'dd MMM yyyy')}</Text>
            <TouchableOpacity onPress={() => setSelectedDate(d => { const nd = new Date(d); nd.setDate(nd.getDate() + 1); return nd; })}>
              <Text style={{ fontSize: 28, marginHorizontal: 12 }}>{'>'}</Text>
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ marginRight: 8, fontWeight: 'bold', fontSize: 16 }}>Select Class:</Text>
            <View style={{
              flex: 1,
              backgroundColor: '#fff',
              borderWidth: 1,
              borderColor: '#ccc',
              borderRadius: 6,
              overflow: 'hidden',
              height: 56,
              minHeight: 44,
              alignSelf: 'stretch',
              justifyContent: 'center',
              paddingHorizontal: 4,
            }}>
              <Picker
                selectedValue={selectedClass}
                style={{ color: '#222', backgroundColor: '#fff', width: '100%', height: 56, minHeight: 44, fontSize: 16 }}
                onValueChange={setSelectedClass}
              >
                {mockClasses.map(c => (
                  <Picker.Item key={c.id} label={c.name} value={c.id} />
                ))}
              </Picker>
            </View>
          </View>
          {/* Show only the selected day's timetable */}
          {(() => {
            const dayName = getDayName(selectedDate);
            const dayTT = timetables[selectedClass]?.[dayName] ? [...timetables[selectedClass][dayName]] : [];
            dayTT.sort((a, b) => a.startTime.localeCompare(b.startTime));
            return (
              <View key={dayName} style={styles.dayBlock}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.dayTitle}>{dayName}</Text>
                  <TouchableOpacity style={styles.addPeriodBtn} onPress={() => openAddPeriod(dayName)}>
                    <Text style={styles.addPeriodBtnText}>+ Add Period</Text>
                  </TouchableOpacity>
                </View>
                {dayTT.length === 0 && <Text style={{ color: '#888', marginVertical: 8 }}>No periods added.</Text>}
                {dayTT.map(period => {
                  const duration = getDuration(period.startTime, period.endTime);
                  let subject, teacherName;
                  if (period.type === 'subject') {
                    subject = subjects.find(s => s.id === period.subjectId);
                    teacherName = subject ? (mockTeachers.find(t => t.id === subject.teacherId)?.name || '-') : '-';
                  }
                  return (
                    <View key={period.id} style={styles.periodCard}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.periodTitle}>
                            {period.type === 'subject' && subject ? `${subject.name} (${subject.code})` : period.label}
                          </Text>
                          <Text style={styles.periodTime}>
                            {formatTime(period.startTime)} - {formatTime(period.endTime)} ({duration} min)
                          </Text>
                          {period.type === 'subject' && (
                            <Text style={styles.periodTeacher}>{teacherName}</Text>
                          )}
                        </View>
                        <View style={{ flexDirection: 'row' }}>
                          <TouchableOpacity style={styles.actionBtn} onPress={() => openEditPeriod(dayName, period)}>
                            <Ionicons name="pencil" size={20} color="#1976d2" />
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.deletePeriodBtn} onPress={() => handleDeletePeriod(dayName, period.id)}>
                            <Ionicons name="trash" size={20} color="#d32f2f" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            );
          })()}
        </ScrollView>
      )}

      {/* Period Modal */}
      <Modal visible={periodModal.visible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{periodModal.period ? 'Edit Period' : 'Add Period'}</Text>
            <View style={{ flexDirection: 'row', marginBottom: 8 }}>
              <TouchableOpacity
                style={[styles.typeBtn, periodForm.type === 'subject' && styles.activeTypeBtn]}
                onPress={() => setPeriodForm(f => ({ ...f, type: 'subject' }))}
              >
                <Text>Subject</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeBtn, periodForm.type === 'break' && styles.activeTypeBtn]}
                onPress={() => setPeriodForm(f => ({ ...f, type: 'break' }))}
              >
                <Text>Break</Text>
              </TouchableOpacity>
            </View>
            {periodForm.type === 'subject' ? (
              <>
                <Text style={{ marginTop: 8 }}>Subject:</Text>
                <Picker
                  selectedValue={periodForm.subjectId}
                  style={styles.input}
                  onValueChange={itemValue => setPeriodForm(f => ({ ...f, subjectId: itemValue }))}
                >
                  {subjects.map(s => (
                    <Picker.Item key={s.id} label={s.name} value={s.id} />
                  ))}
                </Picker>
              </>
            ) : (
              <>
                <TextInput
                  placeholder="Break Label (e.g., Tea Break, Lunch Break)"
                  value={periodForm.label}
                  onChangeText={text => setPeriodForm(f => ({ ...f, label: text }))}
                  style={styles.input}
                />
              </>
            )}
            <TouchableOpacity
              style={styles.input}
              onPress={() => openTimePicker('startTime', periodForm.startTime)}
            >
              <Text>{periodForm.startTime ? `Start Time: ${formatTime(periodForm.startTime)}` : 'Select Start Time'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.input}
              onPress={() => openTimePicker('endTime', periodForm.endTime)}
            >
              <Text>{periodForm.endTime ? `End Time: ${formatTime(periodForm.endTime)}` : 'Select End Time'}</Text>
            </TouchableOpacity>
            {showTimePicker.visible && (
              <DateTimePicker
                value={showTimePicker.value}
                mode="time"
                is24Hour={true}
                display="clock"
                onChange={onTimePicked}
              />
            )}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
              <Button title="Cancel" onPress={() => setPeriodModal({ visible: false, day: '', period: null })} />
              <Button title="Save" onPress={handleSavePeriod} />
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
    paddingTop: 28, // Increased for mobile header spacing
    paddingBottom: 8, // Keep lower padding
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
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    elevation: 1,
  },
  subjectName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  subjectTeacher: {
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  dayBlock: {
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    elevation: 1,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    backgroundColor: '#007bff',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabIcon: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: -2,
  },
  addPeriodBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#e0e0e0',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  addPeriodBtnText: {
    fontSize: 16,
    color: '#007bff',
    fontWeight: 'bold',
  },
  deletePeriodBtn: {
    marginLeft: 8,
    padding: 4,
    borderRadius: 4,
    backgroundColor: '#ffdddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deletePeriodIcon: {
    fontSize: 18,
    color: '#d00',
  },
  periodTeacher: {
    marginLeft: 8,
    fontSize: 14,
    color: '#555',
    minWidth: 80,
  },
  periodCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  periodTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a237e',
  },
  periodTime: {
    fontSize: 14,
    color: '#333',
    marginTop: 2,
  },
  periodTeacher: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  typeBtn: {
    flex: 1,
    padding: 8,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    alignItems: 'center',
  },
  activeTypeBtn: {
    backgroundColor: '#e3f2fd',
    borderColor: '#1976d2',
  },
});

export default SubjectsTimetable; 