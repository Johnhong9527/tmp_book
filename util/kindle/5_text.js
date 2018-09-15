// 编号
const fileName = require('../num');
/**
 * 制作`*.html`章节内容
 * @param {Number} params.index 章节索引
 * @param {Number} params.len 总章节数
 * @param {String} params.title 章节标题
 * @param {String} params.txtContent 章节内容
 * @return {String} 返回`*.html`数据结构
 */
module.exports = function(params) {
  return `
  <html  xmlns="http://www.w3.org/1999/xhtml" lang="zh" xml:lang="zh">
  <meta http-equiv="content-type" content="text/html; charset=utf-8">
  <body>
    <h3 id="id${fileName(params.index + 1, params.len)}">${params.title}</h3>
    <p>
      ${params.txtContent}
    </p>
  </body>
  
  </html>`;
};
