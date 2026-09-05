import { jsPDF } from 'jspdf';
import type { ScheduledSlot, AppTheme } from '../domain/models';
import { formatHumanDate } from '../scheduler/date-utils';
import { formatFriendlyShortDate } from './clipboard';
import type { AggregatedGroceryItem } from './groceries';
import { getThemePalette, hexToRgb } from '../themes';

export interface PDFExportOptions {
  startDate: string;
  endDate: string;
  slots: ScheduledSlot[];
  groceries?: AggregatedGroceryItem[];
  themeId?: AppTheme;
  showNutrition?: boolean;
}

export function generatePlanPDF(options: PDFExportOptions): jsPDF {
  const { startDate, endDate, slots, groceries = [], themeId, showNutrition = true } = options;
  const theme = getThemePalette(themeId);

  // Create landscape A4 PDF: 297mm wide x 210mm high
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 297;
  const pageHeight = 210;
  const margin = 14;

  const [bgR, bgG, bgB] = hexToRgb(theme.colors.bgApp);
  const [headR, headG, headB] = hexToRgb(theme.colors.headerBg);
  const [headTxtR, headTxtG, headTxtB] = hexToRgb(theme.colors.headerText);
  const [cardR, cardG, cardB] = hexToRgb(theme.colors.cardBg);
  const [bordR, bordG, bordB] = hexToRgb(theme.colors.borderLight);
  const [txtR, txtG, txtB] = hexToRgb(theme.colors.textPrimary);
  const [secTxtR, secTxtG, secTxtB] = hexToRgb(theme.colors.textSecondary);
  const [accentR, accentG, accentB] = hexToRgb(theme.colors.accentHighlight);

  // Background tone
  doc.setFillColor(bgR, bgG, bgB);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Header Bar
  doc.setFillColor(headR, headG, headB);
  doc.rect(margin, margin, pageWidth - margin * 2, 18, 'F');

  // Header Logo Text
  doc.setTextColor(headTxtR, headTxtG, headTxtB);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('DinnerRoll', margin + 6, margin + 11);

  // Subtitle / Date range
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const dateRangeText = `${formatFriendlyShortDate(startDate)} to ${formatFriendlyShortDate(endDate)}`;
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

  // Grid layout calculation: up to 7 days per row
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

    // Card background & border
    doc.setFillColor(cardR, cardG, cardB);
    doc.setDrawColor(bordR, bordG, bordB);
    doc.roundedRect(x, y, colWidth, cardHeight, 2, 2, 'FD');

    // Day Header strip
    const [subtleR, subtleG, subtleB] = hexToRgb(theme.colors.bgSubtle);
    doc.setFillColor(subtleR, subtleG, subtleB);
    doc.rect(x, y, colWidth, 8, 'F');
    doc.setTextColor(txtR, txtG, txtB);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(formatFriendlyShortDate(dStr), x + colWidth / 2, y + 5.5, { align: 'center' });

    // Day Content (Slots)
    let slotY = y + 13;
    for (const slot of daySlots) {
      if (slot.isBlocked) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(secTxtR, secTxtG, secTxtB);
        doc.text(`[${slot.mealPeriod}] Blocked`, x + 3, slotY);
      } else if (slot.mealName) {
        // Period & Leftover indicator
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.2);
        doc.setTextColor(accentR, accentG, accentB);
        let label = slot.mealPeriod.toUpperCase();
        if (slot.isLeftover) label += ' (LEFTOVER)';
        doc.text(label, x + 3, slotY);

        // Meal Name (wrapped if needed)
        slotY += 4.2;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.2);
        doc.setTextColor(txtR, txtG, txtB);
        const splitMealName = doc.splitTextToSize(slot.mealName, colWidth - 6);
        doc.text(splitMealName, x + 3, slotY);
        slotY += splitMealName.length * 3.6;

        // Macro summary if enabled
        if (showNutrition && slot.calories) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(6.8);
          doc.setTextColor(secTxtR, secTxtG, secTxtB);
          const macroText = `${slot.calories} kcal | ${slot.protein || 0}g P`;
          doc.text(macroText, x + 3, slotY);
          slotY += 3.8;
        }
      }
      slotY += 2.8;
    }
  }

  // Footer / Grocery summary if space permits
  if (groceries.length > 0 && numRows === 1) {
    const groceryY = startY + cardHeight + 8;
    doc.setFillColor(cardR, cardG, cardB);
    doc.setDrawColor(bordR, bordG, bordB);
    doc.roundedRect(margin, groceryY, availableWidth, 38, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(txtR, txtG, txtB);
    doc.text('Key Grocery Items', margin + 5, groceryY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(secTxtR, secTxtG, secTxtB);

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
