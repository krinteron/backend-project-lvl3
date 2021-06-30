#!/usr/bin/env node

import * as fs from 'fs';
import { readFile } from 'fs/promises';
import * as path from 'path';
import os from 'os';
import nock from 'nock';
import pageLoad from '../src/index.js';

const link = 'https://www.chipdip.ru';
let filePath;

beforeAll(async () => {
  const html = await readFile('./__tests__/__fixtures__/raw_www-chipdip-ru.html', 'utf-8');
  nock('https://www.chipdip.ru', { allowUnmocked: true })
    .persist()
    .get('/')
    .reply(200, html);
});

beforeEach(async () => {
  filePath = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
});

test('the file names are the same', async () => {
  const result = await pageLoad(link, filePath);
  const actual = path.basename(result);
  const expected = 'www-chipdip-ru.html';
  expect(actual).toBe(expected);
});

test('files are equal', async () => {
  const result = await pageLoad(link, filePath);
  const actual = await readFile(result, 'utf-8');
  const expected = await readFile('./__tests__/__fixtures__/www-chipdip-ru.html', 'utf-8');
  expect(actual).toEqual(expected);
});

test('files have been downloaded', async () => {
  const dirIsEmpty = async (dir) => fs.promises.readdir(dir).then((files) => files.length === 0);
  expect(await dirIsEmpty(filePath)).toBe(true);
  await pageLoad(link, filePath);
  expect(await dirIsEmpty(filePath)).toBe(false);
});
