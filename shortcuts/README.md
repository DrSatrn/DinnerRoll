# DinnerRoll Companion Apple Shortcut Guide

This guide explains how to set up the free companion Apple Shortcut to send grocery items from DinnerRoll directly into Apple Reminders Grocery Lists on iOS and macOS.

## Architecture

DinnerRoll does not use private Apple APIs or server credentials. When you tap "Add to Apple Groceries", DinnerRoll generates a structured JSON payload and launches the standard Apple Shortcuts URL scheme:

```text
shortcuts://run-shortcut?name=DinnerRoll%20Groceries&input=text&text=<ENCODED_JSON>
```

The Shortcut receives the payload, parses the items, and adds them to your designated Reminders list (such as your Groceries list with automatic section categorization).

## Setup Instructions

Follow these steps once on your iPhone, iPad, or Mac:

### Step 1: Create the Shortcut

1. Open the **Shortcuts** app on your Apple device.
2. Tap the **+** (plus) icon to create a new shortcut.
3. Name the shortcut exactly:
   ```text
   DinnerRoll Groceries
   ```
   (If you name it something else, configure the custom name in DinnerRoll Settings).

### Step 2: Configure Shortcut Actions

Add the following standard Actions in order:

1. **Get Shortcut Input**
   - Action: Receive input from `Shortcut Input` (Input Type: Text).

2. **Get Dictionary from Input**
   - Action: `Get Dictionary from [Shortcut Input]`

3. **Get Dictionary Value**
   - Key: `items`
   - From: `Dictionary`

4. **Repeat with Each**
   - Repeat with each item in `Dictionary Value`

   *Inside the repeat loop:*
   - **Get Dictionary Value**: Key `display` from `Repeat Item` -> Variable `ItemText`
   - **Add New Reminder**:
     - Text: `ItemText`
     - List: Select your target list (e.g., `Groceries` or `Reminders`)
   - *(Optional for Apple Grocery categorization)*:
     - Apple Reminders in iOS 17+ automatically sorts items added to a Grocery-type list into sections like Produce, Meat, Dairy, and Bakery.

5. **Show Notification** *(Optional)*
   - Text: `Added grocery items to Apple Reminders.`

### Step 3: Run and Authorize

1. In DinnerRoll, generate and accept a meal plan.
2. View the grocery list and tap **Add to Apple Groceries**.
3. iOS will ask for one-time permission to allow DinnerRoll to open Shortcuts. Tap **Open**.
4. The items will appear in your Apple Reminders list immediately.

## Graceful Fallback

If Apple Shortcuts is not installed or you prefer manual entry:
- Tap **Copy Grocery List** to copy a clean formatted list to the system clipboard.
- Tap **Share List** to send via the native system share sheet (AirDrop, Messages, Notes, Mail).
- Tap **Download Text File** to save locally to Files.
