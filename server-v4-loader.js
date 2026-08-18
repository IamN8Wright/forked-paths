const _fs=require('fs');
const _path=require('path');
const _zlib=require('zlib');
const _http=require('http');
const _crypto=require('crypto');
const {Pool:_Pool}=require('pg');

const _originalCreateServer=_http.createServer.bind(_http);
const _marketingPool=process.env.DATABASE_URL?new _Pool({connectionString:process.env.DATABASE_URL,max:2,idleTimeoutMillis:30000}):null;
let _marketingReady=null;
let _cardMediaReady=null;

function _json(res,status,value,headers={}){res.writeHead(status,{"Content-Type":"application/json; charset=utf-8",...headers});res.end(JSON.stringify(value));}
function _cookies(req){return Object.fromEntries((req.headers.cookie||'').split(';').filter(Boolean).map(v=>{const i=v.indexOf('=');return [v.slice(0,i).trim(),decodeURIComponent(v.slice(i+1))];}));}
function _verifySession(token,kind){
  if(!token||!process.env.SESSION_SECRET||!token.includes('.'))return null;
  const [data,sig]=token.split('.');
  const expected=_crypto.createHmac('sha256',process.env.SESSION_SECRET).update(data).digest('base64url');
  if(sig.length!==expected.length||!_crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(expected)))return null;
  try{const payload=JSON.parse(Buffer.from(data,'base64url').toString('utf8'));return payload.exp>Date.now()&&payload.kind===kind?payload:null;}catch{return null;}
}
function _readBody(req,limit=3_500_000){return new Promise((resolve,reject)=>{let size=0,data='';req.on('data',c=>{size+=c.length;if(size>limit){reject(new Error('payload_too_large'));req.destroy();return;}data+=c;});req.on('end',()=>resolve(data));req.on('error',reject);});}
async function _ensureMarketing(){
  if(!_marketingPool)throw new Error('marketing_storage_unavailable');
  if(!_marketingReady)_marketingReady=_marketingPool.query(`
    CREATE TABLE IF NOT EXISTS marketing_subscribers (
      email TEXT PRIMARY KEY,
      user_id TEXT REFERENCES player_accounts(id) ON DELETE SET NULL,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      source TEXT NOT NULL DEFAULT 'account_creation',
      opted_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      opted_out_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await _marketingReady;
}
async function _ensureCardMedia(){
  if(!_marketingPool)throw new Error('card_media_storage_unavailable');
  if(!_cardMediaReady)_cardMediaReady=_marketingPool.query(`
    CREATE TABLE IF NOT EXISTS card_media (
      media_key TEXT PRIMARY KEY,
      data_url TEXT NOT NULL,
      alt_text TEXT NOT NULL DEFAULT '',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await _cardMediaReady;
}
async function _cardMediaRoute(req,res,url){
  if(!url.pathname.startsWith('/api/card-media')&&!url.pathname.startsWith('/api/admin/card-media'))return false;
  try{
    await _ensureCardMedia();
    if(url.pathname==='/api/card-media'&&req.method==='GET'){
      const result=await _marketingPool.query('SELECT media_key,data_url,alt_text,updated_at FROM card_media ORDER BY media_key');
      return _json(res,200,{ok:true,media:Object.fromEntries(result.rows.map(r=>[r.media_key,{src:r.data_url,alt:r.alt_text,updatedAt:r.updated_at}]))},{"Cache-Control":"no-store"}),true;
    }
    const admin=_verifySession(_cookies(req).fp_admin,'admin');
    if(!admin)return _json(res,401,{ok:false,error:'Unauthorized'}),true;
    if(url.pathname==='/api/admin/card-media'&&req.method==='GET'){
      const result=await _marketingPool.query('SELECT media_key,data_url,alt_text,updated_at FROM card_media ORDER BY media_key');
      return _json(res,200,{ok:true,media:Object.fromEntries(result.rows.map(r=>[r.media_key,{src:r.data_url,alt:r.alt_text,updatedAt:r.updated_at}]))},{"Cache-Control":"no-store"}),true;
    }
    if(url.pathname==='/api/admin/card-media'&&req.method==='POST'){
      const raw=await _readBody(req);let body={};try{body=JSON.parse(raw||'{}');}catch{return _json(res,400,{ok:false,error:'Invalid JSON'}),true;}
      const key=String(body.key||'').trim();const src=String(body.src||'');const alt=String(body.alt||'').slice(0,240);
      if(!/^(scene|family):[A-Za-z0-9_-]{1,80}$/.test(key))return _json(res,400,{ok:false,error:'Invalid media key'}),true;
      if(!/^data:image\/(jpeg|png|webp);base64,/i.test(src))return _json(res,400,{ok:false,error:'Please upload a JPG, PNG, or WebP image'}),true;
      if(src.length>3_000_000)return _json(res,413,{ok:false,error:'Image is too large after resizing'}),true;
      await _marketingPool.query(`INSERT INTO card_media(media_key,data_url,alt_text,updated_at) VALUES($1,$2,$3,NOW()) ON CONFLICT(media_key) DO UPDATE SET data_url=EXCLUDED.data_url,alt_text=EXCLUDED.alt_text,updated_at=NOW()`,[key,src,alt]);
      return _json(res,200,{ok:true,key}),true;
    }
    if(url.pathname==='/api/admin/card-media'&&req.method==='DELETE'){
      const key=url.searchParams.get('key')||'';await _marketingPool.query('DELETE FROM card_media WHERE media_key=$1',[key]);return _json(res,200,{ok:true}),true;
    }
    return _json(res,404,{ok:false,error:'Not found'}),true;
  }catch(error){console.error('Card media route error:',error.message);return _json(res,error.message==='payload_too_large'?413:500,{ok:false,error:error.message==='payload_too_large'?'Upload too large':'Card artwork could not be saved'}),true;}
}
async function _marketingRoute(req,res,url){
  if(!url.pathname.startsWith('/api/marketing')&&!url.pathname.startsWith('/api/admin/marketing'))return false;
  try{
    await _ensureMarketing();
    if(url.pathname==='/api/marketing/subscribe'&&req.method==='POST'){
      const session=_verifySession(_cookies(req).fp_player,'player');
      if(!session)return _json(res,401,{ok:false,error:'Please sign in first'}),true;
      const result=await _marketingPool.query('SELECT email FROM player_accounts WHERE id=$1',[session.userId]);
      const email=result.rows[0]?.email;
      if(!email)return _json(res,404,{ok:false,error:'Account not found'}),true;
      await _marketingPool.query(`INSERT INTO marketing_subscribers(email,user_id,active,source,opted_in_at,opted_out_at,updated_at)
        VALUES($1,$2,TRUE,'account_creation',NOW(),NULL,NOW())
        ON CONFLICT(email) DO UPDATE SET user_id=EXCLUDED.user_id,active=TRUE,source=EXCLUDED.source,opted_in_at=NOW(),opted_out_at=NULL,updated_at=NOW()`,[email,session.userId]);
      return _json(res,200,{ok:true}),true;
    }
    if(url.pathname==='/api/marketing/unsubscribe'&&req.method==='POST'){
      const session=_verifySession(_cookies(req).fp_player,'player');
      if(!session)return _json(res,401,{ok:false,error:'Please sign in first'}),true;
      const result=await _marketingPool.query('SELECT email FROM player_accounts WHERE id=$1',[session.userId]);
      const email=result.rows[0]?.email;
      if(email)await _marketingPool.query('UPDATE marketing_subscribers SET active=FALSE,opted_out_at=NOW(),updated_at=NOW() WHERE email=$1',[email]);
      return _json(res,200,{ok:true}),true;
    }
    if(url.pathname==='/api/marketing/status'&&req.method==='GET'){
      const session=_verifySession(_cookies(req).fp_player,'player');
      if(!session)return _json(res,401,{ok:false,error:'Please sign in first'}),true;
      const result=await _marketingPool.query(`SELECT m.active FROM player_accounts p LEFT JOIN marketing_subscribers m ON lower(m.email)=lower(p.email) WHERE p.id=$1`,[session.userId]);
      return _json(res,200,{ok:true,subscribed:result.rows[0]?.active===true}),true;
    }
    if(url.pathname==='/api/admin/marketing/subscribers.csv'&&req.method==='GET'){
      const admin=_verifySession(_cookies(req).fp_admin,'admin');
      if(!admin){_json(res,401,{ok:false,error:'Unauthorized'});return true;}
      const result=await _marketingPool.query('SELECT email,opted_in_at,source FROM marketing_subscribers WHERE active=TRUE ORDER BY opted_in_at DESC');
      const rows=['email,opted_in_at,source',...result.rows.map(r=>`"${String(r.email).replace(/"/g,'""')}","${new Date(r.opted_in_at).toISOString()}","${String(r.source).replace(/"/g,'""')}"`)];
      res.writeHead(200,{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":"attachment; filename=inn8labs-email-subscribers.csv","Cache-Control":"no-store"});res.end(rows.join('\n'));return true;
    }
    _json(res,404,{ok:false,error:'Not found'});return true;
  }catch(error){console.error('Marketing route error:',error.message);_json(res,500,{ok:false,error:'Email preference could not be saved'});return true;}
}

_http.createServer=function(listener){
  return _originalCreateServer(async(req,res)=>{
    const url=new URL(req.url||'/',`http://${req.headers.host||'localhost'}`);
    if(await _cardMediaRoute(req,res,url))return;
    if(await _marketingRoute(req,res,url))return;
    return listener(req,res);
  });
};

const _code=_zlib.gunzipSync(_fs.readFileSync(_path.join(__dirname,'server-v4.js.gz'))).toString('utf8');
eval(_code);
