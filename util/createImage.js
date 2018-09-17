const fs = require('fs');
// const images = require('images');
const TextToSVG = require('text-to-svg');
const textToSVG = TextToSVG.loadSync();
// const svg2png = require('../svg2png');
// const Promise = require('bluebird');
// const svg2img = require('../svg2img');
// var fs = require('fs');
// const text2png = require('../text2png');
const gm = require('gm').subClass({ imageMagick: true });
module.exports = function() {
  gm('./book_2.png')
    .fill('black')
    .font('./fonts/jsxk.ttf')
    .fontSize(250)
    .resize(2560, 1600)
    .drawText(0, -400, '官居一品', 'center')
    .write('./bt.png', function(err) {
      if (err) throw err;
    });
  gm('./book.png')
    .fill('black')
    .font('./fonts/msyh.ttf')
    .fontSize(100)
    .resize(2560, 1600)
    .drawText(300, 400, '三三三三', 'center')
    .write('./author.png', function(err) {
      if (err) throw err;
    });
  gm('./bt.png')
    .draw('image Over 0, 0, 0, 0 "./author.png"')
    .write(`./author2.png`, function(err) {
      if (!err) {
        console.log('done');
      } else {
        console.log(err.message || '出错了！');
      }
    });

  return;
  const attributes = { fill: 'red', stroke: 'black' };
  const options = {
    x: 0,
    y: 0,
    fontSize: 72,
    anchor: 'bottom',
    attributes: attributes,
  };

  const svg1 = textToSVG.getSVG('hello', options);
  const svg2 = textToSVG.getSVG('ok', options);

  fs.writeFileSync('out.png', text2png('Hello!', { color: 'blue' }));
  // console.log(svg);
  fs.writeFileSync('./1.svg', svg1 + svg2);
};

// Promise.promisifyAll(fs);

// const textToSVG = TextToSVG.loadSync('fonts/文泉驿微米黑.ttf');

// const sourceImg = images('./i/webwxgetmsgimg.jpg');
// const sWidth = sourceImg.width();
// const sHeight = sourceImg.height();

// const svg1 = textToSVG.getSVG('魏长青-人人讲App', {
//   x: 0,
//   y: 0,
//   fontSize: 24,
//   anchor: 'top',
// });

// const svg2 = textToSVG.getSVG('邀请您参加', {
//   x: 0,
//   y: 0,
//   fontSize: 16,
//   anchor: 'top',
// });

// const svg3 = textToSVG.getSVG('人人讲课程', {
//   x: 0,
//   y: 0,
//   fontSize: 32,
//   anchor: 'top',
// });

// Promise.coroutine(function* generateInvitationCard() {
//   const targetImg1Path = './i/1.png';
//   const targetImg2Path = './i/2.png';
//   const targetImg3Path = './i/3.png';
//   const targetImg4Path = './i/qrcode.jpg';
//   const [buffer1, buffer2, buffer3] = yield Promise.all([
//     svg2png(svg1),
//     svg2png(svg2),
// 	svg2png(svg3),
//   ]);

//   yield Promise.all([
//     fs.writeFileAsync(targetImg1Path, buffer1),
//     fs.writeFileAsync(targetImg2Path, buffer2),
//     fs.writeFileAsync(targetImg3Path, buffer3),
//   ]);

//   const target1Img = images(targetImg1Path);
//   const t1Width = target1Img.width();
//   const t1Height = target1Img.height();
//   const offsetX1 = (sWidth - t1Width) / 2;
//   const offsetY1 = 200;

//   const target2Img = images(targetImg2Path);
//   const t2Width = target2Img.width();
//   const t2Height = target2Img.height();
//   const offsetX2 = (sWidth - t2Width) / 2;
//   const offsetY2 = 240;

//   const target3Img = images(targetImg3Path);
//   const t3Width = target3Img.width();
//   const t3Height = target3Img.height();
//   const offsetX3 = (sWidth - t3Width) / 2;
//   const offsetY3 = 270;

//   const target4Img = images(targetImg4Path);
//   const t4Width = target4Img.width();
//   const t4Height = target4Img.height();
//   const offsetX4 = (sWidth - t4Width) / 2;
//   const offsetY4 = 400;

//   images(sourceImg)
//   .draw(target1Img, offsetX1, offsetY1)
//   .draw(target2Img, offsetX2, offsetY2)
//   .draw(target3Img, offsetX3, offsetY3)
//   .draw(target4Img, offsetX4, offsetY4)
//   .save('./i/card.png', { quality : 90 });
// })().catch(e => console.error(e));
