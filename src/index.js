import axios from 'axios';
import path from 'path';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import Listr from 'listr';
import debug from 'debug';
import axiosDebug from 'axios-debug-log';

const logger = debug('page-loader:');

axiosDebug({
  request(debugAxios, config) {
    debugAxios(`Request with ${config.headers.common.Accept} on ${config.url}`);
  },
  response(debugAxios, response) {
    debugAxios(
      `Response with ${response.headers['content-type']}`,
      `from ${response.config.url}`,
    );
  },
});

const rename = (source) => {
  const { pathname, host } = new URL(source);
  const fileName = `${host}${pathname}`
    .split(/[^\w+]/gi)
    .filter((el) => el)
    .join('-');
  return fileName;
};

const getFilePath = (url, folder = '', end = '') => {
  const { dir, name, ext } = path.parse(url);
  const fileName = rename(`${dir}/${name}${end ? ext : ''}`);
  return path.join(folder, `${fileName}${end || ext || '.html'}`);
};

const getWebData = (rawHtml, url, folderSrc) => {
  const resources = [];
  const data = cheerio.load(rawHtml, {
    normalizeWhitespace: true,
    decodeEntities: false,
  });
  const mapping = {
    link: 'href',
    img: 'src',
    script: 'src',
  };

  Object.entries(mapping)
    .forEach(([tagName, attribName]) => {
      const elements = data(tagName).toArray();
      elements
        .map(({ attribs }, index) => ({ link: attribs[attribName], index }))
        // remove empty links
        .filter(({ link }) => link)
        // make absolute path
        .map(({ link, index }) => {
          const { host, href } = new URL(link, url.origin);
          return { host, href, index };
        })
        // checking domain
        .filter(({ host }) => host === url.host)
        // make changes to html
        .forEach(({ href, index }) => {
          const fileSrc = getFilePath(href, folderSrc);
          resources.push({
            filename: fileSrc,
            link: href,
          });
          data(elements[index]).attr(attribName, fileSrc);
        });
    });
  return { html: data.html(), resources };
};

const downloadRes = (resources, dir) => (
  resources.forEach(async ({ filename, link }) => {
    const data = await axios({
      method: 'get',
      url: link,
      responseType: 'arraybuffer',
    });
    new Listr([{
      title: `Downloading ${link}`,
      task: () => fs.writeFileSync(path.join(dir, filename), data.data, 'utf-8'),
    }], { concurrent: true }).run();
  })
);

export default (site, dir = process.cwd()) => {
  const urlSite = new URL(site);
  const htmlPath = getFilePath(site, dir, '.html');
  const folderSrc = getFilePath(site, '', '_files');
  const filesPath = getFilePath(site, dir, '_files');

  logger(`parse and modify html: ${site}`);
  return axios.get(site)
    .then((response) => response.data)
    .then((response) => {
      logger(`parse and modify html: ${site}`);
      return getWebData(response, urlSite, folderSrc);
    })
    .then((response) => {
      if (!fs.existsSync(filesPath)) {
        fs.mkdirSync(filesPath);
      }
      const { html, resources } = response;
      logger(`saving the finished html: ${htmlPath}`);
      fs.promises.writeFile(htmlPath, html, 'utf-8');
      return resources;
    })
    .then((resources) => {
      logger('preparing tasks for downloading media files');
      // const tasks = resources.map(({ filename, link }) => ({
      //   title: link,
      //   task: async () => {
      //     const filePath = path.join(dir, filename);
      //     axios({
      //       method: 'get',
      //       url: link,
      //       responseType: 'arraybuffer',
      //     })
      //       .then(({ data }) => {
      //         fs.promises.writeFile(filePath, data);
      //       })
      //       .then(() => logger(`file has been downloaded: ${filePath}`));
      //   },
      // }));
      // const listr = new Listr(tasks, { concurrent: true });
      // listr.run();
      downloadRes(resources, dir);
    })
    .then(() => {
      logger(`task completed: ${htmlPath}`);
      return htmlPath;
    })
    .catch((err) => {
      throw err;
    });
};
