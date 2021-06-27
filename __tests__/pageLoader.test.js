#!/usr/bin/env node

import * as fs from 'fs';
import { readFile } from 'fs/promises';
import * as path from 'path';
import os from 'os';
import pageLoad from '../src/index.js';

const link = 'https://paradiz.ru/informatsiya';
let filePath;
beforeEach(async () => {
  filePath = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
});

test('the file names are the same', async () => {
  const result = await pageLoad(link, filePath);
  const actual = path.basename(result);
  const expected = 'paradiz-ru-informatsiya.html';
  expect(actual).toBe(expected);
});

test('files are equal', async () => {
  const result = await pageLoad(link, filePath);
  const actual = await readFile(result, 'utf-8');
  const expected = await readFile('./__tests__/__fixtures__/paradiz-ru-informatsiya.html', 'utf-8');
  expect(actual).toEqual(expected);
});

test('files have been downloaded', async () => {
  const dirIsEmpty = async (dir) => fs.promises.readdir(dir).then((files) => files.length === 0);
  expect(await dirIsEmpty(filePath)).toBe(true);
  await pageLoad(link, filePath);
  expect(await dirIsEmpty(filePath)).toBe(false);
});
