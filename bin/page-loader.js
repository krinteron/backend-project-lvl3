#!/usr/bin/env node

import { Command } from 'commander';
import process from 'process';
import pageLoad from '../src/index.js';

const program = new Command();
program
  .description('Page loader utility')
  .version('0.0.1')
  .helpOption('-h, --help', 'display help for command')
  .arguments('<url>')
  .option('-o, --output  [dir]', 'output dir (default: "/home/user/current-dir")')
  .action((url) => {
    console.log(pageLoad(url, program.opts().output));
  })
  .parse(process.argv);
