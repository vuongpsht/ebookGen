const axios = require('axios')
const cheerio = require('cheerio');
const iconv = require('iconv-lite')
const fs = require('fs')
const lodash = require('lodash');

function checkDirExist(dirName) {
    try {
        const content = fs.readdirSync(`cache/${dirName}`)
        return content
    } catch (error) {
        fs.mkdirSync(`cache/${dirName}`)
        return null
    }

}

async function sleep(num) {
    return new Promise(resolve => {
        setTimeout(() => resolve(), num ?? 5000)
    })
}

async function checkResume(bookName) {
    const dirContent = checkDirExist(bookName)
    console.log(dirContent);
    if (dirContent === null) {
        return 0
    } else {
        const dirFormat = dirContent.map(e => e.replace('.json', '')).map(e => Number(e.split('-')[1])).sort((a, b) => a - b)[dirContent.length - 1]
        return dirFormat / 100
    }

}
async function getChapterDetailed(chapInfo, bookName) {
    const response = await axios.get(chapInfo.url, { responseType: 'arraybuffer' })
    const data = iconv.decode(response.data, 'gbk');
    const $ = cheerio.load(data)
    const chapterName = $('h1.hide720').text()
    const content = $('div.txtnav>p')
    let chapterContent = ''
    for (const element of content) {
        chapterContent = chapterContent + ($(element).text() + '\n')
    }
    const jsonContent = JSON.stringify({
        chapterName,
        chapterContent
    })
    fs.writeFileSync(`cache/${bookName}/chap-${chapInfo.counter}.json`,
        jsonContent
    )
}
async function getNovelInfo(url) {
    const response = await axios.get(url, { responseType: 'arraybuffer' })
    const chapterUrl = []
    const data = iconv.decode(response.data, 'gbk');
    const $ = cheerio.load(data)
    const chapterList = $('div>ul>li')
    const bread = $('div.bread>a')
    let bookName = ''
    for (const element of bread) {
        const mHref = $(element).attr('href')
        if (mHref === `${url}.htm`) {
            bookName = $(element).text()
        }
    }
    checkDirExist(bookName)


    for (const element of chapterList) {
        chapterUrl.push({
            counter: $(element).attr(('data-num')),
            url: $(element).children('a').attr('href')
        })
    }
    const startPoint = await checkResume(bookName)
    const reversedChapters = chapterUrl.reverse()
    const chunkedChapters = lodash.chunk(reversedChapters, 100)
    console.log('startPoint', startPoint);

    for (let index = startPoint; index < chunkedChapters.length; index++) {
        const element = chunkedChapters[index];
        await Promise.all(element.map(e => getChapterDetailed(e, bookName)))
        await sleep(1000 * 60 * 2)
    }
}

module.exports = {
    getNovelInfo
}