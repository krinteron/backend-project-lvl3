#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import process from 'process';
import os from 'os';
import pageLoad from '../src/index.js';
import { readFile } from 'fs/promises';

const fileName = 'ottisk-com-delivery-payment.html';
const loadPath = path.resolve(process.cwd(), './__tests__/__fixtures__/load', fileName);
let filePath;

console.log(process.cwd);

beforeEach(async () => {
  filePath = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
});

test('the file names are the same', async () => {
  const actual = await pageLoad('https://ottisk.com/delivery-payment/', filePath);
  const result = await readFile(actual, 'utf-8');
  const expected = await readFile('./__tests__/load/ottisk-com-delivery-payment.html', 'utf-8');
  expect(result).toEqual(expected);
});