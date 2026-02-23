// 文件名: server/payment.js
const AlipaySdk = require('alipay-sdk').default;
const AlipayFormData = require('alipay-sdk/lib/form').default;
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// 1. 获取环境变量中的核心秘钥
const APP_ID = process.env.ALIPAY_APP_ID;
const PRIVATE_KEY = process.env.ALIPAY_PRIVATE_KEY;
const ALIPAY_PUBLIC_KEY = process.env.ALIPAY_PUBLIC_KEY;
const RETURN_URL = process.env.ALIPAY_RETURN_URL || 'http://localhost:3000/dashboard';

let alipaySdk = null;

// 2. 初始化支付宝 SDK 实例
if (APP_ID && PRIVATE_KEY && ALIPAY_PUBLIC_KEY) {
  try {
    alipaySdk = new AlipaySdk({
      appId: APP_ID,
      privateKey: PRIVATE_KEY,
      alipayPublicKey: ALIPAY_PUBLIC_KEY,
      gateway: 'https://openapi.alipay.com/gateway.do', // 生产环境真实网关
    });
    console.log('💳 [支付模块] 支付宝 SDK 生产环境初始化成功！');
  } catch (err) {
    console.error('⚠️ [支付模块] SDK 初始化失败:', err.message);
  }
} else {
  console.warn('⚠️ [支付模块] 未检测到完整的支付宝密钥配置，当前为降级不可用状态。');
}

/**
 * 创建真实支付宝网页支付订单
 * @param {string} userId 用户ID (发起付款的人)
 * @param {string} planId 套餐ID (plan_month / plan_year)
 * @param {boolean} isRecurring 是否连续订阅 (咱们业务里已废弃，默认 false)
 */
async function createPayment(userId, planId, isRecurring = false) {
  // 防呆校验：如果 SDK 没初始化成功，直接报错拦截
  if (!alipaySdk) {
     throw new Error('系统尚未配置真实支付密钥，暂无法发起收款。');
  }

  // 1. 生成系统内部唯一的商户订单号 (防重复)
  const orderId = `GEM_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  
  // 2. 根据套餐确定金额和名称
  const amount = planId === 'plan_year' ? '199.00' : '19.90';
  const subject = planId === 'plan_year' ? '御流管家-年度 PRO 会员' : '御流管家-月度 PRO 会员';

  // 3. 组装发给支付宝的表单数据
  const formData = new AlipayFormData();
  formData.setMethod('get'); // 使用 GET 方式，会返回一个可以直接跳转的 URL
  formData.addField('bizContent', {
    outTradeNo: orderId,         // 商户订单号
    productCode: 'FAST_INSTANT_TRADE_PAY', // 电脑网站支付的固定产品码
    totalAmount: amount,         // 金额
    subject: subject,            // 订单标题
    body: `User_ID:${userId}`,   // 备注里塞入用户ID，方便财务对账
  });

  // 4. 配置极其重要的两个 URL
  // 异步回调地址：支付成功后，支付宝服务器会悄悄给这个地址发 POST 请求，这是系统“自动发货、加VIP时长”的唯一凭证！
  // 注意：这个地址必须是公网能访问的域名！如果您在本地开发，支付宝是调不通 localhost 的。
  formData.addField('notifyUrl', 'http://yuliukc.cn/api/alipay-notify');
  
  // 同步跳转地址：用户付完钱后，浏览器自动跳转回到的页面
  formData.addField('returnUrl', RETURN_URL); 

  try {
    // 5. 向支付宝索要支付链接
    const resultUrl = await alipaySdk.exec(
      'alipay.trade.page.pay',
      {},
      { formData: formData }
    );
    
    // 6. 将订单号、金额、支付链接返回给上层 (index.js)
    return { orderId, amount, payUrl: resultUrl };
  } catch (error) {
    console.error('❌ 支付宝创建订单失败:', error);
    throw new Error('支付接口调用失败，请检查密钥是否正确');
  }
}

module.exports = { createPayment };