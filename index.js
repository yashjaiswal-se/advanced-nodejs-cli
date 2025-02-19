#!/usr/bin/env node
import { Command } from "commander";

import chalk from "chalk";

import figlet from "figlet";

const program = new Command();


console.log(chalk.cyan(figlet.textSync("My CLI Tool")));


program
  .name("mycli")
  .version("1.0.0")
  .description("An advanced Node.js CLI tool");

  program
  .command("greet <name>")
  .description("Greet a user")
  .option("-u, --uppercase", "Print in uppercase")
  .action((name, options) => {
    let message = `Hello, ${name}! Welcome to the CLI tool.`;
    if (options.uppercase) message = message.toUpperCase();
    console.log(message);
  });

  // Handle unknown commands
program
  .hook("preAction", (thisCommand, actionCommand) => {
    if (!actionCommand.args.length) {
      console.error("\nError: No command provided.\n");
      program.outputHelp(); // Show help menu
      process.exit(1);
    }
  });

program.on("command:*", () => {
  console.error("\n Error: Unknown command '%s'.", program.args.join(" "));
  program.outputHelp(); // Show help menu
  process.exit(1);
});

program.parse(process.argv);
