import webpush from 'web-push';

const vapidKeys = {
  publicKey: 'BJ9rDeETv6V_gbQUdKvTjBE2YfaRncjac3kiX857rt_IErRVBbKVbAbTEGclgO-F_gQLEcGNggFcVBMlY34jf7c',
  privateKey: 't7WuRYuR_kuYCW-mW7_BlenaQE68ojFILFg8pl2XwbI'
};

webpush.setVapidDetails(
  'mailto:itbartho@gmail.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

export async function sendPushNotification(subscription, data) {
  const payload = JSON.stringify({
    title: data.title || '🔥 Hot Alert!',
    body: data.body || 'New momentum detected',
    tag: data.tag || 'momentum-alert',
    data: data
  });
  
  try {
    await webpush.sendNotification(subscription, payload);
    console.log('✅ Push sent to:', subscription.endpoint);
  } catch (error) {
    console.error('❌ Push failed:', error);
  }
}