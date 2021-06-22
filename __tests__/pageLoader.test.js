#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import os from 'os';
import pageLoad from '../src/index.js';
import { readFile } from 'fs/promises';

//const fileName = 'ottisk-com-delivery-payment.html';
let filePath;
beforeEach(async () => {
  filePath = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
});

test('the file names are the same', async () => {
  const result = await pageLoad('https://ottisk.com/delivery-payment/', filePath);
  const actual = await readFile(result, 'utf-8');
  const expected = await readFile('./__tests__/__fixtures__/ottisk-com-delivery-payment.html', 'utf-8');
  expect(actual).toEqual(expected);
});