const express = require('express');
const app = express();
// const request = require('request');
const fs = require('fs');
const path = require('path');

const ProgressBar = require('progress');

const iconv = require('iconv-lite');
const request = require('./util/request');
const chapterData = require('./util/data');

let book = {
  list_url: 'https://www.boquge.com/book/44529/', // 开着外挂闯三国
  str: '',
  chapter: [],
  name: 'txt/开着外挂闯三国',
};
app.get('/', function(req, res, next) {
  res.send('<h4>hello world!</h4>');
});
app.get('/down', function(req, res, next) {
  function getChapterList(url) {
    console.log(url);
    request(url)
      .then((data) => {
        let tbody = data('#chapters-list li');
        let len = tbody.length;
        for (let i = 3; i < len; i++) {
          book.chapter.push(
            `https://www.boquge.com/${tbody
              .eq(i)
              .children('a')
              .attr('href')}`,
          );
        }
        res.send(book.chapter);
      })
      .catch((err) => {
        console.log(err);
      });
  }
  // getChapterList(book.list_url);
  // return;
  res.send(chapterData);
  let y = 0;
  let len = chapterData.length;
  // const bar = new ProgressBar('[:bar] :current/:total', {
  const bar = new ProgressBar('正在下载[:snow/:total]', {
    // curr: y,
    total: len,
    // width: 50,
    // complete: '#',
  });
  down(chapterData);
  function down() {
    let setTime = setTimeout(() => {
      if (find(y) !== true) {
        y = find(y);
      }
      if (y === len) {
        if (bar.complete) {
          console.log('\ncomplete\n');
        }
        console.log('下载结束');
        mergeTxt();
        clearInterval(setTime);
        return;
      }
      request(chapterData[y])
        .then((data) => {
          let title = data('#h1 h1').html();
          let content = data('#txtContent').html();
          book.str = '';
          book.str += `${title}\n\n${hfdl(content)}\n\n`;
          fs.writeFile(
            path.join(
              __dirname,
              `./${book.name}/${file_name(y, len)}_${title}.txt`,
            ),
            book.str,
            function(err) {
              if (err) {
                console.error(err);
              } else {
                bar.tick({
                  snow: y,
                });
                y++;
                down(chapterData);
              }
            },
          );
        })
        .catch((err) => {
          console.log(err);
        });
    }, 700);
  }
});
app.listen(3000, function() {
  console.log('http://192.168.10.159:3000');
});

//  划分段落
function hfdl(txt) {
  if (typeof txt == String) {
    return txt.replace(/<br>/g, '\n');
  } else {
    return txt;
  }

  // return
}
function file_name(num, len) {
  let min = `${num}`.length;
  // let max = `${len}`.length;
  let max = 5;
  let zero = '';
  if (min < max) {
    for (let i = 0; i < max - min; i++) {
      zero += '0';
    }
    num = zero + num;
  }
  return num;
}

// find file in the file
function find(num) {
  let files = fs.readdirSync(`./${book.name}/`);
  if (num < files.length) {
    num = files.length;
  }
  return num;
}
// mergeTxt();
// merge txt
function mergeTxt() {
  let clips = [],
    stream,
    currentFile,
    dhh = fs.createWriteStream(`./${book.name}.txt`);

  if (isFile(`./${book.name}`)) {
    const txtList = fs.readdirSync(`./${book.name}`);
    Object.keys(txtList).forEach((key) => {
      clips.push(txtList[key]);
    });
    console.log(clips.length);
    function main() {
      if (!clips.length) {
        dhh.end('Done');
        return;
      }
      currentFile = `./${book.name}/` + clips.shift();
      stream = fs.createReadStream(currentFile);
      stream.pipe(
        dhh,
        { end: false },
      );
      stream.on('end', function() {
        // console.log(currentFile + ' appended');
        main();
      });
      // dhh-interview.mp3
    }
    main();
  } else {
    fs.openSync(`./${book.name}`, ['w']);
    mergeTxt();
  }
}

/*
 *file_path 文件所在路径
 *@return 文件是否存在
 */
function isFile(file_path) {
  return new Promise((resolve) => {
    fs.stat(file_path, function(err, stat) {
      if (stat && stat.isFile()) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  });
}
