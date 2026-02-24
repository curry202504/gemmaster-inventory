// 文件名: server/payment.js
const AlipaySdk = require('alipay-sdk').default;
const AlipayFormData = require('alipay-sdk/lib/form').default;
const path = require('path');
// 兼容本地和服务器：先找根目录，找不到再找当前目录
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const APP_ID = process.env.ALIPAY_APP_ID;
const PRIVATE_KEY = process.env.ALIPAY_PRIVATE_KEY;
const ALIPAY_PUBLIC_KEY = process.env.ALIPAY_PUBLIC_KEY;
// 优先使用环境变量，如果没有则回退到本地测试地址
const RETURN_URL = process.env.ALIPAY_RETURN_URL || 'http://localhost:3000/dashboard';

let alipaySdk = null;

console.log('\n========================================');
console.log('🕵️‍♂️ [支付模块探测器] 正在检查支付宝密钥...');

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
  console.warn('⚠️ [支付模块] 核心密钥不全，支付功能已被封印。请检查 .env 文件。');
}

/**
 * 带有终端智能识别的终极支付引擎
 * @param {string} userId - 用户ID
 * @param {string} planId - 套餐ID
 * @param {boolean} isMobile - 决定生死的参数：是手机就唤起App，是电脑就出扫码页
 */
async function createPayment(userId, planId, isMobile = false) {
  if (!alipaySdk) {
     throw new Error('抱歉，老板尚未配置收款密钥，暂时无法付钱。');
  }

  // 生成全局唯一的商户订单号
  const orderId = `GEM_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  const amount = planId === 'plan_year' ? '199.00' : '19.90';
  const subject = planId === 'plan_year' ? '御流管家-年度 PRO 会员' : '御流管家-月度 PRO 会员';

  // 【智能切换赛道】如果探测到是手机，强行切换到手机网站支付产品码
  const productCode = isMobile ? 'QUICK_WAP_WAY' : 'FAST_INSTANT_TRADE_PAY';
  
  console.log(`\n💳 正在为用户 [${userId}] 创建订单. 金额:[${amount}] 终端:[${isMobile ? '手机H5' : 'PC网站'}]`);

  const formData = new AlipayFormData();
  formData.setMethod('get'); 
  formData.addField('bizContent', {
    outTradeNo: orderId,         
    productCode: productCode,    
    totalAmount: amount,         
    subject: subject,            
    body: `User_ID:${userId}`,   
  });

  // 设置异步通知和同步跳转地址
  formData.addField('notifyUrl', 'http://yuliukc.cn/api/alipay-notify');
  formData.addField('returnUrl', RETURN_URL); 

  try {
    // 无论是扫码大页还是深层链接，支付宝都会返回一个支付 URL
    const resultUrl = await alipaySdk.exec(
      // 这个执行方法名必须根据终端类型动态切换
      isMobile ? 'alipay.trade.wap.pay' : 'alipay.trade.page.pay',
      {},
      { formData: formData }
    );
    console.log(`✅ 订单创建成功！支付链接已下发。`);
    return { orderId, amount, payUrl: resultUrl };
  } catch (error) {
    console.error('\n❌ ================= 支付宝接口报错了 =================');
    console.error(error);
    console.error('========================================================\n');
    throw new Error(`支付宝对接异常: ${error.message}`);
  }
}

// 暴露出支付工具函数
module.exports = { createPayment };