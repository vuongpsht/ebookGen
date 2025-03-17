const axios = require('axios')
const cheerio = require('cheerio');
const lodash = require('lodash')
const Epub = require("epub-gen");
const Sharp = require('sharp')
const fs = require('fs')
async function getChapter(url) {
  try {
    const source = await axios.get(url, { responseType: 'text' })
    const html = source.data
    const $ = cheerio.load(html, { xmlMode: false })
    const scriptlength = $('script'); // no longer 0
    const scriptString = $(scriptlength[56]).text()
    const contentString = scriptString.slice(23, scriptString.length - 3)
    const $$ = cheerio.load(JSON.parse('"' + contentString + '"'))
    const contents = $$("p").toArray().map(e => $$(e).text()).reduce((acc, curr) => (acc + curr + '\n'), '')
    console.log('contents', contents);

    const title = $('nav>div>div>div>h2')
    return {
      title: $(title).text(),
      data: contents
    }

  } catch (error) {
    console.log('error', error);

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


async function getNovelInfo(url) {
  try {
    const source = await axios.get(url, { responseType: 'text' })

    const html = source.data
    const $ = cheerio.load(html);
    const _name = $('div>div>div>div>h1')

    const _chapCounterID = $('span.text-muted-foreground')

    const name = _name.text()

    const chapCounterID = Number($(_chapCounterID[6]).text())
    const tmpChapterArray = Array.from(Array(chapCounterID).keys())
    const chapterUrls = tmpChapterArray.map(e => `${url}/chapter-${e + 1}`)
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
    // console.log(error);
  }
}

module.exports = {
  getNovelInfo
}
