/**
 * Script to fix invalid dates in the database
 * Run this script to fix the "2025-07-32" date error
 */

import { supabase } from './src/utils/supabase.js';

const TABLES = {
  FEE_STRUCTURE: 'fee_structure',
  STUDENT_FEES: 'student_fees',
  EXAMS: 'exams',
  ASSIGNMENTS: 'assignments',
  STUDENT_ATTENDANCE: 'student_attendance',
  TEACHER_ATTENDANCE: 'teacher_attendance'
};

// Common invalid dates and their fixes
const DATE_FIXES = {
  '2025-07-32': '2025-07-31',
  '2025-06-31': '2025-06-30',
  '2025-04-31': '2025-04-30',
  '2025-09-31': '2025-09-30',
  '2025-11-31': '2025-11-30',
  '2024-02-30': '2024-02-29', // 2024 is a leap year
  '2024-02-31': '2024-02-29',
  '2025-02-29': '2025-02-28', // 2025 is not a leap year
  '2025-02-30': '2025-02-28',
  '2025-02-31': '2025-02-28'
};

async function fixInvalidDatesInTable(tableName, dateColumns) {
  console.log(`\n🔍 Checking table: ${tableName}`);
  
  try {
    // Get all records from the table
    const { data: records, error } = await supabase
      .from(tableName)
      .select('*');
    
    if (error) {
      console.error(`❌ Error fetching from ${tableName}:`, error.message);
      return;
    }

    if (!records || records.length === 0) {
      console.log(`✅ No records found in ${tableName}`);
      return;
    }

    console.log(`📊 Found ${records.length} records in ${tableName}`);
    
    let fixedCount = 0;
    
    for (const record of records) {
      const updates = {};
      let needsUpdate = false;
      
      // Check each date column
      for (const column of dateColumns) {
        const dateValue = record[column];
        if (dateValue && typeof dateValue === 'string') {
          // Check if this date needs fixing
          for (const [invalidDate, validDate] of Object.entries(DATE_FIXES)) {
            if (dateValue.includes(invalidDate)) {
              console.log(`🔧 Fixing ${column} in record ${record.id}: ${invalidDate} → ${validDate}`);
              updates[column] = dateValue.replace(invalidDate, validDate);
              needsUpdate = true;
              break;
            }
          }
        }
      }
      
      // Update the record if needed
      if (needsUpdate) {
        const { error: updateError } = await supabase
          .from(tableName)
          .update(updates)
          .eq('id', record.id);
        
        if (updateError) {
          console.error(`❌ Error updating record ${record.id}:`, updateError.message);
        } else {
          fixedCount++;
          console.log(`✅ Fixed record ${record.id}`);
        }
      }
    }
    
    if (fixedCount > 0) {
      console.log(`🎉 Fixed ${fixedCount} records in ${tableName}`);
    } else {
      console.log(`✅ No invalid dates found in ${tableName}`);
    }
    
  } catch (error) {
    console.error(`❌ Error processing ${tableName}:`, error.message);
  }
}

async function fixAllInvalidDates() {
  console.log('🚀 Starting to fix invalid dates in database...\n');
  
  // Define tables and their date columns
  const tablesToFix = [
    { table: TABLES.FEE_STRUCTURE, columns: ['due_date', 'created_at'] },
    { table: TABLES.STUDENT_FEES, columns: ['payment_date', 'due_date', 'created_at'] },
    { table: TABLES.EXAMS, columns: ['start_date', 'end_date', 'created_at'] },
    { table: TABLES.ASSIGNMENTS, columns: ['due_date', 'assigned_date', 'created_at'] },
    { table: TABLES.STUDENT_ATTENDANCE, columns: ['date', 'created_at'] },
    { table: TABLES.TEACHER_ATTENDANCE, columns: ['date', 'created_at'] }
  ];
  
  for (const { table, columns } of tablesToFix) {
    await fixInvalidDatesInTable(table, columns);
  }
  
  console.log('\n🎉 Finished fixing invalid dates!');
  console.log('📱 You can now run your app without date errors.');
}

// Run the fix
fixAllInvalidDates().catch(console.error);
