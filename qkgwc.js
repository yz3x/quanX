/*


#清空购物车


 */

const $ = new Env('清空购物车');

//Node.js用户请在jdCookie.js处填写京东ck;

const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';

const notify = $.isNode() ? require('./sendNotify') : '';


//IOS等用户直接用NobyDa的jd cookie

let cookiesArr = [], cookie = '', allMessage = '', users = '';

if ($.isNode()) {

    Object.keys(jdCookieNode).forEach((item) => {

        cookiesArr.push(jdCookieNode[item])

    })

    if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => { };

    users = process.env.CleanUsers ? process.env.CleanUsers : '';

} else {

    cookiesArr = [$.getdata('CookieJD'), $.getdata('CookieJD2'), ...jsonParse($.getdata('CookiesJD') || "[]").map(item => item.cookie)].filter(item => !!item);

}

!(async () => {

    if (!cookiesArr[0]) {

        $.msg('【京东账号一】清空购物车失败', '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', { "open-url": "https://bean.m.jd.com/bean/signIndex.action" });

    }

    console.log("将需要跳过清理的账号(cookie中的pt_pin)放到变量CleanUsers中，多个用@隔开\n")

    console.log("❗️❗️❗️❗️本脚本会清理购物车所有商品❗️❗️❗️❗️\n")

    console.log("脚本十秒后开始清理\n")

    await sleep(10 * 1000)

    for (let i = 0; i < cookiesArr.length; i++) {

        if (cookiesArr[i]) {

            cookie = cookiesArr[i];

            $.User = cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]

            $.UserName = decodeURIComponent($.User)

            $.index = i + 1;

            $.isLogin = true;

            $.nickName = '';

            await TotalBean();

            console.log(`\n****开始【京东账号${$.index}】${$.nickName || $.UserName}*****\n`);

            if (!$.isLogin) {

                $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`, { "open-url": "https://bean.m.jd.com/bean/signIndex.action" });


                if ($.isNode()) {

                    await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);

                }

                continue

            } else if (users.indexOf($.User) > -1) {

                console.log(`❗️❗️账号在变量中，跳过此账号\n`);

                continue

            }

            allMessage += `京东账号${$.index} - ${$.nickName}\n`;

            await getCarts();

            allMessage += `购物车商品数：${$.cartsTotalNum}\n`;

            if ($.cartsTotalNum > 0) {

                for (let i = 0; i < 3; i++) {

                    await unsubscribeCartsFun();

                    await getCarts();

                    if ($.cartsTotalNum == 0) { break }

                    await sleep(3000)

                }

                if ($.cartsTotalNum > 0) {

                    allMessage += `清空结果：❌\n`;

                } else {

                    allMessage += `清空结果：✅\n`;

                }

            }

            allMessage += '\n'

        }

    }

    if (allMessage) {

        allMessage = allMessage.substring(0, allMessage.length - 1)

        if ($.isNode() && (process.env.CASH_NOTIFY_CONTROL ? process.env.CASH_NOTIFY_CONTROL === 'false' : !!1)) await notify.sendNotify($.name, allMessage);

    }

})()

    .catch((e) => {

        $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '')

    })

    .finally(() => {

        $.done();

    })

function sleep(timeout) {

    return new Promise((resolve) => setTimeout(resolve, timeout));

}

function unsubscribeCartsFun() {

    return new Promise(resolve => {


        const options = {

            "url": `https://wq.jd.com/deal/mshopcart/rmvCmdy?sceneval=2&g_login_type=1&g_ty=ajax`,

            "body": `pingouchannel=0&commlist=${$.commlist}&type=0&checked=0&locationid=${$.areaId}&templete=1&reg=1&scene=0&version=20190418&traceid=${$.traceId}&tabMenuType=1&sceneval=2`,

            "headers": {

                "Accept": "application/json,text/plain, */*",

                "Content-Type": "application/x-www-form-urlencoded",

                "Accept-Encoding": "gzip, deflate, br",

                "Accept-Language": "zh-cn",

                "Connection": "keep-alive",

                "Cookie": cookie,

                "Referer": "https://p.m.jd.com/",

                "User-Agent": $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1")

            }

        }

        $.post(options, (err, resp, data) => {

            try {

                data = JSON.parse(data);

                if (data['errId'] == '0') { console.log('清空购物车成功') }

            } catch (e) {

                console.log('清空购物车出错')

                $.logErr(e, resp);

            } finally {

                resolve(data);

            }

        });

    })

}


function getStr(text, start, end) {


    var str = text;

    var aPos = str.indexOf(start);

    if (aPos < 0) { return null }

    var bPos = str.indexOf(end, aPos + start.length);

    if (bPos < 0) { return null }

    var retstr = str.substr(aPos + start.length, text.length - (aPos + start.length) - (text.length - bPos));

    return retstr;


}

function getCarts() {

    $.shopsTotalNum = 0;

    return new Promise((resolve) => {

        const option = {

            url: `https://p.m.jd.com/cart/cart.action`,

            headers: {

                "Host": "p.m.jd.com",

                "Accept": "*/*",

                "Connection": "keep-alive",

                "Cookie": cookie,

                "User-Agent": $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1"),

                "Accept-Language": "zh-cn",

                "Accept-Encoding": "gzip, deflate, br"

            },

        }

        $.get(option, (err, resp, data) => {

            try {


                data = JSON.parse(getStr(data, 'window.cartData =', 'window._PFM_TIMING'));

                $.cartsTotalNum = 0;

                if (data.errId === '0') {

                    $.traceId = data['traceId']

                    $.areaId = data['areaId']

                    let itemId, sKuId, index, temp

                    $.commlist = ''

                    for (let i = 0; i < data['cart']['venderCart'].length; i++) {

                        const vender = data['cart']['venderCart'][i];

                        for (let s = 0; s < vender['sortedItems'].length; s++) {

                            const sorted = vender['sortedItems'][s];

                            itemId = sorted['itemId']

                            for (let m = 0; m < sorted['polyItem']['products'].length; m++) {

                                const products = sorted['polyItem']['products'][m];

                                if (itemId == products['mainSku']['id']) {

                                    sKuId = ''

                                    index = '1'

                                } else {

                                    sKuId = itemId

                                    index = sorted['polyType'] == '4' ? '13' : '11'

                                }

                                temp = [products['mainSku']['id'], , '1', products['mainSku']['id'], index, sKuId, '0', 'skuUuid:' + products['skuUuid'] + '@@useUuid:' + products['useUuid']].join(',')

                                if ($.commlist.length > 0) {

                                    $.commlist += '$'

                                }

                                $.commlist += temp

                                $.cartsTotalNum += 1

                            }

                        }

                    }

                    if ($.commlist.length > 0) {

                        $.commlist = encodeURIComponent($.commlist)

                    }

                    console.log(`当前购物车商品数：${$.cartsTotalNum}个\n`)

                }

            } catch (e) {

                $.logErr(e, resp);

            } finally {

                resolve(data);

            }

        });

    })

}


function TotalBean() {

    return new Promise(async resolve => {

        const options = {

            "url": `https://wq.jd.com/user/info/QueryJDUserInfo?sceneval=2`,

            "headers": {

                "Accept": "application/json,text/plain, */*",

                "Content-Type": "application/x-www-form-urlencoded",

                "Accept-Encoding": "gzip, deflate, br",

                "Accept-Language": "zh-cn",

                "Connection": "keep-alive",

                "Cookie": cookie,

                "Referer": "https://wqs.jd.com/my/jingdou/my.shtml?sceneval=2",

                "User-Agent": $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1")

            }

        }

        $.post(options, (err, resp, data) => {

            try {

                if (err) {

                    console.log(`${JSON.stringify(err)}`)

                    console.log(`${$.name} API请求失败，请检查网路重试`)

                } else {

                    if (data) {

                        data = JSON.parse(data);

                        if (data['retcode'] === 13) {

                            $.isLogin = false; //cookie过期

                            return

                        }

                        if (data['retcode'] === 0) {

                            $.nickName = (data['base'] && data['base'].nickname) || $.UserName;

                        } else {

                            $.nickName = $.UserName

                        }

                    } else {

                        console.log(`京东服务器返回空数据`)

                    }

                }

            } catch (e) {

                $.logErr(e, resp)

            } finally {

                resolve();

            }

        })

    })

}

function jsonParse(str) {

    if (typeof str == "string") {

        try {

            return JSON.parse(str);

        } catch (e) {

            console.log(e);

            $.msg($.name, '', '请勿随意在BoxJs输入框修改内容\n建议通过脚本去获取cookie')

            return [];

        }

    }

}

// prettier-ignore

function Env(t, e) { "undefined" != typeof process && JSON.stringify(process.env).indexOf("GITHUB") > -1 && process.exit(0); class s { constructor(t) { this.env = t } send(t, e = "GET") { t = "string" == typeof t ? { url: t } : t; let s = this.get; return "POST" === e && (s = this.post), new Promise((e, i) => { s.call(this, t, (t, s, r) => { t ? i(t) : e(s) }) }) } get(t) { return this.send.call(this.env, t) } post(t) { return this.send.call(this.env, t, "POST") } } return new class { constructor(t, e) { this.name = t, this.http = new s(this), this.data = null, this.dataFile = "box.dat", this.logs = [], this.isMute = !1, this.isNeedRewrite = !1, this.logSeparator = "\n", this.startTime = (new Date).getTime(), Object.assign(this, e), this.log("", `🔔${this.name}, 开始!`) } isNode() { return "undefined" != typeof module && !!module.exports } isQuanX() { return "undefined" != typeof $task } isSurge() { return "undefined" != typeof $httpClient && "undefined" == typeof $loon } isLoon() { return "undefined" != typeof $loon } toObj(t, e = null) { try { return JSON.parse(t) } catch { return e } } toStr(t, e = null) { try { return JSON.stringify(t) } catch { return e } } getjson(t, e) { let s = e; const i = this.getdata(t); if (i) try { s = JSON.parse(this.getdata(t)) } catch { } return s } setjson(t, e) { try { return this.setdata(JSON.stringify(t), e) } catch { return !1 } } getScript(t) { return new Promise(e => { this.get({ url: t }, (t, s, i) => e(i)) }) } runScript(t, e) { return new Promise(s => { let i = this.getdata("@chavy_boxjs_userCfgs.httpapi"); i = i ? i.replace(/\n/g, "").trim() : i; let r = this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout"); r = r ? 1 * r : 20, r = e && e.timeout ? e.timeout : r; const [o, h] = i.split("@"), n = { url: `http://${h}/v1/scripting/evaluate`, body: { script_text: t, mock_type: "cron", timeout: r }, headers: { "X-Key": o, Accept: "*/*" } }; this.post(n, (t, e, i) => s(i)) }).catch(t => this.logErr(t)) } loaddata() { if (!this.isNode()) return {}; { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), i = !s && this.fs.existsSync(e); if (!s && !i) return {}; { const i = s ? t : e; try { return JSON.parse(this.fs.readFileSync(i)) } catch (t) { return {} } } } } writedata() { if (this.isNode()) { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), i = !s && this.fs.existsSync(e), r = JSON.stringify(this.data); s ? this.fs.writeFileSync(t, r) : i ? this.fs.writeFileSync(e, r) : this.fs.writeFileSync(t, r) } } lodash_get(t, e, s) { const i = e.replace(/\[(\d+)\]/g, ".$1").split("."); let r = t; for (const t of i) if (r = Object(r)[t], void 0 === r) return s; return r } lodash_set(t, e, s) { return Object(t) !== t ? t : (Array.isArray(e) || (e = e.toString().match(/[^.[\]]+/g) || []), e.slice(0, -1).reduce((t, s, i) => Object(t[s]) === t[s] ? t[s] : t[s] = Math.abs(e[i + 1]) >> 0 == +e[i + 1] ? [] : {}, t)[e[e.length - 1]] = s, t) } getdata(t) { let e = this.getval(t); if (/^@/.test(t)) { const [, s, i] = /^@(.*?)\.(.*?)$/.exec(t), r = s ? this.getval(s) : ""; if (r) try { const t = JSON.parse(r); e = t ? this.lodash_get(t, i, "") : e } catch (t) { e = "" } } return e } setdata(t, e) { let s = !1; if (/^@/.test(e)) { const [, i, r] = /^@(.*?)\.(.*?)$/.exec(e), o = this.getval(i), h = i ? "null" === o ? null : o || "{}" : "{}"; try { const e = JSON.parse(h); this.lodash_set(e, r, t), s = this.setval(JSON.stringify(e), i) } catch (e) { const o = {}; this.lodash_set(o, r, t), s = this.setval(JSON.stringify(o), i) } } else s = this.setval(t, e); return s } getval(t) { return this.isSurge() || this.isLoon() ? $persistentStore.read(t) : this.isQuanX() ? $prefs.valueForKey(t) : this.isNode() ? (this.data = this.loaddata(), this.data[t]) : this.data && this.data[t] || null } setval(t, e) { return this.isSurge() || this.isLoon() ? $persistentStore.write