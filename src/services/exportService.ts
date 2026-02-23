// 文件名: src/services/exportService.ts
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import { Product, StockItem, Category } from '../types';

export interface RestockConfig {
  minSize: number;
  maxSize: number;
  targetQty: number;
}

export const generateRestockReport = async (
  products: Product[],
  items: StockItem[],
  categories: Category[],
  config: RestockConfig
) => {
  const children: any[] = [];
  const dateStr = new Date().toLocaleDateString();

  children.push(
    new Paragraph({
      text: `智能补货建议清单 - ${dateStr}`,
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `补货标准：圈口范围 ${config.minSize}# - ${config.maxSize}#，目标安全库存 ${config.targetQty} 件`, color: "5c6ac4" })
      ],
      spacing: { after: 400 },
    })
  );

  let hasRestock = false;

  products.forEach(prod => {
    const prodItems = items.filter(i => String(i.productId) === String(prod.id));
    const restockDetails: string[] = [];

    for (let size = config.minSize; size <= config.maxSize; size++) {
      const existingItems = prodItems.filter(i => {
        const itemSize = parseFloat(String(i.customValues?.size || '0').replace(/[^0-9.]/g, ''));
        return itemSize === size;
      });
      const currentQty = existingItems.reduce((s, i) => s + i.quantity, 0);
      
      const deficit = config.targetQty - currentQty;
      if (deficit > 0) {
        restockDetails.push(`${size}# 补 ${deficit}件`);
      }
    }

    if (restockDetails.length > 0) {
      hasRestock = true;
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${prod.name}: `, bold: true, size: 28 }),
            new TextRun({ text: restockDetails.join('，'), color: "d32f2f", size: 24 })
          ],
          spacing: { after: 200 },
        })
      );
    }
  });

  if (!hasRestock) {
    children.push(
      new Paragraph({ 
        children: [
          new TextRun({ text: "当前所有产品均达到安全库存，无需补货。", color: "2e7d32" })
        ] 
      })
    );
  }

  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `采购补货单_${dateStr.replace(/\//g, '')}.docx`);
};

export const generateDailyFlowReport = async (logs: any[], reportTitle: string = "出入库流水明细表") => {
  try {
    const dateStr = new Date().toLocaleDateString();
    const children: any[] = [];

    children.push(
      new Paragraph({
        text: `${reportTitle}`,
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      })
    );

    const totalIn = logs.filter(l => l.type === 'IN').reduce((sum, l) => sum + l.quantity, 0);
    const totalInWeight = logs.filter(l => l.type === 'IN').reduce((sum, l) => sum + (l.weight * l.quantity), 0);
    const totalOut = logs.filter(l => l.type === 'OUT').reduce((sum, l) => sum + l.quantity, 0);
    const totalOutWeight = logs.filter(l => l.type === 'OUT').reduce((sum, l) => sum + (l.weight * l.quantity), 0);

    children.push(
      new Paragraph({
        children: [new TextRun({ text: `一、期间汇总`, bold: true, size: 32, color: "1976d2" })],
        spacing: { before: 200, after: 200 }
      }),
      new Paragraph({ text: `• 期间总入库：${totalIn} 件，总计克重：${totalInWeight.toFixed(2)}g`, bullet: { level: 0 } }),
      new Paragraph({ text: `• 期间总出库：${totalOut} 件，总计克重：${totalOutWeight.toFixed(2)}g`, bullet: { level: 0 }, spacing: { after: 400 } })
    );

    children.push(
      new Paragraph({
        children: [new TextRun({ text: `二、详细操作流水`, bold: true, size: 32, color: "1976d2" })],
        spacing: { before: 200, after: 200 }
      })
    );

    if (logs.length === 0) {
      children.push(
        new Paragraph({ 
          children: [new TextRun({ text: "该期间内无任何出入库记录。", color: "757575" })] 
        })
      );
    } else {
      logs.forEach(log => {
        const time = new Date(log.timestamp).toLocaleString('zh-CN', { hour12: false });
        const actionStr = log.type === 'IN' ? '【入库】' : '【出库】';
        const color = log.type === 'IN' ? '2e7d32' : 'd32f2f'; 
        
        // 【核心】：尝试解析存储在库里的规格快照，提取出圈口信息
        let detailStr = `(单件 ${log.weight}g)`;
        if (log.custom_values && log.custom_values !== '{}') {
           try {
               const cv = JSON.parse(log.custom_values);
               const sizeStr = cv.size ? `圈口: ${cv.size}, ` : '';
               detailStr = `(${sizeStr}克重: ${cv.weight}g)`;
           } catch(e) {}
        }

        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${time}  `, color: "757575", size: 24 }),
              new TextRun({ text: `${actionStr}  `, color, bold: true, size: 24 }),
              // 将提取出的 detailStr 打印到 Word 里
              new TextRun({ text: `${log.product_name || '未知商品'} - ${log.quantity}件 ${detailStr}`, size: 24 })
            ],
            spacing: { after: 120 }
          })
        );
      });
    }

    const doc = new Document({ sections: [{ children }] });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${reportTitle}_${dateStr.replace(/\//g, '')}.docx`);

  } catch (error) {
    console.error(error);
    throw new Error('生成流水报告失败');
  }
};