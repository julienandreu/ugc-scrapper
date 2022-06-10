#!/usr/bin/env node
import { Command } from 'commander';

export type CLIOptions = {
  name: string;
};

const program = new Command();

program
  .version('0.1.0')
  .description('Scrap User Generated Content')
  .requiredOption('-n, --name <name>', 'Name of the project')
  .parse();

const options = program.opts<CLIOptions>();

console.log(`Scrapping UGC for ${options.name}`);
