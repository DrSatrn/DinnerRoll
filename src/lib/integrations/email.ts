import type { AcceptedPlan, HouseholdSettings, AppTheme } from '../domain/models';
import { generateICS, downloadICS } from './ics';
import { generatePlanPDF } from './pdf';
import { formatSchedulePlainText, formatFriendlyShortDate, copyScheduleToClipboard } from './clipboard';

export interface EmailShareOptions {
  plan: AcceptedPlan;
  settings: HouseholdSettings;
  themeId?: AppTheme;
  showNutrition?: boolean;
}

export interface EmailShareResult {
  success: boolean;
  method: 'share-sheet' | 'mailto';
  filesPrepared: boolean;
  clipboardCopied: boolean;
}

/**
 * Builds the mailto URI with subject and structured body.
 */
export function buildMailtoUrl(subject: string, bodyText: string): string {
  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(bodyText);
  return `mailto:?subject=${encodedSubject}&body=${encodedBody}`;
}

/**
 * Executes the "Send as Email" workflow:
 * 1. Generates the RFC 5545 .ics calendar invite.
 * 2. Generates the landscape PDF plan.
 * 3. Copies the rich styled HTML schedule to clipboard for easy pasting into email body.
 * 4. Tries native Share Sheet (which attaches .ics and .pdf to Apple Mail on iOS/macOS).
 * 5. Falls back to opening default email client via mailto: and downloading the .ics & .pdf files.
 */
export async function sendPlanAsEmail(options: EmailShareOptions): Promise<EmailShareResult> {
  const { plan, settings, themeId, showNutrition = true } = options;
  const startShort = formatFriendlyShortDate(plan.startDate);
  const endShort = formatFriendlyShortDate(plan.endDate);
  const subject = `DinnerRoll Meal Plan: ${startShort} – ${endShort}`;

  // 1. Plain text body for mailto and email client
  const plainSchedule = formatSchedulePlainText(plan, { showNutrition, themeId });
  const emailBody = `Hi,\n\nHere is our household meal plan for ${startShort} to ${endShort}:\n\n${plainSchedule}\n\nAttached is the calendar invite (.ics) to add these dinners to your calendar, and the printable landscape PDF schedule.\n\nGenerated with DinnerRoll.`;

  // 2. Prepare .ics and PDF blobs
  const icsString = generateICS(plan.slots, 'DinnerRoll Meal Plan');
  const icsBlob = new Blob([icsString], { type: 'text/calendar;charset=utf-8' });
  const icsFile = new File([icsBlob], `dinnerroll-${plan.startDate}.ics`, { type: 'text/calendar' });

  const pdfDoc = generatePlanPDF({
    startDate: plan.startDate,
    endDate: plan.endDate,
    slots: plan.slots
  });
  const pdfBlob = pdfDoc.output('blob');
  const pdfFile = new File([pdfBlob], `dinnerroll-plan-${plan.startDate}.pdf`, { type: 'application/pdf' });

  // 3. Copy rich HTML table to clipboard so the user can paste styled tables into Apple Mail or Gmail
  let clipboardCopied = false;
  try {
    clipboardCopied = await copyScheduleToClipboard(plan, { showNutrition, themeId });
  } catch {
    // ignore clipboard error
  }

  // 4. Try native Web Share API with files (supported on iOS Safari and modern macOS Safari/Chrome)
  if (
    typeof navigator !== 'undefined' &&
    navigator.canShare &&
    navigator.canShare({ files: [icsFile, pdfFile] })
  ) {
    try {
      await navigator.share({
        title: subject,
        text: emailBody,
        files: [icsFile, pdfFile]
      });
      return {
        success: true,
        method: 'share-sheet',
        filesPrepared: true,
        clipboardCopied
      };
    } catch (err: any) {
      // If user canceled the share sheet, return gracefully
      if (err?.name === 'AbortError') {
        return {
          success: true,
          method: 'share-sheet',
          filesPrepared: true,
          clipboardCopied
        };
      }
      // Otherwise proceed to mailto fallback
    }
  }

  // 5. Fallback: Download attachments so user has them on hand
  try {
    downloadICS(plan.slots, `dinnerroll-${plan.startDate}.ics`);
    pdfDoc.save(`dinnerroll-plan-${plan.startDate}.pdf`);
  } catch {
    // ignore download error in non-browser env
  }

  // 6. Launch default email client
  const mailtoUrl = buildMailtoUrl(subject, emailBody);
  if (typeof window !== 'undefined') {
    window.location.href = mailtoUrl;
  }

  return {
    success: true,
    method: 'mailto',
    filesPrepared: true,
    clipboardCopied
  };
}
