 #!/bin/bash/
 # 消除多余文字
 sed -i 's/http:\/\/www.biqukan.com\/[0-9]*_[0-9]*\/[0-9]*.html/\ /g' ./*.txt
 sed -i 's/请记住本书首发域名：www.biqukan.com。笔趣阁手机版阅读网址：m.biqukan.com/\ /g' ./*.txt
 sed -i 's/天才壹秒記住『愛♂去÷小?說→網』，為您提供精彩小說閱讀。/\n/g' ./*.txt
 # 空格转换为换行
 sed -i 's/\　\　/\n\n/g' ./*.txt
 sed -i 's/\\n\\n\\n/\n/g' ./*.txt
 sed -i 's/<br>/\n\n/g' ./*.txt
 # 去除空格
 sed -i 's/^[\s]*\n/\n/g' ./*.txt
 sed -i 's/^[\s]*[\ ]*\n/\n/g' ./*.txt