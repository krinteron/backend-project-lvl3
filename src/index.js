import axios from 'axios';
import path from 'path';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import ora from 'ora';

const getFilePath = (url, dir = '', end = '') => {
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

export default (site, dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  const exts = ['.png', '.jpg'];
  const urlSite = new URL(site);
  const htmlPath = getFilePath(urlSite, dir, '.html');
  const folderSrc = getFilePath(urlSite, '', '_files');
  const filesPath = getFilePath(urlSite, dir, '_files');
  if (!fs.existsSync(filesPath)) {
    fs.mkdirSync(filesPath);
  }
  const listFile = {};
  return axios.get(site)
    .then((response) => response.data)
    .then((response) => {
      const data = cheerio.load(response);
      data('img').each((i, link) => {
        const { src } = link.attribs;
        if (!exts.includes(path.extname(src))) return link;
        const fileUrl = src.startsWith('http') ? new URL(src) : new URL(src, urlSite.origin);
        const fileSrc = getFilePath(fileUrl, folderSrc);
        const filePath = getFilePath(fileUrl, filesPath);
        listFile[filePath] = fileUrl.href;
        link.attribs.src = fileSrc;
        return (i, link);
      });
      saveFile(listFile);
      return data.html();
    })
    .then((response) => {
      fs.promises.writeFile(htmlPath, response, 'utf-8');
      return htmlPath;
    });
};
