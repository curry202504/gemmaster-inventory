// 文件名: server/payment.js
const AlipaySdk = require('alipay-sdk').default;
const AlipayFormData = require('alipay-sdk/lib/form').default;
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const APP_ID = process.env.ALIPAY_APP_ID;
const PRIVATE_KEY = process.env.ALIPAY_PRIVATE_KEY;
const ALIPAY_PUBLIC_KEY = process.env.ALIPAY_PUBLIC_KEY;
const RETURN_URL = process.env.ALIPAY_RETURN_URL || 'http://localhost:3000/dashboard';

let alipaySdk = null;

// ==========================================
// 【强化版透视日志】：一启动就检查密钥情况
// ==========================================
console.log('\n========================================');
console.log('🕵️‍♂️ [支付模块探测器] 正在检查支付宝密钥...');

if (!APP_ID) console.log('❌ 警告：未找到 ALIPAY_APP_ID');
else console.log(`✅ ALIPAY_APP_ID: ${APP_ID}`);

if (!PRIVATE_KEY) console.log('❌ 警告：未找到 ALIPAY_PRIVATE_KEY');
else {
  console.log(`✅ 私钥已配置，长度: ${PRIVATE_KEY.length}，开头: ${PRIVATE_KEY.substring(0, 10)}...`);
  if (!PRIVATE_KEY.startsWith('MII')) console.log('⚠️ 严重警告：私钥格式似乎不对，通常应该以 MII 开头！');
}

if (!ALIPAY_PUBLIC_KEY) console.log('❌ 警告：未找到 ALIPAY_PUBLIC_KEY');
else {
  console.log(`✅ 支付宝公钥已配置，长度: ${ALIPAY_PUBLIC_KEY.length}，开头: ${ALIPAY_PUBLIC_KEY.substring(0, 10)}...`);
}
console.log('========================================\n');

if (APP_ID && PRIVATE_KEY && ALIPAY_PUBLIC_KEY) {
  try {
    alipaySdk = new AlipaySdk({
      appId: APP_ID,
      privateKey: PRIVATE_KEY,
      alipayPublicKey: ALIPAY_PUBLIC_KEY,
      gateway: 'https://openapi.alipay.com/gateway.do', 
    });
    console.log('💳 [支付模块] 支付宝 SDK 生产环境初始化成功！');
  } catch (err) {
    console.error('❌ [支付模块] SDK 初始化崩溃:', err);
  }
} else {
  console.warn('⚠️ [支付模块] 核心密钥不全，支付功能已被封印。');
}

async function createPayment(userId, planId, isRecurring = false) {
  if (!alipaySdk) {
     throw new Error('抱歉，老板尚未配置收款密钥，暂时无法付钱。');
  }

  const orderId = `GEM_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  const amount = planId === 'plan_year' ? '199.00' : '19.90';
  const subject = planId === 'plan_year' ? '御流管家-年度 PRO 会员' : '御流管家-月度 PRO 会员';

  console.log(`\n💳 正在为用户 [${userId}] 创建订单 [${orderId}], 金额 [${amount}]...`);

  const formData = new AlipayFormData();
  formData.setMethod('get'); 
  formData.addField('bizContent', {
    outTradeNo: orderId,         
    productCode: 'FAST_INSTANT_TRADE_PAY', 
    totalAmount: amount,         
    subject: subject,            
    body: `User_ID:${userId}`,   
  });

  formData.addField('notifyUrl', 'http://yuliukc.cn/api/alipay-notify');
  formData.addField('returnUrl', RETURN_URL); 

  try {
    const resultUrl = await alipaySdk.exec(
      'alipay.trade.page.pay',
      {},
      { formData: formData }
    );
    console.log(`✅ 订单创建成功！支付链接已下发。`);
    return { orderId, amount, payUrl: resultUrl };
  } catch (error) {
    // 【核心排错】：如果支付宝拒了我们，把它骂我们的话打印出来
    console.error('\n❌ ================= 支付宝接口报错了 =================');
    console.error(error);
    console.error('========================================================\n');
    throw new Error(`支付宝对接异常: ${error.message}`);
  }
}

module.exports = { createPayment };