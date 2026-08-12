const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { Pool } = require("pg");

const PORT = Number(process.env.PORT || 3000);
const publicDir = path.join(__dirname, "public");
const dataDir = process.env.DATA_DIR || path.join(__dirname, "data");
const savesFile = path.join(dataDir, "saves.json");
const settingsFile = path.join(dataDir, "settings.json");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "inn8labs@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex");
const DATABASE_URL = process.env.DATABASE_URL || "";
const DEFAULT_SETTINGS = {accent:"#d8ad53", storySize:20, choiceConfirm:true};

let pool = null;
let storageMode = "file-fallback";

fs.mkdirSync(dataDir, {recursive:true});
if(!fs.existsSync(savesFile)) fs.writeFileSync(savesFile, "[]");
if(!fs.existsSync(settingsFile)) fs.writeFileSync(settingsFile, JSON.stringify(DEFAULT_SETTINGS, null, 2));

const mime = {
  ".html":"text/html; charset=utf-8",
  ".css":"text/css; charset=utf-8",
  ".js":"application/javascript; charset=utf-8",
  ".json":"application/json; charset=utf-8",
  ".png":"image/png",
  ".jpg":"image/jpeg",
  ".jpeg":"image/jpeg",
  ".webp":"image/webp",
  ".svg":"image/svg+xml",
  ".ico":"image/x-icon"
};

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
function json(res,status,value,headers={}){res.writeHead(status,{"Content-Type":"application/json; charset=utf-8",...headers});res.end(JSON.stringify(value));}
function readJson(req,limit=3000000){return new Promise((resolve,reject)=>{let body="";req.on("data",c=>{body+=c;if(body.length>limit){reject(new Error("too_large"));req.destroy();}});req.on("end",()=>{try{resolve(body?JSON.parse(body):{});}catch(e){reject(e);}});req.on("error",reject);});}
function loadJson(file,fallback){try{return JSON.parse(fs.readFileSync(file,"utf8"));}catch{return fallback;}}
function saveJson(file,value){const tmp=file+".tmp";fs.writeFileSync(tmp,JSON.stringify(value,null,2));fs.renameSync(tmp,file);}
function signSession(payload){const data=Buffer.from(JSON.stringify(payload)).toString("base64url");const sig=crypto.createHmac("sha256",SESSION_SECRET).update(data).digest("base64url");return `${data}.${sig}`;}
function verifySession(token){if(!token||!token.includes("."))return null;const [data,sig]=token.split(".");const expected=crypto.createHmac("sha256",SESSION_SECRET).update(data).digest("base64url");if(sig.length!==expected.length||!crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(expected)))return null;try{const p=JSON.parse(Buffer.from(data,"base64url").toString("utf8"));return p.exp>Date.now()?p:null;}catch{return null;}}
function cookies(req){return Object.fromEntries((req.headers.cookie||"").split(";").filter(Boolean).map(v=>{const i=v.indexOf("=");return [v.slice(0,i).trim(),decodeURIComponent(v.slice(i+1))];}));}
function getAdminSession(req){const session=verifySession(cookies(req).fp_admin);return session?.kind==="admin"?session:null;}
function getPlayerSession(req){const session=verifySession(cookies(req).fp_player);return session?.kind==="player"?session:null;}
function requireAdmin(req,res){const session=getAdminSession(req);if(!session){json(res,401,{ok:false,error:"Unauthorized"});return null;}return session;}
function requirePlayer(req,res){const session=getPlayerSession(req);if(!session){json(res,401,{ok:false,error:"Please sign in"});return null;}return session;}
function safeEqual(a,b){const A=Buffer.from(String(a)),B=Buffer.from(String(b));return A.length===B.length&&crypto.timingSafeEqual(A,B);}
function sendFile(res,filePath){fs.readFile(filePath,(err,data)=>{if(err){res.writeHead(err.code==="ENOENT"?404:500,{"Content-Type":"text/plain; charset=utf-8"});res.end(err.code==="ENOENT"?"Not found":"Server error");return;}const ext=path.extname(filePath).toLowerCase();res.writeHead(200,{"Content-Type":mime[ext]||"application/octet-stream","Cache-Control":ext===".html"?"no-cache":"public, max-age=3600"});res.end(data);});}
function normalizeEmail(value){return String(value||"").trim().toLowerCase();}
function validEmail(value){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length<=254;}
function validPassword(value){return typeof value==="string" && value.length>=8 && value.length<=128;}
function hashPassword(password){const salt=crypto.randomBytes(16).toString("hex");const hash=crypto.scryptSync(password,salt,64).toString("hex");return `${salt}:${hash}`;}
function verifyPassword(password,stored){try{const [salt,hex]=String(stored||"").split(":");if(!salt||!hex)return false;const actual=crypto.scryptSync(password,salt,64);const expected=Buffer.from(hex,"hex");return actual.length===expected.length&&crypto.timingSafeEqual(actual,expected);}catch{return false;}}
function claimHash(token){return token?crypto.createHash("sha256").update(String(token)).digest("hex"):null;}
function playerCookie(token,maxAge=2592000){return `fp_player=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}; Secure`;}

async function initializePostgres(){
  if(!DATABASE_URL) return false;
  const candidate = new Pool({connectionString:DATABASE_URL, max:5, idleTimeoutMillis:30000});
  let lastError;
  for(let attempt=1; attempt<=20; attempt++){
    try{
      await candidate.query("SELECT 1");
      await candidate.query(`
        CREATE TABLE IF NOT EXISTS player_accounts (
          id TEXT PRIMARY KEY,
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await candidate.query(`
        CREATE TABLE IF NOT EXISTS character_saves (
          id TEXT PRIMARY KEY,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          avatar JSONB,
          state JSONB NOT NULL,
          history JSONB NOT NULL DEFAULT '[]'::jsonb
        )
      `);
      await candidate.query(`ALTER TABLE character_saves ADD COLUMN IF NOT EXISTS owner_id TEXT REFERENCES player_accounts(id) ON DELETE SET NULL`);
      await candidate.query(`ALTER TABLE character_saves ADD COLUMN IF NOT EXISTS claim_token_hash TEXT`);
      await candidate.query(`CREATE INDEX IF NOT EXISTS character_saves_updated_at_idx ON character_saves (updated_at DESC)`);
      await candidate.query(`CREATE INDEX IF NOT EXISTS character_saves_owner_id_idx ON character_saves (owner_id, updated_at DESC)`);
      await candidate.query(`
        CREATE TABLE IF NOT EXISTS app_settings (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          settings JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await candidate.query(
        `INSERT INTO app_settings (id, settings) VALUES (1, $1::jsonb) ON CONFLICT (id) DO NOTHING`,
        [JSON.stringify(DEFAULT_SETTINGS)]
      );
      pool = candidate;
      storageMode = "postgres";
      await migrateFallbackData();
      return true;
    }catch(error){
      lastError = error;
      if(attempt < 20) await sleep(1000);
    }
  }
  await candidate.end().catch(()=>{});
  console.error("Postgres unavailable; using file fallback:", lastError?.message || lastError);
  return false;
}

async function migrateFallbackData(){
  if(!pool) return;
  const count = await pool.query("SELECT COUNT(*)::int AS count FROM character_saves");
  if(Number(count.rows[0]?.count || 0) === 0){
    const saves = loadJson(savesFile, []);
    for(const record of saves){
      if(!record?.id || !record?.state) continue;
      await pool.query(
        `INSERT INTO character_saves (id, created_at, updated_at, avatar, state, history)
         VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6::jsonb)
         ON CONFLICT (id) DO NOTHING`,
        [
          String(record.id),
          record.createdAt || new Date().toISOString(),
          record.updatedAt || new Date().toISOString(),
          JSON.stringify(record.avatar ?? null),
          JSON.stringify(record.state),
          JSON.stringify(Array.isArray(record.history) ? record.history.slice(-500) : [])
        ]
      );
    }
  }
  const existing = await pool.query("SELECT settings FROM app_settings WHERE id=1");
  if(existing.rows.length && JSON.stringify(existing.rows[0].settings) === JSON.stringify(DEFAULT_SETTINGS)){
    const fallbackSettings = loadJson(settingsFile, DEFAULT_SETTINGS);
    if(JSON.stringify(fallbackSettings) !== JSON.stringify(DEFAULT_SETTINGS)){
      await pool.query("UPDATE app_settings SET settings=$1::jsonb, updated_at=NOW() WHERE id=1", [JSON.stringify(fallbackSettings)]);
    }
  }
}

function rowToRecord(row){
  return {
    id: row.id,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    avatar: row.avatar,
    state: row.state,
    history: Array.isArray(row.history) ? row.history : [],
    ownerId: row.owner_id || null
  };
}

async function getSettings(){
  if(pool){
    const result = await pool.query("SELECT settings FROM app_settings WHERE id=1");
    return result.rows[0]?.settings || DEFAULT_SETTINGS;
  }
  return loadJson(settingsFile, DEFAULT_SETTINGS);
}

async function setSettings(settings){
  if(pool){
    await pool.query(
      `INSERT INTO app_settings (id, settings, updated_at) VALUES (1, $1::jsonb, NOW())
       ON CONFLICT (id) DO UPDATE SET settings=EXCLUDED.settings, updated_at=NOW()`,
      [JSON.stringify(settings)]
    );
    return;
  }
  saveJson(settingsFile, settings);
}

async function upsertCharacter(body,playerSession){
  const id = String(body.id || crypto.randomUUID());
  const avatar = body.avatar ?? null;
  const history = Array.isArray(body.history) ? body.history.slice(-500) : [];
  const tokenHash = claimHash(body.claimToken);
  if(pool){
    const existing = await pool.query("SELECT owner_id, claim_token_hash FROM character_saves WHERE id=$1", [id]);
    if(existing.rows.length){
      const row = existing.rows[0];
      if(row.owner_id){
        if(!playerSession || row.owner_id!==playerSession.userId){
          const error=new Error("forbidden");error.code="forbidden";throw error;
        }
      }else if(row.claim_token_hash && (!tokenHash || !safeEqual(row.claim_token_hash,tokenHash))){
        const error=new Error("claim_mismatch");error.code="claim_mismatch";throw error;
      }
      await pool.query(
        `UPDATE character_saves
         SET updated_at=NOW(), avatar=$2::jsonb, state=$3::jsonb, history=$4::jsonb,
             claim_token_hash=COALESCE(claim_token_hash,$5)
         WHERE id=$1`,
        [id, JSON.stringify(avatar), JSON.stringify(body.state), JSON.stringify(history), tokenHash]
      );
      return id;
    }
    await pool.query(
      `INSERT INTO character_saves (id, avatar, state, history, owner_id, claim_token_hash)
       VALUES ($1, $2::jsonb, $3::jsonb, $4::jsonb, $5, $6)`,
      [id, JSON.stringify(avatar), JSON.stringify(body.state), JSON.stringify(history), playerSession?.userId||null, tokenHash]
    );
    return id;
  }
  const saves=loadJson(savesFile,[]),now=new Date().toISOString(),current=saves.find(x=>x.id===id);
  const record={id,createdAt:current?.createdAt||now,updatedAt:now,avatar:avatar||current?.avatar||null,state:body.state,history:history.length?history:current?.history||[]};
  const next=current?saves.map(x=>x.id===id?record:x):[record,...saves];
  saveJson(savesFile,next.slice(0,1000));
  return id;
}

async function listCharacters(){
  if(pool){
    const result = await pool.query("SELECT id, created_at, updated_at, avatar, state, history, owner_id FROM character_saves ORDER BY updated_at DESC LIMIT 1000");
    return result.rows.map(rowToRecord);
  }
  return loadJson(savesFile,[]);
}

async function getCharacter(id){
  if(pool){
    const result = await pool.query("SELECT id, created_at, updated_at, avatar, state, history, owner_id FROM character_saves WHERE id=$1", [id]);
    return result.rows[0] ? rowToRecord(result.rows[0]) : null;
  }
  return loadJson(savesFile,[]).find(r=>r.id===id) || null;
}

async function listPlayerCharacters(userId){
  if(!pool) return [];
  const result=await pool.query(
    "SELECT id, created_at, updated_at, avatar, state, history, owner_id FROM character_saves WHERE owner_id=$1 ORDER BY updated_at DESC",
    [userId]
  );
  return result.rows.map(rowToRecord);
}

function characterSummary(r){
  return {
    id:r.id,createdAt:r.createdAt,updatedAt:r.updatedAt,avatar:r.avatar,
    name:r.state?.player?.name||"Traveler",origin:r.state?.player?.origin,style:r.state?.player?.style,
    health:r.state?.player?.health,maxHealth:r.state?.player?.maxHealth,gold:r.state?.player?.gold,
    reputation:r.state?.player?.reputation,location:r.state?.world?.location,day:r.state?.world?.day,
    scene:r.state?.scene,companion:r.state?.companion?.name||r.state?.companion?.kind||null,
    historyCount:r.history?.length||0
  };
}

async function createPlayerAccount(email,password){
  if(!pool){const error=new Error("storage");error.code="storage";throw error;}
  const id=crypto.randomUUID();
  try{
    await pool.query(
      "INSERT INTO player_accounts (id,email,password_hash) VALUES ($1,$2,$3)",
      [id,email,hashPassword(password)]
    );
    return {id,email};
  }catch(error){
    if(error.code==="23505"){const duplicate=new Error("duplicate");duplicate.code="duplicate";throw duplicate;}
    throw error;
  }
}

async function authenticatePlayer(email,password){
  if(!pool) return null;
  const result=await pool.query("SELECT id,email,password_hash FROM player_accounts WHERE email=$1",[email]);
  const row=result.rows[0];
  if(!row||!verifyPassword(password,row.password_hash))return null;
  await pool.query("UPDATE player_accounts SET updated_at=NOW() WHERE id=$1",[row.id]);
  return {id:row.id,email:row.email};
}

async function claimCharacter(userId,id,claimToken){
  if(!pool){const error=new Error("storage");error.code="storage";throw error;}
  const result=await pool.query("SELECT owner_id,claim_token_hash FROM character_saves WHERE id=$1",[id]);
  if(!result.rows.length){const error=new Error("missing");error.code="missing";throw error;}
  const row=result.rows[0];
  if(row.owner_id===userId)return true;
  if(row.owner_id){const error=new Error("owned");error.code="owned";throw error;}
  const tokenHash=claimHash(claimToken);
  if(!row.claim_token_hash||!tokenHash||!safeEqual(row.claim_token_hash,tokenHash)){const error=new Error("claim");error.code="claim";throw error;}
  await pool.query("UPDATE character_saves SET owner_id=$1,updated_at=NOW() WHERE id=$2",[userId,id]);
  return true;
}

const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url||"/",`http://${req.headers.host||"localhost"}`);
  const pathname=decodeURIComponent(url.pathname);
  try{
    if(pathname==="/health")return json(res,200,{ok:true,game:"Forked Paths",version:"0.3.0",storage:storageMode});
    if(pathname==="/api/settings"&&req.method==="GET")return json(res,200,await getSettings());

    if(pathname==="/api/player/register"&&req.method==="POST"){
      if(!pool)return json(res,503,{ok:false,error:"Player accounts are temporarily unavailable"});
      try{
        const body=await readJson(req,20000),email=normalizeEmail(body.email),password=body.password;
        if(!validEmail(email))return json(res,400,{ok:false,error:"Enter a valid email address"});
        if(!validPassword(password))return json(res,400,{ok:false,error:"Password must be 8–128 characters"});
        const player=await createPlayerAccount(email,password);
        const token=signSession({kind:"player",userId:player.id,email:player.email,exp:Date.now()+2592000000});
        return json(res,201,{ok:true,email:player.email},{"Set-Cookie":playerCookie(token)});
      }catch(error){
        if(error.code==="duplicate")return json(res,409,{ok:false,error:"An account already exists for that email"});
        return json(res,400,{ok:false,error:"Could not create account"});
      }
    }

    if(pathname==="/api/player/login"&&req.method==="POST"){
      try{
        const body=await readJson(req,20000),email=normalizeEmail(body.email),password=String(body.password||"");
        const player=await authenticatePlayer(email,password);
        if(!player)return json(res,401,{ok:false,error:"Invalid email or password"});
        const token=signSession({kind:"player",userId:player.id,email:player.email,exp:Date.now()+2592000000});
        return json(res,200,{ok:true,email:player.email},{"Set-Cookie":playerCookie(token)});
      }catch{return json(res,400,{ok:false,error:"Invalid request"});}
    }

    if(pathname==="/api/player/logout"&&req.method==="POST"){
      return json(res,200,{ok:true},{"Set-Cookie":playerCookie("",0)});
    }

    if(pathname==="/api/player/session"&&req.method==="GET"){
      const session=requirePlayer(req,res);if(!session)return;
      return json(res,200,{ok:true,email:session.email});
    }

    if(pathname==="/api/player/characters"&&req.method==="GET"){
      const session=requirePlayer(req,res);if(!session)return;
      return json(res,200,{characters:(await listPlayerCharacters(session.userId)).map(characterSummary)});
    }

    if(pathname.startsWith("/api/player/characters/")&&req.method==="GET"){
      const session=requirePlayer(req,res);if(!session)return;
      const id=decodeURIComponent(pathname.split("/").pop());
      const record=await getCharacter(id);
      if(!record||record.ownerId!==session.userId)return json(res,404,{ok:false,error:"Character not found"});
      return json(res,200,{id:record.id,createdAt:record.createdAt,updatedAt:record.updatedAt,avatar:record.avatar,state:record.state,history:record.history});
    }

    if(pathname==="/api/player/claim"&&req.method==="POST"){
      const session=requirePlayer(req,res);if(!session)return;
      try{
        const body=await readJson(req,20000);
        await claimCharacter(session.userId,String(body.id||""),String(body.claimToken||""));
        return json(res,200,{ok:true});
      }catch(error){
        if(error.code==="missing")return json(res,404,{ok:false,error:"Character not found"});
        if(error.code==="owned")return json(res,409,{ok:false,error:"That character is already linked to another account"});
        if(error.code==="claim")return json(res,403,{ok:false,error:"This device cannot verify ownership of that character"});
        return json(res,400,{ok:false,error:"Could not link character"});
      }
    }

    if(pathname==="/api/save"&&req.method==="POST"){
      try{
        const body=await readJson(req);
        if(!body.state?.player?.name)return json(res,400,{ok:false,error:"Invalid save"});
        const id=await upsertCharacter(body,getPlayerSession(req));
        return json(res,200,{ok:true,id});
      }catch(e){
        if(e.code==="forbidden")return json(res,403,{ok:false,error:"Sign in to the account that owns this character"});
        if(e.code==="claim_mismatch")return json(res,403,{ok:false,error:"This device cannot update that unlinked character"});
        return json(res,e.message==="too_large"?413:400,{ok:false,error:"Could not save"});
      }
    }

    if(pathname==="/api/admin/login"&&req.method==="POST"){
      if(!ADMIN_PASSWORD)return json(res,503,{ok:false,error:"Admin login is not configured"});
      try{
        const body=await readJson(req,10000);
        if(!safeEqual(body.email||"",ADMIN_EMAIL)||!safeEqual(body.password||"",ADMIN_PASSWORD))return json(res,401,{ok:false,error:"Invalid credentials"});
        const token=signSession({kind:"admin",email:ADMIN_EMAIL,exp:Date.now()+43200000});
        return json(res,200,{ok:true,email:ADMIN_EMAIL},{"Set-Cookie":`fp_admin=${encodeURIComponent(token)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200; Secure`});
      }catch{return json(res,400,{ok:false,error:"Invalid request"});}
    }
    if(pathname==="/api/admin/logout"&&req.method==="POST")return json(res,200,{ok:true},{"Set-Cookie":"fp_admin=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0; Secure"});
    if(pathname==="/api/admin/session"&&req.method==="GET"){
      const s=requireAdmin(req,res);if(!s)return;
      return json(res,200,{ok:true,email:s.email});
    }
    if(pathname==="/api/admin/characters"&&req.method==="GET"){
      if(!requireAdmin(req,res))return;
      const saves=(await listCharacters()).map(characterSummary);
      return json(res,200,{characters:saves});
    }
    if(pathname.startsWith("/api/admin/characters/")&&req.method==="GET"){
      if(!requireAdmin(req,res))return;
      const id=decodeURIComponent(pathname.split("/").pop()),record=await getCharacter(id);
      return record?json(res,200,record):json(res,404,{error:"Not found"});
    }
    if(pathname==="/api/admin/settings"&&req.method==="PUT"){
      if(!requireAdmin(req,res))return;
      try{
        const body=await readJson(req,100000);
        const next={
          accent:/^#[0-9a-f]{6}$/i.test(body.accent||"")?body.accent:"#d8ad53",
          storySize:Math.max(16,Math.min(28,Number(body.storySize)||20)),
          choiceConfirm:body.choiceConfirm!==false
        };
        await setSettings(next);
        return json(res,200,{ok:true,settings:next});
      }catch{return json(res,400,{ok:false});}
    }

    let filePath;
    if(pathname==="/admin"||pathname==="/admin/")filePath=path.join(publicDir,"admin.html");
    else if(pathname==="/contact"||pathname==="/contact/")filePath=path.join(publicDir,"contact.html");
    else{
      const p=pathname==="/"?"/index.html":pathname;
      filePath=path.normalize(path.join(publicDir,p));
    }
    if(!filePath.startsWith(publicDir)){res.writeHead(403,{"Content-Type":"text/plain; charset=utf-8"});return res.end("Forbidden");}
    fs.stat(filePath,(err,stat)=>{if(!err&&stat.isFile())return sendFile(res,filePath);sendFile(res,path.join(publicDir,"index.html"));});
  }catch(error){
    console.error("Request failed:", error);
    if(!res.headersSent) json(res,500,{ok:false,error:"Server error"});
    else res.end();
  }
});

initializePostgres()
  .catch(error=>console.error("Storage initialization failed:",error))
  .finally(()=>server.listen(PORT,"0.0.0.0",()=>console.log(`Forked Paths listening on port ${PORT} (${storageMode})`)));
