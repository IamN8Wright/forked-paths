(async()=>{
  const response=await fetch('/admin-v4.js.gz?v=0.4.0',{cache:'no-cache'});
  if(!response.ok)throw new Error('Could not load World Builder');
  const stream=response.body.pipeThrough(new DecompressionStream('gzip'));
  const code=await new Response(stream).text();
  (0,eval)(code);
})().catch(error=>{console.error(error);document.body.insertAdjacentHTML('beforeend','<p style="padding:20px;color:#e6a49c">World Builder failed to load. Refresh and try again.</p>');});
