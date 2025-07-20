import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Modal, 
  ScrollView, 
  Alert,
  Dimensions,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';

const { width } = Dimensions.get('window');

// Dummy data for report cards
const DUMMY_REPORT_CARDS = [
  {
    id: '1',
    examName: 'Final Term Examination',
    examDate: '2024-12-15',
    academicYear: '2024-2025',
    class: '5A',
    studentName: 'Rahul Kumar',
    rollNumber: '101',
    subjects: [
      { name: 'Mathematics', marksObtained: 85, maxMarks: 100, grade: 'A', remarks: 'Excellent work in algebra and geometry' },
      { name: 'English', marksObtained: 78, maxMarks: 100, grade: 'B+', remarks: 'Good comprehension skills, needs improvement in grammar' },
      { name: 'Science', marksObtained: 92, maxMarks: 100, grade: 'A+', remarks: 'Outstanding performance in practical work' },
      { name: 'Social Studies', marksObtained: 88, maxMarks: 100, grade: 'A', remarks: 'Very good understanding of historical events' },
      { name: 'Hindi', marksObtained: 82, maxMarks: 100, grade: 'A-', remarks: 'Good reading and writing skills' }
    ],
    totalMarks: 425,
    maxTotalMarks: 500,
    averagePercentage: 85,
    overallGrade: 'A',
    rank: 3,
    classTeacher: 'Mrs. Sarah Johnson',
    principal: 'Mr. David Wilson'
  },
  {
    id: '2',
    examName: 'Mid Term Examination',
    examDate: '2024-10-20',
    academicYear: '2024-2025',
    class: '5A',
    studentName: 'Rahul Kumar',
    rollNumber: '101',
    subjects: [
      { name: 'Mathematics', marksObtained: 82, maxMarks: 100, grade: 'A-', remarks: 'Good progress in arithmetic' },
      { name: 'English', marksObtained: 75, maxMarks: 100, grade: 'B+', remarks: 'Improving in vocabulary and writing' },
      { name: 'Science', marksObtained: 88, maxMarks: 100, grade: 'A', remarks: 'Excellent in science experiments' },
      { name: 'Social Studies', marksObtained: 85, maxMarks: 100, grade: 'A', remarks: 'Good knowledge of geography' },
      { name: 'Hindi', marksObtained: 80, maxMarks: 100, grade: 'A-', remarks: 'Satisfactory performance' }
    ],
    totalMarks: 410,
    maxTotalMarks: 500,
    averagePercentage: 82,
    overallGrade: 'A-',
    rank: 5,
    classTeacher: 'Mrs. Sarah Johnson',
    principal: 'Mr. David Wilson'
  },
  {
    id: '3',
    examName: 'Unit Test 1',
    examDate: '2024-09-15',
    academicYear: '2024-2025',
    class: '5A',
    studentName: 'Rahul Kumar',
    rollNumber: '101',
    subjects: [
      { name: 'Mathematics', marksObtained: 18, maxMarks: 25, grade: 'A-', remarks: 'Good understanding of basic concepts' },
      { name: 'English', marksObtained: 20, maxMarks: 25, grade: 'A', remarks: 'Excellent essay writing' },
      { name: 'Science', marksObtained: 22, maxMarks: 25, grade: 'A+', remarks: 'Outstanding in practical work' },
      { name: 'Social Studies', marksObtained: 19, maxMarks: 25, grade: 'A-', remarks: 'Good knowledge of current affairs' },
      { name: 'Hindi', marksObtained: 21, maxMarks: 25, grade: 'A', remarks: 'Very good reading skills' }
    ],
    totalMarks: 100,
    maxTotalMarks: 125,
    averagePercentage: 80,
    overallGrade: 'A',
    rank: 4,
    classTeacher: 'Mrs. Sarah Johnson',
    principal: 'Mr. David Wilson'
  },
  {
    id: '4',
    examName: 'Final Term Examination',
    examDate: '2024-05-20',
    academicYear: '2023-2024',
    class: '4A',
    studentName: 'Rahul Kumar',
    rollNumber: '101',
    subjects: [
      { name: 'Mathematics', marksObtained: 80, maxMarks: 100, grade: 'A-', remarks: 'Good progress in mathematics' },
      { name: 'English', marksObtained: 75, maxMarks: 100, grade: 'B+', remarks: 'Improving in language skills' },
      { name: 'Science', marksObtained: 85, maxMarks: 100, grade: 'A', remarks: 'Good understanding of scientific concepts' },
      { name: 'Social Studies', marksObtained: 82, maxMarks: 100, grade: 'A-', remarks: 'Satisfactory performance' },
      { name: 'Hindi', marksObtained: 78, maxMarks: 100, grade: 'B+', remarks: 'Good reading and writing' }
    ],
    totalMarks: 400,
    maxTotalMarks: 500,
    averagePercentage: 80,
    overallGrade: 'A-',
    rank: 6,
    classTeacher: 'Mrs. Priya Sharma',
    principal: 'Mr. David Wilson'
  }
];

const ViewReportCard = () => {
  const [selectedReportCard, setSelectedReportCard] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Group report cards by academic year
  const groupedReportCards = DUMMY_REPORT_CARDS.reduce((groups, card) => {
    const year = card.academicYear;
    if (!groups[year]) {
      groups[year] = [];
    }
    groups[year].push(card);
    return groups;
  }, {});

  // Sort years in descending order (current year first)
  const sortedYears = Object.keys(groupedReportCards).sort((a, b) => b.localeCompare(a));

  const handleReportCardPress = (reportCard) => {
    setSelectedReportCard(reportCard);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedReportCard(null);
  };

  const handleExportPDF = async () => {
    if (!selectedReportCard) return;

    try {
      // Generate HTML content for PDF
      const htmlContent = generatePDFHTML(selectedReportCard);

      // Generate PDF using expo-print
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false
      });

      // Create a proper filename
      const fileName = `ReportCard_${selectedReportCard.studentName}_${selectedReportCard.examName.replace(/\s+/g, '_')}.pdf`;

      if (Platform.OS === 'android') {
        try {
          // For Android, use StorageAccessFramework to save to Downloads
          const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
          if (!permissions.granted) {
            Alert.alert('Permission Required', 'Please grant storage permission to save the PDF file.');
            return;
          }

          // Create file in the selected directory
          const destUri = await FileSystem.StorageAccessFramework.createFileAsync(
            permissions.directoryUri,
            fileName,
            'application/pdf'
          );

          // Copy the PDF content to the destination
          const fileData = await FileSystem.readAsStringAsync(uri, { 
            encoding: FileSystem.EncodingType.Base64 
          });
          await FileSystem.writeAsStringAsync(destUri, fileData, { 
            encoding: FileSystem.EncodingType.Base64 
          });

          Alert.alert(
            'PDF Saved Successfully',
            `Report card has been saved to your device.\n\nFile: ${fileName}\nLocation: Selected folder`,
            [
              { 
                text: 'Share', 
                onPress: () => sharePDF(uri, fileName) 
              },
              { text: 'OK', style: 'default' }
            ]
          );
        } catch (error) {
          console.error('Android save error:', error);
          // Fallback to sharing
          Alert.alert(
            'Save Failed',
            'Could not save to Downloads folder. Opening share options instead.',
            [
              { 
                text: 'Share', 
                onPress: () => sharePDF(uri, fileName) 
              },
              { text: 'Cancel', style: 'cancel' }
            ]
          );
        }
      } else {
        // For iOS, share directly
        await sharePDF(uri, fileName);
      }
    } catch (error) {
      console.error('PDF generation error:', error);
      Alert.alert('Error', 'Failed to generate PDF. Please try again.');
    }
  };

  const sharePDF = async (uri, fileName) => {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Report Card',
          UTI: 'com.adobe.pdf'
        });
      } else {
        Alert.alert('Sharing not available', 'Sharing is not available on this device.');
      }
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Error', 'Failed to share PDF. Please try again.');
    }
  };

  const generatePDFHTML = (reportCard) => {
    const getGradeColor = (grade) => {
      switch (grade) {
        case 'A+': return '#4CAF50';
        case 'A': return '#4CAF50';
        case 'A-': return '#8BC34A';
        case 'B+': return '#2196F3';
        case 'B': return '#2196F3';
        case 'B-': return '#03A9F4';
        case 'C+': return '#FF9800';
        case 'C': return '#FF9800';
        case 'C-': return '#FF5722';
        default: return '#F44336';
      }
    };

    const subjectsHTML = reportCard.subjects.map(subject => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${subject.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e0e0e0; text-align: center;">${subject.marksObtained}/${subject.maxMarks}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e0e0e0; text-align: center; color: ${getGradeColor(subject.grade)}; font-weight: bold;">${subject.grade}</td>
      </tr>
    `).join('');

    const remarksHTML = reportCard.subjects.map(subject => `
      <div style="margin-bottom: 10px;">
        <strong>${subject.name}:</strong> ${subject.remarks}
      </div>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Report Card</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              color: #333;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #2196F3;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .school-name {
              font-size: 24px;
              font-weight: bold;
              color: #2196F3;
              margin-bottom: 5px;
            }
            .report-title {
              font-size: 20px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .student-info {
              background-color: #f8f9fa;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 20px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 5px;
            }
            .marks-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            .marks-table th {
              background-color: #2196F3;
              color: white;
              padding: 12px;
              text-align: center;
              font-weight: bold;
            }
            .marks-table td {
              padding: 8px;
              border-bottom: 1px solid #e0e0e0;
            }
            .summary-grid {
              display: flex;
              flex-wrap: wrap;
              gap: 15px;
              margin-bottom: 20px;
            }
            .summary-item {
              flex: 1;
              min-width: 120px;
              background-color: #f8f9fa;
              padding: 15px;
              border-radius: 8px;
              text-align: center;
            }
            .summary-label {
              font-size: 12px;
              color: #666;
              margin-bottom: 5px;
            }
            .summary-value {
              font-size: 18px;
              font-weight: bold;
              color: #333;
            }
            .remarks-section {
              margin-bottom: 20px;
            }
            .remark-item {
              background-color: #f8f9fa;
              padding: 10px;
              border-radius: 5px;
              margin-bottom: 8px;
            }
            .signatures {
              display: flex;
              justify-content: space-between;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e0e0e0;
            }
            .signature-item {
              text-align: center;
              flex: 1;
            }
            .signature-label {
              font-size: 12px;
              color: #666;
              margin-bottom: 5px;
            }
            .signature-name {
              font-size: 14px;
              font-weight: bold;
              color: #333;
            }
            .grade-color {
              color: ${getGradeColor(reportCard.overallGrade)};
            }
            @media print {
              body { margin: 0; }
              .header { page-break-after: avoid; }
              .student-info { page-break-after: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="school-name">ABC School</div>
            <div class="report-title">Report Card</div>
          </div>

          <div class="student-info">
            <div class="info-row">
              <span><strong>Student Name:</strong> ${reportCard.studentName}</span>
              <span><strong>Class:</strong> ${reportCard.class}</span>
            </div>
            <div class="info-row">
              <span><strong>Roll Number:</strong> ${reportCard.rollNumber}</span>
              <span><strong>Academic Year:</strong> ${reportCard.academicYear}</span>
            </div>
            <div class="info-row">
              <span><strong>Exam:</strong> ${reportCard.examName}</span>
              <span><strong>Date:</strong> ${new Date(reportCard.examDate).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
            </div>
          </div>

          <h3>Subject-wise Marks</h3>
          <table class="marks-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Marks</th>
                <th>Grade</th>
              </tr>
            </thead>
            <tbody>
              ${subjectsHTML}
            </tbody>
          </table>

          <h3>Performance Summary</h3>
          <div class="summary-grid">
            <div class="summary-item">
              <div class="summary-label">Total Marks</div>
              <div class="summary-value">${reportCard.totalMarks}/${reportCard.maxTotalMarks}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Average</div>
              <div class="summary-value">${reportCard.averagePercentage}%</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Overall Grade</div>
              <div class="summary-value grade-color">${reportCard.overallGrade}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Class Rank</div>
              <div class="summary-value">${reportCard.rank}</div>
            </div>
          </div>

          <div class="remarks-section">
            <h3>Subject-wise Remarks</h3>
            ${remarksHTML}
          </div>

          <div class="signatures">
            <div class="signature-item">
              <div class="signature-label">Class Teacher</div>
              <div class="signature-name">${reportCard.classTeacher}</div>
            </div>
            <div class="signature-item">
              <div class="signature-label">Principal</div>
              <div class="signature-name">${reportCard.principal}</div>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'A+': return '#4CAF50';
      case 'A': return '#4CAF50';
      case 'A-': return '#8BC34A';
      case 'B+': return '#2196F3';
      case 'B': return '#2196F3';
      case 'B-': return '#03A9F4';
      case 'C+': return '#FF9800';
      case 'C': return '#FF9800';
      case 'C-': return '#FF5722';
      default: return '#F44336';
    }
  };

  const renderReportCardItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.reportCardItem}
      onPress={() => handleReportCardPress(item)}
    >
      <View style={styles.reportCardHeader}>
        <View style={styles.reportCardInfo}>
          <Text style={styles.examName}>{item.examName}</Text>
          <Text style={styles.examDate}>{new Date(item.examDate).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</Text>
          <Text style={styles.classInfo}>Class {item.class}</Text>
        </View>
        <View style={styles.reportCardStats}>
          <Text style={styles.percentage}>{item.averagePercentage}%</Text>
          <Text style={[styles.grade, { color: getGradeColor(item.overallGrade) }]}>
            {item.overallGrade}
          </Text>
        </View>
      </View>
      <View style={styles.reportCardFooter}>
        <Text style={styles.rankText}>Rank: {item.rank}</Text>
        <Ionicons name="chevron-forward" size={20} color="#666" />
      </View>
    </TouchableOpacity>
  );

  const renderYearSection = ({ item: year }) => (
    <View style={styles.yearSection}>
      <Text style={styles.yearTitle}>{year}</Text>
      <FlatList
        data={groupedReportCards[year]}
        renderItem={renderReportCardItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <Header title="View Report Card" showBack={true} />
      
      <View style={styles.content}>
        <Text style={styles.title}>Report Cards</Text>
        <Text style={styles.subtitle}>
          View and download your child's academic performance reports
        </Text>
        
        <FlatList
          data={sortedYears}
          renderItem={renderYearSection}
          keyExtractor={(item) => item}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      </View>

      {/* Report Card Detail Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Report Card</Text>
              <TouchableOpacity onPress={handleCloseModal} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            {selectedReportCard && (
              <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                {/* Student and Exam Info */}
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName}>{selectedReportCard.studentName}</Text>
                  <Text style={styles.studentDetails}>
                    Class: {selectedReportCard.class} | Roll No: {selectedReportCard.rollNumber}
                  </Text>
                  <Text style={styles.examDetails}>
                    {selectedReportCard.examName} - {new Date(selectedReportCard.examDate).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </Text>
                  <Text style={styles.academicYear}>{selectedReportCard.academicYear}</Text>
                </View>

                {/* Marks Table */}
                <View style={styles.marksSection}>
                  <Text style={styles.sectionTitle}>Subject-wise Marks</Text>
                  <View style={styles.marksTable}>
                    <View style={styles.tableHeader}>
                      <Text style={styles.headerCell}>Subject</Text>
                      <Text style={styles.headerCell}>Marks</Text>
                      <Text style={styles.headerCell}>Grade</Text>
                    </View>
                    {selectedReportCard.subjects.map((subject, index) => (
                      <View key={index} style={styles.tableRow}>
                        <Text style={styles.subjectCell}>{subject.name}</Text>
                        <Text style={styles.marksCell}>
                          {subject.marksObtained}/{subject.maxMarks}
                        </Text>
                        <Text style={[styles.gradeCell, { color: getGradeColor(subject.grade) }]}>
                          {subject.grade}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Performance Summary */}
                <View style={styles.summarySection}>
                  <Text style={styles.sectionTitle}>Performance Summary</Text>
                  <View style={styles.summaryGrid}>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>Total Marks</Text>
                      <Text style={styles.summaryValue}>
                        {selectedReportCard.totalMarks}/{selectedReportCard.maxTotalMarks}
                      </Text>
                    </View>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>Average</Text>
                      <Text style={styles.summaryValue}>{selectedReportCard.averagePercentage}%</Text>
                    </View>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>Overall Grade</Text>
                      <Text style={[styles.summaryValue, { color: getGradeColor(selectedReportCard.overallGrade) }]}>
                        {selectedReportCard.overallGrade}
                      </Text>
                    </View>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>Class Rank</Text>
                      <Text style={styles.summaryValue}>{selectedReportCard.rank}</Text>
                    </View>
                  </View>
                </View>

                {/* Teacher Remarks */}
                <View style={styles.remarksSection}>
                  <Text style={styles.sectionTitle}>Subject-wise Remarks</Text>
                  {selectedReportCard.subjects.map((subject, index) => (
                    <View key={index} style={styles.remarkItem}>
                      <Text style={styles.remarkSubject}>{subject.name}</Text>
                      <Text style={styles.remarkText}>{subject.remarks}</Text>
                    </View>
                  ))}
                </View>

                {/* Signatures */}
                <View style={styles.signatureSection}>
                  <View style={styles.signatureItem}>
                    <Text style={styles.signatureLabel}>Class Teacher</Text>
                    <Text style={styles.signatureName}>{selectedReportCard.classTeacher}</Text>
                  </View>
                  <View style={styles.signatureItem}>
                    <Text style={styles.signatureLabel}>Principal</Text>
                    <Text style={styles.signatureName}>{selectedReportCard.principal}</Text>
                  </View>
                </View>
              </ScrollView>
            )}

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.closeModalButton} onPress={handleCloseModal}>
                <Text style={styles.closeModalButtonText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.exportButton} onPress={handleExportPDF}>
                <Ionicons name="download" size={20} color="#fff" />
                <Text style={styles.exportButtonText}>Save PDF</Text>
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
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    lineHeight: 22,
  },
  listContainer: {
    paddingBottom: 20,
  },
  yearSection: {
    marginBottom: 24,
  },
  yearTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  reportCardItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  reportCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reportCardInfo: {
    flex: 1,
  },
  examName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  examDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  classInfo: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
  },
  reportCardStats: {
    alignItems: 'flex-end',
  },
  percentage: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  grade: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 2,
  },
  reportCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  rankText: {
    fontSize: 14,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: width * 0.9,
    maxHeight: '90%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
  },
  studentInfo: {
    marginBottom: 24,
    alignItems: 'center',
  },
  studentName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  studentDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  examDetails: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2196F3',
    marginBottom: 4,
  },
  academicYear: {
    fontSize: 14,
    color: '#666',
  },
  marksSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  marksTable: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  headerCell: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  subjectCell: {
    flex: 2,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  marksCell: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  gradeCell: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  summarySection: {
    marginBottom: 24,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryItem: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  remarksSection: {
    marginBottom: 24,
  },
  remarkItem: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  remarkSubject: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  remarkText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  signatureItem: {
    alignItems: 'center',
    flex: 1,
  },
  signatureLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  signatureName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 12,
  },
  closeModalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  closeModalButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  exportButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
    marginLeft: 8,
  },
});

export default ViewReportCard; 