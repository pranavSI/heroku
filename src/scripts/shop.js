//Code for Shop - Best Seller API is used for this

//Load all required files
var defMessages = require('../../config/defaultMessages.json');
var buttons = require('../variables/buttons.js');
var templates = require('../variables/templates.js');
var sendMessage = require('./sendMessage.js');

const
    config = require('config'),
    request = require('request');

const
    BASE_DOMAIN = (process.env.BASE_DOMAIN) ?
    (process.env.BASE_DOMAIN) :
    config.get('base_domain');

const
    SHOP_LIST = (process.env.SHOP_LIST) ?
    (process.env.SHOP_LIST) :
    config.get('shop_list');

var shoplist = function (senderID, shop_callback, locale) {

    //Same feed used for English and Hindi
    var feedURL = BASE_DOMAIN + SHOP_LIST;
    //console.log(feedURL);
    request({
        uri: feedURL,
        method: 'GET',
    }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var arrayShop = JSON.parse(body).content.data;
            //console.log(arrayShop.length);
            //console.log(arrayShop);

            if (arrayShop == null || typeof (arrayShop) == undefined) {
                console.error("Unable to fetch information from API", response.statusCode, response.statusMessage, body.error);
                shop_callback(defMessages.shop.error, null);
            } else {
                var allProducts = [];
                var displaylength = arrayShop.length <= 4 ? arrayShop.length : 4;
                //console.log(displaylength);
                for (var s = 0; s < displaylength; s++) {
                    var productID = arrayShop[s].product_id;
                    var productName = arrayShop[s].asset_title;
                    var productDesc = arrayShop[s].short_desc;
                    var productImgPath = arrayShop[s].imagedata[0].image_path;
                    var productImgFileName = arrayShop[s].imagedata[0].image_file_name;
                    var productImg = productImgPath + productImgFileName.replace('/0/', '/1-1/388-218/');
                    var productAlias = arrayShop[s].title_alias;
                    var productLink = BASE_DOMAIN + "/shop/" + productAlias;
                    var obj = {
                        title: productName,
                        image_url: BASE_DOMAIN + "/static-assets/waf-images/" + productImg,
                        subtitle: productDesc,
                        buttons: [{
                            "type": "web_url",
                            "url": productLink + "?utm_source=facebook&utm_medium=chatbot&utm_campaign=fb_messenger",
                            "title": "Buy Now",
                            "webview_height_ratio": "full",
                            "webview_share_button": "show"
                        }]
                    }
                    allProducts.push(obj);
                }
                //console.log(obj);
                shop_callback(error, allProducts, locale);
            }
        } else {
            console.error("Failed calling Send API", response.statusCode, response.statusMessage, body.error);
        }
    });
    return ("Success");
}

module.exports = shoplist;