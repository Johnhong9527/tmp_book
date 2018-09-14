module.exports = function (params) {
  return `<!DOCTYPE html>
  <html xmlns="http://www.w3.org/1999/xhtml" lang="zh" xml:lang="zh">
  
  <head>
    <meta http-equiv="content-type" content="text/html; charset=utf-8">
    <title>简介</title>
  </head>
  
  <body>
    <h1 id="intro">简介</h1>
    <p>${params.book_intro}</p>
    <div style="text-align: right;vertical-align: bottom">
      作者: ${params.book_author}
    </div>
  </body>
  
  </html>`
}