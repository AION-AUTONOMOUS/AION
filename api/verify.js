
```javascript
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const transactionId = req.body.transactionId;
  const expectedAmount = parseFloat(req.body.expectedAmount) || 0;
  
  if (!transactionId) {
    return res.status(400).json({ success: false, error: 'رقم العملية مطلوب' });
  }
  
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_SECRET;
  
  if (!clientId || !secret) {
    return res.status(500).json({ success: false, error: 'إعدادات PayPal غير مكتملة' });
  }
  
  try {
    // Get access token
    const auth = Buffer.from(clientId + ':' + secret).toString('base64');
    const tokenRes = await fetch('https://api-m.paypal.com/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + auth,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });
    
    const tokenData = await tokenRes.json();
    
    if (!tokenRes.ok || !tokenData.access_token) {
      return res.status(500).json({ success: false, error: 'فشل الاتصال بـ PayPal' });
    }
    
    const accessToken = tokenData.access_token;
    
    // Verify transaction
    const verifyRes = await fetch(
      'https://api-m.paypal.com/v2/payments/captures/' + transactionId,
      {
        headers: {
          'Authorization': 'Bearer ' + accessToken,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!verifyRes.ok) {
      return res.status(200).json({ 
        success: false, 
        error: 'رقم العملية غير موجود أو غير صحيح'
      });
    }
    
    const capture = await verifyRes.json();
    
    const amount = parseFloat(capture.amount ? capture.amount.value : 0);
    const currency = capture.amount ? capture.amount.currency_code : 'USD';
    const status = capture.status || 'UNKNOWN';
    
    // Validate
    if (status !== 'COMPLETED') {
      return res.status(200).json({ 
        success: false, 
        error: 'العملية غير مكتملة (الحالة: ' + status + ')'
      });
    }
    
    if (expectedAmount > 0 && amount < expectedAmount) {
      return res.status(200).json({ 
        success: false, 
        error: 'المبلغ المدفوع أقل من المطلوب (' + amount + ' ' + currency + ')'
      });
    }
    
    return res.status(200).json({
      success: true,
      transactionId: transactionId,
      amount: amount,
      currency: currency,
      status: status,
      payer: capture.payer ? capture.payer.email_address : 'N/A',
      date: capture.create_time || new Date().toISOString()
    });
    
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      error: 'خطأ في التحقق: ' + error.message 
    });
  }
};
```
