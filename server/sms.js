const Core = require('@alicloud/pop-core');
const path = require('path');
const fs = require('fs');

// 确保加载环境变量
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

// 【核心修改】不再判断环境，直接初始化 SDK
let client = null;

try {
  if (process.env.ALIYUN_ACCESS_KEY_ID && process.env.ALIYUN_ACCESS_KEY_SECRET) {
    client = new Core({
      accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID,
      accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET,
      endpoint: 'https://dysmsapi.aliyuncs.com',
      apiVersion: '2017-05-25'
    });
    console.log('📡 [短信服务] 阿里云 SDK 已强制加载');
  } else {
    console.error('❌ [短信服务] 缺少阿里云 Key，请检查 .env 文件');
  }
} catch (e) {
  console.error('❌ [短信服务] SDK 初始化失败:', e);
}

async function sendSms(phoneNumber, code) {
  // 【核心修改】删除了所有的模拟拦截逻辑，直接发！
  
  if (!client) {
    console.error('❌ [短信服务] SDK 未就绪，无法发送');
    return false;
  }

  const params = {
    "RegionId": "cn-hangzhou",
    "PhoneNumbers": phoneNumber,
    "SignName": process.env.ALIYUN_SMS_SIGN_NAME,
    "TemplateCode": process.env.ALIYUN_SMS_TEMPLATE_CODE,
    "TemplateParam": JSON.stringify({ code: String(code) })
  };

  const requestOption = {
    method: 'POST',
    formatParams: false,
  };

  try {
    console.log(`📡 [阿里云] 正在请求真实发送接口 -> 目标: ${phoneNumber}`);
    const response = await client.request('SendSms', params, requestOption);
    
    if (response.Code === 'OK') {
      console.log(`✅ [阿里云] 发送成功! BizId: ${response.BizId}`);
      return true;
    } else {
      console.error(`❌ [阿里云] 发送被拒绝: ${response.Code} - ${response.Message}`);
      return false;
    }
  } catch (error) {
    console.error('❌ [阿里云] 网络或接口异常:', error);
    return false;
  }
}

module.exports = { sendSms };