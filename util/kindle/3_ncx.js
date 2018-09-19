/**
 * 制作`toc.ncx`目录索引
 * @param {Object} params 章节数据集合
 * @param {String} params[0].name 章节名
 * @param {String} params[0].link 章节所在链接
 * @return {String} 返回`toc.ncx`数据结构
 */
module.exports = function (name, params) {
  function navPoint(params) {
    let navPoint = '';
    for (let i = 0; i < params.length; i++) {
      navPoint += `      <navPoint id="navpoint-${i + 3}" playOrder="${i + 3}">
      <navLabel>
        <text>${params[i].name}</text>
      </navLabel>
      <content src="text/${i + 1}.html#id${i + 1}" />
    </navPoint>`;
    }
    return navPoint;
  }

  return `<?xml version="1.0"?>
  <!DOCTYPE ncx PUBLIC "-//NISO//DTD ncx 2005-1//EN"
      "http://www.daisy.org/z3986/2005/ncx-2005-1.dtd">
  <ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  
    <head>
      <meta http-equiv="content-type" content="text/html; charset=utf-8">
    </head>
    <docTitle>
      <text>${name}</text>
    </docTitle>
    <navMap>
      <navPoint id="navpoint-1" playOrder="1">
        <navLabel>
          <text>内容</text>
        </navLabel>
        <content src="toc.html#toc" />
      </navPoint>
      <navPoint id="navpoint-2" playOrder="2">
        <navLabel>
          <text>简介</text>
        </navLabel>
        <content src="intro.html#intro" />
      </navPoint>
${navPoint(params)}      
    </navMap>
  </ncx>`;
};
