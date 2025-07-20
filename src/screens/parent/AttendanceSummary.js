import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from 'date-fns';
import { LineChart, BarChart } from 'react-native-chart-kit';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import Header from '../../components/Header';

const { width } = Dimensions.get('window');

// Mock attendance data - in real app, this would come from API
const MOCK_ATTENDANCE_DATA = {
  '2024-01': {
    '2024-01-01': { status: 'present', subject: 'All' },
    '2024-01-02': { status: 'present', subject: 'All' },
    '2024-01-03': { status: 'absent', subject: 'All', reason: 'Sick' },
    '2024-01-04': { status: 'present', subject: 'All' },
    '2024-01-05': { status: 'late', subject: 'All', reason: 'Traffic' },
    '2024-01-08': { status: 'present', subject: 'All' },
    '2024-01-09': { status: 'present', subject: 'All' },
    '2024-01-10': { status: 'excused', subject: 'All', reason: 'Family event' },
    '2024-01-11': { status: 'present', subject: 'All' },
    '2024-01-12': { status: 'present', subject: 'All' },
    '2024-01-15': { status: 'present', subject: 'All' },
    '2024-01-16': { status: 'present', subject: 'All' },
    '2024-01-17': { status: 'absent', subject: 'All', reason: 'Sick' },
    '2024-01-18': { status: 'present', subject: 'All' },
    '2024-01-19': { status: 'present', subject: 'All' },
    '2024-01-22': { status: 'present', subject: 'All' },
    '2024-01-23': { status: 'late', subject: 'All', reason: 'Overslept' },
    '2024-01-24': { status: 'present', subject: 'All' },
    '2024-01-25': { status: 'present', subject: 'All' },
    '2024-01-26': { status: 'present', subject: 'All' },
    '2024-01-29': { status: 'present', subject: 'All' },
    '2024-01-30': { status: 'present', subject: 'All' },
    '2024-01-31': { status: 'present', subject: 'All' },
  },
  '2024-02': {
    '2024-02-01': { status: 'present', subject: 'All' },
    '2024-02-02': { status: 'present', subject: 'All' },
    '2024-02-05': { status: 'present', subject: 'All' },
    '2024-02-06': { status: 'absent', subject: 'All', reason: 'Sick' },
    '2024-02-07': { status: 'present', subject: 'All' },
    '2024-02-08': { status: 'present', subject: 'All' },
    '2024-02-09': { status: 'present', subject: 'All' },
    '2024-02-12': { status: 'late', subject: 'All', reason: 'Traffic' },
    '2024-02-13': { status: 'present', subject: 'All' },
    '2024-02-14': { status: 'present', subject: 'All' },
    '2024-02-15': { status: 'present', subject: 'All' },
    '2024-02-16': { status: 'present', subject: 'All' },
    '2024-02-19': { status: 'present', subject: 'All' },
    '2024-02-20': { status: 'present', subject: 'All' },
    '2024-02-21': { status: 'present', subject: 'All' },
    '2024-02-22': { status: 'present', subject: 'All' },
    '2024-02-23': { status: 'present', subject: 'All' },
    '2024-02-26': { status: 'present', subject: 'All' },
    '2024-02-27': { status: 'present', subject: 'All' },
    '2024-02-28': { status: 'present', subject: 'All' },
    '2024-02-29': { status: 'present', subject: 'All' },
  },
  '2024-03': {
    '2024-03-01': { status: 'present', subject: 'All' },
    '2024-03-04': { status: 'present', subject: 'All' },
    '2024-03-05': { status: 'present', subject: 'All' },
    '2024-03-06': { status: 'absent', subject: 'All', reason: 'Sick' },
    '2024-03-07': { status: 'present', subject: 'All' },
    '2024-03-08': { status: 'present', subject: 'All' },
    '2024-03-11': { status: 'late', subject: 'All', reason: 'Traffic' },
    '2024-03-12': { status: 'present', subject: 'All' },
    '2024-03-13': { status: 'present', subject: 'All' },
    '2024-03-14': { status: 'present', subject: 'All' },
    '2024-03-15': { status: 'present', subject: 'All' },
    '2024-03-18': { status: 'present', subject: 'All' },
    '2024-03-19': { status: 'present', subject: 'All' },
    '2024-03-20': { status: 'present', subject: 'All' },
    '2024-03-21': { status: 'present', subject: 'All' },
    '2024-03-22': { status: 'present', subject: 'All' },
    '2024-03-25': { status: 'present', subject: 'All' },
    '2024-03-26': { status: 'present', subject: 'All' },
    '2024-03-27': { status: 'present', subject: 'All' },
    '2024-03-28': { status: 'present', subject: 'All' },
    '2024-03-29': { status: 'present', subject: 'All' },
  },
      '2024-04': {
      '2024-04-01': { status: 'present', subject: 'All' },
      '2024-04-02': { status: 'present', subject: 'All' },
      '2024-04-03': { status: 'present', subject: 'All' },
      '2024-04-04': { status: 'present', subject: 'All' },
      '2024-04-05': { status: 'present', subject: 'All' },
      '2024-04-08': { status: 'absent', subject: 'All', reason: 'Sick' },
      '2024-04-09': { status: 'present', subject: 'All' },
      '2024-04-10': { status: 'present', subject: 'All' },
      '2024-04-11': { status: 'present', subject: 'All' },
      '2024-04-12': { status: 'present', subject: 'All' },
      '2024-04-15': { status: 'present', subject: 'All' },
      '2024-04-16': { status: 'late', subject: 'All', reason: 'Overslept' },
      '2024-04-17': { status: 'present', subject: 'All' },
      '2024-04-18': { status: 'present', subject: 'All' },
      '2024-04-19': { status: 'present', subject: 'All' },
      '2024-04-22': { status: 'present', subject: 'All' },
      '2024-04-23': { status: 'present', subject: 'All' },
      '2024-04-24': { status: 'present', subject: 'All' },
      '2024-04-25': { status: 'present', subject: 'All' },
      '2024-04-26': { status: 'present', subject: 'All' },
      '2024-04-29': { status: 'present', subject: 'All' },
      '2024-04-30': { status: 'present', subject: 'All' },
    },
    '2024-05': {
      '2024-05-01': { status: 'present', subject: 'All' },
      '2024-05-02': { status: 'present', subject: 'All' },
      '2024-05-03': { status: 'present', subject: 'All' },
      '2024-05-06': { status: 'present', subject: 'All' },
      '2024-05-07': { status: 'absent', subject: 'All', reason: 'Sick' },
      '2024-05-08': { status: 'present', subject: 'All' },
      '2024-05-09': { status: 'present', subject: 'All' },
      '2024-05-10': { status: 'present', subject: 'All' },
      '2024-05-13': { status: 'present', subject: 'All' },
      '2024-05-14': { status: 'late', subject: 'All', reason: 'Traffic' },
      '2024-05-15': { status: 'present', subject: 'All' },
      '2024-05-16': { status: 'present', subject: 'All' },
      '2024-05-17': { status: 'present', subject: 'All' },
      '2024-05-20': { status: 'present', subject: 'All' },
      '2024-05-21': { status: 'present', subject: 'All' },
      '2024-05-22': { status: 'present', subject: 'All' },
      '2024-05-23': { status: 'present', subject: 'All' },
      '2024-05-24': { status: 'present', subject: 'All' },
      '2024-05-27': { status: 'present', subject: 'All' },
      '2024-05-28': { status: 'present', subject: 'All' },
      '2024-05-29': { status: 'present', subject: 'All' },
      '2024-05-30': { status: 'present', subject: 'All' },
      '2024-05-31': { status: 'present', subject: 'All' },
    },
    '2024-06': {
      '2024-06-01': { status: 'present', subject: 'All' },
      '2024-06-02': { status: 'present', subject: 'All' },
      '2024-06-03': { status: 'present', subject: 'All' },
      '2024-06-04': { status: 'present', subject: 'All' },
      '2024-06-05': { status: 'present', subject: 'All' },
      '2024-06-06': { status: 'absent', subject: 'All', reason: 'Sick' },
      '2024-06-07': { status: 'present', subject: 'All' },
      '2024-06-10': { status: 'present', subject: 'All' },
      '2024-06-11': { status: 'present', subject: 'All' },
      '2024-06-12': { status: 'present', subject: 'All' },
      '2024-06-13': { status: 'present', subject: 'All' },
      '2024-06-14': { status: 'present', subject: 'All' },
      '2024-06-17': { status: 'late', subject: 'All', reason: 'Overslept' },
      '2024-06-18': { status: 'present', subject: 'All' },
      '2024-06-19': { status: 'present', subject: 'All' },
      '2024-06-20': { status: 'present', subject: 'All' },
      '2024-06-21': { status: 'present', subject: 'All' },
      '2024-06-24': { status: 'present', subject: 'All' },
      '2024-06-25': { status: 'present', subject: 'All' },
      '2024-06-26': { status: 'present', subject: 'All' },
      '2024-06-27': { status: 'present', subject: 'All' },
      '2024-06-28': { status: 'present', subject: 'All' },
    }
};

const SUBJECTS = ['All', 'Maths', 'Science', 'English', 'History', 'Geography'];
const TERMS = ['All Terms', 'Term 1', 'Term 2', 'Term 3', 'Term 4'];

const MONTHS = [
  { label: 'January 2024', value: '2024-01' },
  { label: 'February 2024', value: '2024-02' },
  { label: 'March 2024', value: '2024-03' },
  { label: 'April 2024', value: '2024-04' },
  { label: 'May 2024', value: '2024-05' },
  { label: 'June 2024', value: '2024-06' },
  { label: 'July 2024', value: '2024-07' },
  { label: 'August 2024', value: '2024-08' },
  { label: 'September 2024', value: '2024-09' },
  { label: 'October 2024', value: '2024-10' },
  { label: 'November 2024', value: '2024-11' },
  { label: 'December 2024', value: '2024-12' },
];

const TERM_MONTHS = {
  'Term 1': ['2024-01', '2024-02', '2024-03', '2024-04'],
  'Term 2': ['2024-05', '2024-06', '2024-07', '2024-08'],
  'Term 3': ['2024-09', '2024-10'],
  'Term 4': ['2024-11', '2024-12'],
};

const MONTH_BG_COLORS = ['#f3f8fd', '#fdf7f3', '#f7fdf3']; // Light blue, light orange, light green

const AttendanceSummary = () => {
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedTerm, setSelectedTerm] = useState('Term 1');
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'summary'
  const [showFilters, setShowFilters] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [showTermPicker, setShowTermPicker] = useState(false);
  const [displayMonth, setDisplayMonth] = useState(new Date());
  // Add state for popup modal
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showMonthSelect, setShowMonthSelect] = useState(false);
  const [showTermSelect, setShowTermSelect] = useState(false);

  // Update displayMonth when selectedMonth changes (for specific months)
  useEffect(() => {
    if (selectedMonth !== 'all') {
      setDisplayMonth(new Date(selectedMonth));
    }
  }, [selectedMonth]);

  // Get data based on selected month or all months
  const getCurrentData = () => {
    if (selectedMonth === 'all') {
      // Combine all months data
      const allData = {};
      Object.keys(MOCK_ATTENDANCE_DATA).forEach(month => {
        Object.assign(allData, MOCK_ATTENDANCE_DATA[month]);
      });
      return allData;
    } else {
      // For specific month, use displayMonth to get the correct month data
      const monthKey = format(displayMonth, 'yyyy-MM');
      return MOCK_ATTENDANCE_DATA[monthKey] || {};
    }
  };

  const currentMonthData = getCurrentData();
  
  // Helper to get month label from value
  const getMonthLabel = (value) => {
    const m = MONTHS.find(m => m.value === value);
    return m ? m.label : value;
  };

  // Helper to get month range label for a term
  const getTermRangeLabel = (term) => {
    const months = TERM_MONTHS[term];
    if (months && months.length > 0) {
      const first = getMonthLabel(months[0]).split(' ')[0];
      const last = getMonthLabel(months[months.length - 1]).split(' ')[0];
      return `${first} to ${last}`;
    }
    return '';
  };

  // Helper to get next/previous term
  const getNextTerm = (current) => {
    const idx = TERMS.indexOf(current);
    if (idx > 0 && idx < TERMS.length - 1) return TERMS[idx + 1];
    if (idx === TERMS.length - 1) return TERMS[1]; // wrap to first term
    return TERMS[1];
  };
  const getPrevTerm = (current) => {
    const idx = TERMS.indexOf(current);
    if (idx > 1) return TERMS[idx - 1];
    if (idx === 1) return TERMS[TERMS.length - 1]; // wrap to last term
    return TERMS[TERMS.length - 1];
  };

  // Get month days for calendar view
  const getMonthDays = () => {
    if (selectedTerm && selectedTerm !== 'All Terms') {
      // Show all days from the first to last month in the selected term
      const months = TERM_MONTHS[selectedTerm];
      if (months && months.length > 0) {
        const start = startOfMonth(new Date(months[0]));
        const end = endOfMonth(new Date(months[months.length - 1]));
        return eachDayOfInterval({ start, end });
      }
    }
    // Default: show selected month
    return eachDayOfInterval({
      start: startOfMonth(displayMonth),
      end: endOfMonth(displayMonth)
    });
  };

  const monthDays = getMonthDays();

  // Calendar title logic
  let calendarTitle = '';
  if (selectedTerm && selectedTerm !== 'All Terms') {
    const months = TERM_MONTHS[selectedTerm];
    if (months && months.length > 0) {
      calendarTitle = `Term Calendar: ${getMonthLabel(months[0]).split(' ')[0]} to ${getMonthLabel(months[months.length - 1]).split(' ')[0]}`;
    } else {
      calendarTitle = 'Term Calendar';
    }
  } else {
    calendarTitle = `Monthly Calendar: ${getMonthLabel(format(displayMonth, 'yyyy-MM'))}`;
  }

  const getAttendanceStats = () => {
    const stats = { present: 0, absent: 0, late: 0, excused: 0, total: 0 };
    
    Object.values(currentMonthData).forEach(day => {
      if (day.status) {
        stats[day.status]++;
        stats.total++;
      }
    });

    return {
      ...stats,
      percentage: stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0
    };
  };

  const getAttendanceColor = (status) => {
    switch (status) {
      case 'present': return '#4CAF50';
      case 'absent': return '#F44336';
      case 'late': return '#FF9800';
      case 'excused': return '#9C27B0';
      default: return '#E0E0E0';
    }
  };

  const getAttendanceIcon = (status) => {
    switch (status) {
      case 'present': return 'checkmark-circle';
      case 'absent': return 'close-circle';
      case 'late': return 'time';
      case 'excused': return 'medical';
      default: return 'help-circle';
    }
  };

  // Placeholders for school and student info
  const SCHOOL_INFO = {
    name: 'Springfield Public School',
    address: '123 Main St, Springfield, USA',
    logoUrl: 'https://via.placeholder.com/60x60?text=Logo',
  };
  // Placeholders for student info
  const STUDENT_INFO = {
    name: 'John Doe',
    class: '5A',
    rollNo: '123',
    section: 'A',
    profilePicUrl: '', // If empty, show placeholder
  };

  // Helper to generate a calendar table for a given month
  function getCalendarTableHtml(month, year, attendanceData) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startWeekday = firstDay.getDay(); // 0=Sun
    const daysInMonth = lastDay.getDate();
    let html = '<table class="calendar-table"><tr>';
    ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(d => {
      html += `<th>${d}</th>`;
    });
    html += '</tr><tr>';
    for (let i = 0; i < startWeekday; i++) html += '<td></td>';
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      const att = attendanceData[dateStr];
      const statusClass = att ? att.status : '';
      html += `<td class="${statusClass}">${day}</td>`;
      if ((startWeekday + day) % 7 === 0) html += '</tr><tr>';
    }
    html += '</tr></table>';
    return html;
  }

  // Update generateAttendanceReport to accept a mode parameter
  const generateAttendanceReport = async (mode = 'month', value = null) => {
    console.log('Download report:', { mode, value }); // TEST LOG
    const stats = getAttendanceStats();
    const monthName = format(new Date(selectedMonth), 'MMMM yyyy');
    const profilePic = STUDENT_INFO.profilePicUrl
      ? `<img src="${STUDENT_INFO.profilePicUrl}" class="profile-img" />`
      : `<div class="profile-placeholder"></div>`;

    let dataToInclude = {};
    let calendarHtml = '';
    if (mode === 'month' && value) {
      dataToInclude = MOCK_ATTENDANCE_DATA[value] || {};
      const [year, month] = value.split('-').map(Number);
      calendarHtml = getCalendarTableHtml(month - 1, year, dataToInclude);
    } else if (mode === 'term' && value) {
      const months = TERM_MONTHS[value];
      if (months && months.length > 0) {
        calendarHtml = months.map(m => {
          const [year, month] = m.split('-').map(Number);
          const monthData = MOCK_ATTENDANCE_DATA[m] || {};
          return `<div style="margin-bottom:24px"><div style="font-weight:bold;margin-bottom:4px;">${getMonthLabel(m)}</div>${getCalendarTableHtml(month - 1, year, monthData)}</div>`;
        }).join('');
      }
    } else if (mode === 'overall') {
      // Only render the first two months for performance testing
      const months = Object.keys(MOCK_ATTENDANCE_DATA).slice(0, 2);
      console.log('Rendering months in overall report:', months);
      calendarHtml = months.map(m => {
        const [year, month] = m.split('-').map(Number);
        const monthData = MOCK_ATTENDANCE_DATA[m] || {};
        return `<div style="margin-bottom:24px"><div style="font-weight:bold;margin-bottom:4px;">${getMonthLabel(m)}</div>${getCalendarTableHtml(month - 1, year, monthData)}</div>`;
      }).join('');
    } else {
      // Default to current month
      dataToInclude = currentMonthData;
      const [year, month] = format(displayMonth, 'yyyy-MM').split('-').map(Number);
      calendarHtml = getCalendarTableHtml(month - 1, year, dataToInclude);
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .school-header { display: flex; align-items: center; margin-bottom: 16px; }
            .school-logo { width: 60px; height: 60px; border-radius: 8px; margin-right: 16px; }
            .student-info { display: flex; align-items: center; margin-bottom: 16px; }
            .profile-pic { width: 60px; height: 60px; border-radius: 30px; background: #eee; margin-right: 16px; display: flex; align-items: center; justify-content: center; }
            .profile-img { width: 60px; height: 60px; border-radius: 30px; }
            .profile-placeholder { width: 60px; height: 60px; border-radius: 30px; background: #ccc; }
            .student-details { font-size: 15px; color: #333; }
            .student-name { font-size: 20px; font-weight: bold; color: #1976d2; margin-bottom: 2px; }
            .stats { display: flex; justify-content: space-around; margin: 20px 0; }
            .stat-box { text-align: center; padding: 15px; border: 1px solid #ddd; border-radius: 8px; min-width: 90px; }
            .calendar-table { border-collapse: collapse; width: 100%; margin-top: 16px; }
            .calendar-table th, .calendar-table td { width: 40px; height: 40px; text-align: center; border: 1px solid #ddd; }
            .calendar-table th { background: #f5f5f5; color: #1976d2; }
            .present { background: #4CAF50; color: #fff; }
            .absent { background: #F44336; color: #fff; }
            .late { background: #FF9800; color: #fff; }
            .excused { background: #9C27B0; color: #fff; }
          </style>
        </head>
        <body>
          <div class="school-header">
            <img src="${SCHOOL_INFO.logoUrl}" class="school-logo" />
            <div>
              <h1 style="margin:0;">${SCHOOL_INFO.name}</h1>
              <p style="margin:0;">${SCHOOL_INFO.address}</p>
            </div>
          </div>
          <div class="student-info">
            <div class="profile-pic">${profilePic}</div>
            <div class="student-details">
              <div class="student-name">${STUDENT_INFO.name}</div>
              <div>Class: ${STUDENT_INFO.class} &nbsp; Roll No: ${STUDENT_INFO.rollNo}</div>
              <div>Section: ${STUDENT_INFO.section}</div>
            </div>
          </div>
          <div class="stats">
            <div class="stat-box">
              <h3>Present</h3>
              <p>${stats.present}</p>
            </div>
            <div class="stat-box">
              <h3>Absent</h3>
              <p>${stats.absent}</p>
            </div>
            <div class="stat-box">
              <h3>Late</h3>
              <p>${stats.late}</p>
            </div>
            <div class="stat-box">
              <h3>Excused</h3>
              <p>${stats.excused}</p>
            </div>
            <div class="stat-box">
              <h3>Attendance %</h3>
              <p>${stats.percentage}%</p>
            </div>
          </div>
          <div class="calendar">
            <h3>Attendance Calendar</h3>
            ${calendarHtml}
          </div>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share Attendance Report'
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to generate report');
    }
  };

  const chartData = {
    labels: ['Present', 'Absent', 'Late', 'Excused'],
    datasets: [{
      data: [
        getAttendanceStats().present,
        getAttendanceStats().absent,
        getAttendanceStats().late,
        getAttendanceStats().excused
      ]
    }]
  };

  const trendData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [{
      data: [95, 88, 92, 96],
      color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
      strokeWidth: 2
    }]
  };

  // Group days by month for rendering
  const groupedMonthDays = monthDays.reduce((acc, day) => {
    const monthKey = format(day, 'yyyy-MM');
    if (!acc[monthKey]) acc[monthKey] = [];
    acc[monthKey].push(day);
    return acc;
  }, {});

  return (
    <View style={styles.container}>
      <Header title="Attendance Summary" showBack={true} />
      
      <ScrollView style={styles.content}>
        {/* Filters Section */}
        <View style={styles.filtersSection}>
          <TouchableOpacity 
            style={styles.filterButton} 
            onPress={() => setShowFilters(!showFilters)}
          >
            <Ionicons name="filter" size={20} color="#2196F3" />
            <View style={styles.filterButtonTextContainer}>
              <Text style={styles.filterButtonText}>Filters</Text>
              <Text style={styles.filterButtonSubtext}>
                {selectedMonth === 'all' ? 'All Months' : format(new Date(selectedMonth), 'MMM yyyy')} • {selectedSubject} • {selectedTerm}
              </Text>
            </View>
            <Ionicons 
              name={showFilters ? "chevron-up" : "chevron-down"} 
              size={20} 
              color="#2196F3" 
            />
          </TouchableOpacity>

          {showFilters && (
            <View style={styles.filtersContainer}>
              <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>Month:</Text>
                <TouchableOpacity 
                  style={styles.dropdownButton}
                  onPress={() => setShowMonthPicker(true)}
                >
                  <Text style={styles.dropdownButtonText}>
                    {selectedMonth === 'all' ? 'All Months' : MONTHS.find(m => m.value === selectedMonth)?.label || 'Select Month'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#666" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>Subject:</Text>
                <TouchableOpacity 
                  style={styles.dropdownButton}
                  onPress={() => setShowSubjectPicker(true)}
                >
                  <Text style={styles.dropdownButtonText}>
                    {selectedSubject}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#666" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>Term:</Text>
                <TouchableOpacity 
                  style={styles.dropdownButton}
                  onPress={() => setShowTermPicker(true)}
                >
                  <Text style={styles.dropdownButtonText}>
                    {selectedTerm}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#666" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* View Mode Toggle */}
        <View style={styles.viewToggle}>
          <TouchableOpacity 
            style={[styles.toggleButton, viewMode === 'calendar' && styles.activeToggle]}
            onPress={() => setViewMode('calendar')}
          >
            <Ionicons name="calendar" size={20} color={viewMode === 'calendar' ? '#fff' : '#666'} />
            <Text style={[styles.toggleText, viewMode === 'calendar' && styles.activeToggleText]}>
              Calendar
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleButton, viewMode === 'summary' && styles.activeToggle]}
            onPress={() => setViewMode('summary')}
          >
            <Ionicons name="stats-chart" size={20} color={viewMode === 'summary' ? '#fff' : '#666'} />
            <Text style={[styles.toggleText, viewMode === 'summary' && styles.activeToggleText]}>
              Summary
            </Text>
          </TouchableOpacity>
        </View>

        {/* Enhanced Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, styles.mainStatCard]}>
            <View style={styles.statIconContainer}>
              <Ionicons name="trending-up" size={24} color="#2196F3" />
            </View>
            <Text style={styles.statNumber}>{getAttendanceStats().percentage}%</Text>
            <Text style={styles.statLabel}>Attendance</Text>
            <Text style={styles.statSubtext}>Overall</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${getAttendanceStats().percentage}%` }]} />
            </View>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            </View>
            <Text style={styles.statNumber}>{getAttendanceStats().present}</Text>
            <Text style={styles.statLabel}>Present</Text>
            <Text style={styles.statSubtext}>Days</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="close-circle" size={24} color="#F44336" />
            </View>
            <Text style={styles.statNumber}>{getAttendanceStats().absent}</Text>
            <Text style={styles.statLabel}>Absent</Text>
            <Text style={styles.statSubtext}>Days</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="time" size={24} color="#FF9800" />
            </View>
            <Text style={styles.statNumber}>{getAttendanceStats().late}</Text>
            <Text style={styles.statLabel}>Late</Text>
            <Text style={styles.statSubtext}>Days</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="medical" size={24} color="#9C27B0" />
            </View>
            <Text style={styles.statNumber}>{getAttendanceStats().excused}</Text>
            <Text style={styles.statLabel}>Excused</Text>
            <Text style={styles.statSubtext}>Days</Text>
          </View>
        </View>

        {viewMode === 'calendar' ? (
          /* Calendar View */
          <View style={styles.calendarContainer}>
            <Text style={styles.sectionTitle}>Monthly Calendar</Text>
            <View style={styles.calendarHeaderRow}>
              <View style={styles.navButtonContainer}>
                <TouchableOpacity
                  style={styles.calendarNavButton}
                  onPress={() => {
                    if (selectedTerm && selectedTerm !== 'All Terms') {
                      setSelectedTerm(getPrevTerm(selectedTerm));
                    } else {
                      const newMonth = new Date(displayMonth);
                      newMonth.setMonth(newMonth.getMonth() - 1);
                      setDisplayMonth(newMonth);
                    }
                  }}
                >
                  <Ionicons name="chevron-back" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              <Text style={styles.currentMonthLabel}>
                {selectedTerm && selectedTerm !== 'All Terms'
                  ? getTermRangeLabel(selectedTerm)
                  : getMonthLabel(format(displayMonth, 'yyyy-MM'))}
              </Text>
              <View style={styles.navButtonContainer}>
                <TouchableOpacity
                  style={styles.calendarNavButton}
                  onPress={() => {
                    if (selectedTerm && selectedTerm !== 'All Terms') {
                      setSelectedTerm(getNextTerm(selectedTerm));
                    } else {
                      const newMonth = new Date(displayMonth);
                      newMonth.setMonth(newMonth.getMonth() + 1);
                      setDisplayMonth(newMonth);
                    }
                  }}
                >
                  <Ionicons name="chevron-forward" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
            
            {selectedMonth === 'all' && (
              <Text style={styles.calendarNote}>
                Showing 3-month overview with attendance indicators
              </Text>
            )}
            
            {/* Calendar Header */}
            <View style={styles.calendarHeader}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <Text key={day} style={styles.calendarHeaderText}>
                  {day}
                </Text>
              ))}
            </View>
            
            {/* Calendar Grid */}
            <View style={styles.calendarGrid}>
              {Object.entries(groupedMonthDays).map(([monthKey, days], idx) => {
                const monthIndex = new Date(monthKey + '-01').getMonth() % 3;
                const monthBgColor = MONTH_BG_COLORS[monthIndex];
                const monthName = getMonthLabel(monthKey).split(' ')[0];
                return (
                  <React.Fragment key={monthKey}>
                    <View style={[styles.monthLabelContainer, { backgroundColor: monthBgColor }]}> 
                      <Text style={styles.monthLabelText}>{monthName}</Text>
                    </View>
                    {days.map(day => {
                      const dateStr = format(day, 'yyyy-MM-dd');
                      const attendance = currentMonthData[dateStr];
                      const isCurrentDay = isToday(day);
                      const isCurrentMonth = day.getMonth() === displayMonth.getMonth();
                      return (
                        <View key={dateStr} style={[
                          styles.calendarDay,
                          isCurrentDay && styles.currentDay,
                          !isCurrentMonth && styles.otherMonthDay,
                          { backgroundColor: monthBgColor },
                        ]}>
                          <Text style={[
                            styles.dayNumber,
                            isCurrentDay && styles.currentDayText,
                            !isCurrentMonth && styles.otherMonthText
                          ]}>
                            {format(day, 'd')}
                          </Text>
                          {attendance && (
                            <View style={[styles.attendanceIndicator, { backgroundColor: getAttendanceColor(attendance.status) }]}>
                              <Ionicons
                                name={getAttendanceIcon(attendance.status)}
                                size={10}
                                color="#fff"
                              />
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </View>
            
            {/* Enhanced Legend */}
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
                <Text style={styles.legendText}>Present</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#F44336' }]} />
                <Text style={styles.legendText}>Absent</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#FF9800' }]} />
                <Text style={styles.legendText}>Late</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#9C27B0' }]} />
                <Text style={styles.legendText}>Excused</Text>
              </View>
            </View>
            
            {/* Quick Stats for Calendar View */}
            <View style={styles.calendarStats}>
              <View style={styles.calendarStatItem}>
                <Text style={styles.calendarStatNumber}>{getAttendanceStats().total}</Text>
                <Text style={styles.calendarStatLabel}>Total Days</Text>
              </View>
              <View style={styles.calendarStatItem}>
                <Text style={styles.calendarStatNumber}>{getAttendanceStats().percentage}%</Text>
                <Text style={styles.calendarStatLabel}>Attendance</Text>
              </View>
              <View style={styles.calendarStatItem}>
                <Text style={styles.calendarStatNumber}>{getAttendanceStats().present}</Text>
                <Text style={styles.calendarStatLabel}>Present</Text>
              </View>
            </View>
          </View>
        ) : (
          /* Summary View */
          <View style={styles.summaryContainer}>
            <Text style={styles.sectionTitle}>Attendance Summary</Text>
            
            {/* Bar Chart */}
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Attendance Distribution</Text>
              <BarChart
                data={chartData}
                width={width - 40}
                height={220}
                yAxisLabel=""
                chartConfig={{
                  backgroundColor: '#fff',
                  backgroundGradientFrom: '#fff',
                  backgroundGradientTo: '#fff',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: {
                    borderRadius: 16
                  },
                  barPercentage: 0.7,
                }}
                style={styles.chart}
              />
            </View>
            
            {/* Trend Chart */}
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Weekly Attendance Trend</Text>
              <LineChart
                data={trendData}
                width={width - 40}
                height={220}
                chartConfig={{
                  backgroundColor: '#fff',
                  backgroundGradientFrom: '#fff',
                  backgroundGradientTo: '#fff',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: {
                    borderRadius: 16
                  },
                  propsForDots: {
                    r: '6',
                    strokeWidth: '2',
                    stroke: '#4CAF50'
                  }
                }}
                bezier
                style={styles.chart}
              />
            </View>
          </View>
        )}

        {/* Download Button at the bottom */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowMonthSelect(true)}
          >
            <Ionicons name="download" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Download Report</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Month Picker Modal */}
      <Modal
        visible={showMonthPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMonthPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Month</Text>
              <TouchableOpacity onPress={() => setShowMonthPicker(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={MONTHS}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    selectedMonth === item.value && styles.selectedModalItem
                  ]}
                  onPress={() => {
                    setSelectedMonth(item.value);
                    setShowMonthPicker(false);
                  }}
                >
                  <Text style={[
                    styles.modalItemText,
                    selectedMonth === item.value && styles.selectedModalItemText
                  ]}>
                    {item.label}
                  </Text>
                  {selectedMonth === item.value && (
                    <Ionicons name="checkmark" size={20} color="#2196F3" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Subject Picker Modal */}
      <Modal
        visible={showSubjectPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSubjectPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Subject</Text>
              <TouchableOpacity onPress={() => setShowSubjectPicker(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={SUBJECTS}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    selectedSubject === item && styles.selectedModalItem
                  ]}
                  onPress={() => {
                    setSelectedSubject(item);
                    setShowSubjectPicker(false);
                  }}
                >
                  <Text style={[
                    styles.modalItemText,
                    selectedSubject === item && styles.selectedModalItemText
                  ]}>
                    {item}
                  </Text>
                  {selectedSubject === item && (
                    <Ionicons name="checkmark" size={20} color="#2196F3" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Term Picker Modal */}
      <Modal
        visible={showTermPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTermPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Term</Text>
              <TouchableOpacity onPress={() => setShowTermPicker(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={TERMS}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    selectedTerm === item && styles.selectedModalItem
                  ]}
                  onPress={() => {
                    setSelectedTerm(item);
                    setShowTermPicker(false);
                  }}
                >
                  <Text style={[
                    styles.modalItemText,
                    selectedTerm === item && styles.selectedModalItemText
                  ]}>
                    {item}
                  </Text>
                  {selectedTerm === item && (
                    <Ionicons name="checkmark" size={20} color="#2196F3" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Month selection modal */}
      <Modal
        visible={showMonthSelect}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMonthSelect(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.downloadModalContent}>
            <Text style={styles.downloadModalTitle}>Select Month</Text>
            {MONTHS.map(m => (
              <TouchableOpacity
                key={m.value}
                style={styles.downloadOption}
                onPress={() => {
                  setShowMonthSelect(false);
                  setTimeout(async () => {
                    // School and student info
                    const schoolName = 'Springfield Public School';
                    const schoolLogoUrl = '';
                    const studentName = 'John Doe';
                    const profilePicUrl = '';
                    const monthLabel = m.label;
                    // Attendance data for the selected month
                    const [year, month] = m.value.split('-').map(Number);
                    const monthData = MOCK_ATTENDANCE_DATA[m.value] || {};
                    const firstDay = new Date(year, month - 1, 1);
                    const lastDay = new Date(year, month, 0);
                    const startWeekday = firstDay.getDay();
                    const daysInMonth = lastDay.getDate();
                    let calendarTable = '<table border="1"><tr>';
                    ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(d => { calendarTable += `<th>${d}</th>`; });
                    calendarTable += '</tr><tr>';
                    for (let i = 0; i < startWeekday; i++) calendarTable += '<td></td>';
                    for (let day = 1; day <= daysInMonth; day++) {
                      const dateStr = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                      const att = monthData[dateStr];
                      const statusClass = att ? att.status : '';
                      calendarTable += `<td class="${statusClass}">${day}</td>`;
                      if ((startWeekday + day) % 7 === 0) calendarTable += '</tr><tr>';
                    }
                    calendarTable += '</tr></table>';
                    // Legend HTML
                    const legendHtml = `
                      <div style="display:flex;gap:16px;margin-top:16px;align-items:center;justify-content:center;">
                        <span style="display:flex;align-items:center;"><span style="display:inline-block;width:16px;height:16px;background:#4CAF50;border-radius:4px;margin-right:6px;"></span>Present</span>
                        <span style="display:flex;align-items:center;"><span style="display:inline-block;width:16px;height:16px;background:#F44336;border-radius:4px;margin-right:6px;"></span>Absent</span>
                        <span style="display:flex;align-items:center;"><span style="display:inline-block;width:16px;height:16px;background:#FF9800;border-radius:4px;margin-right:6px;"></span>Late</span>
                        <span style="display:flex;align-items:center;"><span style="display:inline-block;width:16px;height:16px;background:#9C27B0;border-radius:4px;margin-right:6px;"></span>Excused</span>
                      </div>
                    `;
                    // Profile picture HTML
                    const profilePic = profilePicUrl
                      ? `<img src="${profilePicUrl}" style="width:60px;height:60px;border-radius:30px;margin-right:16px;" />`
                      : `<div style="width:60px;height:60px;border-radius:30px;background:#ccc;margin-right:16px;display:inline-block;"></div>`;
                    // School logo HTML with placeholder
                    const schoolLogo = schoolLogoUrl
                      ? `<img src="${schoolLogoUrl}" style="width:60px;height:60px;border-radius:8px;margin-right:16px;" />`
                      : `<div style="width:60px;height:60px;border-radius:8px;background:#eee;margin-right:16px;display:inline-block;"></div>`;
                    const htmlContent = `
                      <html>
                        <head>
                          <style>
                            .present { background: #4CAF50; color: #fff; }
                            .absent { background: #F44336; color: #fff; }
                            .late { background: #FF9800; color: #fff; }
                            .excused { background: #9C27B0; color: #fff; }
                          </style>
                        </head>
                        <body>
                          <h1>Attendance Report</h1>
                          <div style="display:flex;align-items:center;margin-bottom:16px;">
                            ${schoolLogo}
                            ${profilePic}
                            <div>
                              <strong>School:</strong> ${schoolName}<br/>
                              <strong>Student:</strong> ${studentName}<br/>
                              <strong>Month:</strong> ${monthLabel}
                            </div>
                          </div>
                          ${calendarTable}
                          ${legendHtml}
                        </body>
                      </html>
                    `;
                    try {
                      const { uri } = await Print.printToFileAsync({ html: htmlContent });
                      await Sharing.shareAsync(uri, {
                        mimeType: 'application/pdf',
                        dialogTitle: 'Share Attendance Report',
                      });
                    } catch (error) {
                      Alert.alert('Error', 'Failed to generate PDF');
                    }
                  }, 300);
                }}
              >
                <Text style={styles.downloadOptionText}>{m.label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.downloadCancel}
              onPress={() => setShowMonthSelect(false)}
            >
              <Text style={styles.downloadCancelText}>Cancel</Text>
            </TouchableOpacity>
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
  content: {
    flex: 1,
    padding: 16,
  },
  filtersSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterButtonTextContainer: {
    flex: 1,
    marginLeft: 8,
  },
  filterButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2196F3',
  },
  filterButtonSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  filtersContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  filterLabel: {
    width: 70,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  dropdownButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dropdownButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    elevation: 2,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  activeToggle: {
    backgroundColor: '#2196F3',
  },
  toggleText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeToggleText: {
    color: '#fff',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    marginBottom: 16,
    rowGap: 12,
    columnGap: 12,
  },
  statCard: {
    flexGrow: 1,
    minWidth: (width - 64) / 3,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginHorizontal: 6,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  statSubtext: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
    marginTop: 2,
  },
  mainStatCard: {
    minWidth: (width - 64) / 1.5,
    backgroundColor: '#e3f2fd',
    borderWidth: 2,
    borderColor: '#2196F3',
    marginHorizontal: 6,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 2,
  },
  calendarContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  calendarNavButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: '#1976d2',
  },
  navButtonContainer: {
    alignItems: 'center',
    minWidth: 80,
  },
  navButtonLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
    fontWeight: '500',
  },
  currentMonthLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  summaryContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    flex: 1,
    textAlign: 'center',
  },
  calendarNote: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  calendarHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  calendarHeaderText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: (width - 64) / 7,
    height: 45,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    position: 'relative',
  },
  currentDay: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196F3',
  },
  otherMonthDay: {
    backgroundColor: '#f8f9fa',
  },
  dayNumber: {
    fontSize: 13,
    color: '#333',
  },
  currentDayText: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  otherMonthText: {
    color: '#999',
  },
  attendanceIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  calendarStatItem: {
    alignItems: 'center',
  },
  calendarStatNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  calendarStatLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 4,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  chartContainer: {
    marginBottom: 24,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    borderRadius: 12,
    paddingVertical: 16,
    marginHorizontal: 4,
    elevation: 2,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedModalItem: {
    backgroundColor: '#e3f2fd',
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
  },
  selectedModalItemText: {
    color: '#2196F3',
    fontWeight: '600',
  },
  monthLabelContainer: {
    width: '100%',
    paddingVertical: 4,
    alignItems: 'center',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    marginTop: 8,
  },
  monthLabelText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1976d2',
    letterSpacing: 1,
  },
  // New styles for download modal
  downloadModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  downloadModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  downloadOption: {
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  downloadOptionText: {
    fontSize: 16,
    color: '#333',
  },
  downloadCancel: {
    paddingVertical: 15,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  downloadCancelText: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '600',
  },
});

export default AttendanceSummary; 