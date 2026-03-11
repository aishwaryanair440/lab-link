// ============================================================================
// LAB EQUIPMENT TRACKING SYSTEM - Google Apps Script
// ============================================================================
// This script automatically creates a complete backend for tracking lab
// equipment, students, transactions, damage reports, and bookings.
//
// HOW TO USE:
// 1. Open Google Apps Script: https://script.google.com
// 2. Create a new project and paste this entire code.
// 3. Run the "setupLabEquipmentSystem" function to generate everything.
// 4. Authorize the script when prompted (it needs Drive & Sheets access).
// 5. Deploy as Web App to enable the JSON API endpoint.
//
// FEATURES:
// - Creates a "Lab Equipment Database" Google Sheet with 5 tabs
// - Populates mock data for Students (30+), Equipment (40+)
// - Generates Code-128 barcodes for each equipment item
// - Creates a "Lab Equipment Barcodes" folder in Google Drive
// - Generates a printable "Barcode Labels" sheet
// - Exposes a Web API endpoint returning equipment data as JSON
// ============================================================================


// ============================================================================
// SECTION 1: MAIN SETUP FUNCTION
// ============================================================================
// This is the entry point. Run this function to set up everything.
// It orchestrates the creation of sheets, data population, and barcode generation.

function setupLabEquipmentSystem() {
  Logger.log("🚀 Starting Lab Equipment Tracking System setup...");

  // Step 1: Create the main spreadsheet
  var spreadsheet = SpreadsheetApp.create("Lab Equipment Database");
  var spreadsheetId = spreadsheet.getId();
  Logger.log("✅ Created spreadsheet: " + spreadsheet.getUrl());

  // Step 2: Set up each sheet tab with headers and data
  setupStudentsSheet(spreadsheet);
  setupEquipmentSheet(spreadsheet);
  setupTransactionsSheet(spreadsheet);
  setupDamageLogSheet(spreadsheet);
  setupBookingSheet(spreadsheet);
  setupStudentBarcodesPrintSheet(spreadsheet);

  // Remove the default "Sheet1" that Google creates automatically
  var defaultSheet = spreadsheet.getSheetByName("Sheet1");
  if (defaultSheet) {
    spreadsheet.deleteSheet(defaultSheet);
  }

  // Step 3: Generate barcodes for equipment items
  generateBarcodesForEquipment(spreadsheet);

  // Step 4: Create barcode folder and labels sheet in Google Drive
  createBarcodeFolder(spreadsheet);

  Logger.log("🎉 Setup complete! Open your Google Drive to find your files.");
  Logger.log("📄 Spreadsheet URL: " + spreadsheet.getUrl());
}


// ============================================================================
// SECTION 2: STUDENTS SHEET
// ============================================================================
// Creates the "Students" tab with 30 mock student records.
// Departments: IT, ECE, EEE, Mechanical
// Student_ID format: ST001, ST002, ...

function setupStudentsSheet(spreadsheet) {
  var sheet = spreadsheet.insertSheet("Students");

  // Define column headers
  var headers = [["Student_ID", "Name", "Department", "Year", "Email", "Barcode_Image"]];
  sheet.getRange(1, 1, 1, 6).setValues(headers);

  // Style the header row
  styleHeaderRow(sheet, 6);

  // Mock student data — 30 students across 4 departments
  var students = [
    ["ST001", "Aarav Sharma",       "IT",         "2nd", "aarav.sharma@college.edu"],
    ["ST002", "Diya Patel",         "ECE",        "3rd", "diya.patel@college.edu"],
    ["ST003", "Rohan Mehta",        "EEE",        "1st", "rohan.mehta@college.edu"],
    ["ST004", "Ananya Iyer",        "Mechanical", "4th", "ananya.iyer@college.edu"],
    ["ST005", "Kabir Singh",        "IT",         "2nd", "kabir.singh@college.edu"],
    ["ST006", "Priya Nair",         "ECE",        "3rd", "priya.nair@college.edu"],
    ["ST007", "Arjun Reddy",        "EEE",        "1st", "arjun.reddy@college.edu"],
    ["ST008", "Sneha Gupta",        "Mechanical", "2nd", "sneha.gupta@college.edu"],
    ["ST009", "Vivaan Kumar",       "IT",         "3rd", "vivaan.kumar@college.edu"],
    ["ST010", "Ishita Das",         "ECE",        "4th", "ishita.das@college.edu"],
    ["ST011", "Aditya Joshi",       "EEE",        "2nd", "aditya.joshi@college.edu"],
    ["ST012", "Meera Krishnan",     "Mechanical", "1st", "meera.krishnan@college.edu"],
    ["ST013", "Siddharth Menon",    "IT",         "4th", "siddharth.menon@college.edu"],
    ["ST014", "Kavya Rao",          "ECE",        "2nd", "kavya.rao@college.edu"],
    ["ST015", "Harsh Verma",        "EEE",        "3rd", "harsh.verma@college.edu"],
    ["ST016", "Tanya Bhat",         "Mechanical", "1st", "tanya.bhat@college.edu"],
    ["ST017", "Raj Malhotra",       "IT",         "2nd", "raj.malhotra@college.edu"],
    ["ST018", "Nisha Sundaram",     "ECE",        "3rd", "nisha.sundaram@college.edu"],
    ["ST019", "Vikram Chauhan",     "EEE",        "4th", "vikram.chauhan@college.edu"],
    ["ST020", "Pooja Deshmukh",     "Mechanical", "2nd", "pooja.deshmukh@college.edu"],
    ["ST021", "Karan Kapoor",       "IT",         "1st", "karan.kapoor@college.edu"],
    ["ST022", "Riya Saxena",        "ECE",        "2nd", "riya.saxena@college.edu"],
    ["ST023", "Dhruv Tiwari",       "EEE",        "3rd", "dhruv.tiwari@college.edu"],
    ["ST024", "Ankita Pillai",      "Mechanical", "4th", "ankita.pillai@college.edu"],
    ["ST025", "Manish Agarwal",     "IT",         "3rd", "manish.agarwal@college.edu"],
    ["ST026", "Shruti Hegde",       "ECE",        "1st", "shruti.hegde@college.edu"],
    ["ST027", "Nikhil Pandey",      "EEE",        "2nd", "nikhil.pandey@college.edu"],
    ["ST028", "Deepa Ramesh",       "Mechanical", "3rd", "deepa.ramesh@college.edu"],
    ["ST029", "Amit Kulkarni",      "IT",         "4th", "amit.kulkarni@college.edu"],
    ["ST030", "Lakshmi Venkatesh",  "ECE",        "1st", "lakshmi.venkatesh@college.edu"]
  ];

  // Add barcode formula to each student row
  for (var i = 0; i < students.length; i++) {
    var rowNum = i + 2;
    students[i].push('=IMAGE("https://barcode.tec-it.com/barcode.ashx?data="&A' + rowNum + '&"&code=Code128")');
  }

  // Write all student data to the sheet
  sheet.getRange(2, 1, students.length, 6).setValues(students);

  // Auto-resize columns for readability
  for (var i = 1; i <= 5; i++) {
    sheet.autoResizeColumn(i);
  }
  
  // Set row heights and width for barcode image column
  for (var r = 2; r <= students.length + 1; r++) {
    sheet.setRowHeight(r, 60);
  }
  sheet.setColumnWidth(6, 220);

  Logger.log("✅ Students sheet created with " + students.length + " records.");
}


// ============================================================================
// SECTION 2.5: STUDENT BARCODE PRINT SHEET
// ============================================================================
// Creates the "Student_Barcode_Print" tab for printing student IDs.

function setupStudentBarcodesPrintSheet(spreadsheet) {
  var labelsSheet = spreadsheet.insertSheet("Student_Barcode_Print");

  // Set up headers for the labels sheet
  var headers = [["Student_ID", "Name", "Department", "Barcode_Image"]];
  labelsSheet.getRange(1, 1, 1, 4).setValues(headers);

  // Style the header row
  var headerRange = labelsSheet.getRange(1, 1, 1, 4);
  headerRange.setBackground("#1a237e");
  headerRange.setFontColor("#FFFFFF");
  headerRange.setFontWeight("bold");
  headerRange.setFontSize(12);
  headerRange.setHorizontalAlignment("center");

  // Get student data from the main spreadsheet
  var studentsSheet = spreadsheet.getSheetByName("Students");
  var lastRow = studentsSheet.getLastRow();
  
  if (lastRow > 1) {
    var studentData = studentsSheet.getRange(2, 1, lastRow - 1, 3).getValues(); // ID, Name, Dept
    var outputData = [];
    
    for (var i = 0; i < studentData.length; i++) {
      var rowNum = i + 2;
      var newRow = [
        studentData[i][0], // Student_ID
        studentData[i][1], // Name
        studentData[i][2], // Department
        '=IMAGE("https://barcode.tec-it.com/barcode.ashx?data="&A' + rowNum + '&"&code=Code128")'
      ];
      outputData.push(newRow);
    }
    
    labelsSheet.getRange(2, 1, outputData.length, 4).setValues(outputData);
    
    // Format the labels sheet for printing
    for (var r = 2; r <= outputData.length + 1; r++) {
      labelsSheet.setRowHeight(r, 70);
    }
    
    labelsSheet.setColumnWidth(1, 100);  // Student ID
    labelsSheet.setColumnWidth(2, 200);  // Name
    labelsSheet.setColumnWidth(3, 100);  // Department
    labelsSheet.setColumnWidth(4, 250);  // Barcode Image
    
    var dataRange = labelsSheet.getRange(1, 1, outputData.length + 1, 4);
    dataRange.setBorder(true, true, true, true, true, true,
                        "#CCCCCC", SpreadsheetApp.BorderStyle.SOLID);
    dataRange.setHorizontalAlignment("center");
    dataRange.setVerticalAlignment("middle");
  }

  Logger.log("✅ Student_Barcode_Print sheet created.");
}


// ============================================================================
// SECTION 3: EQUIPMENT SHEET
// ============================================================================
// Creates the "Equipment" tab with 40 mock equipment records.
// Includes lab instruments like Oscilloscope, Arduino Kit, Multimeter, etc.
// Equipment_ID format: EQ001, EQ002, ...
// The Barcode_Value column stores the Code-128 barcode string.

function setupEquipmentSheet(spreadsheet) {
  var sheet = spreadsheet.insertSheet("Equipment");

  // Define column headers — Barcode_Image column will be populated later
  var headers = [["Equipment_ID", "Equipment_Name", "Category", "Lab_Type", "Status", "Barcode_Value", "Barcode_Image"]];
  sheet.getRange(1, 1, 1, 7).setValues(headers);

  // Style the header row
  styleHeaderRow(sheet, 7);

  // Mock equipment data — 40 items across various categories
  var equipment = [
    ["EQ001", "Oscilloscope (Analog)",          "Measurement",    "Electronics Lab",   "Available",    "EQ001"],
    ["EQ002", "Oscilloscope (Digital)",          "Measurement",    "Electronics Lab",   "Available",    "EQ002"],
    ["EQ003", "CRO (Cathode Ray Oscilloscope)",  "Measurement",   "Electronics Lab",   "In Use",       "EQ003"],
    ["EQ004", "Digital Multimeter",              "Measurement",    "Electronics Lab",   "Available",    "EQ004"],
    ["EQ005", "Analog Multimeter",               "Measurement",    "Electronics Lab",   "Available",    "EQ005"],
    ["EQ006", "Arduino Uno Kit",                 "Microcontroller","Embedded Systems Lab","Available",  "EQ006"],
    ["EQ007", "Arduino Mega Kit",                "Microcontroller","Embedded Systems Lab","In Use",     "EQ007"],
    ["EQ008", "Raspberry Pi 4 Model B",          "Microcontroller","Embedded Systems Lab","Available",  "EQ008"],
    ["EQ009", "DC Power Supply (0-30V)",          "Power",          "Electronics Lab",   "Available",    "EQ009"],
    ["EQ010", "AC Power Supply",                  "Power",          "Electronics Lab",   "Under Repair", "EQ010"],
    ["EQ011", "Breadboard (Full-size)",           "Prototyping",    "Electronics Lab",   "Available",    "EQ011"],
    ["EQ012", "Breadboard (Half-size)",           "Prototyping",    "Electronics Lab",   "Available",    "EQ012"],
    ["EQ013", "Vernier Caliper (Digital)",        "Measurement",    "Mechanical Lab",    "Available",    "EQ013"],
    ["EQ014", "Vernier Caliper (Analog)",         "Measurement",    "Mechanical Lab",    "In Use",       "EQ014"],
    ["EQ015", "Micrometer Screw Gauge",           "Measurement",    "Mechanical Lab",    "Available",    "EQ015"],
    ["EQ016", "Function Generator",               "Signal",         "Electronics Lab",   "Available",    "EQ016"],
    ["EQ017", "Signal Generator (RF)",             "Signal",        "Communications Lab","Available",    "EQ017"],
    ["EQ018", "Soldering Station",                 "Tools",         "Electronics Lab",   "Available",    "EQ018"],
    ["EQ019", "Hot Air Rework Station",            "Tools",         "Electronics Lab",   "Under Repair", "EQ019"],
    ["EQ020", "Logic Analyzer",                    "Measurement",   "Digital Lab",       "Available",    "EQ020"],
    ["EQ021", "LCR Meter",                         "Measurement",   "Electronics Lab",   "Available",    "EQ021"],
    ["EQ022", "Spectrum Analyzer",                 "Measurement",   "Communications Lab","In Use",       "EQ022"],
    ["EQ023", "Network Analyzer",                  "Measurement",   "Communications Lab","Available",    "EQ023"],
    ["EQ024", "Lathe Machine (Small)",             "Machine",       "Workshop",          "Available",    "EQ024"],
    ["EQ025", "Drilling Machine",                  "Machine",       "Workshop",          "Available",    "EQ025"],
    ["EQ026", "3D Printer (FDM)",                  "Prototyping",   "Fabrication Lab",   "In Use",       "EQ026"],
    ["EQ027", "3D Printer (SLA)",                  "Prototyping",   "Fabrication Lab",   "Available",    "EQ027"],
    ["EQ028", "ESP32 Development Board",           "Microcontroller","IoT Lab",          "Available",    "EQ028"],
    ["EQ029", "NodeMCU (ESP8266)",                 "Microcontroller","IoT Lab",          "Available",    "EQ029"],
    ["EQ030", "Voltage Regulator Module",          "Components",    "Electronics Lab",   "Available",    "EQ030"],
    ["EQ031", "Transformer (Step-down)",           "Power",         "Electrical Lab",    "Available",    "EQ031"],
    ["EQ032", "Transformer (Step-up)",             "Power",         "Electrical Lab",    "Under Repair", "EQ032"],
    ["EQ033", "Relay Module (4-Channel)",          "Components",    "Electronics Lab",   "Available",    "EQ033"],
    ["EQ034", "Motor Driver (L298N)",              "Components",    "Robotics Lab",      "Available",    "EQ034"],
    ["EQ035", "Stepper Motor Kit",                 "Actuators",     "Robotics Lab",      "Available",    "EQ035"],
    ["EQ036", "Servo Motor (SG90)",                "Actuators",     "Robotics Lab",      "In Use",       "EQ036"],
    ["EQ037", "Ultrasonic Sensor (HC-SR04)",       "Sensors",       "IoT Lab",           "Available",    "EQ037"],
    ["EQ038", "Temperature Sensor (DHT11)",        "Sensors",       "IoT Lab",           "Available",    "EQ038"],
    ["EQ039", "Oscilloscope Probe Set",            "Accessories",   "Electronics Lab",   "Available",    "EQ039"],
    ["EQ040", "Wire Stripper & Crimping Tool",     "Tools",         "Electronics Lab",   "Available",    "EQ040"]
  ];

  // Write all equipment data to the sheet
  sheet.getRange(2, 1, equipment.length, 6).setValues(equipment);

  // Auto-resize columns for readability
  for (var i = 1; i <= 6; i++) {
    sheet.autoResizeColumn(i);
  }

  // Set row heights for barcode image column (column 7)
  for (var r = 2; r <= equipment.length + 1; r++) {
    sheet.setRowHeight(r, 60);
  }
  sheet.setColumnWidth(7, 220);

  Logger.log("✅ Equipment sheet created with " + equipment.length + " records.");
}


// ============================================================================
// SECTION 4: TRANSACTIONS SHEET
// ============================================================================
// Creates the "Transactions" tab to log equipment issue/return events.
// Includes sample transaction records.

function setupTransactionsSheet(spreadsheet) {
  var sheet = spreadsheet.insertSheet("Transactions");

  // Define column headers
  var headers = [["Transaction_ID", "Student_ID", "Equipment_ID", "Issue_Time", "Return_Time", "Return_Status", "Damage_Reported"]];
  sheet.getRange(1, 1, 1, 7).setValues(headers);

  // Style the header row
  styleHeaderRow(sheet, 7);

  // Sample transaction data — 15 records to demonstrate the tracking workflow
  var transactions = [
    ["TXN001", "ST001", "EQ003", "2026-03-10 09:00", "2026-03-10 12:00", "Returned",     "No"],
    ["TXN002", "ST005", "EQ007", "2026-03-10 10:30", "",                  "Not Returned",  "No"],
    ["TXN003", "ST012", "EQ014", "2026-03-10 11:00", "2026-03-10 14:30", "Returned",     "Yes"],
    ["TXN004", "ST018", "EQ022", "2026-03-11 08:00", "",                  "Not Returned",  "No"],
    ["TXN005", "ST003", "EQ006", "2026-03-09 09:00", "2026-03-09 11:00", "Returned",     "No"],
    ["TXN006", "ST022", "EQ026", "2026-03-11 10:00", "",                  "Not Returned",  "No"],
    ["TXN007", "ST008", "EQ036", "2026-03-11 09:30", "2026-03-11 13:00", "Returned",     "No"],
    ["TXN008", "ST015", "EQ010", "2026-03-08 14:00", "2026-03-08 17:00", "Returned",     "Yes"],
    ["TXN009", "ST027", "EQ004", "2026-03-11 08:30", "2026-03-11 10:30", "Returned",     "No"],
    ["TXN010", "ST010", "EQ001", "2026-03-11 11:00", "",                  "Not Returned",  "No"],
    ["TXN011", "ST014", "EQ016", "2026-03-07 09:00", "2026-03-07 12:30", "Returned",     "No"],
    ["TXN012", "ST021", "EQ008", "2026-03-11 14:00", "",                  "Not Returned",  "No"],
    ["TXN013", "ST029", "EQ028", "2026-03-06 10:00", "2026-03-06 15:00", "Returned",     "No"],
    ["TXN014", "ST007", "EQ018", "2026-03-10 13:00", "2026-03-10 16:00", "Returned",     "Yes"],
    ["TXN015", "ST024", "EQ024", "2026-03-11 09:00", "",                  "Not Returned",  "No"]
  ];

  sheet.getRange(2, 1, transactions.length, 7).setValues(transactions);

  // Auto-resize columns
  for (var i = 1; i <= 7; i++) {
    sheet.autoResizeColumn(i);
  }

  Logger.log("✅ Transactions sheet created with " + transactions.length + " records.");
}


// ============================================================================
// SECTION 5: DAMAGE LOG SHEET
// ============================================================================
// Creates the "Damage_Log" tab for reporting equipment damage.

function setupDamageLogSheet(spreadsheet) {
  var sheet = spreadsheet.insertSheet("Damage_Log");

  // Define column headers
  var headers = [["Damage_ID", "Equipment_ID", "Reported_By", "Damage_Description", "Report_Date", "Status"]];
  sheet.getRange(1, 1, 1, 6).setValues(headers);

  // Style the header row
  styleHeaderRow(sheet, 6);

  // Sample damage log entries — 12 records
  var damageLogs = [
    ["DMG001", "EQ010", "ST015", "Power supply unit producing inconsistent voltage output",    "2026-03-08", "Under Repair"],
    ["DMG002", "EQ014", "ST012", "Caliper jaw misaligned after accidental drop",               "2026-03-10", "Reported"],
    ["DMG003", "EQ019", "ST007", "Heating element malfunction, not reaching set temperature",  "2026-03-05", "Under Repair"],
    ["DMG004", "EQ032", "ST011", "Winding insulation degraded, sparking observed",             "2026-03-01", "Under Repair"],
    ["DMG005", "EQ003", "ST002", "Screen flickering intermittently during measurements",       "2026-03-09", "Reported"],
    ["DMG006", "EQ018", "ST007", "Soldering iron tip corroded, uneven heat distribution",      "2026-03-10", "Reported"],
    ["DMG007", "EQ026", "ST017", "3D printer extruder nozzle clogged with filament residue",   "2026-03-06", "Resolved"],
    ["DMG008", "EQ007", "ST005", "Arduino Mega USB port loose, intermittent connection",       "2026-03-09", "Under Repair"],
    ["DMG009", "EQ025", "ST024", "Drilling machine chuck not gripping bits securely",          "2026-03-07", "Reported"],
    ["DMG010", "EQ036", "ST008", "Servo motor gear teeth worn, jittery movement observed",     "2026-03-11", "Reported"],
    ["DMG011", "EQ022", "ST018", "Spectrum analyzer display showing dead pixels in corner",    "2026-03-04", "Under Repair"],
    ["DMG012", "EQ024", "ST024", "Lathe machine tool post misaligned, produces uneven cuts",   "2026-03-02", "Resolved"]
  ];

  sheet.getRange(2, 1, damageLogs.length, 6).setValues(damageLogs);

  // Auto-resize columns
  for (var i = 1; i <= 6; i++) {
    sheet.autoResizeColumn(i);
  }

  Logger.log("✅ Damage_Log sheet created with " + damageLogs.length + " records.");
}


// ============================================================================
// SECTION 6: BOOKING SHEET
// ============================================================================
// Creates the "Booking" tab for students to reserve equipment in advance.

function setupBookingSheet(spreadsheet) {
  var sheet = spreadsheet.insertSheet("Booking");

  // Define column headers
  var headers = [["Booking_ID", "Student_ID", "Equipment_ID", "Booking_Date", "Booking_Time", "Purpose"]];
  sheet.getRange(1, 1, 1, 6).setValues(headers);

  // Style the header row
  styleHeaderRow(sheet, 6);

  // Sample booking data — 13 records
  var bookings = [
    ["BK001", "ST002", "EQ001", "2026-03-12", "09:00 - 11:00", "ECE Lab Experiment - Waveform Analysis"],
    ["BK002", "ST009", "EQ006", "2026-03-12", "11:00 - 13:00", "IoT Project - Sensor Data Collection"],
    ["BK003", "ST016", "EQ013", "2026-03-12", "14:00 - 16:00", "Mechanical Drawing Measurements"],
    ["BK004", "ST021", "EQ008", "2026-03-13", "09:00 - 12:00", "IT Project - Raspberry Pi Server Setup"],
    ["BK005", "ST006", "EQ016", "2026-03-13", "10:00 - 12:00", "Signal Processing Assignment"],
    ["BK006", "ST023", "EQ031", "2026-03-13", "14:00 - 16:00", "Power Electronics Lab Practical"],
    ["BK007", "ST017", "EQ026", "2026-03-14", "09:00 - 13:00", "3D Printing - Project Prototype"],
    ["BK008", "ST028", "EQ025", "2026-03-14", "10:00 - 12:00", "Workshop Practice - Drilling Operations"],
    ["BK009", "ST010", "EQ020", "2026-03-14", "14:00 - 16:00", "Digital Logic Design - Timing Analysis"],
    ["BK010", "ST003", "EQ009", "2026-03-15", "09:00 - 11:00", "EEE Circuit Testing - Voltage Regulation"],
    ["BK011", "ST025", "EQ029", "2026-03-15", "10:00 - 13:00", "IoT Workshop - NodeMCU Weather Station"],
    ["BK012", "ST020", "EQ015", "2026-03-15", "14:00 - 16:00", "Precision Measurement Lab - Micrometer"],
    ["BK013", "ST014", "EQ034", "2026-03-16", "09:00 - 12:00", "Robotics Club - Motor Driver Testing"]
  ];

  sheet.getRange(2, 1, bookings.length, 6).setValues(bookings);

  // Auto-resize columns
  for (var i = 1; i <= 6; i++) {
    sheet.autoResizeColumn(i);
  }

  Logger.log("✅ Booking sheet created with " + bookings.length + " records.");
}


// ============================================================================
// SECTION 7: BARCODE GENERATION
// ============================================================================
// Generates Code-128 barcode images for each equipment item using a
// public barcode API (barcodeapi.org). The images are inserted into the
// "Barcode_Image" column (column 7) of the Equipment sheet.
//
// NOTE: This uses UrlFetchApp to download barcode images. Google Apps Script
// has execution time limits (6 minutes for free accounts), so we add small
// delays to avoid rate-limiting from the barcode API.

function generateBarcodesForEquipment(spreadsheet) {
  var sheet = spreadsheet.getSheetByName("Equipment");
  var lastRow = sheet.getLastRow();

  Logger.log("📊 Generating barcodes for " + (lastRow - 1) + " equipment items...");

  for (var row = 2; row <= lastRow; row++) {
    var equipmentId = sheet.getRange(row, 1).getValue(); // Equipment_ID column

    try {
      // Use the barcodeapi.org public API to generate Code-128 barcodes
      // Alternative APIs you can use:
      //   - https://barcode.tec-it.com/barcode.ashx?data=EQ001&code=Code128&translate-esc=on
      //   - https://bwipjs-api.metafloor.com/?bcid=code128&text=EQ001
      var barcodeUrl = "https://bwipjs-api.metafloor.com/?bcid=code128&text=" +
                        encodeURIComponent(equipmentId) +
                        "&scale=2&height=12&includetext";

      // Fetch the barcode image from the API
      var response = UrlFetchApp.fetch(barcodeUrl);
      var blob = response.getBlob().setName(equipmentId + "_barcode.png");

      // Insert the barcode image into the cell
      // CellImageBuilder places images inside cells (available in newer Sheets)
      var image = SpreadsheetApp.newCellImage()
                    .setSourceUrl(barcodeUrl)
                    .setAltTextTitle(equipmentId + " Barcode")
                    .setAltTextDescription("Code-128 barcode for " + equipmentId)
                    .build();

      sheet.getRange(row, 7).setValue(image);

      Logger.log("  ✅ Barcode generated for " + equipmentId);

      // Small delay to avoid API rate limiting (200ms between requests)
      Utilities.sleep(200);

    } catch (e) {
      // If barcode generation fails, log the error and put a placeholder
      Logger.log("  ⚠️ Failed to generate barcode for " + equipmentId + ": " + e.message);
      sheet.getRange(row, 7).setValue("Barcode Error - " + e.message);
    }
  }

  Logger.log("✅ Barcode generation complete.");
}


// ============================================================================
// SECTION 8: BARCODE FOLDER & LABELS SHEET
// ============================================================================
// Creates a "Lab Equipment Barcodes" folder in Google Drive and generates
// a printable "Barcode Labels" Google Sheet inside that folder.
// The labels sheet is formatted for printing as barcode stickers.

function createBarcodeFolder(spreadsheet) {
  // Create the folder in Google Drive
  var folder = DriveApp.createFolder("Lab Equipment Barcodes");
  Logger.log("📁 Created folder: Lab Equipment Barcodes");

  // Get equipment data from the main spreadsheet
  var equipmentSheet = spreadsheet.getSheetByName("Equipment");
  var lastRow = equipmentSheet.getLastRow();
  var equipmentData = equipmentSheet.getRange(2, 1, lastRow - 1, 6).getValues();

  // Create a new Google Sheet in the barcodes folder
  var labelsSpreadsheet = SpreadsheetApp.create("Barcode Labels");
  var labelsFile = DriveApp.getFileById(labelsSpreadsheet.getId());

  // Move the file to the barcodes folder
  folder.addFile(labelsFile);
  DriveApp.getRootFolder().removeFile(labelsFile);

  var labelsSheet = labelsSpreadsheet.getActiveSheet();
  labelsSheet.setName("Labels");

  // Set up headers for the labels sheet
  var headers = [["Equipment_Name", "Equipment_ID", "Barcode_Image"]];
  labelsSheet.getRange(1, 1, 1, 3).setValues(headers);

  // Style the header row
  var headerRange = labelsSheet.getRange(1, 1, 1, 3);
  headerRange.setBackground("#1a237e");
  headerRange.setFontColor("#FFFFFF");
  headerRange.setFontWeight("bold");
  headerRange.setFontSize(12);
  headerRange.setHorizontalAlignment("center");

  // Populate labels with equipment name, ID, and barcode
  for (var i = 0; i < equipmentData.length; i++) {
    var equipmentName = equipmentData[i][1]; // Equipment_Name
    var equipmentId = equipmentData[i][0];   // Equipment_ID
    var rowNum = i + 2;

    // Write equipment name and ID
    labelsSheet.getRange(rowNum, 1).setValue(equipmentName);
    labelsSheet.getRange(rowNum, 2).setValue(equipmentId);

    // Generate and insert barcode image
    try {
      var barcodeUrl = "https://bwipjs-api.metafloor.com/?bcid=code128&text=" +
                        encodeURIComponent(equipmentId) +
                        "&scale=2&height=12&includetext";

      var image = SpreadsheetApp.newCellImage()
                    .setSourceUrl(barcodeUrl)
                    .setAltTextTitle(equipmentId + " Barcode")
                    .setAltTextDescription("Code-128 barcode for " + equipmentId)
                    .build();

      labelsSheet.getRange(rowNum, 3).setValue(image);

      Utilities.sleep(200);

    } catch (e) {
      labelsSheet.getRange(rowNum, 3).setValue("Error: " + e.message);
      Logger.log("  ⚠️ Label barcode error for " + equipmentId + ": " + e.message);
    }

    // Set row height for barcode visibility
    labelsSheet.setRowHeight(rowNum, 70);
  }

  // Format the labels sheet for printing
  // Column widths optimized for standard sticker label sheets
  labelsSheet.setColumnWidth(1, 200);  // Equipment Name
  labelsSheet.setColumnWidth(2, 100);  // Equipment ID
  labelsSheet.setColumnWidth(3, 250);  // Barcode Image

  // Add borders for easy cutting
  var dataRange = labelsSheet.getRange(1, 1, equipmentData.length + 1, 3);
  dataRange.setBorder(true, true, true, true, true, true,
                      "#CCCCCC", SpreadsheetApp.BorderStyle.SOLID);

  // Center-align all cells
  dataRange.setHorizontalAlignment("center");
  dataRange.setVerticalAlignment("middle");

  // Set print settings for label printing
  labelsSheet.getRange(2, 1, equipmentData.length, 1).setFontSize(10);
  labelsSheet.getRange(2, 2, equipmentData.length, 1).setFontSize(11)
    .setFontWeight("bold");

  Logger.log("✅ Barcode Labels sheet created in folder: Lab Equipment Barcodes");
  Logger.log("📄 Labels URL: " + labelsSpreadsheet.getUrl());
}


// ============================================================================
// SECTION 9: WEB API ENDPOINT
// ============================================================================
// These functions create a REST-like API endpoint when the script is deployed
// as a Web App. External web applications can fetch equipment data as JSON.
//
// HOW TO DEPLOY:
// 1. Click "Deploy" > "New deployment" in the Apps Script editor
// 2. Select "Web app" as the deployment type
// 3. Set "Execute as" to "Me"
// 4. Set "Who has access" to "Anyone" (or "Anyone with Google account")
// 5. Click "Deploy" and copy the Web App URL
//
// API USAGE:
//   GET <web-app-url>                        → Returns all equipment
//   GET <web-app-url>?action=equipment       → Returns all equipment
//   GET <web-app-url>?action=students        → Returns all students
//   GET <web-app-url>?action=transactions    → Returns all transactions
//   GET <web-app-url>?action=damage          → Returns damage log
//   GET <web-app-url>?action=bookings        → Returns all bookings
//   GET <web-app-url>?action=search&q=Arduino → Search equipment by name
//   GET <web-app-url>?action=status          → Returns system status summary

function doGet(e) {
  var action = e.parameter.action || "equipment";
  var result;

  try {
    switch (action) {
      case "equipment":
        result = getEquipmentData(); break;
      case "students":
        result = getStudentsData(); break;
      case "transactions":
        result = getTransactionsData(); break;
      case "damage":
        result = getDamageLogData(); break;
      case "bookings":
        result = getBookingsData(); break;
      case "search":
        result = searchEquipment(e.parameter.q || ""); break;
      case "status":
        result = getSystemStatus(); break;
      
      // Data Mutating GETs / Login requests
      case "login":
        result = handleLogin(e.parameter.role, e.parameter.id); break;
      case "issue":
        result = handleIssueEquipment(e.parameter.studentId, e.parameter.equipmentId); break;
      case "return":
        result = handleReturnEquipment(e.parameter.equipmentId, e.parameter.damage); break;
      
      default:
        result = { error: "Unknown action: " + action, availableActions: ["equipment", "students", "transactions", "damage", "bookings", "search", "status", "login", "issue", "return"] };
    }
  } catch (err) {
    result = { status: "error", error: err.toString() };
  }

  // Return the result as JSON with proper CORS headers for web app access
  var output = ContentService.createTextOutput(JSON.stringify(result, null, 2));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

// Handle POST requests using standard x-www-form-urlencoded or JSON
function doPost(e) {
  var data = {};
  if (e.postData && e.postData.contents) {
    try { data = JSON.parse(e.postData.contents); } catch(err) {}
  } else {
    data = e.parameter;
  }
  
  var action = data.action || e.parameter.action;
  e.parameter = Object.assign(e.parameter || {}, data);
  
  // Forward to GET for simplified handling
  return doGet(e);
}


// ============================================================================
// SECTION 10: DATA RETRIEVAL FUNCTIONS (Used by Web API)
// ============================================================================
// These helper functions read data from the spreadsheet and return it
// as structured JavaScript objects. They are used by the doGet() handler.
//
// IMPORTANT: After running setupLabEquipmentSystem(), you need to set the
// SPREADSHEET_ID variable below to the ID of your created spreadsheet.
// You can find the ID in the spreadsheet URL:
// https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_HERE/edit

// ⚠️ Configured for specific provided Database spreadsheets
var SPREADSHEET_ID = "1GesLyfAhM2PWbOWSU7mUYvtbp8Rbyc1uepHQl9FSU1g";
var BARCODE_SPREADSHEET_ID = "1FG5URMquepa9moAcb6uUES3KCKvtrEQHyc1cn6POTuI";

/**
 * Finds the Lab Equipment Database spreadsheet by ID.
 */
function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

/**
 * Finds the Secondary Barcode Data spreadsheet by ID.
 */
function getBarcodeSpreadsheet() {
  return SpreadsheetApp.openById(BARCODE_SPREADSHEET_ID);
}

/**
 * Generic function to read any sheet and return data as an array of objects.
 * Each object uses the header row values as keys.
 */
function getSheetDataAsObjects(sheetName) {
  var spreadsheet = getSpreadsheet();
  var sheet = spreadsheet.getSheetByName(sheetName);

  if (!sheet) {
    return { error: "Sheet '" + sheetName + "' not found." };
  }

  var data = sheet.getDataRange().getValues();
  var headers = data[0]; // First row is headers
  var result = [];

  // Convert each row to an object with header keys
  for (var i = 1; i < data.length; i++) {
    var row = {};
    for (var j = 0; j < headers.length; j++) {
      // Skip the Barcode_Image column (it contains image objects, not text)
      if (headers[j] === "Barcode_Image") continue;
      row[headers[j]] = data[i][j];
    }
    result.push(row);
  }

  return result;
}

/** Returns all equipment data as JSON */
function getEquipmentData() {
  var data = getSheetDataAsObjects("Equipment");
  return {
    status: "success",
    count: data.length || 0,
    data: data,
    timestamp: new Date().toISOString()
  };
}

/** Returns all students data as JSON */
function getStudentsData() {
  var data = getSheetDataAsObjects("Students");
  return {
    status: "success",
    count: data.length || 0,
    data: data,
    timestamp: new Date().toISOString()
  };
}

/** Returns all transactions data as JSON */
function getTransactionsData() {
  var data = getSheetDataAsObjects("Transactions");
  return {
    status: "success",
    count: data.length || 0,
    data: data,
    timestamp: new Date().toISOString()
  };
}

// ============================================================================
// SECTION 10.5: MUTATIONS (ISSUE / RETURN / LOGIN)
// ============================================================================

function handleLogin(role, id) {
  if (role === "admin") {
    if (id === "admin") {
      return { status: "success", user: { role: "admin", Name: "Lab Assistant" } };
    }
    return { status: "error", message: "Invalid Admin Credentials" };
  }
  
  if (role === "student") {
    // Validate student against main spreadsheet
    var students = getSheetDataAsObjects("Students");
    var student = students.find(function(s) { return s.Student_ID === id; });
    
    if (student) {
      return { status: "success", user: student };
    }
    return { status: "error", message: "Student ID not found" };
  }
  
  return { status: "error", message: "Invalid role specified" };
}

function normalizeEquipmentIdFromBarcode(scannedId) {
  if (!scannedId) return "";
  var rawInput = scannedId.toString().trim();
  var searchId = rawInput.toLowerCase();
  
  var resolvedIdCandidate = rawInput; // Start with the input itself

  // 1. Resolve from the Barcode Spreadsheet first
  try {
    var barcodeSS = getBarcodeSpreadsheet();
    if (barcodeSS) {
      var sheet = barcodeSS.getSheets()[0];
      var data = sheet.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        // Search across all common identifier columns (Barcode, ID, or Name)
        if ((data[i][0] && data[i][0].toString().trim().toLowerCase() === searchId) || 
            (data[i][1] && data[i][1].toString().trim().toLowerCase() === searchId)) {
           // If match found, use column B (index 1) as the likely ID, otherwise col A
           resolvedIdCandidate = (data[i][1] || data[i][0]).toString().trim();
           break; 
        }
      }
    }
  } catch (e) {
    Logger.log("Barcode spreadsheet access error: " + e);
  }

  // 2. Final Resolution: Map whatever we have (ID or Name) to the Primary ID in Main Sheet
  var ss = getSpreadsheet();
  var equipSheet = ss.getSheetByName("Equipment");
  var equipData = equipSheet.getDataRange().getValues();
  
  var candidateLower = resolvedIdCandidate.toLowerCase().replace(/\s+/g, ' ');

  for (var j = 1; j < equipData.length; j++) {
    var idInSheet = equipData[j][0].toString().trim().toLowerCase();
    var nameInSheet = equipData[j][1].toString().trim().toLowerCase().replace(/\s+/g, ' ');
    
    // Check if our candidate matches either the ID row or the Name row
    if (idInSheet === candidateLower || nameInSheet === candidateLower) {
      return equipData[j][0]; // EXTREMELY IMPORTANT: Return the primary ID from Column A
    }
  }

  return resolvedIdCandidate; // Final fallback if not found in main sheet
}

function handleIssueEquipment(studentId, scannedEquipId) {
  var ss = getSpreadsheet();
  var equipId = normalizeEquipmentIdFromBarcode(scannedEquipId);
  
  var equipSheet = ss.getSheetByName("Equipment");
  var equipData = equipSheet.getDataRange().getValues();
  
  var foundEquipRowIndex = -1;
  var equipStatusIndex = 4; // 'Status' is column E (index 4)
  
  for (var i = 1; i < equipData.length; i++) {
    if (equipData[i][0] === equipId) { // Equipment_ID is col 1
      foundEquipRowIndex = i + 1; // 1-indexed for Sheets
      if (equipData[i][equipStatusIndex] !== "Available") {
        return { status: "error", message: "Equipment is currently " + equipData[i][equipStatusIndex] };
      }
      break;
    }
  }
  
  if (foundEquipRowIndex === -1) {
    return { status: "error", message: "Equipment ID " + equipId + " not found in database." };
  }

  // Create Transaction
  var txnSheet = ss.getSheetByName("Transactions");
  var txnId = "TXN" + Math.floor(10000 + Math.random() * 90000); // random transaction id
  var issueTime = new Date().toISOString().replace('T', ' ').substring(0, 16);
  
  // Format: [Transaction_ID, Student_ID, Equipment_ID, Issue_Time, Return_Time, Return_Status, Damage_Reported]
  txnSheet.appendRow([txnId, studentId, equipId, issueTime, "", "Not Returned", "No"]);
  
  // Update Equipment Status
  equipSheet.getRange(foundEquipRowIndex, equipStatusIndex + 1).setValue("In Use");
  
  return { status: "success", message: "Equipment " + equipId + " issued to " + studentId, transaction: txnId };
}

function handleReturnEquipment(scannedEquipId, dmgReported) {
  var ss = getSpreadsheet();
  var equipId = normalizeEquipmentIdFromBarcode(scannedEquipId);
  var damage = dmgReported || "No";
  
  // Find active transaction
  var txnSheet = ss.getSheetByName("Transactions");
  var txnData = txnSheet.getDataRange().getValues();
  var activeTxnRow = -1;
  
  for (var i = txnData.length - 1; i > 0; i--) { // Reverse search to find latest
    if (txnData[i][2] === equipId && txnData[i][5] === "Not Returned") {
      activeTxnRow = i + 1;
      break;
    }
  }
  
  if (activeTxnRow === -1) {
    return { status: "error", message: "No active issue found for equipment " + equipId };
  }
  
  var returnTime = new Date().toISOString().replace('T', ' ').substring(0, 16);
  txnSheet.getRange(activeTxnRow, 5).setValue(returnTime); // Return_Time
  txnSheet.getRange(activeTxnRow, 6).setValue("Returned"); // Return_Status
  txnSheet.getRange(activeTxnRow, 7).setValue(damage);      // Damage_Reported
  
  // Update Equipment Status
  var equipSheet = ss.getSheetByName("Equipment");
  var equipData = equipSheet.getDataRange().getValues();
  var foundEquipRowIndex = -1;
  for (var j = 1; j < equipData.length; j++) {
    if (equipData[j][0] === equipId) {
      foundEquipRowIndex = j + 1;
      break;
    }
  }
  
  if (foundEquipRowIndex !== -1) {
    equipSheet.getRange(foundEquipRowIndex, 5).setValue(damage === "Yes" ? "Under Repair" : "Available");
  }
  
  return { status: "success", message: "Equipment " + equipId + " returned successfully." };
}

/** Returns all damage log data as JSON */
function getDamageLogData() {
  var data = getSheetDataAsObjects("Damage_Log");
  return {
    status: "success",
    count: data.length || 0,
    data: data,
    timestamp: new Date().toISOString()
  };
}

/** Returns all bookings data as JSON */
function getBookingsData() {
  var data = getSheetDataAsObjects("Booking");
  return {
    status: "success",
    count: data.length || 0,
    data: data,
    timestamp: new Date().toISOString()
  };
}

/**
 * Searches equipment by name (case-insensitive partial match).
 * Usage: ?action=search&q=Arduino
 */
function searchEquipment(query) {
  var allEquipment = getSheetDataAsObjects("Equipment");
  if (allEquipment.error) return allEquipment;

  var results = allEquipment.filter(function(item) {
    return item.Equipment_Name.toLowerCase().indexOf(query.toLowerCase()) !== -1 ||
           item.Equipment_ID.toLowerCase().indexOf(query.toLowerCase()) !== -1 ||
           item.Category.toLowerCase().indexOf(query.toLowerCase()) !== -1;
  });

  return {
    status: "success",
    query: query,
    count: results.length,
    data: results,
    timestamp: new Date().toISOString()
  };
}

/**
 * Returns a summary of the system status:
 * total equipment, available items, items in use, under repair, etc.
 */
function getSystemStatus() {
  var equipment = getSheetDataAsObjects("Equipment");
  var students = getSheetDataAsObjects("Students");
  var transactions = getSheetDataAsObjects("Transactions");
  var damages = getSheetDataAsObjects("Damage_Log");
  var bookings = getSheetDataAsObjects("Booking");

  if (equipment.error) return equipment;

  var available = equipment.filter(function(e) { return e.Status === "Available"; }).length;
  var inUse = equipment.filter(function(e) { return e.Status === "In Use"; }).length;
  var underRepair = equipment.filter(function(e) { return e.Status === "Under Repair"; }).length;
  var activeTransactions = transactions.filter ? transactions.filter(function(t) { return t.Return_Status === "Not Returned"; }).length : 0;

  return {
    status: "success",
    summary: {
      total_equipment: equipment.length,
      available: available,
      in_use: inUse,
      under_repair: underRepair,
      total_students: students.length || 0,
      active_transactions: activeTransactions,
      total_damage_reports: damages.length || 0,
      pending_bookings: bookings.length || 0
    },
    timestamp: new Date().toISOString()
  };
}


// ============================================================================
// SECTION 11: GOOGLE SHEETS API KEY INSTRUCTIONS
// ============================================================================
// This function prints step-by-step instructions for generating a Google
// Sheets API key through Google Cloud Console. Useful for students who want
// to access the spreadsheet data from external applications.

function getApiKeyInstructions() {
  var instructions = [
    "==================================================================",
    "  HOW TO GENERATE A GOOGLE SHEETS API KEY",
    "==================================================================",
    "",
    "Follow these steps to create an API key for accessing Google Sheets",
    "data from external web applications or mobile apps.",
    "",
    "STEP 1: Go to Google Cloud Console",
    "  → Visit: https://console.cloud.google.com/",
    "  → Sign in with your Google account",
    "",
    "STEP 2: Create a New Project (or select an existing one)",
    "  → Click the project dropdown at the top of the page",
    "  → Click 'New Project'",
    "  → Enter a project name (e.g., 'Lab Equipment Tracker')",
    "  → Click 'Create'",
    "",
    "STEP 3: Enable the Google Sheets API",
    "  → In the left sidebar, navigate to 'APIs & Services' > 'Library'",
    "  → Search for 'Google Sheets API'",
    "  → Click on it and then click 'Enable'",
    "",
    "STEP 4: Create API Credentials",
    "  → Go to 'APIs & Services' > 'Credentials'",
    "  → Click '+ CREATE CREDENTIALS' at the top",
    "  → Select 'API Key'",
    "  → Your API key will be generated — copy it immediately!",
    "",
    "STEP 5: (Recommended) Restrict Your API Key",
    "  → Click on the newly created API key to edit it",
    "  → Under 'API restrictions', select 'Restrict key'",
    "  → Check 'Google Sheets API' from the list",
    "  → Under 'Application restrictions', choose the appropriate type:",
    "     - 'HTTP referrers' for web apps (add your domain)",
    "     - 'IP addresses' for server-side apps",
    "  → Click 'Save'",
    "",
    "STEP 6: Use the API Key in Your Application",
    "  → Replace 'YOUR_API_KEY' in the code below with your actual key:",
    "",
    "  // JavaScript Example (Fetch API):",
    "  const API_KEY = 'YOUR_API_KEY';",
    "  const SHEET_ID = 'YOUR_SPREADSHEET_ID';",
    "  const RANGE = 'Equipment!A1:G41';",
    "  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`;",
    "",
    "  fetch(url)",
    "    .then(response => response.json())",
    "    .then(data => console.log(data))",
    "    .catch(error => console.error('Error:', error));",
    "",
    "ALTERNATIVE: Using the Apps Script Web App URL (No API Key Needed)",
    "  → Deploy this script as a Web App (see Section 9 comments)",
    "  → Use the Web App URL directly in your fetch requests",
    "  → This method doesn't require an API key",
    "",
    "  // Example:",
    "  fetch('YOUR_WEB_APP_URL?action=equipment')",
    "    .then(response => response.json())",
    "    .then(data => console.log(data));",
    "",
    "WHERE TO INSERT THE API KEY IN THIS SCRIPT:",
    "  → This script doesn't require an API key itself since it runs",
    "    within Google's infrastructure with built-in authentication.",
    "  → The API key is only needed for EXTERNAL applications accessing",
    "    the Google Sheets data via the Sheets REST API.",
    "  → If you want to store the key in this script for reference:",
    "    var MY_API_KEY = 'paste-your-key-here';",
    "",
    "SECURITY NOTES:",
    "  ⚠️ Never commit API keys to public repositories (GitHub, etc.)",
    "  ⚠️ Always restrict API keys to specific APIs and domains",
    "  ⚠️ Rotate keys periodically for security",
    "  ⚠️ Use environment variables or secret managers in production",
    "",
    "=================================================================="
  ];

  // Print each line to the Logger
  for (var i = 0; i < instructions.length; i++) {
    Logger.log(instructions[i]);
  }

  return instructions.join("\n");
}


// ============================================================================
// SECTION 12: UTILITY / HELPER FUNCTIONS
// ============================================================================
// Shared helper functions used across multiple sections.

/**
 * Styles a header row with a dark blue background and white bold text.
 * @param {Sheet} sheet - The sheet to style
 * @param {number} numCols - Number of columns in the header
 */
function styleHeaderRow(sheet, numCols) {
  var headerRange = sheet.getRange(1, 1, 1, numCols);
  headerRange.setBackground("#0D47A1");      // Dark blue background
  headerRange.setFontColor("#FFFFFF");        // White text
  headerRange.setFontWeight("bold");          // Bold text
  headerRange.setFontSize(11);               // Slightly larger font
  headerRange.setHorizontalAlignment("center"); // Center alignment
  headerRange.setVerticalAlignment("middle");

  // Freeze the header row so it stays visible when scrolling
  sheet.setFrozenRows(1);
}

/**
 * Adds alternating row colors for better readability.
 * Call this after data is populated if you want zebra-striped rows.
 * @param {Sheet} sheet - The sheet to style
 * @param {number} numCols - Number of columns
 */
function addAlternatingColors(sheet, numCols) {
  var lastRow = sheet.getLastRow();
  for (var row = 2; row <= lastRow; row++) {
    var range = sheet.getRange(row, 1, 1, numCols);
    if (row % 2 === 0) {
      range.setBackground("#E3F2FD"); // Light blue for even rows
    } else {
      range.setBackground("#FFFFFF"); // White for odd rows
    }
  }
}

/**
 * Utility function to test the API endpoint locally.
 * Simulates a GET request to verify data retrieval works correctly.
 * Run this function to test before deploying as a Web App.
 */
function testApiEndpoint() {
  // Simulate a request for equipment data
  Logger.log("Testing Equipment API...");
  var equipmentResult = getSheetDataAsObjects("Equipment");
  Logger.log("Equipment records found: " + (equipmentResult.length || 0));
  Logger.log("Sample: " + JSON.stringify(equipmentResult[0] || "No data"));

  // Simulate a request for students data
  Logger.log("\nTesting Students API...");
  var studentsResult = getSheetDataAsObjects("Students");
  Logger.log("Student records found: " + (studentsResult.length || 0));

  // Simulate a search
  Logger.log("\nTesting Search API (query: 'Arduino')...");
  var searchResult = searchEquipment("Arduino");
  Logger.log("Search results: " + JSON.stringify(searchResult));

  // Test system status
  Logger.log("\nTesting System Status...");
  var statusResult = getSystemStatus();
  Logger.log("Status: " + JSON.stringify(statusResult));
}


// ============================================================================
// SECTION 13: CUSTOM MENU (Optional)
// ============================================================================
// Adds a custom menu to the Google Sheets UI for easy access to functions.
// This runs automatically when the spreadsheet is opened.

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu("🔬 Lab Equipment Tracker")
    .addItem("🔄 Refresh Barcodes", "generateBarcodesForEquipment_Wrapper")
    .addItem("📊 View System Status", "showSystemStatus")
    .addItem("📋 API Key Instructions", "showApiKeyInstructions")
    .addSeparator()
    .addItem("🧪 Test API Endpoint", "testApiEndpoint")
    .addToUi();
}

/**
 * Wrapper to regenerate barcodes for the active spreadsheet.
 * Used by the custom menu.
 */
function generateBarcodesForEquipment_Wrapper() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  generateBarcodesForEquipment(spreadsheet);
  SpreadsheetApp.getUi().alert("✅ Barcodes regenerated successfully!");
}

/**
 * Shows system status in a dialog box.
 * Used by the custom menu.
 */
function showSystemStatus() {
  var status = getSystemStatus();
  var summary = status.summary;

  var message = "📊 LAB EQUIPMENT SYSTEM STATUS\n\n" +
    "Total Equipment: " + summary.total_equipment + "\n" +
    "Available: " + summary.available + "\n" +
    "In Use: " + summary.in_use + "\n" +
    "Under Repair: " + summary.under_repair + "\n\n" +
    "Total Students: " + summary.total_students + "\n" +
    "Active Transactions: " + summary.active_transactions + "\n" +
    "Damage Reports: " + summary.total_damage_reports + "\n" +
    "Pending Bookings: " + summary.pending_bookings;

  SpreadsheetApp.getUi().alert(message);
}

/**
 * Shows API key instructions in a dialog box.
 * Used by the custom menu.
 */
function showApiKeyInstructions() {
  var instructions = getApiKeyInstructions();
  var htmlOutput = HtmlService.createHtmlOutput(
    "<pre style='font-family: monospace; font-size: 12px; white-space: pre-wrap;'>" +
    instructions +
    "</pre>"
  )
  .setWidth(700)
  .setHeight(500);

  SpreadsheetApp.getUi().showModalDialog(htmlOutput, "Google Sheets API Key Instructions");
}
