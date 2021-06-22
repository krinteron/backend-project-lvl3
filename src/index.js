import axios from 'axios';
import path from 'path';
import * as fs from 'fs/promises';

const getFilePath = (url, dir) => {
  const urlName = new URL(url);
  return path.resolve(dir, `${urlName.hostname}${urlName.pathname}`
    .replace(/[^a-zA-Z0-9]/g, '-').replace(/(\W$)/, '').concat('.html'));
};

export default (url, dir) => {
  const filePath = getFilePath(url, dir);
  return axios.get(url)
    .then((response) => fs.writeFile(filePath, response.data, 'utf-8'),
      (error) => console.log(error.response.status))
    .then(() => {
      console.log(filePath);
      return filePath;
    });
};
