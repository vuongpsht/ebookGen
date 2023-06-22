const axios = require('axios')
const cheerio = require('cheerio');
const lodash = require('lodash')
const Epub = require("epub-gen");
const Sharp = require('sharp')
const fs = require('fs')
async function getChapter(url) {
    try {
        const source = await axios.get(url)
        const html = source.data
        const $ = cheerio.load(html)
        $('div.pt-3').remove()
        const article = $('#article')
        const title = $('div.nh-read__title')
        return {
            title: title.text(),
            data: `${article.html()}`.replaceAll('<br>', '<br />')
        }
    
    } catch (error) {
        return null        
    }
}
async function chapterProcess(urls) {
    const chapChunk = lodash.chunk(urls, 100)
    // const testChap = await getChapter(urls[0])
    // return [testChap]
    const allChaps = []
    for (let i = 0; i < chapChunk.length; i++) {
        const promises = chapChunk[i].map(e => getChapter(e))
        const chaps = await Promise.all(promises)
        allChaps.push(chaps.filter(e => !!e))
        process.stdout.write('Downloading ' + Number(i / chapChunk.length * 100).toFixed(0) + '% complete... \r');
    }
    return lodash.chunk(lodash.flattenDeep(allChaps), 1000)
}

async function getCover(url) {
    const bufferRes = await axios.get(url, {
        responseType: 'arraybuffer'
    })
    const imgBuffer = Buffer.from(bufferRes.data, 'binary')
    const jpegBuffer = await Sharp(imgBuffer).jpeg().toBuffer()
    fs.writeFile('./imgTMPDir/cover.jpeg', jpegBuffer, function (err) {
        if (err) throw err;
    })
}

async function getNovelInfo(url) {
    try {
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
        await getCover(cover)
        console.log('name: ' + name + '\n' + 'chapter count: ' + chapCounterID + ' cover ' + cover)
        const tmpChapterArray = Array.from(Array(chapCounterID).keys())
        const chapterUrls = tmpChapterArray.map(e => `${url}/chuong-${e + 1}`)
        const content = await chapterProcess(chapterUrls)
        content.forEach((contentPart, contentIndex) => {
            const _name = `${name}-num-${contentIndex + 1}`
            const bookOptions = {
                title: _name,
                author,
                cover: 'imgTMPDir/cover.jpeg',
                publisher: "Nothinginhere", // optional
                content: contentPart,
                version: 3
            }
            const epubPath = `./${new Date().getTime()}${_name}.epub`
            new Epub(bookOptions, epubPath)
        })
    } catch (error) {
        console.log(error);
    }
}

module.exports = {
    getNovelInfo
}
