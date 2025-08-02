/**
 * Direct database fix for invalid dates
 * Run this with: node fix_dates_direct.js
 */

// You'll need to install supabase-js: npm install @supabase/supabase-js
const { createClient } = require('@supabase/supabase-js');

// Replace these with your actual Supabase credentials
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function fixInvalidDates() {
  console.log('🚀 Starting to fix invalid dates...\n');
  
  let totalFixed = 0;
  
  try {
    // Fix fee_structure table
    console.log('🔧 Fixing fee_structure table...');
    
    const { data: feeRecords, error: feeError } = await supabase
      .from('fee_structure')
      .select('id, due_date, created_at');
    
    if (feeError) {
      console.error('❌ Error fetching fee_structure:', feeError.message);
    } else if (feeRecords) {
      for (const record of feeRecords) {
        const updates = {};
        let needsUpdate = false;
        
        // Fix due_date
        if (record.due_date && record.due_date.includes('2025-07-32')) {
          updates.due_date = '2025-07-31';
          needsUpdate = true;
          console.log(`  🔧 Fixing due_date for record ${record.id}`);
        }
        
        // Fix created_at
        if (record.created_at && record.created_at.includes('2025-07-32')) {
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
          } else {
            totalFixed++;
            console.log(`  ✅ Fixed record ${record.id}`);
          }
        }
      }
    }
    
    // Fix student_fees table
    console.log('\n🔧 Fixing student_fees table...');
    
    const { data: paymentRecords, error: paymentError } = await supabase
      .from('student_fees')
      .select('id, payment_date, due_date, created_at');
    
    if (paymentError) {
      console.error('❌ Error fetching student_fees:', paymentError.message);
    } else if (paymentRecords) {
      for (const record of paymentRecords) {
        const updates = {};
        let needsUpdate = false;
        
        // Check all date fields
        ['payment_date', 'due_date', 'created_at'].forEach(field => {
          if (record[field] && record[field].includes('2025-07-32')) {
            updates[field] = record[field].replace('2025-07-32', '2025-07-31');
            needsUpdate = true;
            console.log(`  🔧 Fixing ${field} for record ${record.id}`);
          }
        });
        
        if (needsUpdate) {
          const { error: updateError } = await supabase
            .from('student_fees')
            .update(updates)
            .eq('id', record.id);
          
          if (updateError) {
            console.error(`  ❌ Error updating record ${record.id}:`, updateError.message);
          } else {
            totalFixed++;
            console.log(`  ✅ Fixed record ${record.id}`);
          }
        }
      }
    }
    
    console.log(`\n🎉 Finished! Fixed ${totalFixed} records total.`);
    
    if (totalFixed > 0) {
      console.log('✅ Your app should now work without date errors!');
    } else {
      console.log('ℹ️  No invalid dates found.');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Run the fix
fixInvalidDates();
