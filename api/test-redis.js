// api/test-redis.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  
  const diag = {
    url_exists: !!url,
    url_length: url ? url.length : 0,
    url_has_newline: url ? /[\r\n]/.test(url) : false,
    token_exists: !!token,
    token_length: token ? token.length : 0,
    token_has_newline: token ? /[\r\n]/.test(token) : false,
  };
  
  if (!url || !token) {
    return res.status(500).json({
      success: false,
      message: 'المتغيرات مفقودة',
      diag
    });
  }
  
  try {
    const setRes = await fetch(`${url}/set/test-key?value=hello-aion`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    const setData = await setRes.json();
    
    const getRes = await fetch(`${url}/get/test-key`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const getData = await getRes.json();
    
    return res.status(200).json({
      success: true,
      message: 'Redis يعمل بنجاح!',
      diag,
      set_result: setData,
      get_result: getData,
      stored_value: getData.result
    });
  } catch(e) {
    return res.status(500).json({
      success: false,
      message: 'فشل الاتصال',
      error: e.message,
      diag
    });
  }
}
