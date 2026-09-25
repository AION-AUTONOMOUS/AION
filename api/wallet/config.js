const ALLOWED_ORIGIN = process.env.AION_PUBLIC_ORIGIN || 'https://aion-theta-eight.vercel.app';

function validAddress(value) {
  return typeof value === 'string' && /^0x[a-fA-F0-9]{40}$/.test(value);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const companyWallet = process.env.AION_COMPANY_WALLET;
  const tokenAddress = process.env.AION_TOKEN_ADDRESS || '';

  return res.status(200).json({
    ready: validAddress(companyWallet),
    chainId: '0x38',
    network: 'BNB Smart Chain',
    companyWallet: validAddress(companyWallet) ? companyWallet : null,
    tokenAddress: validAddress(tokenAddress) ? tokenAddress : null
  });
}
