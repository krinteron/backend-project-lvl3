import axios from 'axios';
import path from 'path';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import ora from 'ora';

const getFilePath = (url, dir = '', end = '') => {
  if (dir && !fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  const renameUrl = `${url.hostname.replace(/[^a-zA-Z0-9]/g, '-')}${url.pathname.replace(/[^a-zA-Z0-9.]/g, '-')}`
    .replace(/(\W$)/, '');
  return path.join(dir, `${renameUrl}${end}`);
};

const saveFile = async (listFile) => {
  await Promise.all(Object.keys(listFile).map((pathFile) => (
    axios({
      method: 'get',
      url: listFile[pathFile],
      responseType: 'stream',
    })
      .then((response) => {
        response.data.pipe(fs.createWriteStream(pathFile));
        const spinner = ora('').start();
        spinner.text = listFile[pathFile];
        return spinner;
      })
      .then((spinner) => spinner.succeed())
  )));
};

export default (url, dir) => {
  const exts = ['.png', '.jpg'];
  const urlName = new URL(url);
  const sitePath = getFilePath(urlName, dir, '.html');
  const filesPath = getFilePath(urlName, '', '_files');
  const listFile = {};
  return axios.get(url)
    .then((response) => response.data)
    .then((response) => {
      const data = cheerio.load(response);
      data('img').each((i, link) => {
        const { src } = link.attribs;
        if (!exts.includes(path.extname(src))) return link;
        const imageUrl = src.startsWith('http') ? new URL(src) : new URL(src, urlName.origin);
        const imagePath = getFilePath(imageUrl, filesPath);
        listFile[imagePath] = imageUrl.href;
        link.attribs.src = imagePath;
        return (i, link);
      });
      saveFile(listFile);
      return data.html();
    })
    .then((response) => {
      fs.promises.writeFile(sitePath, response, 'utf-8');
      console.log(sitePath);
      return sitePath;
    });
};
