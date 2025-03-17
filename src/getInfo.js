const getNovelInfo_MTCV = require('./host_metruyencv').getNovelInfo
const getNovelInfo_123 = require('./host_123truyenhot').getNovelInfo
const getNovelInfo_qidian = require('./host_qidian').getNovelInfo
const getNovelInfo_reaperscans = require('./host_reaperscans').getNovelInfo
async function getNovelInfo(url) {
    if (url.includes('metruyencv')) {
        await getNovelInfo_MTCV(url)
    }
    if (url.includes('123truyenhot')) {
        await getNovelInfo_123(url)
    }
    if (url.includes('69shuba')) {
        await getNovelInfo_qidian(url)
    }
    if (url.includes('reaperscans')) {
        await getNovelInfo_reaperscans(url)
    }
}
module.exports = {
    getNovelInfo
}
