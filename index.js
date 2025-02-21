#!/usr/bin/env node


import fs from "fs";
import path from "path";
import { Command } from "commander";
import chalk from "chalk";
import figlet from "figlet";
import { fileURLToPath } from "url";
import axios from "axios";
import winston from "winston";
import debug from "debug";
import { exec } from "child_process";

console.log(chalk.cyan(figlet.textSync("My CLI Tool")));



const log = debug("cli:app");
log("This is a debug message.");



// Configure Winston Logger
const logger = winston.createLogger({
  level: "info", // Logging level (info, warn, error, etc.)
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "cli.log" }) // Logs saved to cli.log
  ]
});




const program = new Command();

// Resolve __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base directory for categorized files
const BASE_DIR = path.join(__dirname, "files");

// Function to detect category based on file extension
const detectCategory = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  if ([".txt", ".md"].includes(ext)) return "texts";
  if ([".json", ".csv"].includes(ext)) return "data";
  if ([".log"].includes(ext)) return "logs";
  return "misc"; // Default folder for unknown types
};

// Ensure category folder exists
const ensureFolderExists = (folder) => {
  const folderPath = path.join(BASE_DIR, folder);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
};

// Command: Write to a File (Auto-Categorized)
program
  .command("write <filename> <content>")
  .description("Write content to a file (auto-detect category)")
  .action((filename, content) => {
    const category = detectCategory(filename);
    ensureFolderExists(category);

    const filePath = path.join(BASE_DIR, category, filename);
    fs.writeFileSync(filePath, content, "utf-8");
    logger.info(chalk.green(`File '${filename}' written successfully in '${category}/'!`));
  });

// Command: Read a File (Auto-Detect Category)
program
  .command("read <filename>")
  .description("Read content from a file (auto-detect category)")
  .action((filename) => {
    const category = detectCategory(filename);
    const filePath = path.join(BASE_DIR, category, filename);

    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      logger.info(chalk.yellow(`File Content of '${filename}':\n`), content);
    } else {
      logger.info(chalk.red(`Error: File '${filename}' does not exist in '${category}/'.`));
    }
  });

// Command: Delete a File (Auto-Detects Category)
program
  .command("delete <filename>")
  .description("Delete a file (auto-detect category)")
  .action((filename) => {
    const category = detectCategory(filename);
    const filePath = path.join(BASE_DIR, category, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.info(chalk.green(` File '${filename}' deleted from '${category}/'!`));
    } else {
      logger.info(chalk.red(`Error: File '${filename}' does not exist in '${category}/'.`));
    }
  });

// Command: Fetch Data from an API
program
  .command("fetch <url>")
  .description("Fetch data from a given API URL")
  .action(async (url) => {
    try {
      logger.info(chalk.blue("Fetching data..."));
      const response = await axios.get(url);
      logger.info(chalk.green("Response Data:\n"), response.data);
    } catch (error) {
      logger.info(chalk.red("Error fetching data:"), error.message);
    }
  });

// Command: Get Random User Data from API
program
  .command("random-user")
  .description("Fetch a random user from the Random User API")
  .action(async () => {
    try {
      logger.info(chalk.blue("Fetching random user data..."));
      const response = await axios.get("https://randomuser.me/api/");
      const user = response.data.results[0];
      logger.info(
        chalk.green(`User: ${user.name.first} ${user.name.last} | Email: ${user.email}`)
      );
    } catch (error) {
      logger.info(chalk.red("Error fetching user data:"), error.message);
    }
  });

  program
  .command("exec <cmd>")
  .description("Execute a shell command")
  .action((cmd) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        logger.error(`Error: ${error.message}`);
        return;
      }
      if (stderr) {
        logger.warn(`Stderr: ${stderr}`);
        return;
      }
      logger.info(`Output:\n${stdout}`);
    });
  });


// Parse CLI Arguments
program.parse(process.argv);
