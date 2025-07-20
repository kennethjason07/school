import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  FlatList, 
  Modal, 
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

// Dummy data for fee structure
const DUMMY_FEE_STRUCTURE = {
  studentName: 'Rahul Kumar',
  class: '5A',
  academicYear: '2024-2025',
  totalDue: 17000,
  totalPaid: 4000,
  outstanding: 13000,
  fees: [
    {
      id: '1',
      name: 'First Term Fee',
      amount: 5000,
      dueDate: '2024-07-15',
      status: 'unpaid', // unpaid, paid, partial
      paidAmount: 0,
      description: 'First term tuition and development fee',
      category: 'tuition'
    },
    {
      id: '2',
      name: 'Second Term Fee',
      amount: 5000,
      dueDate: '2024-10-15',
      status: 'unpaid',
      paidAmount: 0,
      description: 'Second term tuition and development fee',
      category: 'tuition'
    },
    {
      id: '3',
      name: 'Books Fee',
      amount: 2000,
      dueDate: '2024-06-30',
      status: 'paid',
      paidAmount: 2000,
      description: 'Textbooks and study materials',
      category: 'books'
    },
    {
      id: '4',
      name: 'Bus Fee',
      amount: 3000,
      dueDate: '2024-07-01',
      status: 'partial',
      paidAmount: 1500,
      description: 'Transportation fee for the academic year',
      category: 'transport'
    },
    {
      id: '5',
      name: 'Laboratory Fee',
      amount: 1000,
      dueDate: '2024-08-15',
      status: 'unpaid',
      paidAmount: 0,
      description: 'Science lab and computer lab fee',
      category: 'facilities'
    },
    {
      id: '6',
      name: 'Sports Fee',
      amount: 800,
      dueDate: '2024-07-20',
      status: 'unpaid',
      paidAmount: 0,
      description: 'Sports equipment and activities fee',
      category: 'activities'
    },
    {
      id: '7',
      name: 'Library Fee',
      amount: 500,
      dueDate: '2024-06-25',
      status: 'paid',
      paidAmount: 500,
      description: 'Library membership and resources',
      category: 'facilities'
    },
    {
      id: '8',
      name: 'Examination Fee',
      amount: 700,
      dueDate: '2024-09-01',
      status: 'unpaid',
      paidAmount: 0,
      description: 'Mid-term and final examination fee',
      category: 'examination'
    }
  ]
};

// Dummy payment history
const DUMMY_PAYMENT_HISTORY = [
  {
    id: '1',
    feeName: 'Books Fee',
    amount: 2000,
    paymentDate: '2024-06-20',
    paymentMethod: 'Online',
    transactionId: 'TXN123456',
    status: 'completed',
    receiptUrl: 'receipt_books_fee.pdf'
  },
  {
    id: '2',
    feeName: 'Library Fee',
    amount: 500,
    paymentDate: '2024-06-18',
    paymentMethod: 'Cash',
    transactionId: 'CASH001',
    status: 'completed',
    receiptUrl: 'receipt_library_fee.pdf'
  },
  {
    id: '3',
    feeName: 'Bus Fee',
    amount: 1500,
    paymentDate: '2024-06-25',
    paymentMethod: 'UPI',
    transactionId: 'UPI789012',
    status: 'completed',
    receiptUrl: 'receipt_bus_fee.pdf'
  }
];

const FeePayment = () => {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [selectedFee, setSelectedFee] = useState(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Calculate total fee from individual fees
  const calculatedTotalFee = DUMMY_FEE_STRUCTURE.fees.reduce((total, fee) => total + fee.amount, 0);
  const isTotalFeeMatching = calculatedTotalFee === DUMMY_FEE_STRUCTURE.totalDue;

  console.log('Calculated Total Fee:', calculatedTotalFee);
  console.log('Total Due from data:', DUMMY_FEE_STRUCTURE.totalDue);
  console.log('Are they matching?', isTotalFeeMatching);

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return '#4CAF50';
      case 'partial': return '#FF9800';
      case 'unpaid': return '#F44336';
      default: return '#666';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'paid': return 'Paid';
      case 'partial': return 'Partial';
      case 'unpaid': return 'Unpaid';
      default: return 'Unknown';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'tuition': return 'school';
      case 'books': return 'library';
      case 'transport': return 'car';
      case 'facilities': return 'build';
      case 'activities': return 'football';
      case 'examination': return 'document-text';
      default: return 'card';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'tuition': return '#2196F3';
      case 'books': return '#4CAF50';
      case 'transport': return '#FF9800';
      case 'facilities': return '#9C27B0';
      case 'activities': return '#795548';
      case 'examination': return '#607D8B';
      default: return '#666';
    }
  };

  const handlePayment = (fee) => {
    setSelectedFee(fee);
    setPaymentModalVisible(true);
  };

  const handleDownloadReceipt = async (receipt) => {
    setSelectedReceipt(receipt);
    setReceiptModalVisible(true);
  };

  const handleConfirmDownload = async () => {
    if (!selectedReceipt) return;

    try {
      // Generate receipt HTML
      const htmlContent = generateReceiptHTML(selectedReceipt);
      
      // Generate PDF
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false
      });

      const fileName = `Receipt_${selectedReceipt.feeName.replace(/\s+/g, '_')}.pdf`;

      if (Platform.OS === 'android') {
        try {
          const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
          if (!permissions.granted) {
            Alert.alert('Permission Required', 'Please grant storage permission to save the receipt.');
            return;
          }

          const destUri = await FileSystem.StorageAccessFramework.createFileAsync(
            permissions.directoryUri,
            fileName,
            'application/pdf'
          );

          const fileData = await FileSystem.readAsStringAsync(uri, { 
            encoding: FileSystem.EncodingType.Base64 
          });
          await FileSystem.writeAsStringAsync(destUri, fileData, { 
            encoding: FileSystem.EncodingType.Base64 
          });

          Alert.alert('Receipt Downloaded', `Receipt saved as ${fileName}`);
          setReceiptModalVisible(false);
        } catch (error) {
          console.error('Download error:', error);
          Alert.alert('Error', 'Failed to download receipt. Please try again.');
        }
      } else {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Receipt',
          UTI: 'com.adobe.pdf'
        });
        setReceiptModalVisible(false);
      }
    } catch (error) {
      console.error('Receipt generation error:', error);
      Alert.alert('Error', 'Failed to generate receipt. Please try again.');
    }
  };

  const handleCloseReceiptModal = () => {
    setReceiptModalVisible(false);
    setSelectedReceipt(null);
  };

  const generateReceiptHTML = (receipt) => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Fee Receipt</title>
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
            .receipt-title {
              font-size: 20px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .receipt-info {
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
            .amount-section {
              text-align: center;
              margin: 20px 0;
              padding: 20px;
              background-color: #e3f2fd;
              border-radius: 8px;
            }
            .amount {
              font-size: 24px;
              font-weight: bold;
              color: #2196F3;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="school-name">ABC School</div>
            <div class="receipt-title">Fee Receipt</div>
          </div>

          <div class="receipt-info">
            <div class="info-row">
              <span><strong>Student Name:</strong> ${DUMMY_FEE_STRUCTURE.studentName}</span>
              <span><strong>Class:</strong> ${DUMMY_FEE_STRUCTURE.class}</span>
            </div>
            <div class="info-row">
              <span><strong>Fee Type:</strong> ${receipt.feeName}</span>
              <span><strong>Payment Date:</strong> ${receipt.paymentDate}</span>
            </div>
            <div class="info-row">
              <span><strong>Transaction ID:</strong> ${receipt.transactionId}</span>
              <span><strong>Payment Method:</strong> ${receipt.paymentMethod}</span>
            </div>
          </div>

          <div class="amount-section">
            <div class="amount">₹${receipt.amount}</div>
            <div>Amount Paid</div>
          </div>

          <div class="footer">
            <p>This is a computer generated receipt. No signature required.</p>
            <p>Thank you for your payment!</p>
          </div>
        </body>
      </html>
    `;
  };

  const generateReceiptPreview = (receipt) => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Fee Receipt Preview</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              color: #333;
              background-color: #f8f9fa;
            }
            .receipt-container {
              background-color: #fff;
              border-radius: 12px;
              padding: 24px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              max-width: 400px;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #2196F3;
              padding-bottom: 20px;
              margin-bottom: 24px;
            }
            .school-name {
              font-size: 20px;
              font-weight: bold;
              color: #2196F3;
              margin-bottom: 4px;
            }
            .receipt-title {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 8px;
            }
            .receipt-info {
              background-color: #f8f9fa;
              padding: 16px;
              border-radius: 8px;
              margin-bottom: 20px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
              font-size: 14px;
            }
            .info-label {
              font-weight: bold;
              color: #666;
            }
            .info-value {
              color: #333;
            }
            .amount-section {
              text-align: center;
              margin: 20px 0;
              padding: 20px;
              background-color: #e3f2fd;
              border-radius: 8px;
            }
            .amount {
              font-size: 24px;
              font-weight: bold;
              color: #2196F3;
              margin-bottom: 4px;
            }
            .amount-label {
              font-size: 14px;
              color: #666;
            }
            .footer {
              margin-top: 20px;
              text-align: center;
              font-size: 12px;
              color: #666;
              border-top: 1px solid #e0e0e0;
              padding-top: 16px;
            }
            .status-badge {
              display: inline-block;
              background-color: #4CAF50;
              color: white;
              padding: 4px 8px;
              border-radius: 12px;
              font-size: 10px;
              font-weight: bold;
              margin-left: 8px;
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="header">
              <div class="school-name">ABC School</div>
              <div class="receipt-title">Fee Receipt</div>
            </div>

            <div class="receipt-info">
              <div class="info-row">
                <span class="info-label">Student Name:</span>
                <span class="info-value">${DUMMY_FEE_STRUCTURE.studentName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Class:</span>
                <span class="info-value">${DUMMY_FEE_STRUCTURE.class}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Fee Type:</span>
                <span class="info-value">${receipt.feeName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Payment Date:</span>
                <span class="info-value">${receipt.paymentDate}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Transaction ID:</span>
                <span class="info-value">${receipt.transactionId}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Payment Method:</span>
                <span class="info-value">${receipt.paymentMethod}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Status:</span>
                <span class="info-value">Completed <span class="status-badge">PAID</span></span>
              </div>
            </div>

            <div class="amount-section">
              <div class="amount">₹${receipt.amount}</div>
              <div class="amount-label">Amount Paid</div>
            </div>

            <div class="footer">
              <p>This is a computer generated receipt.</p>
              <p>No signature required.</p>
              <p>Thank you for your payment!</p>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const renderFeeItem = ({ item }) => (
    <View style={styles.feeItem}>
      <View style={styles.feeHeader}>
        <View style={styles.feeInfo}>
          <View style={styles.feeTitleRow}>
            <View style={[styles.categoryIcon, { backgroundColor: getCategoryColor(item.category) }]}>
              <Ionicons name={getCategoryIcon(item.category)} size={20} color="#fff" />
            </View>
            <View style={styles.feeTitle}>
              <Text style={styles.feeName}>{item.name}</Text>
              <Text style={styles.feeDescription}>{item.description}</Text>
            </View>
          </View>
          <View style={styles.feeAmount}>
            <Text style={styles.amountText}>₹{item.amount}</Text>
            <Text style={styles.dueDate}>Due: {new Date(item.dueDate).toLocaleDateString('en-US', { 
              day: 'numeric', 
              month: 'short', 
              year: 'numeric' 
            })}</Text>
          </View>
        </View>
        <View style={styles.feeStatus}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
          {item.status === 'partial' && (
            <Text style={styles.partialAmount}>₹{item.paidAmount} paid</Text>
          )}
        </View>
      </View>
      
      {item.status !== 'paid' && (
        <TouchableOpacity 
          style={[styles.payButton, { backgroundColor: getStatusColor(item.status) }]}
          onPress={() => handlePayment(item)}
        >
          <Ionicons name="card" size={16} color="#fff" />
          <Text style={styles.payButtonText}>
            {item.status === 'partial' ? 'Pay Remaining' : 'Pay Now'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderPaymentHistoryItem = ({ item }) => (
    <View style={styles.historyItem}>
      <View style={styles.historyHeader}>
        <Text style={styles.historyFeeName}>{item.feeName}</Text>
        <Text style={styles.historyAmount}>₹{item.amount}</Text>
      </View>
      <View style={styles.historyDetails}>
        <Text style={styles.historyDate}>{item.paymentDate}</Text>
        <Text style={styles.historyMethod}>{item.paymentMethod}</Text>
        <Text style={styles.historyId}>TXN: {item.transactionId}</Text>
      </View>
      <TouchableOpacity 
        style={styles.downloadButton}
        onPress={() => handleDownloadReceipt(item)}
      >
        <Ionicons name="download" size={16} color="#2196F3" />
        <Text style={styles.downloadText}>Download Receipt</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header title="Fee Payment" showBack={true} />
      
      <View style={styles.content}>
        {/* Fee Summary Cards */}
        <View style={styles.summaryCards}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Academic Fee</Text>
            <Text style={[styles.summaryAmount, { color: '#2196F3' }]}>₹{DUMMY_FEE_STRUCTURE.totalDue}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Paid</Text>
            <Text style={[styles.summaryAmount, { color: '#4CAF50' }]}>₹{DUMMY_FEE_STRUCTURE.totalPaid}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Outstanding</Text>
            <Text style={[styles.summaryAmount, { color: '#F44336' }]}>₹{DUMMY_FEE_STRUCTURE.outstanding}</Text>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'overview' && styles.activeTab]}
            onPress={() => setSelectedTab('overview')}
          >
            <Text style={[styles.tabText, selectedTab === 'overview' && styles.activeTabText]}>Fee Structure</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'history' && styles.activeTab]}
            onPress={() => setSelectedTab('history')}
          >
            <Text style={[styles.tabText, selectedTab === 'history' && styles.activeTabText]}>Payment History</Text>
          </TouchableOpacity>
        </View>

        {/* Content based on selected tab */}
        {selectedTab === 'overview' ? (
          <View>
            <FlatList
              data={DUMMY_FEE_STRUCTURE.fees}
              renderItem={renderFeeItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.feeList}
            />
            
            {/* Fee Distribution Summary */}
            <View style={styles.feeDistributionContainer}>
              <Text style={styles.feeDistributionTitle}>Fee Distribution Summary</Text>
              
              <View style={styles.feeDistributionRow}>
                <View style={styles.feeDistributionItem}>
                  <Text style={styles.feeDistributionLabel}>Total Academic Fee</Text>
                  <Text style={[styles.feeDistributionAmount, { color: '#2196F3' }]}>₹{DUMMY_FEE_STRUCTURE.totalDue}</Text>
                </View>
                <View style={styles.feeDistributionItem}>
                  <Text style={styles.feeDistributionLabel}>Total Paid</Text>
                  <Text style={[styles.feeDistributionAmount, { color: '#4CAF50' }]}>₹{DUMMY_FEE_STRUCTURE.totalPaid}</Text>
                </View>
                <View style={styles.feeDistributionItem}>
                  <Text style={styles.feeDistributionLabel}>Total Outstanding</Text>
                  <Text style={[styles.feeDistributionAmount, { color: '#F44336' }]}>₹{DUMMY_FEE_STRUCTURE.outstanding}</Text>
                </View>
              </View>
              
              {/* Fee Category Breakdown */}
              <View style={styles.feeCategoryBreakdown}>
                <Text style={styles.feeCategoryTitle}>Fee Category Breakdown</Text>
                
                <View style={styles.feeCategoryItem}>
                  <Text style={styles.feeCategoryName}>Tuition Fees</Text>
                  <View style={styles.feeCategoryDetails}>
                    <Text style={styles.feeCategoryAmount}>₹10,000</Text>
                    <Text style={styles.feeCategoryStatus}>Unpaid</Text>
                  </View>
                </View>
                
                <View style={styles.feeCategoryItem}>
                  <Text style={styles.feeCategoryName}>Books & Materials</Text>
                  <View style={styles.feeCategoryDetails}>
                    <Text style={styles.feeCategoryAmount}>₹2,000</Text>
                    <Text style={[styles.feeCategoryStatus, { color: '#4CAF50' }]}>Paid</Text>
                  </View>
                </View>
                
                <View style={styles.feeCategoryItem}>
                  <Text style={styles.feeCategoryName}>Transport</Text>
                  <View style={styles.feeCategoryDetails}>
                    <Text style={styles.feeCategoryAmount}>₹3,000</Text>
                    <Text style={[styles.feeCategoryStatus, { color: '#FF9800' }]}>Partial</Text>
                  </View>
                </View>
                
                <View style={styles.feeCategoryItem}>
                  <Text style={styles.feeCategoryName}>Other Fees</Text>
                  <View style={styles.feeCategoryDetails}>
                    <Text style={styles.feeCategoryAmount}>₹2,000</Text>
                    <Text style={styles.feeCategoryStatus}>Unpaid</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <FlatList
            data={DUMMY_PAYMENT_HISTORY}
            renderItem={renderPaymentHistoryItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.historyList}
          />
        )}
      </View>

      {/* Payment Modal */}
      <Modal
        visible={paymentModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPaymentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Make Payment</Text>
              <TouchableOpacity onPress={() => setPaymentModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            {selectedFee && (
              <View style={styles.paymentContent}>
                <View style={styles.paymentFeeInfo}>
                  <Text style={styles.paymentFeeName}>{selectedFee.name}</Text>
                  <Text style={styles.paymentFeeDescription}>{selectedFee.description}</Text>
                  <Text style={styles.paymentAmount}>₹{selectedFee.amount}</Text>
                </View>
                
                <View style={styles.paymentMethods}>
                  <Text style={styles.paymentMethodsTitle}>Select Payment Method</Text>
                  <TouchableOpacity style={styles.paymentMethod}>
                    <Ionicons name="card-outline" size={24} color="#2196F3" />
                    <Text style={styles.paymentMethodText}>Credit/Debit Card</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.paymentMethod}>
                    <Ionicons name="qr-code-outline" size={24} color="#4CAF50" />
                    <Text style={styles.paymentMethodText}>UPI</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.paymentMethod}>
                    <Ionicons name="wallet-outline" size={24} color="#FF9800" />
                    <Text style={styles.paymentMethodText}>Net Banking</Text>
                  </TouchableOpacity>
                </View>
                
                <TouchableOpacity style={styles.payNowButton}>
                  <Text style={styles.payNowButtonText}>Pay ₹{selectedFee.amount}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Receipt Preview Modal */}
      <Modal
        visible={receiptModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseReceiptModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Receipt Preview</Text>
              <TouchableOpacity onPress={handleCloseReceiptModal}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            {selectedReceipt && (
              <ScrollView style={styles.receiptPreviewContent}>
                <View style={styles.receiptPreview}>
                  <View style={styles.receiptHeader}>
                    <Text style={styles.receiptSchoolName}>ABC School</Text>
                    <Text style={styles.receiptTitle}>Fee Receipt</Text>
                  </View>

                  <View style={styles.receiptInfo}>
                    <View style={styles.receiptInfoRow}>
                      <Text style={styles.receiptInfoLabel}>Student Name:</Text>
                      <Text style={styles.receiptInfoValue}>{DUMMY_FEE_STRUCTURE.studentName}</Text>
                    </View>
                    <View style={styles.receiptInfoRow}>
                      <Text style={styles.receiptInfoLabel}>Class:</Text>
                      <Text style={styles.receiptInfoValue}>{DUMMY_FEE_STRUCTURE.class}</Text>
                    </View>
                    <View style={styles.receiptInfoRow}>
                      <Text style={styles.receiptInfoLabel}>Fee Type:</Text>
                      <Text style={styles.receiptInfoValue}>{selectedReceipt.feeName}</Text>
                    </View>
                    <View style={styles.receiptInfoRow}>
                      <Text style={styles.receiptInfoLabel}>Payment Date:</Text>
                      <Text style={styles.receiptInfoValue}>{selectedReceipt.paymentDate}</Text>
                    </View>
                    <View style={styles.receiptInfoRow}>
                      <Text style={styles.receiptInfoLabel}>Transaction ID:</Text>
                      <Text style={styles.receiptInfoValue}>{selectedReceipt.transactionId}</Text>
                    </View>
                    <View style={styles.receiptInfoRow}>
                      <Text style={styles.receiptInfoLabel}>Payment Method:</Text>
                      <Text style={styles.receiptInfoValue}>{selectedReceipt.paymentMethod}</Text>
                    </View>
                    <View style={styles.receiptInfoRow}>
                      <Text style={styles.receiptInfoLabel}>Status:</Text>
                      <View style={styles.receiptStatusRow}>
                        <Text style={styles.receiptInfoValue}>Completed</Text>
                        <View style={styles.statusBadge}>
                          <Text style={styles.statusBadgeText}>PAID</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <View style={styles.receiptAmountSection}>
                    <Text style={styles.receiptAmount}>₹{selectedReceipt.amount}</Text>
                    <Text style={styles.receiptAmountLabel}>Amount Paid</Text>
                  </View>

                  <View style={styles.receiptFooter}>
                    <Text style={styles.receiptFooterText}>This is a computer generated receipt.</Text>
                    <Text style={styles.receiptFooterText}>No signature required.</Text>
                    <Text style={styles.receiptFooterText}>Thank you for your payment!</Text>
                  </View>
                </View>
              </ScrollView>
            )}

            {/* Receipt Modal Footer */}
            <View style={styles.receiptModalFooter}>
              <TouchableOpacity style={styles.cancelReceiptButton} onPress={handleCloseReceiptModal}>
                <Text style={styles.cancelReceiptButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.downloadReceiptButton} onPress={handleConfirmDownload}>
                <Ionicons name="download" size={20} color="#fff" />
                <Text style={styles.downloadReceiptButtonText}>Download PDF</Text>
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
  summaryCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 8,
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
    fontWeight: '500',
    textAlign: 'center',
  },
  summaryAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#2196F3',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
  },
  feeList: {
    paddingBottom: 150,
  },
  historyList: {
    paddingBottom: 20,
  },
  feeItem: {
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
  feeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  feeInfo: {
    flex: 1,
  },
  feeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  feeTitle: {
    flex: 1,
  },
  feeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  feeDescription: {
    fontSize: 12,
    color: '#666',
  },
  feeAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  dueDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  feeStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  partialAmount: {
    fontSize: 10,
    color: '#FF9800',
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  payButtonText: {
    color: '#fff',
    fontWeight: '500',
    marginLeft: 4,
  },
  historyItem: {
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
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyFeeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  historyDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  historyDate: {
    fontSize: 12,
    color: '#666',
  },
  historyMethod: {
    fontSize: 12,
    color: '#666',
  },
  historyId: {
    fontSize: 12,
    color: '#666',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#2196F3',
    borderRadius: 8,
  },
  downloadText: {
    color: '#2196F3',
    fontWeight: '500',
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '95%',
    minHeight: '70%',
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
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  paymentContent: {
    padding: 20,
  },
  paymentFeeInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  paymentFeeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  paymentFeeDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
  },
  paymentAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  paymentMethods: {
    marginBottom: 24,
  },
  paymentMethodsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    marginBottom: 8,
  },
  paymentMethodText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  payNowButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  payNowButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  receiptPreviewContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  receiptPreview: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 16,
  },
  receiptHeader: {
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#2196F3',
    paddingBottom: 16,
    marginBottom: 20,
  },
  receiptSchoolName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 4,
    textAlign: 'center',
  },
  receiptTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  receiptInfo: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  receiptInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    alignItems: 'center',
  },
  receiptInfoLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    flex: 1,
  },
  receiptInfoValue: {
    fontSize: 13,
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  receiptAmountSection: {
    alignItems: 'center',
    marginVertical: 16,
    padding: 16,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
  },
  receiptAmount: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 4,
  },
  receiptAmountLabel: {
    fontSize: 13,
    color: '#666',
  },
  receiptFooter: {
    marginTop: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 12,
  },
  receiptFooterText: {
    fontSize: 11,
    color: '#666',
    marginBottom: 3,
    textAlign: 'center',
  },
  receiptStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  statusBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    marginLeft: 6,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#fff',
  },
  receiptModalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  cancelReceiptButton: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelReceiptButtonText: {
    color: '#666',
    fontSize: 15,
    fontWeight: '500',
  },
  downloadReceiptButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginLeft: 8,
  },
  downloadReceiptButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 6,
  },
  feeDistributionContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  feeDistributionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  feeDistributionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  feeDistributionItem: {
    alignItems: 'center',
  },
  feeDistributionLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  feeDistributionAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  feeCategoryBreakdown: {
    marginTop: 16,
  },
  feeCategoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  feeCategoryItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  feeCategoryName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  feeCategoryDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feeCategoryAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  feeCategoryStatus: {
    fontSize: 12,
    color: '#FF9800',
  },
});

export default FeePayment; 