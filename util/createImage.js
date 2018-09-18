const shell = require('shelljs');
const gm = require('gm').subClass({ imageMagick: true });
module.exports = function(info) {
  // shell.exec('rm -rf data/tmp/*');
  gm(`../kindle/${Math.floor(Math.random() * 30) + 1}.png`)
    .fill('black')
    .font('../data/fonts/jsxk.ttf')
    .fontSize(130)
    .resize(2560, 1600)
    .drawText(0, -400, info.book_name, 'center')
    .write('./data/tmp/bt.png', function(err) {
      if (err) throw err;
    });
  gm('./data/books_img/book.png')
    .fill('black')
    .font('../data/fonts/msyh.ttf')
    .fontSize(70)
    .resize(2560, 1600)
    .drawText(150, 400, `作者: ${info.author}`, 'center')
    .write('./data/tmp/author.png', function(err) {
      if (err) throw err;
    });
  setTimeout(() => {
    gm('./data/tmp/bt.png')
      .draw('image Over 0, 0, 0, 0 "./data/tmp/author.png"')
      .write(`${info.path}/images/image.png`, function(err) {
        if (!err) {
          // console.log('done');
        } else {
          console.log(err.message || '出错了！');
        }
      });
  }, 2000);
};
