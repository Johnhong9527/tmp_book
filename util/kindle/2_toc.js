// 编号
const fileName = require('./util/num');
/**
 * 制作`toc.html`目录
 * @param {Object} params 章节数据集合
 * @param {String} params[0].name 章节名
 * @param {String} params[0].link 章节所在链接
 * @return {String} 返回`toc.html`数据结构
 */
module.exports = function(params) {
  function li(params) {
    let li = '';
    for (let i = 0; i < params.length; i++) {
      li += `<li><a href="text/${fileName(i + 1)}.html#id${i + 1}">${
        params[i].text
      }}</a></li>`;
    }
    return li;
  }
  return `<!DOCTYPE html>
  <html xmlns="http://www.w3.org/1999/xhtml" lang="zh" xml:lang="zh">
  
  <head>
    <meta http-equiv="content-type" content="text/html; charset=utf-8">
    <title>TOC</title>
    
  </head>
  
  <body>
    <h1 id="toc">目录</h1>
    <ul>
      <li><a href="./intro.html#intro">简介</a></li>
      ${li(params)}
    </ul>
  </body>
  
  </html>`;
};
