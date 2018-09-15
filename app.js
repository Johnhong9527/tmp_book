const express = require('express');
const app = express();
// const request = require('request');
const fs = require('fs');
const path = require('path');

const ProgressBar = require('progress');
const axios = require('axios');

const request = require('./util/request');
const chapterData = require('./util/data');
// kindle
const cheerio = require('cheerio');
const kindle_opf = require('./util/kindle/1_opf');
const kindle_toc = require('./util/kindle/2_toc');
const kindle_ncx = require('./util/kindle/3_ncx');
const kindle_intro = require('./util/kindle/4_intro');
const kindle_text = require('./util/kindle/5_text');
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
const list = require('./util/list');
const bookList = require('./util/book');
app.get('/list', function(req, res, next) {
  res.send(list);
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

const noBook = require('./txt/noBook');
const noBookInfo = require('./txt/noBookInfo');
// 获取可爬书籍集合
function getInfo() {
  let book = JSON.parse(JSON.stringify(list));
  console.log(book.length);
  for (let x = 0; x < book.length; x++) {
    for (let y = 0; y < noBookInfo.length; y++) {
      if (book[x].book_name == noBookInfo[y].book_name) {
        book.splice(book[x], 1);
      }
    }
  }

  console.log(book.length);
  fs.writeFileSync(`./util/book.js`, 'module.exports =' + JSON.stringify(book));
}
// 清理章节列表中,混乱的数据
// remove();
function remove() {
  let books = fs.readdirSync('./book');
  let len = books.length;
  for (let i = 0; i < len; i++) {
    // 获取单个书籍的list_now.js
    let bookC = JSON.parse(
      fs.readFileSync(`./book/${books[i]}/list_now.js`).toString(),
    );
    for (let i in bookC) {
      if (bookC[i].name === null) {
        bookC.splice(i, 1);
      }
    }
    fs.writeFileSync(`./book/${books[i]}/list_now.js`, JSON.stringify(bookC));
  }
  console.log('完毕');
}
// 抓取单个书籍的所有章节数据
// 设置 opf/toc/ncx
function setOpf() {
  let books = fs.readdirSync('./book');
  let len = books.length;
  // let len = 2;
  // console.log(len);
  // return;
  for (let i = 0; i < len; i++) {
    console.log(bookList[i].book_name);
    let bookC = fs.readFileSync(`./book/${books[i]}/list_now.js`).toString();
    bookC = JSON.parse(bookC);
    console.log(`./book/${books[i]}/${books[i]}.opf`);
    if (!fs.existsSync(`./book/${books[i]}/${books[i]}.opf`)) {
      fs.writeFileSync(
        `./book/${books[i]}/${books[i]}.opf`,
        kindle_opf(bookList[i].book_name, bookC.length),
      );
      console.log(`./book/${books[i]}/${books[i]}.opf文件成功创建`);
    } else {
      console.log('该文件已创建');
    }
  }
  /*  fs.writeFile(
    `${bookPath}/${fileName(i + 1, len)}_${books[i]}.opf`,
    kindle_opf(bookList[i].name, bookC.len),
    function(err) {
      if (err) {
        console.error(err);
      } else {
        console.log('./noBookInfo.js写入成功');
        // return Promise.resolve();
      }
    },
  ); */
  return;
  // 获取数据合集
  let book_list = fs
    .readFileSync(`${bookPath}/${books[books.indexOf('list_now.js')]}`)
    .toString();
  book_list = JSON.parse(book_list);
  fs.writeFileSync(
    `${bookPath}/${fileName(bookIndex, len)}_${bookId}.opf`,
    kindle_opf(bookList[i].name, book_list),
  );
  // 获取单个章节数据
  let j = 0;
  // let book_len = book_list.length;
  let book_len = 3;
  // getData();
  function getData() {
    let timer = setImmediate(() => {
      if (j === book_len) {
        clearImmediate(timer);
        return;
      }
      request(book_list[j].link).then(($) => {
        let title = $('#h1 h1').html();
        let txtContent = $('#txtContent').html();
        console.log(txtContent);
      });
    });
  }
}
function setToc() {
  let books = fs.readdirSync('./book');
  let len = books.length;
  for (let i = 0; i < len; i++) {
    console.log(bookList[i].book_name);
    let bookC = fs.readFileSync(`./book/${books[i]}/list_now.js`).toString();
    bookC = JSON.parse(bookC);
    console.log(`./book/${books[i]}/toc.html`);
    if (!fs.existsSync(`./book/${books[i]}/toc.html`)) {
      fs.writeFileSync(`./book/${books[i]}/toc.html`, kindle_toc(bookC));
      console.log(`./book/${books[i]}/toc.html文件成功创建`);
    } else {
      console.log('该文件已创建');
    }
  }
}
function setNcx() {
  let books = fs.readdirSync('./book');
  let len = books.length;
  for (let i = 0; i < len; i++) {
    console.log(bookList[i].book_name);
    let bookC = fs.readFileSync(`./book/${books[i]}/list_now.js`).toString();
    bookC = JSON.parse(bookC);
    console.log(`./book/${books[i]}/toc.ncx`);
    if (!fs.existsSync(`./book/${books[i]}/toc.ncx`)) {
      fs.writeFileSync(
        `./book/${books[i]}/toc.ncx`,
        kindle_ncx(bookList[i].book_name, bookC),
      );
      console.log(`./book/${books[i]}/toc.ncx文件成功创建`);
    } else {
      console.log('该文件已创建');
    }
  }
}
function setIntro() {
  let len = list.length;
  for (let i = 0; i < len; i++) {
    // 编号__用于该书籍存放路径以及编号
    const bookId = list[i].book_img.split('/')[5];
    const bookIndex = i + 1;
    const bookPath = `./book/${fileName(bookIndex, len)}_${bookId}`;
    // 根据路径检测文件是否存在
    if (!fs.existsSync(bookPath)) {
      fs.mkdirSync(bookPath);
    } else {
      console.log('该文件已创建');
    }
    // 创建intro
    let introPath = `${bookPath}/intro.html`;
    if (!fs.existsSync(introPath)) {
      fs.writeFile(`${bookPath}/intro.html`, kindle_intro(list[i]), function(
        err,
      ) {
        if (err) {
          console.error(err);
        } else {
          console.log(`${bookPath}`);
        }
      });
    } else {
      console.log('该文件已创建');
    }
  }
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
// 获取各个书籍目录,并存放到各个书籍的目录中
function getBookList() {
  let i = 0;
  let len = list.length;
  let noBook = [];
  get();
  function get() {
    let timer = setImmediate(() => {
      if (i === len) {
        // if (i === 36) {

        clearImmediate(timer);
        fs.writeFile(
          './noBook.js',
          `module.exports =${JSON.stringify(noBook)}`,
          function(err) {
            if (err) {
              console.error(err);
            } else {
              console.log('./noBook.js写入成功');
              // return Promise.resolve();
            }
          },
        );
        return;
      }
      // 编号__用于该书籍存放路径以及编号
      const bookId = list[i].book_img.split('/')[5];
      const bookIndex = i + 1;
      const bookPath = `./book/${fileName(bookIndex, len)}_${bookId}`;
      const bookName = list[i].book_name;
      if (fs.existsSync(`${bookPath}/list_now.js`)) {
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
            `https://www.boquge.com/book/${bookListUrl.split('/')[2]}`,
          );
        })
        .then(($) => {
          let ddList = $('#chapters-list li');
          let ddArray = [];
          for (let i = 1; i < ddList.length; i++) {
            if (ddList.eq(i) && ddList.eq(i).children('a')) {
              ddArray.push({
                name: ddList
                  .eq(i)
                  .children('a')
                  .html(),
                link: `https://www.boquge.com${ddList
                  .eq(i)
                  .children('a')
                  .attr('href')}`,
              });
            }
          }
          return Promise.resolve(ddArray);
        })
        .then((data) => {
          fs.writeFile(
            `${bookPath}/list_now.js`,
            `module.exports =${JSON.stringify(data)}`,
            function(err) {
              if (err) {
                console.error(err);
              } else {
                console.log(`${bookPath}/list_now.js写入成功`);
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

// 为每一本书,获取各自的章节.并存放到本地
getListText();
function getListText() {
  let books = fs.readdirSync('./book');
  // let len = books.length; // 需要爬取的书籍的总数
  let len = 13; // 需要爬取的书籍的总数
  let x = 3; // book下的所有书籍的起始索引
  let y = 0; // 当前爬取的书籍的章节列表起始索引
  let x_list = JSON.parse(
    fs.readFileSync(`./book/${books[x]}/list_now.js`).toString(),
  ); //当前爬取的书籍的文章总数
  // `setTimeF`函数,用于循环需要爬取的书籍索引,间隔10秒
  // 第一次,尝试不会循环`setTimeF`函数.
  setTimeF();
  function setTimeF() {
    console.log('开始数据抓取');
    let setTime = setTimeout(() => {
      // 所有书籍章节爬取完毕,终止程序
      if (x === len) {
        clearTimeout(setTime);
        return;
      }
      // `setIF`函数,循环当前爬取书籍的章节索引
      setIF();
      function setIF() {
        console.log(`当前开始抓取<${bookList[x].book_name}>的章节`);
        let setI = setImmediate(() => {
          // 当前书籍章节爬取完毕,触发`setTimeF`函数;
          // 并初始化`x`和`y`
          // 第一次,尝试不会循环`setTimeF`函数.
          if (y === x_list.length) {
            clearImmediate(setI);
            // x = y = 0;
            // setTimeF();
            return;
          }
          // 开始执行爬虫
          request(x_list[y].link).then(($) => {
            let title = $('#h1 h1').html(); // 文章标题,目录
            let txtContent = $('#txtContent').html(); // 文章内容,主体
            // `textHtmlPath`当前章节路径
            let textHtmlPath = `./book/${books[x]}/text/${y + 1}.html`;
            // 检查书籍章节根目录是否村在，没有则创建
            if (!fs.existsSync(`./book/${books[x]}/text/`)) {
              fs.mkdirSync(`./book/${books[x]}/text/`, '0775');
            }
            // 写入当前书籍的text目录中
            if (!fs.existsSync(textHtmlPath)) {
              fs.writeFileSync(
                textHtmlPath,
                kindle_text({
                  index: y,
                  len: x_list.length,
                  title: title,
                  txtContent: txtContent.replace(
                    '<div class="gad2"><script type="text/javascript">try{mad1();} catch(ex){}</script></div>',
                    '',
                  ),
                }),
              );
            }
            console.log(
              `<${bookList[x].book_name}>的<${title}>制作完毕,开始下一步`,
            );
            y++;
            setIF();
          });
        }, 2000);
      }
    }, 10);
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
