/**
 * Webhook Diagnostic Test Script
 * 
 * Independent tests to determine if payment registration issues are caused by:
 * 1. Stripe webhook delivery failures
 * 2. Stripe platform issues
 * 3. Application-side issues
 * 
 * Usage:
 *   npx tsx scripts/test-webhook-diagnostics.ts <session_id> <user_id>
 * 
 * Example:
 *   npx tsx scripts/test-webhook-diagnostics.ts cs_test_abc123 user_123
 */

import Stripe from 'stripe';
import { getStripeClient } from '../src/lib/stripe';
import { getAdminDatabase } from '../src/lib/firebase/admin';
import { secureLogger } from '../src/lib/secureLogger';

interface DiagnosticResults {
  stripeAPIConnectivity: boolean;
  sessionVerification: boolean;
  paymentStatus: 'paid' | 'unpaid' | 'unknown';
  subscriptionExists: boolean;
  firebaseState: {
    reg_sts: string | null;
    onc: boolean | null;
    hasSubscription: boolean;
  };
  stateMismatch: boolean;
  recommendations: string[];
}

/**
 * Test Stripe API connectivity
 */
async function testStripeAPIConnectivity(): Promise<boolean> {
  try {
    console.log('\n🔍 Test 1: Stripe API Connectivity');
    const stripe = getStripeClient();
    
    // Test basic API call
    const account = await stripe.accounts.retrieve();
    console.log('✅ Stripe API accessible');
    console.log(`   Account ID: ${account.id}`);
    
    // Test webhook endpoints
    try {
      const webhooks = await stripe.webhookEndpoints.list({ limit: 10 });
      console.log('✅ Webhook endpoints accessible');
      console.log(`   Found ${webhooks.data.length} webhook endpoint(s)`);
      
      webhooks.data.forEach((webhook, index) => {
        console.log(`   ${index + 1}. ${webhook.url}`);
        console.log(`      Status: ${webhook.status}`);
        console.log(`      Events: ${webhook.enabled_events.length}`);
      });
    } catch (error) {
      console.log('⚠️  Could not retrieve webhook endpoints (may require specific permissions)');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Stripe API connectivity test failed:', error);
    return false;
  }
}

/**
 * Test session verification and compare with Firebase
 */
async function testSessionVerification(
  sessionId: string,
  userId: string
): Promise<DiagnosticResults> {
  const results: DiagnosticResults = {
    stripeAPIConnectivity: false,
    sessionVerification: false,
    paymentStatus: 'unknown',
    subscriptionExists: false,
    firebaseState: {
      reg_sts: null,
      onc: null,
      hasSubscription: false,
    },
    stateMismatch: false,
    recommendations: [],
  };
  
  try {
    console.log('\n🔍 Test 2: Session Verification & State Comparison');
    console.log(`   Session ID: ${sessionId.substring(0, 20)}...`);
    console.log(`   User ID: ${userId}`);
    
    const stripe = getStripeClient();
    
    // 1. Retrieve session from Stripe
    console.log('\n   Step 1: Retrieving session from Stripe...');
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    console.log('   ✅ Session retrieved from Stripe');
    console.log(`      Payment Status: ${session.payment_status}`);
    console.log(`      Session Status: ${session.status}`);
    console.log(`      Subscription: ${session.subscription || 'none'}`);
    console.log(`      Metadata:`, session.metadata);
    
    results.paymentStatus = session.payment_status === 'paid' ? 'paid' : 'unpaid';
    results.sessionVerification = true;
    
    // 2. Check payment status
    if (session.payment_status === 'paid' && session.status === 'complete') {
      console.log('   ✅ Payment confirmed in Stripe');
      
      // 3. Check subscription
      if (session.subscription) {
        console.log('\n   Step 2: Checking subscription...');
        try {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );
          console.log('   ✅ Subscription exists in Stripe');
          console.log(`      Subscription ID: ${subscription.id}`);
          console.log(`      Status: ${subscription.status}`);
          console.log(`      Customer: ${subscription.customer}`);
          results.subscriptionExists = true;
        } catch (error) {
          console.error('   ❌ Could not retrieve subscription:', error);
          results.recommendations.push('Subscription exists in session but cannot be retrieved');
        }
      } else {
        console.log('   ⚠️  No subscription in session (may be one-time payment)');
      }
      
      // 4. Check Firebase state
      console.log('\n   Step 3: Checking Firebase state...');
      const db = getAdminDatabase();
      const userRef = db.ref(`rbca_users/${userId}`);
      const userSnapshot = await userRef.once('value');
      
      if (userSnapshot.exists()) {
        const userData = userSnapshot.val();
        results.firebaseState = {
          reg_sts: userData.reg?.sts || null,
          onc: userData.onc || false,
          hasSubscription: !!userData.subscription,
        };
        
        console.log('   ✅ User found in Firebase');
        console.log(`      Registration Status: ${results.firebaseState.reg_sts || 'not set'}`);
        console.log(`      Onboarding Complete: ${results.firebaseState.onc}`);
        console.log(`      Has Subscription Record: ${results.firebaseState.hasSubscription}`);
        
        // 5. Compare states
        console.log('\n   Step 4: Comparing Stripe vs Firebase state...');
        const expectedCompleted = results.firebaseState.reg_sts === 'completed';
        const expectedOnc = results.firebaseState.onc === true;
        
        if (!expectedCompleted || !expectedOnc) {
          console.log('   ❌ STATE MISMATCH DETECTED');
          console.log('      Stripe: Payment = paid, Status = complete');
          console.log(`      Firebase: reg.sts = ${results.firebaseState.reg_sts}, onc = ${results.firebaseState.onc}`);
          results.stateMismatch = true;
          results.recommendations.push(
            'Webhook likely did not process - Firebase not updated despite successful payment'
          );
        } else {
          console.log('   ✅ States match - Webhook processed successfully');
        }
      } else {
        console.log('   ❌ User not found in Firebase');
        results.recommendations.push('User record missing in Firebase');
      }
      
      // 6. Check subscription record
      if (session.subscription && !results.firebaseState.hasSubscription) {
        console.log('   ⚠️  Subscription exists in Stripe but not in Firebase');
        results.recommendations.push('Subscription record missing in Firebase - webhook may not have created it');
      }
      
    } else {
      console.log('   ❌ Payment not completed in Stripe');
      console.log(`      Payment Status: ${session.payment_status}`);
      console.log(`      Session Status: ${session.status}`);
      results.recommendations.push('Payment not actually completed - this is not a webhook issue');
    }
    
    // 7. Verify user ownership
    const sessionUserId = session.metadata?.userId;
    if (sessionUserId && sessionUserId !== userId) {
      console.log('   ⚠️  WARNING: Session user ID mismatch');
      console.log(`      Session metadata userId: ${sessionUserId}`);
      console.log(`      Authenticated userId: ${userId}`);
      results.recommendations.push('SECURITY WARNING: Session does not belong to authenticated user');
    }
    
  } catch (error) {
    console.error('   ❌ Session verification failed:', error);
    if (error instanceof Stripe.errors.StripeError) {
      if (error.code === 'resource_missing') {
        results.recommendations.push('Session ID not found in Stripe - may be invalid or expired');
      } else {
        results.recommendations.push(`Stripe API error: ${error.message}`);
      }
    }
  }
  
  return results;
}

/**
 * Check webhook delivery status (requires manual check in Stripe Dashboard)
 */
function checkWebhookDeliveryStatus(sessionId: string): void {
  console.log('\n🔍 Test 3: Webhook Delivery Status (Manual Check Required)');
  console.log('   To check webhook delivery:');
  console.log('   1. Go to Stripe Dashboard → Developers → Webhooks');
  console.log('   2. Click on your webhook endpoint');
  console.log('   3. Check "Recent deliveries" tab');
  console.log(`   4. Look for event: checkout.session.completed`);
  console.log(`   5. Check if session ID ${sessionId.substring(0, 20)}... is in the event data`);
  console.log('\n   What to look for:');
  console.log('   ✅ Success status → Webhook delivered and processed');
  console.log('   ❌ Failed status → Check response code and error message');
  console.log('   ⚠️  No events → Stripe not sending webhooks');
}

/**
 * Generate diagnostic report
 */
function generateReport(results: DiagnosticResults): void {
  console.log('\n' + '='.repeat(60));
  console.log('📊 DIAGNOSTIC REPORT');
  console.log('='.repeat(60));
  
  console.log('\n✅ Tests Passed:');
  if (results.stripeAPIConnectivity) console.log('   ✓ Stripe API Connectivity');
  if (results.sessionVerification) console.log('   ✓ Session Verification');
  
  console.log('\n📋 State Information:');
  console.log(`   Payment Status: ${results.paymentStatus}`);
  console.log(`   Subscription Exists: ${results.subscriptionExists ? 'Yes' : 'No'}`);
  console.log(`   Firebase reg.sts: ${results.firebaseState.reg_sts || 'not set'}`);
  console.log(`   Firebase onc: ${results.firebaseState.onc}`);
  console.log(`   Firebase has subscription: ${results.firebaseState.hasSubscription}`);
  
  if (results.stateMismatch) {
    console.log('\n❌ ISSUE DETECTED:');
    console.log('   State mismatch between Stripe and Firebase');
    console.log('   This indicates webhook did not process successfully');
  } else if (results.paymentStatus === 'paid') {
    console.log('\n✅ States Match:');
    console.log('   Webhook appears to have processed successfully');
  }
  
  if (results.recommendations.length > 0) {
    console.log('\n💡 Recommendations:');
    results.recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec}`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
}

/**
 * Main diagnostic function
 */
async function runDiagnostics(sessionId: string, userId: string): Promise<void> {
  console.log('🔍 Starting Webhook Diagnostics...');
  console.log(`   Session ID: ${sessionId}`);
  console.log(`   User ID: ${userId}`);
  
  // Test 1: Stripe API connectivity
  const apiConnected = await testStripeAPIConnectivity();
  
  // Test 2: Session verification
  const results = await testSessionVerification(sessionId, userId);
  results.stripeAPIConnectivity = apiConnected;
  
  // Test 3: Webhook delivery (manual check)
  checkWebhookDeliveryStatus(sessionId);
  
  // Generate report
  generateReport(results);
  
  // Final conclusion
  console.log('\n🎯 CONCLUSION:');
  if (results.stateMismatch && results.paymentStatus === 'paid') {
    console.log('   ❌ Webhook likely did not process');
    console.log('   → Check Stripe Dashboard for webhook delivery status');
    console.log('   → Verify webhook endpoint is accessible');
    console.log('   → Review webhook handler logs');
    console.log('   → Consider implementing verification endpoint fallback');
  } else if (results.paymentStatus === 'unpaid') {
    console.log('   ⚠️  Payment not completed - not a webhook issue');
  } else if (!results.stateMismatch) {
    console.log('   ✅ No issues detected - webhook processed successfully');
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('Usage: npx tsx scripts/test-webhook-diagnostics.ts <session_id> <user_id>');
    console.error('Example: npx tsx scripts/test-webhook-diagnostics.ts cs_test_abc123 user_123');
    process.exit(1);
  }
  
  const [sessionId, userId] = args;
  
  if (!sessionId.startsWith('cs_')) {
    console.error('Error: session_id must start with "cs_"');
    process.exit(1);
  }
  
  runDiagnostics(sessionId, userId)
    .then(() => {
      console.log('\n✅ Diagnostics complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Diagnostics failed:', error);
      process.exit(1);
    });
}

export { runDiagnostics, testStripeAPIConnectivity, testSessionVerification };
