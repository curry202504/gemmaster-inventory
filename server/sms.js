const Core = require('@alicloud/pop-core');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// 初始化阿里云 SDK
const client = new Core({
  accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID,
  accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET,
  endpoint: 'https://dysmsapi.aliyuncs.com',
  apiVersion: '2017-05-25'
});

async function sendSms(phoneNumber, code) {
  // 构造参数
  const params = {
    "RegionId": "cn-hangzhou",
    "PhoneNumbers": phoneNumber,
    "SignName": process.env.ALIYUN_SMS_SIGN_NAME,
    "TemplateCode": process.env.ALIYUN_SMS_TEMPLATE_CODE,
    // 假设你的模板里只有一个变量 ${code}
    "TemplateParam": JSON.stringify({ code: String(code) })
  };

  const requestOption = {
    method: 'POST',
    formatParams: false,
  };

  try {
    console.log(`[阿里云] 正在尝试发送短信... 目标: ${phoneNumber}, 签名: ${params.SignName}, 模板: ${params.TemplateCode}`);
    const response = await client.request('SendSms', params, requestOption);
    
    if (response.Code === 'OK') {
      console.log(`[阿里云] 发送成功!`);
      return true;
    } else {
      console.error(`[阿里云] 发送失败: ${response.Code} - ${response.Message}`);
      return false;
    }
  } catch (error) {
    console.error('[阿里云] SDK 报错:', error);
    return false;
  }
}

module.exports = { sendSms };