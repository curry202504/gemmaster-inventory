const AlipaySdk = require('alipay-sdk').default;

/**
 * AurumFlow (御流) 支付中心逻辑
 */
const alipaySdk = new AlipaySdk({
  appId: process.env.ALIPAY_APP_ID,
  privateKey: process.env.ALIPAY_PRIVATE_KEY,
  alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY,
  gateway: 'https://openapi.alipay.com/gateway.do',
  camelcase: true
});

// 核心价格配置：必须与前端展示严格一致
const PRICING = {
  'plan_month': {
    base: 19.9,
    name: '御流专业版-月度订阅'
  },
  'plan_year': {
    base: 199.0,
    name: '御流尊享版-年度订阅'
  }
};

const PaymentService = {
  /**
   * 生成支付链接
   * @param {number} userId 用户ID
   * @param {string} planId 方案ID (plan_month/plan_year)
   * @param {boolean} isRecurring 是否是连续订阅 (8折)
   */
  createPayment: async (userId, planId, isRecurring) => {
    const plan = PRICING[planId];
    if (!plan) throw new Error('无效的订阅方案');

    // 严谨计算金额：如果是连续订阅则打8折
    let finalAmount = isRecurring ? (plan.base * 0.8) : plan.base;
    finalAmount = finalAmount.toFixed(2); // 支付宝要求保留两位小数

    // 生成商户订单号 (AF = AurumFlow)
    const orderId = `AF${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // 调用支付宝电脑网站支付接口
    const payUrl = await alipaySdk.pageExec('alipay.trade.page.pay', {
      method: 'GET',
      bizContent: {
        outTradeNo: orderId,
        productCode: 'FAST_INSTANT_TRADE_PAY',
        totalAmount: finalAmount,
        subject: `${plan.name}${isRecurring ? ' (连续订阅折扣)' : ''}`,
        timeoutExpress: '15m' // 订单15分钟内有效
      },
      // 支付完成后，用户浏览器自动跳转回你的网站
      returnUrl: `http://8.148.176.196:3001/dashboard?pay_status=success&orderId=${orderId}`,
      // 支付成功后，支付宝服务器会偷偷给你的后端发个通知确认到账
      notifyUrl: `http://8.148.176.196:3001/api/alipay-notify`
    });

    return { orderId, amount: finalAmount, payUrl };
  }
};

module.exports = PaymentService;