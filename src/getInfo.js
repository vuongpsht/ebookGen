const getNovelInfo_MTCV = require('./host_metruyencv').getNovelInfo
const getNovelInfo_123 = require('./host_123truyenhot').getNovelInfo
async function getNovelInfo (url){
    if (url.includes('metruyencv')){
        await getNovelInfo_MTCV(url)
    }
    if (url.includes('123truyenhot')){
        await getNovelInfo_123(url)
    }
}
module.exports = {
    getNovelInfo
}
