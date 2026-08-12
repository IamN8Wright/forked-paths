(async()=>{
  const response=await fetch('/app-v4.js.gz?v=0.4.0',{cache:'no-cache'});
  if(!response.ok)throw new Error('Could not load Forked Paths engine');
  const stream=response.body.pipeThrough(new DecompressionStream('gzip'));
  const code=await new Response(stream).text();
  (0,eval)(code);
  const script=document.createElement('script');
  script.src='/features.js?v=0.4.0';
  script.onload=()=>{if(document.readyState==='complete')window.dispatchEvent(new Event('load'));};
  document.body.appendChild(script);
})().catch(error=>{console.error(error);const story=document.getElementById('storyText');if(story)story.innerHTML='<p>The road cannot be opened right now. Please refresh and try again.</p>';});
