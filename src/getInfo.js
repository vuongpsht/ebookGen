const axios = require('axios')
const cheerio = require('cheerio');
const lodash = require('lodash')
const Epub = require("epub-gen");

async function getChapter (url){
    const source = await axios.get(url)
    const html = source.data
    const $ = cheerio.load(html)
    $('div.pt-3').remove()
    const article = $('#article')
    const title = $('div.nh-read__title')
    return {
        title: title.text(),
        data: article.html()
    }
}
async function chapterProcess (urls){
    const chapChunk = lodash.chunk(urls, 100)
    const allChaps = []
    for (let i = 0; i < chapChunk.length ; i++) {
        const promises = chapChunk[i].map(e => getChapter(e))
        const chaps = await Promise.all(promises)
        allChaps.push(chaps)
        process.stdout.write('Downloading ' + Number(i / chapChunk.length * 100).toFixed(0) + '% complete... \r');
    }
    return lodash.flattenDeep(allChaps)
}
async function getNovelInfo(url) {
    const source = await axios.get(url)
    const html = source.data
    const $ = cheerio.load(html);
    const _name = $('h1.mr-2')
    const _chapCounterID = $('#nav-tab-chap > span.counter')
    const _author = $('a.text-secondary')
    const _thumb = $('div.nh-thumb > img')

    const name = _name.text()
    const chapCounterID = Number(_chapCounterID.text())
    const author = _author.text().trim()
    const cover = _thumb.attr('src')

    console.log('name: ' + name + '\n' + 'chapter count: ' +chapCounterID)
    const tmpChapterArray = Array.from(Array(chapCounterID).keys())
    const chapterUrls = tmpChapterArray.map(e => `${url}/chuong-${e+1}`)
    const content = await chapterProcess(chapterUrls)
    const bookOptions = {
        title: name,
        author,
        cover,
        publisher: "Nothinginhere", // optional
        content
    }
    new Epub(bookOptions, `./${name}.epub`)
}

module.exports = {
    getNovelInfo
}
