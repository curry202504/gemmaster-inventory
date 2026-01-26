import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType, HeadingLevel, BorderStyle, AlignmentType } from 'docx';
import saveAs from 'file-saver';
import { Product, StockItem, Category, OperationLog } from '../types';

export const generateDailyReport = async (
  products: Product[],
  items: StockItem[], // Needed for gap analysis
  logs: OperationLog[], // Needed for daily activity
  categories: Category[]
) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTime = today.getTime();

  // 1. Filter Logs: Must be today AND belong to selected products
  const relevantLogs = logs.filter((log) => {
    const isSelectedProduct = products.some((p) => p.id === log.productId);
    if (!isSelectedProduct) return false;
    return log.timestamp >= todayTime;
  });

  // Helpers
  const getProductName = (pid: string) => products.find((p) => p.id === pid)?.name || '未知品名';
  
  // Calculate Statistics
  let inboundCount = 0;
  let inboundWeight = 0;
  let outboundCount = 0;
  let outboundWeight = 0;

  relevantLogs.forEach(log => {
      // Try to find weight in customValues
      const weightVal = Object.entries(log.customValues || {}).find(([key, val]) => key.includes('weight') || key === 'weight')?.[1];
      const weight = typeof weightVal === 'number' ? weightVal : parseFloat(weightVal as string) || 0;

      if (log.type === 'IN') {
          inboundCount += log.quantity;
          inboundWeight += weight * log.quantity;
      } else {
          outboundCount += log.quantity;
          outboundWeight += weight * log.quantity;
      }
  });

  // 2. Build Activity Table
  const tableRows = [
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({ children: [new Paragraph({ text: "操作", bold: true })] }),
        new TableCell({ children: [new Paragraph({ text: "品名", bold: true })] }),
        new TableCell({ children: [new Paragraph({ text: "规格详情 (克重/圈口)", bold: true })] }),
        new TableCell({ children: [new Paragraph({ text: "数量", bold: true })] }),
        new TableCell({ children: [new Paragraph({ text: "上架状态", bold: true })] }),
        new TableCell({ children: [new Paragraph({ text: "时间", bold: true })] }),
      ],
    }),
  ];

  relevantLogs.forEach((log) => {
    const typeText = log.type === 'IN' ? "入库" : "出库";
    const productName = getProductName(log.productId);
    const listingStatusText = log.listingStatus === 'LISTED' ? "已上架" : "未上架";
    const timeStr = new Date(log.timestamp).toLocaleTimeString();

    tableRows.push(
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ text: typeText, color: log.type === "IN" ? "2E7D32" : "C62828" })] }),
          new TableCell({ children: [new Paragraph(productName)] }),
          new TableCell({ children: [new Paragraph(log.details)] }),
          new TableCell({ children: [new Paragraph(log.quantity.toString())] }),
          new TableCell({ children: [new Paragraph(listingStatusText)] }),
          new TableCell({ children: [new Paragraph(timeStr)] }),
        ],
      })
    );
  });

  // 3. Gap Analysis for Rings (10# - 22#)
  const analysisParagraphs: Paragraph[] = [];
  
  // Find "Ring" category ID (assuming name contains '戒指' or id is 'cat_ring')
  const ringCategory = categories.find(c => c.name.includes('戒指') || c.id === 'cat_ring');

  if (ringCategory) {
    analysisParagraphs.push(
        new Paragraph({
            text: "戒指缺货分析 (10# - 22#)",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
        })
    );

    const ringProducts = products.filter(p => p.categoryId === ringCategory.id);
    
    if (ringProducts.length === 0) {
        analysisParagraphs.push(new Paragraph({ text: "今日未选择戒指类商品，无法分析。" }));
    }

    ringProducts.forEach(product => {
        // Find 'size' key in category
        const sizeField = ringCategory.fields.find(f => f.label.includes('圈口') || f.key === 'size');
        if (!sizeField) return;

        // Get all items for this product that are IN STOCK
        const productItems = items.filter(i => i.productId === product.id);
        
        const existingSizes = new Set<number>();
        productItems.forEach(i => {
            const val = i.customValues[sizeField.key];
            if (val !== undefined && val !== null) {
                existingSizes.add(Number(val));
            }
        });

        const missingSizes: number[] = [];
        for (let s = 10; s <= 22; s++) {
            if (!existingSizes.has(s)) {
                missingSizes.push(s);
            }
        }

        analysisParagraphs.push(
            new Paragraph({
                children: [
                    new TextRun({ text: `• ${product.name}: `, bold: true }),
                    new TextRun({ 
                        text: missingSizes.length > 0 ? `缺 ${missingSizes.join(', ')} #` : "规格齐全 (10-22#)",
                        color: missingSizes.length > 0 ? "C62828" : "2E7D32"
                    })
                ]
            })
        );
    });
  }

  // 4. Generate Doc
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: `库存日报 - ${new Date().toLocaleDateString()}`,
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 300 },
          }),
          
          // Summary Section
          new Paragraph({
              text: "今日汇总",
              heading: HeadingLevel.HEADING_2,
              spacing: { after: 200 }
          }),
          new Paragraph({
              children: [
                  new TextRun({ text: "今日入库: ", bold: true }),
                  new TextRun({ text: `${inboundCount} 件, 总重: ${inboundWeight.toFixed(2)}g` }),
              ]
          }),
          new Paragraph({
              children: [
                  new TextRun({ text: "今日出库: ", bold: true }),
                  new TextRun({ text: `${outboundCount} 件, 总重: ${outboundWeight.toFixed(2)}g` }),
              ],
              spacing: { after: 300 }
          }),

          // Table
          relevantLogs.length > 0 ? new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: tableRows,
            borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "auto" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "auto" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "auto" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "auto" },
                insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "gray" },
                insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "gray" },
            }
          }) : new Paragraph({ text: "今日无所选商品的出入库记录。", italics: true }),
          
          ...analysisParagraphs
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Inventory_Report_${new Date().toISOString().split('T')[0]}.docx`);
};