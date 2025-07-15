# Google Sheets Sync Setup Guide

This guide will help you set up Google Sheets synchronization to import events and tasks into your dashboard.

## Step 1: Create Your Google Sheets

### Events Sheet Format
Create a Google Sheet with the following columns in this exact order:

| A | B | C | D | E | F | G | H | I |
|---|---|---|---|---|---|---|---|---|
| Title | Description | Date | Start Time | End Time | Is Online | Meeting Link | Location | Notes |

**Example data:**
```
Team Meeting | Weekly sync | 2024-01-15 | 09:00 | 10:00 | true | https://meet.google.com/xyz | | Important topics
Project Review | Q1 review | 2024-01-16 | 14:00 | 16:00 | false | | Conference Room A | Bring reports
```

### Tasks Sheet Format
Create a Google Sheet with the following columns in this exact order:

| A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|
| Title | Description | Date | Start Time | End Time | Is Completed | Priority | Notes |

**Example data:**
```
Review Documents | Check all contracts | 2024-01-15 | 09:00 | 11:00 | false | high | Urgent deadline
Update Website | Fix homepage bugs | 2024-01-16 | | | false | medium | Client request
```

## Step 2: Make Your Sheets Public

1. Open your Google Sheet
2. Click "Share" button (top right)
3. Click "Change to anyone with the link"
4. Set permission to "Viewer"
5. Copy the sheet URL

## Step 3: Get Your Sheet IDs

From your Google Sheets URL, extract the sheet ID:
```
https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit#gid=0
```

The SHEET_ID is the long string between `/d/` and `/edit`.

## Step 4: Configure Your App

Add these environment variables to your Replit Secrets:

1. `EVENTS_SHEET_ID` - Your events spreadsheet ID
2. `TASKS_SHEET_ID` - Your tasks spreadsheet ID

## Step 5: Test the Sync

1. Go to your dashboard
2. Navigate to the Sync Dashboard (you need admin privileges)
3. Click "Trigger Manual Sync"
4. Check the sync logs for any errors

## Column Details

### Events Columns:
- **Title** (Required): Event name
- **Description**: Detailed description
- **Date** (Required): Format: YYYY-MM-DD (e.g., 2024-01-15)
- **Start Time** (Required): Format: HH:MM (e.g., 09:00)
- **End Time** (Required): Format: HH:MM (e.g., 17:00)
- **Is Online**: true/false for online events
- **Meeting Link**: URL for online meetings
- **Location**: Physical location for in-person events
- **Notes**: Additional notes

### Tasks Columns:
- **Title** (Required): Task name
- **Description**: Detailed description
- **Date** (Required): Format: YYYY-MM-DD
- **Start Time**: Optional start time (HH:MM)
- **End Time**: Optional end time (HH:MM)
- **Is Completed**: true/false
- **Priority**: low/medium/high
- **Notes**: Additional notes

## Troubleshooting

### Common Issues:
1. **"Failed to fetch" errors**: Check that your sheets are public and the IDs are correct
2. **"API key not configured"**: Make sure GOOGLE_SHEETS_API_KEY is set in your secrets
3. **Data not importing**: Verify your sheet format matches exactly, including column order

### Checking Your Setup:
1. Verify your Google Sheets API key is working by testing this URL in your browser:
   ```
   https://sheets.googleapis.com/v4/spreadsheets/[YOUR_SHEET_ID]/values/Sheet1!A1:C3?key=[YOUR_API_KEY]
   ```

2. Make sure your sheet names are exactly "Events" and "Tasks" (case sensitive)

## Tips:
- Use the first row as headers (they will be skipped during sync)
- Keep data consistent - empty cells are okay but maintain the column structure
- Test with a small amount of data first
- The sync will create new entries each time, so avoid running it multiple times with the same data