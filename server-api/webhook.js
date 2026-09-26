module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method Not Allowed'
    });
  }

  const paypalWebhookId = process.env.PAYPAL_WEBHOOK_ID;
  const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;

  if (!paypalWebhookId || !n8nWebhookUrl) {
    return res.status(500).json({
      success: false,
      error: 'Configuration incomplete'
    });
  }

  try {
    const webhookEvent = req.body;
    const headers = req.headers;

    const clientId = process.env.PAYPAL_CLIENT_ID;
    const secret = process.env.PAYPAL_SECRET;

    if (!clientId || !secret) {
      return res.status(500).json({
        success: false,
        error: 'PayPal credentials are not configured'
      });
    }

    const auth = Buffer.from(
      clientId + ':' + secret
    ).toString('base64');

    const verificationResponse = await fetch(
      'https://api-m.paypal.com/v1/notifications/verify-webhook-signature',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + auth
        },
        body: JSON.stringify({
          auth_algo: headers['paypal-auth-algo'],
          cert_url: headers['paypal-cert-url'],
          transmission_id: headers['paypal-transmission-id'],
          transmission_sig: headers['paypal-transmission-sig'],
          transmission_time: headers['paypal-transmission-time'],
          webhook_id: paypalWebhookId,
          webhook_event: webhookEvent
        })
      }
    );

    const verificationResult =
      await verificationResponse.json();

    if (
      !verificationResponse.ok ||
      verificationResult.verification_status !== 'SUCCESS'
    ) {
      console.error(
        'PayPal signature verification failed:',
        verificationResult
      );

      return res.status(400).json({
        success: false,
        error: 'Invalid signature'
      });
    }

    const forwardResponse = await fetch(
      n8nWebhookUrl,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(webhookEvent)
      }
    );

    if (!forwardResponse.ok) {
      const forwardText =
        await forwardResponse.text();

      console.error(
        'Automation webhook failed:',
        forwardResponse.status,
        forwardText
      );

      return res.status(502).json({
        success: false,
        error: 'Automation webhook failed',
        provider_status: forwardResponse.status
      });
    }

    return res.status(200).json({
      success: true,
      status: 'Forwarded to automation'
    });

  } catch (error) {
    console.error(
      'AION webhook error:',
      error
    );

    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      details:
        error?.message || 'Unknown error'
    });
  }
};
