#!/usr/bin/env node
import 'dotenv/config';
import { Command } from 'commander';
import { scrap } from './scrapper';
import { AxiosError } from 'axios';

export type CLIOptions = {
  nameId: string;
  projectId: string;
  environmentId: string;
};

process.on('unhandledRejection', (error: unknown) => {
  if (error instanceof AxiosError) {
    if (!error.response) {
      process.exit(1);
    }

    const { status, statusText, data } = error.response;
    console.error(`Axios error`, {
      request: {
        headers: error?.request?._headers,
        method: error?.request?.method,
        url: error?.request?.res?.responseUrl,
      },
      response: {
        status,
        statusText,
        data,
      },
    });
    process.exit(1);
  }

  console.error('unhandledRejection', error);
  process.exit(1);
});

const program = new Command();

program
  .version('0.1.0')
  .description('Scrap User Generated Content')
  .requiredOption('-n, --name-id <nameId>', 'Name of the project')
  .requiredOption('-p, --project-id <projectId>', 'Project ID')
  .requiredOption('-e, --environment-id <environmentId>', 'Environment ID')
  .parse();

const options = program.opts<CLIOptions>();

scrap(options.nameId, options.projectId, options.environmentId);
