# DinnerRoll Companion Apple Shortcut Guide

This guide explains how to set up the companion Apple Shortcut to send grocery items from DinnerRoll directly into Apple Reminders Grocery Lists on iOS and macOS.

## Architecture

DinnerRoll does not use private Apple APIs or server credentials. When you tap "Add to Apple Groceries", DinnerRoll generates a structured JSON payload and launches the standard Apple Shortcuts URL scheme:

```text
shortcuts://run-shortcut?name=DinnerRoll%20Groceries&input=text&text=<ENCODED_JSON>
```

The Shortcut receives the payload, parses the items, and adds them to your designated Reminders list (such as your `Groceries` or `Family Shopping` list with automatic section categorization).

## Setup Instructions

Follow these simple steps once on your iPhone, iPad, or Mac:

### Step 1: Create the Shortcut

1. In DinnerRoll, open Groceries and tap **Setup Apple Shortcut** (or open the **Shortcuts** app and tap **+**).
2. Name the shortcut exactly:
   ```text
   DinnerRoll Groceries
   ```
   *(If you use a different name, specify it in DinnerRoll Settings under Apple Shortcuts Name).*

### Step 2: Configure Shortcut Actions (3 Simple Actions)

Add the following standard Actions in order:

1. **Receive Any / Text from Nowhere** (or Shortcut Input).
2. **Get Dictionary from Input**:
   - Action: `Get Dictionary from [Shortcut Input]`
3. **Get Value from Dictionary**:
   - Action: `Get [Value] for [items] in [Dictionary]`
4. **Repeat with Each**:
   - Action: `Repeat with each item in [Dictionary Value]`
   - Inside the loop:
     - **Add New Reminder**:
       - Text: `[Repeat Item]`
       - List: Select your target list (e.g. `Family Shopping` or `Groceries`)

*(Note: Because DinnerRoll provides `items` as ready-to-use formatted text strings like "800 g Canned Chickpeas", there is NO NEED to extract nested properties inside the loop!)*

### Alternative: Pure Plain Text Setup (2 Actions)

If you prefer pure plain text without dictionaries:
1. `Split [Shortcut Input] by New Lines`
2. `Repeat with each item in [Split Text]`
   - `Add [Repeat Item] to [Groceries]`

### Step 3: Run and Authorize

1. In DinnerRoll, generate and accept a meal plan.
2. View the grocery list and tap **Add to Apple Groceries**.
3. iOS will ask for one-time permission to allow DinnerRoll to open Shortcuts. Tap **Open**.
4. The items will appear in your Apple Reminders list immediately as clean item titles.

## Graceful Fallbacks

If Apple Shortcuts is not installed or you prefer manual entry:
- Tap **Copy Grocery List** to copy a clean formatted list to the system clipboard.
- Tap **Share List** to send via the native system share sheet (AirDrop, Messages, Notes, Mail).
- Tap **Download Text File** to save locally to Files.
