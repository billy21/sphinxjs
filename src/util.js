'use strict';
var fs = require('fs');
var path = require('path');
var ext = require('./ext');
var _ = module.exports = {};

var TEXT_EXTS = [
    ext.js,
    ext.css,
    ext.scss,
    ext.sass,
    ext.less,
    ext.tmpl,
    ext.tpl,
    ext.html,
    // todo 此处应该可以配置
    // symbol 设置为文本文件
    ext.symbol
];

var IMAGE_EXTS = [
    ext.png,
    ext.gif,
    ext.jpeg,
    ext.jpg,
    ext.webp
];

var JS_EXTS = [
    ext.js
];

var ES_EXTS = [
    ext.es
];

var JSX_EXTS = [
    ext.jsx
];

var CSS_EXTS = [
    ext.css,
    ext.scss,
    ext.sass
];

var TPL_EXTS = [
    ext.tmpl,
    ext.tpl
];

var HTML_EXTS = [
    ext.html
];

var MIME_MAP = {};

// TEXT
MIME_MAP[ext.css] = 'text/css';
MIME_MAP[ext.less] = 'text/css';
MIME_MAP[ext.sass] = 'text/css';
MIME_MAP[ext.scss] = 'text/css';
MIME_MAP[ext.js] = 'text/javascript';
MIME_MAP[ext.tmpl] = 'text/html';
MIME_MAP[ext.tpl] = 'text/html';
MIME_MAP[ext.html] = 'text/html';

// IMAGE
MIME_MAP[ext.png] = 'image/png';
MIME_MAP[ext.gif] = 'image/gif';
MIME_MAP[ext.jpeg] = 'image/jpeg';
MIME_MAP[ext.jpg] = 'image/jpg';
MIME_MAP[ext.webp] = 'image/webp';

var EXT_MAP = {};

EXT_MAP[ext.less] = ext.css;
EXT_MAP[ext.sass] = ext.css;
EXT_MAP[ext.scss] = ext.css;

_.escapeReg = function (str) {
    return str.replace(/[\.\\\+\*\?\[\^\]\$\(\){}=!<>\|:\/]/g, '\\$&');
};

_.getReleaseExt = function (ext) {
    var rExt;

    rExt = EXT_MAP[ext];

    return rExt || ext;
};

_.exists = fs.existsSync || path.existsSync;

_.isFile = function (filepath) {
    return _.exists(filepath) && fs.statSync(filepath).isFile();
};

_.isDir = function (filepath) {
    return _.exists(filepath) && fs.statSync(filepath).isDirectory();
};

_.isText = function (extname) {
    return TEXT_EXTS.indexOf(extname) > -1;
};

_.isImage = function (extname) {
    return IMAGE_EXTS.indexOf(extname) > -1;
};

_.isJs = function (extname) {
    return JS_EXTS.indexOf(extname) > -1;
};

_.isCss = function (extname) {
    return CSS_EXTS.indexOf(extname) > -1;
};

_.isHtml = function (extname) {
    return HTML_EXTS.indexOf(extname) > -1;
};

_.isEs = function (extname) {
    return ES_EXTS.indexOf(extname) > -1;
};

_.isJsx = function (extname) {
    return JSX_EXTS.indexOf(extname) > -1;
};

_.isTpl = function (extname) {
    return TPL_EXTS.indexOf(extname) > -1;
};

_.dirname = function (filepath) {
    return path.dirname(filepath);
};

_.extname = function (filepath) {
    return path.extname(filepath);
};

_.basename = function (filepath) {
    return path.basename(filepath);
};

_.relative = function (root, filepath) {
    return path.relative(root, filepath);
};

// 获取 query hash
_.query = function (str) {
    var rest = str;
    var pos = rest.indexOf('#');
    var hash = '';
    var query = '';

    if (pos > -1) {
        hash = rest.substring(pos);
        rest = rest.substring(0, pos);
    }

    pos = rest.indexOf('?');

    if (pos > -1) {
        query = rest.substring(pos);
        rest = rest.substring(0, pos);
    }

    rest = rest.replace(/\\/g, '/');

    if (rest !== '/') {
        rest = rest.replace(/\/\.?$/, '');
    }

    return {
        origin: str,
        realpath: rest,
        hash: hash,
        query: query
    };
};

// 获取字符串引号
_.stringQuote = function (str, quotes) {
    var info = {
        origin: str,
        realpath: str = str.trim(),
        quote: ''
    };
    var strLen, i, c;

    if (str) {
        quotes = quotes || '\'"';
        strLen = str.length - 1;
        for (i = 0; i < quotes.length; i++) {
            c = quotes[i];
            if (str[0] === c && str[strLen] === c) {
                info.quote = c;
                info.realpath = str.substring(1, strLen);
                break;
            }
        }
    }

    return info;
};

/*
 * realpath 文件物理地址
 * release 文件发布后地址
 */
// todo 对于 http 开头的文件处理
_.uri = function (filepath, dirname, cwd) {
    var info = _.stringQuote(filepath);
    var qInfo = _.query(info.realpath);
    var reg;

    info.query = qInfo.query;
    info.hash = qInfo.hash;
    info.realpath = qInfo.realpath;

    if (info.realpath) {
        filepath = info.realpath;
        if (filepath.indexOf(':') === -1) {
            // 绝对路径
            if (filepath[0] === '/') {
                filepath = [cwd, filepath].join('/');
            // 相对路径
            } else if (dirname) {
                filepath = [dirname, filepath].join('/');
            }

            // filepath = filepath.replace(/[\/\\]+/g, '/').replace(/\\/g, '/');
            filepath = filepath.replace(/[\/\\]+/g, '/');
            filepath = path.normalize(filepath);

            if (filepath !== '/') {
                filepath = filepath.replace(/\/$/, '');
            }

            info.realpath = filepath;
            // 判断文件是否存在
            info.exists = _.exists(info.realpath);

            // extname
            info.extname = _.extname(info.realpath);
            info.rExtname = _.getReleaseExt(info.extname);

            // 文件发布后地址
            reg = new RegExp(_.escapeReg(info.extname) + '$|' + _.escapeReg(info.rExtname) + '$', 'i');
            info.release = info.realpath.replace(reg, info.rExtname);

            if (info.release.indexOf(cwd) === 0) {
                info.url = info.release.substring(cwd.length);
                info.id = info.url.replace(/^\//, '');
            }
            info.dirname = _.dirname(info.release);
            info.basename = _.basename(info.release);
        }
    }

    return info;
};

_.base64 = function (data, extname) {
    var prefix;

    if (extname) {
        prefix = MIME_MAP[extname] || 'application/x-' + extname;
        prefix = 'data:' + prefix + ';base64,';
    }

    if (data instanceof Buffer) {
        // do nothing for quickly determining.
    } else if (data instanceof Array) {
        data = new Buffer(data);
    } else {
        // convert to string.
        data = new Buffer(String(data || ''));
    }
    return prefix + data.toString('base64');
};

