import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import saveAs from "file-saver";
import { Product, StockItem, Category } from "../types";
import { api } from "./api";

// 补货配置接口
export interface RestockConfig {
  minSize: number; // 最小圈口 (如 10)
  maxSize: number; // 最大圈口 (如 22)
  targetQty: number; // 安全库存 (如 5)
}

export const generateDailyReport = async (
  products: Product[],
  items: StockItem[],
  categories: Category[],
  restockConfig: RestockConfig
) => {
  // 1. 获取今日流水日志
  const logs = await api.getDailyLogs();
  
  // 统计今日入库/出库
  const inboundLogs = logs.filter((l: any) => l.type === 'IN');
  const outboundLogs = logs.filter((l: any) => l.type === 'OUT');
  
  const totalInQty = inboundLogs.reduce((s: number, l: any) => s + l.quantity, 0);
  const totalInWeight = inboundLogs.reduce((s: number, l: any) => s + l.weight, 0);
  
  const totalOutQty = outboundLogs.reduce((s: number, l: any) => s + l.quantity, 0);
  const totalOutWeight = outboundLogs.reduce((s: number, l: any) => s + l.weight, 0);

  // 2. 生成缺货分析报告 (纯文字版)
  const restockParagraphs: Paragraph[] = [];
  let hasRestockData = false;

  // 遍历所有选中的产品
  products.forEach(prod => {
    // 找到该产品的所有库存
    const prodItems = items.filter(i => String(i.productId) === String(prod.id));
    const category = categories.find(c => c.id === prod.categoryId);
    
    // 只有戒指、手链等有圈口属性的才分析
    if (category?.name.includes('戒指') || category?.name.includes('手链')) {
      const missingDetails: string[] = [];

      // 遍历圈口范围
      for (let size = restockConfig.minSize; size <= restockConfig.maxSize; size++) {
        // 查找当前圈口的库存 (模糊匹配字符串，比如 "12" 或 "12#")
        const currentStockItem = prodItems.find(item => {
          const itemSize = item.customValues?.size;
          // 移除所有非数字字符进行比较
          return itemSize && String(itemSize).replace(/\D/g, '') === String(size);
        });

        const currentQty = currentStockItem ? currentStockItem.quantity : 0;
        
        // 如果库存低于安全水位
        if (currentQty < restockConfig.targetQty) {
          const deficit = restockConfig.targetQty - currentQty;
          // 生成话术：10圈口需要补3个
          missingDetails.push(`${size}圈口补${deficit}个`);
        }
      }

      // 如果该产品有补货需求，生成一行文字
      if (missingDetails.length > 0) {
        hasRestockData = true;
        restockParagraphs.push(
          new Paragraph({
            children: [
              // 品名：(加粗)
              new TextRun({ 
                text: `${prod.name}：`, 
                bold: true,
                size: 24 // 字号稍微大一点
              }),
              // 10圈口需要补3个 (红色)
              new TextRun({ 
                text: missingDetails.join("，"), 
                color: "FF0000",
                size: 24
              })
            ],
            spacing: { before: 120 } // 段落间距
          })
        );
      }
    }
  });

  if (!hasRestockData) {
    restockParagraphs.push(
      new Paragraph({
        children: [new TextRun({ text: "当前所有选定产品库存充足，无需补货。", color: "008000" })],
        spacing: { before: 120 }
      })
    );
  }

  // 3. 构建文档
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({ 
            text: `库存运营日报 - ${new Date().toLocaleDateString()}`, 
            heading: HeadingLevel.HEADING_1, 
            alignment: AlignmentType.CENTER 
          }),
          new Paragraph({ text: "" }), // 空行

          // 今日汇总
          new Paragraph({ text: "一、今日流水汇总", heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ 
            children: [new TextRun({ text: `• 今日入库：${totalInQty} 件，总重 ${totalInWeight.toFixed(2)}g`, size: 24 })],
            spacing: { before: 100 }
          }),
          new Paragraph({ 
            children: [new TextRun({ text: `• 今日出库：${totalOutQty} 件，总重 ${totalOutWeight.toFixed(2)}g`, size: 24 })],
            spacing: { after: 200 }
          }),

          // 补货建议 (标题)
          new Paragraph({ 
            text: `二、智能补货建议 (分析范围: ${restockConfig.minSize}# - ${restockConfig.maxSize}#，安全库存: ${restockConfig.targetQty})`, 
            heading: HeadingLevel.HEADING_2 
          }),
          
          // 补货建议 (内容 - 直接展开 paragraph 数组)
          ...restockParagraphs
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `库存日报_${new Date().toISOString().split('T')[0]}.docx`);
};