// 文件名: src/services/exportService.ts
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType } from 'docx';
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

// 🚀 全新引擎：生成历史结余的精美 Word 盘点表
export const generateHistoricalInventoryReport = async (data: any[], dateStr: string, products: Product[]) => {
    try {
      const children: any[] = [];
  
      children.push(
        new Paragraph({
          text: `系统库存盘点结余报告 (时光机演算)`,
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `盘点溯源基准日期：${dateStr} 23:59:59`, color: "d32f2f", bold: true }),
            new TextRun({ text: `\n注：本表数据由系统底层出入库流水精准逆向推演生成，真实反映该时刻的理论结余。`, color: "757575", size: 20 })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        })
      );
  
      if (data.length === 0) {
        children.push(new Paragraph({ text: "所选日期未查询到任何有效库存结余。" }));
      } else {
        // 创建一个美观的表格
        const tableRows = [
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ text: "商品名称", alignment: AlignmentType.CENTER })], width: { size: 35, type: WidthType.PERCENTAGE } }),
              new TableCell({ children: [new Paragraph({ text: "规格详情", alignment: AlignmentType.CENTER })], width: { size: 45, type: WidthType.PERCENTAGE } }),
              new TableCell({ children: [new Paragraph({ text: "历史结余数量", alignment: AlignmentType.CENTER })], width: { size: 20, type: WidthType.PERCENTAGE } }),
            ],
          }),
        ];
  
        let totalPieces = 0;

        data.forEach(row => {
          const prodName = products.find(p => String(p.id) === String(row.product_id))?.name || '未知产品';
          let specStr = '-';
          try {
              const cv = JSON.parse(row.custom_values || '{}');
              const s = cv.size ? `圈口:${cv.size} ` : '';
              const w = cv.weight ? `克重:${cv.weight}g` : '';
              specStr = s + w;
          } catch(e) {}
          
          const qty = Number(row.calc_qty);
          totalPieces += qty;
  
          tableRows.push(
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph(prodName)] }),
                new TableCell({ children: [new Paragraph(specStr)] }),
                new TableCell({ children: [new Paragraph({ text: `${qty} 件`, alignment: AlignmentType.CENTER })] }),
              ],
            })
          );
        });
  
        children.push(
            new Table({
                rows: tableRows,
                width: { size: 100, type: WidthType.PERCENTAGE },
            }),
            new Paragraph({
                children: [
                  new TextRun({ text: `\n总计历史库存件数：${totalPieces} 件`, bold: true, size: 28, color: "1976d2" })
                ],
                spacing: { before: 400, after: 800 },
                alignment: AlignmentType.RIGHT
            }),
            new Paragraph({
                children: [
                  new TextRun({ text: `盘点人签字：____________________      日期：____________________` })
                ],
                alignment: AlignmentType.RIGHT
            })
        );
      }
  
      const doc = new Document({ sections: [{ children }] });
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `历史库存盘点表_${dateStr}.docx`);
  
    } catch (error) {
      console.error(error);
      throw new Error('生成历史盘点报告失败');
    }
  };