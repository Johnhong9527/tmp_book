### 参考文章
[Converting a Buffer to JSON and Utf8 Strings in Nodejs](https://hackernoon.com/https-medium-com-amanhimself-converting-a-buffer-to-json-and-utf8-strings-in-nodejs-2150b1e3de57)


https://www.qidian.com/finish?size=-1&sign=-1&tag=-1&chanId=-1&subCateId=-1&orderId=8&update=-1&page=1&month=-1&style=1&vip=-1

https://www.qidian.com/finish?action=hidden&orderId=8&style=1&pageSize=20&siteid=1&pubflag=0&hiddenField=2&page=2


#### 文件编码操作
```bash
# 将 UTF-8 with BOM 转为 非 UTF-8 with BOM 
sed -i '1 s/^\xef\xbb\xbf//' fileName
# 将非UTF-8 with BOM 转为 UTF-8 with BOM 
sed -i '1 s/^/\xef\xbb\xbf&/' fileName
```

#### 下载服务器文件到本地
```bash
# 下载文件
scp username@serveIP:{服务器详细文件路径} {本地存放路径} 
# 下载目录
scp -r username@serveIP:{服务器详细文件夹路径} {本地存放路径} 

```

#### 查看文件夹大小
```bash
du -h --max-depth=0 {文件夹路径}
```
#### 电子书创建指令
```bash
kindlegen c1 {opf文件} -locale zh
```
