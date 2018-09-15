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
const kindle_intro = require('./util/kindle/4_intro');
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
const noBookJs = require('./noBook');
// 获取部分查询不到的书籍信息
getNotBookInfo();
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
// getBookList();
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
            `${bookPath}/list.js`,
            `module.exports =${JSON.stringify(data)}`,
            function(err) {
              if (err) {
                console.error(err);
              } else {
                console.log(`${bookPath}/list.js写入成功`);
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
            `${bookPath}/list.js`,
            `module.exports =${JSON.stringify(bookList)}`,
            function(err) {
              if (err) {
                console.error(err);
              } else {
                console.log(`${bookPath}/list.js写入成功`);
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
// created();
// 为每一本书创建 opf nxc toc 等kindle电纸书相关索引
function created() {
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

app.listen(3000, function() {
  console.log('http://192.168.10.159:3000');
});
