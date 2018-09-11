// 网络请求模块
let originRequest = require('request');
const cheerio = require('cheerio');
const iconv = require('iconv-lite');
const fs = require('fs');

let headers = {
  // 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,images/webp,images/apng,*/*;q=0.8',
  // 'Accept-Encoding': 'gzip, deflate, br',
  // 'Accept-Language': 'zh-CN,zh;q=0.9',
  // 'Cache-Control': 'max-age=0',
  // 'Connection': 'keep-alive',
  // 'Cookie': 'M_distinctid=162531f23f473-0ad39a30d650f5-3b7c015b-1fa400-162531f23f5b95; cids_AC2=73088; cids_AC3=31747; CNZZDATA1259606950=482206451-1521811991-%7C1523949373',
  // 'DNT': 1,
  // 'Host': 'www.boquge.com',
  // 'Upgrade-Insecure-Requests': 1,
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36',
};
module.exports = function(url) {
  return new Promise((resolve, reject) => {
    let options = {
      // url: `https://api.honghaitao.net/cros?url=${url}`,
      // url: `http://127.0.0.1:3000/cros?url=${url}`,
      url: url,
      // url: 'https://api.honghaitao.net/cros2/?url=' + url,
      encoding: null,
      //代理服务器
      //proxy: 'http://xxx.xxx.xxx.xxx:8888',
      headers: headers,
    };
    originRequest(options, function(err, res, body) {
      if (err) {
        reject(err);
      } else {
        //进行解码
        // let json = JSON.stringify(body);
        // let bufferOriginal = new Buffer(JSON.parse(json).data);
        setTimeout(() => {
          /* let bus = iconv.decode(body, 'gb2312');
          let $ = cheerio.load(bus.toString('gbk'), {
            decodeEntities: false,
          });
          resolve($); */

          let html = iconv.decode(body, 'gb2312');
          let $ = cheerio.load(html, {
            decodeEntities: false,
          });
          // console.log(html);
          resolve($);
        }, 100);
      }
    });
  });
};
