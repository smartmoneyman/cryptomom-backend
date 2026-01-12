// Storage for push notification subscriptions
const subscriptions = [];

export function saveSubscription(subscription) {
  // Check if subscription already exists
  const exists = subscriptions.some(
    sub => sub.endpoint === subscription.endpoint
  );
  
  if (!exists) {
    subscriptions.push(subscription);
    console.log('✅ Subscription saved. Total:', subscriptions.length);
  } else {
    console.log('ℹ️ Subscription already exists');
  }
  
  return subscription;
}

export function getSubscriptions() {
  return subscriptions;
}

export function removeSubscription(endpoint) {
  const index = subscriptions.findIndex(
    sub => sub.endpoint === endpoint
  );
  
  if (index !== -1) {
    subscriptions.splice(index, 1);
    console.log('✅ Subscription removed. Total:', subscriptions.length);
    return true;
  }
  
  return false;
}

export function getSubscriptionCount() {
  return subscriptions.length;
}
