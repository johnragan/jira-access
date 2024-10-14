import fs from "fs"; // Use the regular fs module for createReadStream
import { promises as fsPromises } from "fs"; // For fsPromises functions like writeFile
import csv from "csv-parser";
import { parse } from "json2csv";
import winston from "winston";
import path from "path";
import process from "process";
import { fileURLToPath } from "url";
import { sortItems } from "./sortingUtils.js";

// Get the current file URL and convert it to a path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure the logs directory exists
const logDirectory = path.join(__dirname, "logs");
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory);
}

// Initialize Winston Logger
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: path.join(logDirectory, "error.log"),
      level: "error",
    }),
    new winston.transports.File({
      filename: path.join(logDirectory, "combined.log"),
    }),
  ],
});

const statusOrder = [
  "Done",
  "Passed UAT",
  "IN LIVE - NEEDS TESTING",
  "Live - Rework",
  "Live Build Deploy Ready",
  "In UAT",
  "Deployed to UAT",
  "UAT Deploy Ready",
  "UAT - REWORK",
  "QA In Testing",
  "Deployed to QA",
  "Happy Path Tested QA Ready",
  "Needs Happy Path Testing",
  "Ready for Code Review",
  "REWORK FROM TESTING",
  "In Development",
  "Blocked",
  "Blocked - External",
  "Ready",
  "To Do",
];

const priorityOrder = ["Highest", "High", "Medium", "Low", "Lowest"];

// Utility function to parse the DueDate, handling empty dates as future dates
function parseDate(dateStr) {
  if (!dateStr) return Infinity; // Treat empty DueDate as far in the future
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? Infinity : date; // Invalid dates are treated as future
}

// Function to read the CSV file as a stream and return the rows
async function readCSV(inputFile) {
  const rows = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream(inputFile) // fs.createReadStream works with the regular fs module
      .pipe(csv())
      .on("data", (row) => {
        if (Object.keys(row).length > 0) {
          // Ensure non-empty rows are pushed
          rows.push(row);
        }
      })
      .on("end", () => {
        if (rows.length === 0) {
          reject(new Error("The CSV file contains no data."));
        } else if (Object.keys(rows[0]).length === 0) {
          reject(
            new Error("The CSV file contains only headers and no content.")
          );
        } else {
          resolve(rows);
        }
      })
      .on("error", (error) => {
        reject(new Error(`Error reading the CSV file: ${error.message}`));
      });
  });
}

// Function to sort tickets by Status, Priority, and DueDate
function sortTickets(tickets) {
  // Define the criteria for sorting tickets
  const sortingCriteria = [
    { field: "Status", order: "custom", customOrder: statusOrder },
    { field: "Priority", order: "custom", customOrder: priorityOrder },
    { field: "ParsedDueDate", order: "asc" }, // Sort by parsed due date in ascending order
  ];

  return sortItems(tickets, sortingCriteria);
}

// Another part of the code that needs a different sorting
function sortByDueDateThenPriority(tickets) {
  const sortingCriteria = [
    { field: "ParsedDueDate", order: "asc" },
    { field: "Priority", order: "custom", customOrder: priorityOrder },
  ];

  return sortItems(tickets, sortingCriteria);
}

// Helper function to compare based on custom order
function compareOrder(a, b, order) {
  const indexA = order.indexOf(a) >= 0 ? order.indexOf(a) : order.length;
  const indexB = order.indexOf(b) >= 0 ? order.indexOf(b) : order.length;
  return indexA - indexB;
}

// Function to validate the required fields in the CSV data and check for valid statuses and priorities
function validateFields(rows) {
  const requiredFields = ["Priority", "Status"];
  const missingFields = requiredFields.filter((field) => !(field in rows[0]));
  if (missingFields.length) {
    throw new Error(
      `Missing required columns in CSV: ${missingFields.join(", ")}`
    );
  }

  const validStatuses = [
    "Done",
    "Passed UAT",
    "IN LIVE - NEEDS TESTING",
    "Live - Rework",
    "Live Build Deploy Ready",
    "In UAT",
    "Deployed to UAT",
    "UAT Deploy Ready",
    "UAT - REWORK",
    "QA In Testing",
    "Deployed to QA",
    "Happy Path Tested QA Ready",
    "Needs Happy Path Testing",
    "Ready for Code Review",
    "REWORK FROM TESTING",
    "In Development",
    "Blocked",
    "Blocked - External",
    "Ready",
    "To Do",
    "",
  ];

  const validPriorities = ["Highest", "High", "Medium", "Low", "Lowest", ""];

  rows.forEach((row) => {
    if (!validStatuses.includes(row.Status)) {
      logger.warn(`Invalid Status found: ${row.Status}`);
    }
    if (!validPriorities.includes(row.Priority)) {
      logger.warn(`Invalid Priority found: ${row.Priority}`);
    }
  });
}

// Function to process CSV and write sorted output
async function processCSV(inputFile, outputFile) {
  try {
    logger.info("Reading CSV file...");
    const rows = await readCSV(inputFile);

    // Validate that required columns exist and that statuses and priorities are valid
    validateFields(rows);

    const fields = Object.keys(rows[0] || {});
    if (!fields.length)
      throw new Error("The CSV file does not contain any columns.");

    rows.forEach((row) => {
      row.ParsedDueDate = parseDate(row.DueDate); // Set a default value for the new column, or calculate it dynamically
    });

    // Sort tickets using the generalized sorting function
    logger.info("Sorting tickets...");
    const sortedTickets = sortTickets(rows);

    // Separate and process 'Done' or 'Passed UAT' tickets
    const donePassedTickets = [];
    const importantTickets = [];
    const remainingTickets = [];

    for (const row of sortedTickets) {
      if (["Done", "Passed UAT"].includes(row.Status)) {
        donePassedTickets.push({ ...row, Flagged: "" });
      } else if (row.Flagged === "Impediment") {
        importantTickets.push(row);
      } else {
        remainingTickets.push(row);
      }
    }

    const importantTickets2 = sortByDueDateThenPriority(importantTickets);
    console.log(importantTickets2);

    // Combine the final ticket list
    const finalTickets = [
      ...donePassedTickets,
      ...importantTickets2,
      ...remainingTickets,
    ];

    // Convert sorted data back to CSV
    const csvOutput = parse(finalTickets, { fields });

    // Write the sorted CSV file
    await fsPromises.writeFile(outputFile, csvOutput);
    logger.info(`CSV file successfully processed and saved as ${outputFile}`);
  } catch (error) {
    logger.error(`Error processing CSV: ${error.message}`);
  }
}

// Function to display usage instructions
function displayHelp() {
  logger.info(`
  Usage: node yourScript.js <inputFile> <outputFile>

  Environment Variables:
    INPUT_FILE   Path to the input CSV file (default: 'Jira.csv')
    OUTPUT_FILE  Path to the output CSV file (default: 'Sorted_Jira_Output.csv')

  Example:
    INPUT_FILE=myInput.csv OUTPUT_FILE=myOutput.csv node yourScript.js
  `);
}

// Handle graceful exit (e.g., Ctrl+C)
process.on("SIGINT", () => {
  logger.info("Process interrupted. Exiting gracefully...");
  process.exit(0);
});

// Check if the required arguments or environment variables are provided
const inputFile = process.env.INPUT_FILE || process.argv[2] || "Jira.csv";
const outputFile =
  process.env.OUTPUT_FILE || process.argv[3] || "Sorted_Jira_Output.csv";

// Display help if no file arguments are passed
if (!inputFile || !outputFile) {
  logger.error("Error: Missing input or output file arguments.");
  displayHelp();
  process.exit(1);
}

// Run the script
processCSV(inputFile, outputFile);

export { parseDate, sortTickets, processCSV, readCSV };
