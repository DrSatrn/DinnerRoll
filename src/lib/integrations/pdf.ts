import { jsPDF } from 'jspdf';
import type { ScheduledSlot } from '../domain/models';
import { formatHumanDate } from '../scheduler/date-utils';
import type { AggregatedGroceryItem } from './groceries';

export interface PDFExportOptions {
  startDate: string;
  endDate: string;
  slots: ScheduledSlot[];
  groceries?: AggregatedGroceryItem[];
}

export function generatePlanPDF(options: PDFExportOptions): jsPDF {
  const { startDate, endDate, slots, groceries = [] } = options;

  // Create landscape A4 PDF: 297mm wide x 210mm high
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 297;
  const pageHeight = 210;
  const margin = 14;

  // Background subtle warm tone
  doc.setFillColor(250, 248, 245);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Header Bar
  doc.setFillColor(45, 42, 38);
  doc.rect(margin, margin, pageWidth - margin * 2, 18, 'F');

  // Header Logo Text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('DinnerRoll', margin + 6, margin + 11);

  // Subtitle / Date range
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const dateRangeText = `${formatHumanDate(startDate)} to ${formatHumanDate(endDate)}`;
  doc.text(dateRangeText, pageWidth - margin - 6, margin + 11, { align: 'right' });

  // Group slots by date
  const dateMap = new Map<string, ScheduledSlot[]>();
  for (const slot of slots) {
    if (!dateMap.has(slot.date)) {
      dateMap.set(slot.date, []);
    }
    dateMap.get(slot.date)!.push(slot);
  }

  const distinctDates = Array.from(dateMap.keys()).sort();
  const numDays = distinctDates.length;

  // Grid layout calculation
  // Up to 7 days per row
  const daysPerRow = Math.min(7, numDays > 0 ? numDays : 7);
  const numRows = Math.ceil(numDays / daysPerRow);
  const availableWidth = pageWidth - margin * 2;
  const colWidth = (availableWidth - (daysPerRow - 1) * 3) / daysPerRow;
  const startY = margin + 22;
  const cardHeight = numRows > 1 ? 55 : 85;

  for (let idx = 0; idx < distinctDates.length; idx++) {
    const dStr = distinctDates[idx];
    const row = Math.floor(idx / daysPerRow);
    const col = idx % daysPerRow;
    const x = margin + col * (colWidth + 3);
    const y = startY + row * (cardHeight + 4);

    const daySlots = dateMap.get(dStr) || [];

    // Card background
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(225, 220, 212);
    doc.roundedRect(x, y, colWidth, cardHeight, 2, 2, 'FD');

    // Day Header
    doc.setFillColor(242, 238, 230);
    doc.rect(x, y, colWidth, 8, 'F');
    doc.setTextColor(50, 45, 40);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(formatHumanDate(dStr), x + colWidth / 2, y + 5.5, { align: 'center' });

    // Day Content (Slots)
    let slotY = y + 13;
    for (const slot of daySlots) {
      if (slot.isBlocked) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(150, 145, 140);
        doc.text(`[${slot.mealPeriod}] Blocked`, x + 3, slotY);
      } else if (slot.mealName) {
        // Period & Leftover indicator
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(180, 83, 9); // warm amber
        let label = slot.mealPeriod.toUpperCase();
        if (slot.isLeftover) label += ' (LEFTOVER)';
        doc.text(label, x + 3, slotY);

        // Meal Name (wrapped if needed)
        slotY += 4.5;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(30, 25, 20);
        const splitMealName = doc.splitTextToSize(slot.mealName, colWidth - 6);
        doc.text(splitMealName, x + 3, slotY);
        slotY += splitMealName.length * 3.8;

        // Macro summary if space permits
        if (slot.calories) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
          doc.setTextColor(110, 105, 100);
          const macroText = `${slot.calories} kcal | ${slot.protein || 0}g P`;
          doc.text(macroText, x + 3, slotY);
          slotY += 4;
        }
      }
      slotY += 3;
    }
  }

  // Footer / Grocery summary if space permits
  if (groceries.length > 0 && numRows === 1) {
    const groceryY = startY + cardHeight + 8;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(225, 220, 212);
    doc.roundedRect(margin, groceryY, availableWidth, 38, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(45, 42, 38);
    doc.text('Key Grocery Items', margin + 5, groceryY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(70, 65, 60);

    const sampleGroceries = groceries.slice(0, 18);
    const groceryColWidth = availableWidth / 3;
    sampleGroceries.forEach((item, i) => {
      const gCol = Math.floor(i / 6);
      const gRow = i % 6;
      const gx = margin + 5 + gCol * groceryColWidth;
      const gy = groceryY + 11 + gRow * 4.2;
      const display = `${item.quantity ? item.quantity + ' ' + item.unit + ' ' : ''}${item.name}`;
      doc.text(display.substring(0, 36), gx, gy);
    });
  }

  return doc;
}

export function downloadPlanPDF(options: PDFExportOptions, filename = 'dinnerroll-plan.pdf'): void {
  const doc = generatePlanPDF(options);
  doc.save(filename);
}
