export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const clientId = process.env.PAYPAL_CLIENT_ID || '';
  const clientSecret = process.env.PAYPAL_SECRET || '';

  // Diagnostic info (بدون كشف القيم كاملة)
  const diag = {
    clientId_length: clientId.length,
    clientId_start: clientId.slice(0, 10),
    clientId_end: clientId.slice(-10),
    clientId_has_space: clientId !== clientId.trim(),
    clientId_has_newline: clientId.includes('\n'),
    clientSecret_length: clientSecret.length,
    clientSecret_start: clientSecret.slice(0, 6),
    clientSecret_end: clientSecret.slice(-6),
    clientSecret_has_space: clientSecret !== clientSecret.trim(),
    clientSecret_has_newline: clientSecret.includes('\n'),
  };

  // Test PayPal auth
  try {
    const auth = Buffer.from(clientId + ':' + clientSecret).toString('base64');
    const tokenRes = await fetch('https://api-m.paypal.com/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + auth,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });

    const tokenData = await tokenRes.json();

    if (tokenRes.ok && tokenData.access_token) {
      return res.status(200).json({
        success: true,
        message: 'المفاتيح صحيحة — PayPal يقبل الاتصال',
        diag,
        token_preview: tokenData.access_token.slice(0, 20) + '...'
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'PayPal رفض المفاتيح',
        error: tokenData.error,
        error_description: tokenData.error_description,
        diag
      });
    }
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'خطأ في الاتصال',
      error: err.message,
      diag
    });
  }
}
