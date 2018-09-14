/**
 * 在bookIndex前添加若干个`0`字符,
 * @param {Number} index
 * @param {Number} length 最后返回字符的长度
 * @return {String} 然后对应编号
 */
module.exports = function(index, length) {
  index = index.toString();
  let len = index.length;
  for (let i = 0; i < length.toString().length - len; i++) {
    index = '0' + index;
  }
  return index;
};
