#!/usr/bin/env node
import 'dotenv/config';
import { Command } from 'commander';
import { scrap } from './scrapper';

export type CLIOptions = {
  nameId: string;
};

const program = new Command();

program
  .version('0.1.0')
  .description('Scrap User Generated Content')
  .requiredOption('-n, --name-id <nameId>', 'Name of the project')
  .parse();

const options = program.opts<CLIOptions>();

scrap(options.nameId);
