const express = require('express');
const app = express();
// const request = require('request');
const fs = require('fs');
const path = require('path');
const shelljs = require('shelljs');

const ProgressBar = require('progress');

const request = require('./util/request');
const chapterData = require('./data/data');
// 所有书籍信息合集
const list = require('./data/list');
const bookList = require('./data/book');
// 站点查询不到的数据
const noBook = require('./data/noBook');
const noBookInfo = require('./data/noBookInfo');
// kindle
const cheerio = require('cheerio');
const kindle_opf = require('./util/kindle/1_opf');
const kindle_toc = require('./util/kindle/2_toc');
const kindle_ncx = require('./util/kindle/3_ncx');
const kindle_intro = require('./util/kindle/4_intro');
const kindle_text = require('./util/kindle/5_text');
// createImage
const createImage = require('./util/createImage');
/* createImage({
  book_name: '完美世界',
  author: '城东城东城东城东',
}); */
// 获取可爬书籍集合
const book1 = require('./data/book_1');
// 编号
const fileName = require('./util/num');
const QIDIAN = {
  url:
    'https://www.qidian.com/finish?action=hidden&orderId=&style=1&pageSize=20&siteid=1&pubflag=0&hiddenField=2&page=',
  max: 100,
  index: 1,
};
let BOOKLIST = [];

app.get('/', function(req, res, next) {
  res.send('<h4>hello world!</h4>');
});

app.get('/list', function(req, res, next) {
  let listInfo = [];
  let books = fs.readdirSync('../book');
  /*   ('scp -r honghaitao@35.189.174.148:/home/wwwroot/book/0001_1009398284/text /media/seam/7209c24a-77ce-4c9f-b505-ac351fcd2baf/tmp/book_back/0001_1009398284'); */
  const SHELLCOMMAND = 'scp -r honghaitao@35.189.174.148:';
  const SERVEPATH = `/home/wwwroot/book/`;
  const LOCALPATH = `/media/seam/7209c24a-77ce-4c9f-b505-ac351fcd2baf/tmp/book_dow/`;
  // for (let i = 0; i < books.length; i++) {
  for (let i = 0; i < 100; i++) {
    let bookC = fs.readFileSync(`./book/${books[i]}/list.js`).toString();
    bookC = JSON.parse(JSON.parse(bookC));
    listInfo.push({
      name: book1[i].book_name,
      index: i + 1,
      max: bookC.length - 1,
      dow: `${SHELLCOMMAND}${SERVEPATH}${books[i]} ${LOCALPATH}`,
    });
  }
  res.send(JSON.stringify(listInfo));
});
app.get('/renqi', function(req, res, next) {
  renqi();
  res.send('ok');
});

// 获取起点人气完本排行榜书籍数据
function renqi() {
  let timer = setImmediate(() => {
    if (QIDIAN.index === QIDIAN.max + 1) {
      clearImmediate(timer);
      fs.writeFile(
        './list.js',
        `module.exports =${JSON.stringify(BOOKLIST)}`,
        function(err) {
          if (err) {
            console.error(err);
          } else {
            console.log('./list.js写入成功');
          }
        },
      );
      return;
    }
    request(QIDIAN.url + QIDIAN.index).then((data) => {
      let list = data('.all-img-list li');
      for (let i = 0; i < list.length; i++) {
        let book_info = list.eq(i).children('.book-mid-info');
        BOOKLIST.push({
          book_img: list
            .eq(i)
            .children('.book-img-box')
            .children('a')
            .children('img')
            .attr('src'),
          book_name: book_info
            .children('h4')
            .children('a')
            .html(),
          book_author: book_info
            .children('.author')
            .children('a.name')
            .html(),
          book_intro: book_info.children('p.intro').html(),
        });
      }
      // console.log(BOOKLIST);
      QIDIAN.index++;
      renqi();
    });
  });
}

// 清除`book`中各个目录下`list.js`文件中`module.exports =`
function removeME() {
  let books = fs.readdirSync('../book');
  let len = books.length;
  for (let i = 0; i < len; i++) {
    let list = fs
      .readFileSync(`../book/${books[i]}/list.js`)
      .toString()
      .replace('module.exports =', '');
    fs.writeFileSync(`../book/${books[i]}/list.js`, JSON.stringify(list));
  }
}

// 去除 第一章前的混乱数据
function removeFirst(list) {
  /**
   * Regular Expresion IndexOf for Arrays
   * This little addition to the Array prototype will iterate over array
   * and return the index of the first element which matches the provided
   * regular expresion.
   * Note: This will not match on objects.
   * @param  {RegEx}   rx The regular expression to test with. E.g. /-ba/gim
   * @return {Numeric} -1 means not found
   */
  if (typeof Array.prototype.reIndexOf === 'undefined') {
    Array.prototype.reIndexOf = function(rx) {
      for (var i in this) {
        if (this[i].toString().match(rx)) {
          return i;
        }
      }
      return -1;
    };
  }
  // let rIndex = list.reIndexOf(/第[一|1]章/);
  let rIndex = null;
  for (let i = 0; i < list.length; i++) {
    // console.log(list[i].name.reIndexOf(/第[一|1]章/));
    if (list[i].name.match(/第[一|1]章/)) {
      rIndex = i;
      break;
    }
  }

  for (let i = rIndex - 1; i >= 0; i--) {
    list.splice(i, 1);
  }
  return;
}

// 获取部分查询不到的书籍信息
function getNotBookInfo() {
  let books = [];
  for (let i = 0; i < noBookJs.length; i++) {
    books.push(list[noBookJs[i]]);
  }
  fs.writeFile(
    './noBookInfo.js',

    `module.exports =${JSON.stringify(books)}`,
    function(err) {
      if (err) {
        console.error(err);
      } else {
        console.log('./noBookInfo.js写入成功');
        // return Promise.resolve();
      }
    },
  );
}

// 移动部分盗版网站查询不到书籍,这部分书籍,后期不做数据爬取
function removeBookInfo() {
  for (let i = 0; i < list.length; i++) {
    let bookId = list[i].book_img.split('/')[5];
    let bookIndex = i + 1;
    let bookPath = `./book/${fileName(bookIndex, list.length)}_${bookId}`;
    let isListJs = fs.existsSync(`${bookPath}/list_now.js`);
    if (!isListJs) {
      fs.renameSync(
        bookPath,

        `./noBook/${fileName(bookIndex, list.length)}_${bookId}`,
      );
    }
  }
}

// 批量删除数组中数据
// http://www.blogjava.net/Hafeyang/archive/2010/12/29/how_to_batch_remove_items_in_javascript_array.html
function getInfo() {
  function removeBatch(arr, toDeleteIndexes) {
    var result = [];
    for (var i = 0; i < arr.length; i++) {
      var o = arr[i];
      var needDelete = false;
      for (var j = 0; j < toDeleteIndexes.length; j++) {
        if (i == toDeleteIndexes[j]) {
          needDelete = true;
          break;
        }
      }
      if (!needDelete) {
        result.push(arr[i]);
      }
    }
    return result;
  }

  let b = removeBatch(list, noBook);
  stopCount();
  console.log(b.length);

  function stopCount() {
    fs.writeFileSync(
      `./util/book_1.js`,
      'module.exports =' + JSON.stringify(b),
    );
  }
}

// 创建对应书籍的目录
function createBookFile() {
  let i = 0;
  let len = bookNotImageInfo.length;
  // 没有封面的书籍
  let bookNotImage = [];
  time();

  function time() {
    let timer = setTimeout(() => {
      if (i === len) {
        if (bookNotImage.length > 0) {
          fs.writeFileSync(
            './data/bookNotImage.js',

            `module.exports =${JSON.stringify(bookNotImage)}`,
          );
          // createBookFile();
        }
        clearInterval(timer);
        return;
      }

      // 书籍ID
      const bookId = `${fileName(bookNotImageInfo[i] + 1, book1.length)}_${
        book1[bookNotImageInfo[i]].book_img.split('/')[5]
      }`;
      // 根路径
      const bookPath = `./book/${bookId}`;
      // 书籍信息
      const bookInfo = book1[bookNotImageInfo[i]];
      // 创建书籍目录
      /*  if (!fs.existsSync(bookPath)) {
    fs.mkdirSync(bookPath);
  } */
      // 创建书籍简介数据
      /*  if (!fs.existsSync(
`${bookPath}/bookInfo.js`
)) {
    fs.writeFileSync(

`${bookPath}/bookInfo.js`
,

`module.exports =${JSON.stringify(bookInfo)}`
,
    );
  } */
      /* if (!fs.existsSync(
`${bookPath}/images`
)) {
    fs.mkdirSync(
`${bookPath}/images`
);
  } */
      // 创建书籍封面
      if (!fs.existsSync(`${bookPath}/images/image.png`)) {
        console.log(bookNotImageInfo[i]);
        createImage({
          book_name: bookInfo.book_name,
          author: bookInfo.book_author,
          path: bookPath,
        });
        bookNotImage.push(bookNotImageInfo[i]);
      }
      /* if (fs.existsSync(
`${bookPath}/images/image.png`
)) {
      } */
      i++;
      time();
    }, 4000);
  }

  /* for (let i = 0; i < 3; i++) {

  } */
}

// 获取各个书籍目录,并存放到各个书籍的目录中
// getBookList();
// PC_url to M_url
function linkF(url) {
  let urlA = url.split('/');
  return;
  `/wapbook/${urlA[2]}_${urlA[3]}`;
}

function getBookList() {
  let i = 0;
  let len = book1.length;
  // let len = 3;
  // let noBook = [];
  get();

  function get() {
    let timer = setImmediate(() => {
      if (i === len) {
        // if (i === 36) {
        clearImmediate(timer);
        /* fs.writeFile(
          './noBook.js',

`module.exports =${JSON.stringify(noBook)}`
,
          function(err) {
            if (err) {
              console.error(err);
            } else {
              console.log('./noBook.js写入成功');
            }
          },
        ); */
        return;
      }
      // 编号__用于该书籍存放路径以及编号
      const bookId = book1[i].book_img.split('/')[5];
      const bookIndex = i + 1;
      const bookPath = `./book/${fileName(bookIndex, book1.length)}_${bookId}`;
      const bookName = book1[i].book_name;
      if (fs.existsSync(`${bookPath}/list.js`)) {
        i++;
        get();
        return;
      }
      request(
        `https://www.boquge.com/search.htm?keyword=${encodeURI(bookName)}`,
      )
        .then(($) => {
          if (!$) {
            i++;
            get();
            return;
          }
          let bookListUrl = $('#novel-list ul li')
            .eq(1)
            .children('div.col-xs-3')
            .children('a')
            .attr('href');
          if (bookListUrl === undefined) {
            noBook.push(i);
            i++;
            get();
            return;
          }
          return request(
            `
https://www.boquge.com/book/$
{
  bookListUrl.split('/')[2]
}
`,
          );
        })
        .then(($) => {
          let ddList = $('#chapters-list li');
          let ddArray = [];
          for (let i = 0; i < ddList.length; i++) {
            if (
              ddList.eq(i) &&
              ddList.eq(i).children('a') &&
              ddList
                .eq(i)
                .children('a')
                .html()
            ) {
              let link = ddList
                .eq(i)
                .children('a')
                .attr('href');
              ddArray.push({
                name: ddList
                  .eq(i)
                  .children('a')
                  .html(),
                link: `
https://m.boquge.com$
{
  linkF(link)
}
`,
              });
            }
          }
          return Promise.resolve(ddArray);
        })
        .then((data) => {
          fs.writeFile(
            `
$
{
  bookPath
}
/list.js
`,
            `
module.exports =$
{
  JSON.stringify(data)
}
`,
            function(err) {
              if (err) {
                console.error(err);
              } else {
                console.log(`
$
{
  bookPath
}
/list.js写入成功
`);
                i++;
                get();
                // return Promise.resolve();
              }
            },
          );
        })
        .catch((err) => {
          console.log(err);
        });

      /* axios
        .get(
          `https://sou.xanbhx.com/search?siteid=qula&q=${encodeURI(bookName)}`,
        )
        .then((data) => {
          let $ = cheerio.load(data.data, {
            decodeEntities: false,
          });
          return axios.get(
            $('.search-list ul li')
              .eq(1)
              .children('span.s2')
              .children('a')
              .attr('href'),
          );
        })
        .then((data) => {
          let $ = cheerio.load(data.data, {
            decodeEntities: false,
          });
          let ddList = $('#list dl dd');
          let ddArray = [];
          for (let i = 0; i < ddList.length; i++) {
            ddArray.push({
              name: ddList
                .eq(i)
                .children('a')
                .html(),
              link: `https://www.qu.la${ddList
                .eq(i)
                .children('a')
                .attr('href')}`,
            });
          }
          console.log(ddArray.length);
          return Promise.resolve(ddArray);
        })
        .then((data) => {
          let bookList = removeFirst(data);
          console.log(bookList.length);
          return;
          fs.writeFile(
            `${bookPath}/list_now.js`,
            `module.exports =${JSON.stringify(bookList)}`,
            function(err) {
              if (err) {
                console.error(err);
              } else {
                console.log(`${bookPath}/list_now.js写入成功`);
                return Promise.resolve();
              }
            },
          );
        })
        .then(() => {
          i++;
          get();
        })
        .catch((err) => {
          console.log(err);
        }); */
    });
  }
}

// 清理章节列表中,混乱的数据
function remove() {
  let books = fs.readdirSync('./book');
  let len = books.length;
  for (let i = 0; i < len; i++) {
    // 获取单个书籍的list_now.js
    let bookC = JSON.parse(
      fs
        .readFileSync(
          `
./book/$
{
  books[i]
}
/list_now.js
`,
        )
        .toString(),
    );
    for (let i in bookC) {
      if (bookC[i].name === null) {
        bookC.splice(i, 1);
      }
    }
    fs.writeFileSync(
      `
./book/$
{
  books[i]
}
/list_now.js
`,
      JSON.stringify(bookC),
    );
  }
  console.log('完毕');
}

// 设置 opf/toc/ncx

function setOpf() {
  let books = fs.readdirSync('../book');
  let len = books.length;
  // let len = 1;
  // console.log(len);
  // return;
  /*for (let i = 0; i < books.length; i++) {
    let bookPath = `../book/${books[i]}/`;
    console.log(i + 1);
    if (!fs.existsSync(`./book/${books[i]}/data.opf`)) {
      shelljs.exec(`cp ./data/data.opf ${bookPath}`).code
    }
  }
  return*/
  for (let i = 0; i < len; i++) {
    // console.log(book1[i].book_name);
    let bookC = fs.readFileSync(`./book/${books[i]}/list.js`).toString();
    bookC = JSON.parse(JSON.parse(bookC));
    console.log(`../book/${books[i]}/${books[i]}.opf`);
    if (!fs.existsSync(`../book/${books[i]}/${books[i]}.opf`)) {
      fs.writeFileSync(
        `../book/${books[i]}/${books[i]}.opf`,
        kindle_opf({
          name: book1[i].book_name,
          author: book1[i].book_author,
          len: bookC.length,
        }),
      );
      console.log(`../book/${books[i]}/${books[i]}.opf文件成功创建`);
    } else {
      console.log('该文件已创建');
    }
  }
}

// setToc()
function setToc() {
  let books = fs.readdirSync('../book');
  let len = books.length;
  // let len = 1;
  for (let i = 0; i < len; i++) {
    console.log(bookList[i].book_name);
    let bookC = fs.readFileSync(`./book/${books[i]}/list.js`).toString();
    bookC = JSON.parse(JSON.parse(bookC));
    console.log(`../book/${books[i]}/toc.html`);
    if (!fs.existsSync(`../book/${books[i]}/toc.html`)) {
      fs.writeFileSync(`../book/${books[i]}/toc.html`, kindle_toc(bookC));
      console.log(`../book/${books[i]}/toc.html文件成功创建`);
    } else {
      console.log('该文件已创建');
    }
  }
}

// setNcx()
function setNcx() {
  let books = fs.readdirSync('../book');
  let len = books.length;
  // let len = 1;
  for (let i = 0; i < len; i++) {
    // console.log(bookList[i].book_name);
    let bookC = fs.readFileSync(`./book/${books[i]}/list.js`).toString();
    bookC = JSON.parse(JSON.parse(bookC));
    // console.log(`../book/${books[i]}/toc.ncx`);
    if (!fs.existsSync(`../book/${books[i]}/toc.ncx`)) {
      fs.writeFileSync(
        `../book/${books[i]}/toc.ncx`,
        kindle_ncx(book1[i].book_name, bookC),
      );
      console.log(`../book/${books[i]}/toc.ncx文件成功创建`);
    } else {
      console.log('该文件已创建');
    }
  }
}

// setIntro()
function setIntro() {
  let books = fs.readdirSync('../book');
  let len = book1.length;
  // let len = 1;
  for (let i = 0; i < len; i++) {
    // 编号__用于该书籍存放路径以及编号
    const bookPath = `../book/${books[i]}`;
    // 根据路径检测文件是否存在
    if (!fs.existsSync(bookPath)) {
      fs.mkdirSync(bookPath);
    } else {
      console.log('该文件已创建');
    }
    // 创建intro
    let introPath = `${bookPath}/intro.html`;
    if (!fs.existsSync(introPath)) {
      fs.writeFileSync(introPath, kindle_intro(book1[i]));
    } else {
      console.log('该文件已创建');
    }
  }
}

// 生产环境 执行爬虫程序
if (process.env.NODE_ENV === 'production') {
  getListText();
}
// getListText();
// 为每一本书,获取各自的章节.并存放到本地
function getListText() {
  let books = fs.readdirSync('../book');
  // let len = books.length; // 需要爬取的书籍的总数
  let len = 30; // 需要爬取的书籍的总数
  let x = 20; // book下的所有书籍的起始索引
  let y = 0; // 当前爬取的书籍的章节列表起始索引
  let time = 100; // 章节内容爬取程序循环时间

  // `setTimeF`函数,用于循环需要爬取的书籍索引,间隔10秒
  // 第一次,尝试不会循环`setTimeF`函数.
  setTimeF();
  function setTimeF() {
    console.log('开始数据抓取');
    if (!fs.existsSync(`../book/${books[x]}/text`)) {
      fs.mkdirSync(`../book/${books[x]}/text`, '0775');
    }
    let x_list = JSON.parse(
      fs.readFileSync(`../book/${books[x]}/list.js`).toString(),
    ); //当前爬取的书籍的文章总数
    // 当前爬取小说已获取章节集合
    let bookFiles = fs.readdirSync(`../book/${books[x]}/text/`);
    x_list = JSON.parse(x_list);
    let setTime = setTimeout(() => {
      // 所有书籍章节爬取完毕,终止程序
      if (x === len) {
        clearTimeout(setTime);
        return;
      }
      // `setIF`函数,循环当前爬取书籍的章节索引
      console.log(`${x}当前开始抓取<${book1[x].book_name}>的章节`);
      setIF();
      function setIF() {
        let setI = setTimeout(() => {
          let textHtmlPath = `../book/${books[x]}/text/${y + 1}.html`;
          // let setI = setImmediate(() => {
          // 当前书籍章节爬取完毕,触发`setTimeF`函数;
          // 并初始化`x`和`y`
          // 第一次,尝试不会循环`setTimeF`函数.
          // 如果当前爬取的书籍的章节列表起始索引等于当前书籍的章节总数或者如果当前爬取书籍章节数完整,直接进入下一个循环
          if (y === x_list.length || bookFiles.length === x_list.length) {
            // clearImmediate(setI);
            x++;
            y = 0;
            clearTimeout(setI);
            setTimeF();
            return;
          }
          // 开始执行爬虫
          if (!fs.existsSync(textHtmlPath)) {
            request(x_list[y].link).then(($) => {
              let title = $('#content h1').html(); // 文章标题,目录
              let txtContent = $('#cContent').html(); // 文章内容,主体
              // console.log(title);
              // return;
              console.log(
                `<${book1[x].book_name}>_<${
                  title ? title : '**'
                }>_制作完毕,还有${x_list.length - y}`,
              );
              // `textHtmlPath`当前章节路径

              // 检查书籍章节根目录是否存在,没有则创建
              if (!fs.existsSync(`../book/${books[x]}/text/`)) {
                fs.mkdirSync(`../book/${books[x]}/text/`, '0775');
              }
              // 写入当前书籍的text目录中
              if (!fs.existsSync(textHtmlPath)) {
                fs.writeFileSync(
                  textHtmlPath,
                  kindle_text({
                    index: y,
                    len: x_list.length,
                    title: title,
                    txtContent: txtContent,
                  }),
                );
              }
            });
            // time = 10;

            loop();
          } else {
            // time = 10;
            loop();
          }
          function loop() {
            y++;
            setIF();
          }
        }, time);
      }
    }, 1000);
  }

  // 为每个书籍,创建章节存放目录
  /* for (let i in books) {
    // 这需要使用到2种
    if (!fs.existsSync(`./book/${books[i]}/text`)) {
      fs.mkdirSync(`./book/${books[i]}/text`, '0775');
    }
  } */
  // 开始获取书籍章节列表信息
}
app.listen(3000, function() {
  console.log('http://192.168.10.159:3000');
});
