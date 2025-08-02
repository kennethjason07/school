/**
 * Utility to fix invalid dates in the database
 * Import this and call fixAllDates() from anywhere in your app
 */

import { supabase } from './supabase';

export const fixAllDates = async () => {
  console.log('🚀 Starting emergency date fix...');
  
  let totalFixed = 0;
  const errors = [];
  
  try {
    // Fix fee_structure table
    console.log('🔧 Fixing fee_structure table...');
    
    try {
      const { data: feeRecords, error: feeError } = await supabase
        .from('fee_structure')
        .select('id, due_date, created_at');
      
      if (feeError) {
        console.error('❌ Error fetching fee_structure:', feeError.message);
        errors.push(`fee_structure fetch: ${feeError.message}`);
      } else if (feeRecords) {
        console.log(`📊 Found ${feeRecords.length} fee structure records`);
        
        for (const record of feeRecords) {
          const updates = {};
          let needsUpdate = false;
          
          // Fix due_date
          if (record.due_date && typeof record.due_date === 'string' && record.due_date.includes('2025-07-32')) {
            updates.due_date = '2025-07-31';
            needsUpdate = true;
            console.log(`  🔧 Fixing due_date for record ${record.id}: 2025-07-32 → 2025-07-31`);
          }
          
          // Fix created_at
          if (record.created_at && typeof record.created_at === 'string' && record.created_at.includes('2025-07-32')) {
            updates.created_at = record.created_at.replace('2025-07-32', '2025-07-31');
            needsUpdate = true;
            console.log(`  🔧 Fixing created_at for record ${record.id}`);
          }
          
          if (needsUpdate) {
            const { error: updateError } = await supabase
              .from('fee_structure')
              .update(updates)
              .eq('id', record.id);
            
            if (updateError) {
              console.error(`  ❌ Error updating record ${record.id}:`, updateError.message);
              errors.push(`fee_structure update ${record.id}: ${updateError.message}`);
            } else {
              totalFixed++;
              console.log(`  ✅ Fixed record ${record.id}`);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error processing fee_structure:', error);
      errors.push(`fee_structure processing: ${error.message}`);
    }
    
    // Fix student_fees table
    console.log('🔧 Fixing student_fees table...');
    
    try {
      const { data: paymentRecords, error: paymentError } = await supabase
        .from('student_fees')
        .select('id, payment_date, due_date, created_at');
      
      if (paymentError) {
        console.error('❌ Error fetching student_fees:', paymentError.message);
        errors.push(`student_fees fetch: ${paymentError.message}`);
      } else if (paymentRecords) {
        console.log(`📊 Found ${paymentRecords.length} student fee records`);
        
        for (const record of paymentRecords) {
          const updates = {};
          let needsUpdate = false;
          
          // Check all date fields
          ['payment_date', 'due_date', 'created_at'].forEach(field => {
            if (record[field] && typeof record[field] === 'string' && record[field].includes('2025-07-32')) {
              updates[field] = record[field].replace('2025-07-32', '2025-07-31');
              needsUpdate = true;
              console.log(`  🔧 Fixing ${field} for record ${record.id}: 2025-07-32 → 2025-07-31`);
            }
          });
          
          if (needsUpdate) {
            const { error: updateError } = await supabase
              .from('student_fees')
              .update(updates)
              .eq('id', record.id);
            
            if (updateError) {
              console.error(`  ❌ Error updating record ${record.id}:`, updateError.message);
              errors.push(`student_fees update ${record.id}: ${updateError.message}`);
            } else {
              totalFixed++;
              console.log(`  ✅ Fixed record ${record.id}`);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error processing student_fees:', error);
      errors.push(`student_fees processing: ${error.message}`);
    }
    
    console.log(`\n🎉 Date fix completed!`);
    console.log(`✅ Total records fixed: ${totalFixed}`);
    
    if (errors.length > 0) {
      console.log(`⚠️  Errors encountered: ${errors.length}`);
      errors.forEach(error => console.log(`  - ${error}`));
    }
    
    return {
      success: true,
      totalFixed,
      errors
    };
    
  } catch (error) {
    console.error('❌ Unexpected error during date fix:', error);
    return {
      success: false,
      error: error.message,
      totalFixed,
      errors
    };
  }
};

// Quick test function to check for invalid dates
export const checkForInvalidDates = async () => {
  console.log('🔍 Checking for invalid dates...');
  
  const issues = [];
  
  try {
    // Check fee_structure
    const { data: feeRecords } = await supabase
      .from('fee_structure')
      .select('id, due_date, created_at');
    
    if (feeRecords) {
      feeRecords.forEach(record => {
        if (record.due_date && record.due_date.includes('2025-07-32')) {
          issues.push(`fee_structure ${record.id}: invalid due_date ${record.due_date}`);
        }
        if (record.created_at && record.created_at.includes('2025-07-32')) {
          issues.push(`fee_structure ${record.id}: invalid created_at ${record.created_at}`);
        }
      });
    }
    
    // Check student_fees
    const { data: paymentRecords } = await supabase
      .from('student_fees')
      .select('id, payment_date, due_date, created_at');
    
    if (paymentRecords) {
      paymentRecords.forEach(record => {
        ['payment_date', 'due_date', 'created_at'].forEach(field => {
          if (record[field] && record[field].includes('2025-07-32')) {
            issues.push(`student_fees ${record.id}: invalid ${field} ${record[field]}`);
          }
        });
      });
    }
    
    console.log(`🔍 Found ${issues.length} invalid dates`);
    issues.forEach(issue => console.log(`  - ${issue}`));
    
    return issues;
    
  } catch (error) {
    console.error('Error checking dates:', error);
    return [];
  }
};
