const AlipaySdk = require('alipay-sdk').default;
const AlipayFormData = require('alipay-sdk/lib/form').default;
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// 1. 获取环境变量
const APP_ID = process.env.ALIPAY_APP_ID;
const PRIVATE_KEY = process.env.ALIPAY_PRIVATE_KEY;
const ALIPAY_PUBLIC_KEY = process.env.ALIPAY_PUBLIC_KEY;

let alipaySdk = null;

// 2. 安全初始化逻辑
// 如果缺少关键配置，我们不报错，而是记录警告并进入“模拟模式”
if (APP_ID && PRIVATE_KEY) {
  try {
    alipaySdk = new AlipaySdk({
      appId: APP_ID,
      privateKey: PRIVATE_KEY,
      alipayPublicKey: ALIPAY_PUBLIC_KEY,
      gateway: 'https://openapi.alipay.com/gateway.do', // 生产环境
      // gateway: 'https://openapi-sandbox.dl.alipaydev.com/gateway.do', // 沙箱环境可切换
    });
    console.log('💳 [支付模块] 支付宝 SDK 初始化成功');
  } catch (err) {
    console.error('⚠️ [支付模块] 初始化失败，将降级为模拟模式:', err.message);
  }
} else {
  console.warn('⚠️ [支付模块] 未检测到 ALIPAY_APP_ID 或 PRIVATE_KEY，已自动切换为 [模拟支付模式]。不影响其他功能使用。');
}

/**
 * 创建支付订单
 * @param {string} userId 用户ID
 * @param {string} planId 套餐ID (plan_month / plan_year)
 * @param {boolean} isRecurring 是否订阅
 */
async function createPayment(userId, planId, isRecurring) {
  const orderId = `ORD_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const amount = planId === 'plan_year' ? '99.00' : '9.90';
  const subject = planId === 'plan_year' ? 'AurumFlow 年费会员' : 'AurumFlow 月度会员';

  // ============================
  // 模式 A: 模拟支付 (Mock Mode)
  // ============================
  if (!alipaySdk) {
    console.log(`💳 [模拟支付] 创建订单: ${orderId}, 金额: ${amount}`);
    // 返回一个假的支付链接，或者直接返回前端的一个成功页面路由
    // 这里我们返回一个特殊的 URL，前端可以识别并提示“模拟支付成功”
    return {
      orderId,
      amount,
      payUrl: `http://localhost:3000/mock-payment-success?out_trade_no=${orderId}&amount=${amount}` 
    };
  }

  // ============================
  // 模式 B: 真实支付宝 (Real Mode)
  // ============================
  const formData = new AlipayFormData();
  formData.setMethod('get');
  formData.addField('bizContent', {
    outTradeNo: orderId,
    productCode: 'FAST_INSTANT_TRADE_PAY',
    totalAmount: amount,
    subject: subject,
    body: `User: ${userId} Plan: ${planId}`,
  });

  // 支付成功后的回调地址 (你需要有公网域名才能被支付宝回调)
  // 本地开发时通常接收不到回调
  formData.addField('notifyUrl', 'http://your-domain.com/api/alipay-notify');
  formData.addField('returnUrl', 'http://localhost:3000/dashboard'); // 支付完成后跳回前端

  try {
    const result = await alipaySdk.exec(
      'alipay.trade.page.pay',
      {},
      { formData: formData }
    );
    return { orderId, amount, payUrl: result };
  } catch (error) {
    console.error('支付宝创建订单失败:', error);
    throw new Error('支付接口调用失败');
  }
}

module.exports = { createPayment };