const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const rimraf = require('rimraf');
const cherio = require('cherio');
const request = require('request-promise');
const jsonFormat = require('json-format');
const {baseDir} = require('../config');
const {exec} = require('child_process');
const districtFile = path.join(baseDir, 'district', 'district.json');

async function commander(cmd) {
  console.log('执行的命令: ', cmd);
  return new Promise(resolve => {
    exec(cmd, (error, stdout, stderr) => {
      console.log('stdout =>', stdout);
      console.error('stderr =>', stderr);
      console.error('error =>', error);
      resolve(stderr || stdout);
    });
  });
};

async function main() {
  rimraf.sync(districtFile);
  const result = await request('http://www.mca.gov.cn/article/sj/xzqh/2019/201901-06/201905271445.html');
  const $ = cherio.load(result);
  const tr = $('table tr');

  const json = {};
  for (let i = 0; i < tr.length; i++) {
    const e = tr.eq(i);
    const code = _.toInteger($(e).find('td').eq(1).text().trim());
    const name = _.toString($(e).find('td').eq(2).text()).trim();
    if (code <= 0 || _.isEmpty(name)) {
      continue;
    }
    Object.assign(json, {[code]: name});
  }
  fs.writeFileSync(districtFile, jsonFormat(json));
  await commander(`cd ${baseDir} && git add . && git commit -m 更新全国行政区域编码 && git push --no-verify`);
  console.log('全国行政区域编码更新完毕');
}

main();
