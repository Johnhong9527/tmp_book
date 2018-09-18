const gm = require('gm').subClass({ imageMagick: true });
module.exports = function(info) {
  gm('./books_img/book_2.png')
    .fill('black')
    .font('./fonts/jsxk.ttf')
    .fontSize(250)
    .resize(2560, 1600)
    .drawText(0, -400, info.book_name, 'center')
    .write('./tmp/bt.png', function(err) {
      if (err) throw err;
    });
  gm('./books_img/book.png')
    .fill('black')
    .font('./fonts/msyh.ttf')
    .fontSize(70)
    .resize(2560, 1600)
    .drawText(150, 400, info.author, 'center')
    .write('./tmp/author.png', function(err) {
      if (err) throw err;
    });
  setTimeout(() => {
    gm('./tmp/bt.png')
      .draw('image Over 0, 0, 0, 0 "./tmp/author.png"')
      .write(`./tmp/image.png`, function(err) {
        if (!err) {
          console.log('done');
        } else {
          console.log(err.message || '出错了！');
        }
      });
  }, 1000);
};
