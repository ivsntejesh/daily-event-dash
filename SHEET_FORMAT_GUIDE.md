# Google Sheets Format Guide for Sync

## Overview
The sync system expects data in a specific Google Sheets format with two sheets: **Sheet1** for Events and **Sheet2** for Tasks.

## Sheet1 - Events Format

### Column Structure (A-I):
| Column | Field | Type | Required | Format | Example |
|--------|-------|------|----------|--------|---------|
| A | Title | Text | ✅ Yes | Any text | "Team Meeting" |
| B | Description | Text | ❌ No | Any text | "Weekly team standup" |
| C | Date | Date | ✅ Yes | YYYY-MM-DD | "2024-01-15" |
| D | Start Time | Time | ✅ Yes | HH:MM | "09:00" |
| E | End Time | Time | ✅ Yes | HH:MM | "10:00" |
| F | Is Online | Boolean | ❌ No | TRUE/FALSE | "TRUE" |
| G | Location | Text | ❌ No | Any text | "Conference Room A" |
| H | Meeting Link | URL | ❌ No | Valid URL | "https://zoom.us/j/123456789" |
| I | Notes | Text | ❌ No | Any text | "Bring laptop" |

### Example Sheet1 Data:
```
Title                    | Description           | Date       | Start Time | End Time | Is Online | Location        | Meeting Link              | Notes
Team Meeting            | Weekly standup        | 2024-01-15 | 09:00      | 10:00    | FALSE     | Conference Room | -                         | Bring reports
Client Presentation     | Q4 Results           | 2024-01-16 | 14:00      | 15:30    | TRUE      | -               | https://zoom.us/j/123     | Share screen ready
Project Review          | Sprint retrospective  | 2024-01-17 | 11:00      | 12:00    | FALSE     | Meeting Room B  | -                         | -
```

## Sheet2 - Tasks Format

### Column Structure (A-H):
| Column | Field | Type | Required | Format | Example |
|--------|-------|------|----------|--------|---------|
| A | Title | Text | ✅ Yes | Any text | "Complete report" |
| B | Description | Text | ❌ No | Any text | "Finish quarterly analysis" |
| C | Date | Date | ✅ Yes | YYYY-MM-DD | "2024-01-15" |
| D | Start Time | Time | ❌ No | HH:MM | "09:00" |
| E | End Time | Time | ❌ No | HH:MM | "17:00" |
| F | Is Completed | Boolean | ❌ No | TRUE/FALSE | "FALSE" |
| G | Priority | Text | ❌ No | low/medium/high | "high" |
| H | Notes | Text | ❌ No | Any text | "Due by EOD" |

### Example Sheet2 Data:
```
Title              | Description              | Date       | Start Time | End Time | Is Completed | Priority | Notes
Complete report    | Finish quarterly analysis| 2024-01-15 | 09:00      | 17:00    | FALSE        | high     | Due by EOD
Review documents   | Check legal compliance   | 2024-01-16 | -          | 12:00    | FALSE        | medium   | -
Update website     | Add new features         | 2024-01-17 | 10:00      | -        | TRUE         | low      | Already done
```

## Important Rules

### 1. Header Row
- **Row 1** must contain column headers (they can be any text, but the order matters)
- The sync system skips the first row automatically

### 2. Required Fields
**Events (Sheet1):**
- Title (Column A) - Cannot be empty
- Date (Column C) - Must be in YYYY-MM-DD format
- Start Time (Column D) - Must be in HH:MM format
- End Time (Column E) - Must be in HH:MM format

**Tasks (Sheet2):**
- Title (Column A) - Cannot be empty
- Date (Column C) - Must be in YYYY-MM-DD format

### 3. Data Validation Rules

**Date Format:**
- ✅ Correct: `2024-01-15`, `2024-12-31`
- ❌ Wrong: `01/15/2024`, `15-01-2024`, `Jan 15, 2024`

**Time Format:**
- ✅ Correct: `09:00`, `14:30`, `23:59`
- ❌ Wrong: `9:00 AM`, `2:30 PM`, `9:0`

**Boolean Values:**
- ✅ Correct: `TRUE`, `FALSE`, `true`, `false`
- ❌ Wrong: `Yes`, `No`, `1`, `0`

**Priority Values (Tasks only):**
- ✅ Correct: `low`, `medium`, `high`, `LOW`, `MEDIUM`, `HIGH`
- ❌ Wrong: `urgent`, `normal`, `1`, `2`, `3`

### 4. Optional Fields
- Empty cells in optional columns are perfectly fine
- Use `-` or leave blank for unused optional fields
- For online events, you can leave Location empty and fill Meeting Link
- For in-person events, you can leave Meeting Link empty and fill Location

### 5. Data Limits
- No specific row limit, but sync processes in batches of 50 rows
- Each text field can handle up to several thousand characters
- URLs should be valid and accessible

## Common Issues and Solutions

### Issue: Rows not syncing
**Possible causes:**
- Missing required fields (Title, Date, Start Time for events)
- Invalid date format (not YYYY-MM-DD)
- Invalid time format (not HH:MM)

### Issue: Some rows skipped
**Check for:**
- Empty title cells
- Invalid date formats
- Invalid time formats
- Invalid priority values (for tasks)

### Issue: Sync errors
**Common fixes:**
- Ensure Sheet1 and Sheet2 exist in your Google Sheet
- Check that the Google Sheets API key is configured
- Verify the spreadsheet ID in the sync function

## Testing Your Sheet Format

Before running a full sync, you can:
1. Start with a few test rows
2. Run a manual sync from the admin dashboard
3. Check the sync logs for any validation errors
4. Fix any issues and try again with more data

## Sheet Permissions
- The sheet must be publicly readable or shared with the service account
- The Google Sheets API must be enabled for your project
- The spreadsheet ID must be correctly configured in the sync function

## Example Google Sheets Template

You can create a template with these exact headers:

**Sheet1 (Events):**
```
Title | Description | Date | Start Time | End Time | Is Online | Location | Meeting Link | Notes
```

**Sheet2 (Tasks):**
```
Title | Description | Date | Start Time | End Time | Is Completed | Priority | Notes
```

Then fill in your data following the format rules above.