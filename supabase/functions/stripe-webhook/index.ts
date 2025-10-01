import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'npm:stripe@latest';
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400"
};
serve(async (req)=>{
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }
  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!stripeSecretKey || !webhookSecret) {
      throw new Error("Missing Stripe configuration");
    }
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16'
    });
    // Initialize Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    // Verify webhook signature
    const signature = req.headers.get('stripe-signature');
    const rawBody = await req.text();
    console.log("Printing raw response", rawBody);
    if (!signature) {
      console.error('No Stripe signature found');
      return new Response('No signature', {
        status: 400
      });
    }
    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return new Response(`Webhook Error: ${err.message}`, {
        status: 400
      });
    }
    // Handle the events
    switch(event.type){
      case 'checkout.session.completed':
        await handleCheckoutCompleted(supabase, stripe, event.data.object);
        break;
      case 'customer.subscription.created':
        await handleSubscriptionCreated(supabase, event.data.object);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(supabase, event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(supabase, event.data.object);
        break;
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(supabase, event.data.object);
        break;
      case 'invoice.payment_failed':
        await handlePaymentFailed(supabase, event.data.object);
        break;
      case 'invoice.payment_action_required':
        await handlePaymentActionRequired(supabase, event.data.object);
        break;
      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(supabase, event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    return new Response('ok', {
      status: 200
    });
  } catch (error) {
    console.error(error.message);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500
    });
  }
});
// Helper function to get user by customer ID
async function getUserByCustomerId(supabase, customerId) {
  const { data: profile, error } = await supabase.from('profiles').select('*').eq('stripe_customer_id', customerId).single();
  if (error) {
    console.error('Error finding user by customer ID:', error);
    return null;
  }
  return profile;
}
// Helper function to get subscription by stripe ID
async function getSubscriptionByStripeId(supabase, stripeSubscriptionId) {
  const { data: subscription, error } = await supabase.from('user_subscriptions').select('*').eq('stripe_subscription_id', stripeSubscriptionId).single();
  if (error && error.code !== 'PGRST116') {
    console.error('Error finding subscription:', error);
    return null;
  }
  return subscription;
}
// Handle successful checkout completion
async function handleCheckoutCompleted(supabase, stripe, session) {
  try {
    console.log('Processing checkout completion:', session.id);
    const profile = await getUserByCustomerId(supabase, session.customer);
    if (!profile) {
      console.error('No user found for customer:', session.customer);
      return;
    }
    // If this is a subscription checkout
    if (session.mode === 'subscription' && session.subscription) {
      // Get full subscription details from Stripe
      const subscription = await stripe.subscriptions.retrieve(session.subscription);
      // Check if subscription already exists
      const existingSubscription = await getSubscriptionByStripeId(supabase, subscription.id);
      console.log("object", subscription);
      console.log('Subscription', subscription.items.data[0]);
      if (!existingSubscription) {
        // Create new subscription record
        const { error: subError } = await supabase.from('user_subscriptions').insert({
          user_id: profile.id,
          stripe_subscription_id: subscription.id,
          stripe_customer_id: session.customer,
          status: subscription.status,
          current_period_start: new Date(subscription.items.data[0].current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.items.data[0].current_period_end * 1000).toISOString(),
          subscription_tier: subscription.items.data[0].price.lookup_key || subscription.items.data[0].price.id,
          price_id: subscription.items.data[0].price.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        if (subError) {
          console.error('Error creating subscription:', subError);
          return;
        }
        // Update user profile with subscription info
        const { error: profileError } = await supabase.from('profiles').update({
          stripe_subscription_id: subscription.id,
          subscription_status: subscription.status,
          plan_id: subscription.items.data[0].price.lookup_key || subscription.items.data[0].price.id,
          updated_at: new Date().toISOString()
        }).eq('id', profile.id);
        if (profileError) {
          console.error('Error updating profile:', profileError);
        }
      }
    }
    console.log('Checkout completion processed successfully');
  } catch (error) {
    console.error('Error in handleCheckoutCompleted:', error);
  }
}
// Handle subscription creation
async function handleSubscriptionCreated(supabase, subscription) {
  try {
    console.log('Processing subscription creation:', subscription.id);
    const profile = await getUserByCustomerId(supabase, subscription.customer);
    if (!profile) {
      console.error('No user found for customer:', subscription.customer);
      return;
    }
    // Check if subscription already exists
    const existingSubscription = await getSubscriptionByStripeId(supabase, subscription.id);
    if (!existingSubscription) {
      const { error } = await supabase.from('user_subscriptions').insert({
        user_id: profile.user_id || profile.id,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer,
        status: subscription.status,
        current_period_start: new Date(subscription.items.data[0].current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.items.data[0].current_period_end * 1000).toISOString(),
        subscription_tier: subscription.items.data[0].price.lookup_key || subscription.items.data[0].price.id,
        price_id: subscription.items.data[0].price.id,
        created_at: new Date().toISOString().replace('T', ' ').replace('Z', '+00'),
        updated_at: new Date().toISOString().replace('T', ' ').replace('Z', '+00')
      });
      if (error) {
        console.error('Error creating subscription:', error);
      }
    }
  } catch (error) {
    console.error('Error in handleSubscriptionCreated:', error);
  }
}
// Handle subscription updates
async function handleSubscriptionUpdated(supabase, subscription) {
  try {
    console.log('Processing subscription update:', subscription.id);
    // Update subscription record
    const { error: subError } = await supabase.from('user_subscriptions').update({
      status: subscription.status,
      current_period_start: new Date(subscription.items.data[0].current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.items.data[0].current_period_end * 1000).toISOString(),
      subscription_tier: subscription.items.data[0].price.lookup_key || subscription.items.data[0].price.id,
      price_id: subscription.items.data[0].price.id,
      canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
      updated_at: new Date().toISOString()
    }).eq('stripe_subscription_id', subscription.id);
    if (subError) {
      console.error('Error updating subscription:', subError);
      return;
    }
    // Update user profile
    const profile = await getUserByCustomerId(supabase, subscription.customer);
    if (profile) {
      const { error: profileError } = await supabase.from('profiles').update({
        subscription_status: subscription.status,
        plan_id: subscription.items.data[0].price.lookup_key || subscription.items.data[0].price.id,
        updated_at: new Date().toISOString()
      }).eq('id', profile.id);
      if (profileError) {
        console.error('Error updating profile:', profileError);
      }
    }
    console.log('Subscription update processed successfully');
  } catch (error) {
    console.error('Error in handleSubscriptionUpdated:', error);
  }
}
// Handle subscription deletion/cancellation
async function handleSubscriptionDeleted(supabase, subscription) {
  try {
    console.log('Processing subscription deletion:', subscription.id);
    // Update subscription record
    const { error: subError } = await supabase.from('user_subscriptions').update({
      status: 'canceled',
      canceled_at: new Date(subscription.canceled_at * 1000).toISOString(),
      updated_at: new Date().toISOString()
    }).eq('stripe_subscription_id', subscription.id);
    if (subError) {
      console.error('Error updating subscription on deletion:', subError);
      return;
    }
    // Update user profile
    const profile = await getUserByCustomerId(supabase, subscription.customer);
    if (profile) {
      const { error: profileError } = await supabase.from('profiles').update({
        subscription_status: 'canceled',
        updated_at: new Date().toISOString()
      }).eq('id', profile.id);
      if (profileError) {
        console.error('Error updating profile on subscription deletion:', profileError);
      }
    }
    console.log('Subscription deletion processed successfully');
  } catch (error) {
    console.error('Error in handleSubscriptionDeleted:', error);
  }
}
// Handle successful payments
async function handlePaymentSucceeded(supabase, invoice) {
  try {
    console.log('Processing successful payment:', invoice.id);
    const subscriptionDetails = invoice.lines.data[0].parent.subscription_item_details;
    if (!subscriptionDetails.subscription) {
      console.log('No subscription associated with invoice, skipping');
      return;
    }
    // Get subscription info
    const { data: subscription, error: subError } = await supabase.from('user_subscriptions').select('user_id, id').eq('stripe_subscription_id', subscriptionDetails.subscription).single();
    if (subError || !subscription) {
      console.error('No subscription found for invoice:', invoice.subscription);
      return;
    }
    // Check if payment record already exists
    const { data: existingPayment } = await supabase.from('payments').select('id').eq('stripe_invoice_id', invoice.id).single();
    if (existingPayment) {
      console.log('Payment record already exists, skipping');
      return;
    }
    // Create payment record
    const { error: paymentError } = await supabase.from('payments').insert({
      user_id: subscription.user_id,
      subscription_id: subscription.id,
      stripe_invoice_id: invoice.id,
      amount: invoice.amount_paid,
      currency: invoice.currency.toUpperCase(),
      status: 'succeeded',
      billing_period_start: new Date(invoice.period_start * 1000).toISOString(),
      billing_period_end: new Date(invoice.period_end * 1000).toISOString(),
      created_at: new Date().toISOString()
    });
    if (paymentError) {
      console.error('Error creating payment record:', paymentError);
      return;
    }
    console.log('Payment success processed successfully');
  } catch (error) {
    console.error('Error in handlePaymentSucceeded:', error);
  }
}
// Handle failed payments
async function handlePaymentFailed(supabase, invoice) {
  try {
    console.log('Processing failed payment:', invoice.id);
    const subscriptionDetails = invoice.lines.data[0].parent.subscription_item_details;
    if (!subscriptionDetails.subscription) {
      console.log('No subscription associated with invoice, skipping');
      return;
    }
    const { data: subscription, error: subError } = await supabase.from('user_subscriptions').select('user_id, id').eq('stripe_subscription_id', subscriptionDetails.subscription).single();
    if (subError || !subscription) {
      console.error('No subscription found for invoice:', invoice.subscription);
      return;
    }
    // Check if payment record already exists
    const { data: existingPayment } = await supabase.from('payments').select('id').eq('stripe_invoice_id', invoice.id).single();
    if (existingPayment) {
      // Update existing record
      const { error: updateError } = await supabase.from('payments').update({
        status: 'failed',
        failure_reason: invoice.last_finalization_error?.message || 'Payment failed',
        updated_at: new Date().toISOString()
      }).eq('stripe_invoice_id', invoice.id);
      if (updateError) {
        console.error('Error updating failed payment:', updateError);
      }
      return;
    }
    // Create failed payment record
    const { error: paymentError } = await supabase.from('payments').insert({
      user_id: subscription.user_id,
      subscription_id: subscription.id,
      stripe_invoice_id: invoice.id,
      amount: invoice.amount_due,
      currency: invoice.currency.toUpperCase(),
      status: 'failed',
      failure_reason: invoice.last_finalization_error?.message || 'Payment failed',
      billing_period_start: new Date(invoice.period_start * 1000).toISOString(),
      billing_period_end: new Date(invoice.period_end * 1000).toISOString(),
      created_at: new Date().toISOString()
    });
    if (paymentError) {
      console.error('Error creating failed payment record:', paymentError);
      return;
    }
    console.log('Payment failure processed successfully');
  } catch (error) {
    console.error('Error in handlePaymentFailed:', error);
  }
}
// Handle payments requiring additional action (3D Secure, etc.)
async function handlePaymentActionRequired(supabase, invoice) {
  try {
    console.log('Processing payment action required:', invoice.id);
    const subscriptionDetails = invoice.lines.data[0].parent.subscription_item_details;
    if (!subscriptionDetails.subscription) {
      return;
    }
    const { data: subscription } = await supabase.from('user_subscriptions').select('user_id, id').eq('stripe_subscription_id', subscriptionDetails.subscription).single();
    if (!subscription) {
      return;
    }
    // Update or create payment record with pending status
    const { data: existingPayment } = await supabase.from('payments').select('id').eq('stripe_invoice_id', invoice.id).single();
    if (existingPayment) {
      await supabase.from('payments').update({
        status: 'requires_action',
        updated_at: new Date().toISOString()
      }).eq('stripe_invoice_id', invoice.id);
    } else {
      await supabase.from('payments').insert({
        user_id: subscription.user_id,
        subscription_id: subscription.id,
        stripe_invoice_id: invoice.id,
        amount: invoice.amount_due,
        currency: invoice.currency.toUpperCase(),
        status: 'requires_action',
        billing_period_start: new Date(invoice.period_start * 1000).toISOString(),
        billing_period_end: new Date(invoice.period_end * 1000).toISOString(),
        created_at: new Date().toISOString()
      });
    }
    console.log('Payment action required processed successfully');
  } catch (error) {
    console.error('Error in handlePaymentActionRequired:', error);
  }
}
// Handle trial ending soon
async function handleTrialWillEnd(supabase, subscription) {
  try {
    console.log('Processing trial will end:', subscription.id);
    const profile = await getUserByCustomerId(supabase, subscription.customer);
    if (!profile) {
      return;
    }
    // You can send email notifications here or update flags
    // For now, just log it
    console.log(`Trial ending soon for user ${profile.id}`);
    // Optional: Update a flag in the database
    const { error } = await supabase.from('profiles').update({
      trial_ending_notification_sent: true,
      updated_at: new Date().toISOString()
    }).eq('id', profile.id);
    if (error) {
      console.error('Error updating trial notification flag:', error);
    }
  } catch (error) {
    console.error('Error in handleTrialWillEnd:', error);
  }
}
