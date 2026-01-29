const Core = require('@alicloud/pop-core');
const path = require('path');
const fs = require('fs');

// 确保加载环境变量
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

// 判断当前是否为生产环境
// 逻辑：如果 NODE_ENV 是 'production' 或者系统环境变量里设置了 production，则是生产环境
const isProduction = process.env.NODE_ENV === 'production';

let client = null;

// 仅在生产环境下初始化阿里云 SDK，避免本地报错
if (isProduction) {
  if (process.env.ALIYUN_ACCESS_KEY_ID && process.env.ALIYUN_ACCESS_KEY_SECRET) {
    client = new Core({
      accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID,
      accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET,
      endpoint: 'https://dysmsapi.aliyuncs.com',
      apiVersion: '2017-05-25'
    });
  } else {
    console.warn('⚠️ [系统警告] 生产环境模式下未检测到阿里云 Key，短信功能将无法使用！');
  }
}

async function sendSms(phoneNumber, code) {
  // ============================
  // 模式 A: 开发环境 (Mock Mode)
  // ============================
  if (!isProduction) {
    console.log('===========================================================');
    console.log(`📱 [开发模式-模拟短信] 目标手机: ${phoneNumber}`);
    console.log(`🔑 [开发模式-验证码]   ${code}`);
    console.log('   (已拦截真实发送请求，前端将收到成功响应)');
    console.log('===========================================================');
    return true; // 强制返回成功
  }

  // ============================
  // 模式 B: 生产环境 (Real Mode)
  // ============================
  
  if (!client) {
    console.error('[阿里云] SDK 未初始化，无法发送短信。');
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
    console.log(`[阿里云] 正在尝试发送真实短信... 目标: ${phoneNumber}`);
    const response = await client.request('SendSms', params, requestOption);
    
    if (response.Code === 'OK') {
      console.log(`[阿里云] 发送成功! BizId: ${response.BizId}`);
      return true;
    } else {
      console.error(`[阿里云] 发送失败: ${response.Code} - ${response.Message}`);
      return false;
    }
  } catch (error) {
    console.error('[阿里云] SDK 异常:', error);
    return false;
  }
}

module.exports = { sendSms };