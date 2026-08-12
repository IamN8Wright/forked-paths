(() => {
  function loadScript(src){
    return new Promise((resolve,reject)=>{
      const script=document.createElement('script');
      script.src=src;
      script.onload=resolve;
      script.onerror=()=>reject(new Error(`Could not load ${src}`));
      document.body.appendChild(script);
    });
  }

  async function boot(){
    // v0.4.1 hotfix: use the proven browser engine directly. The World Builder,
    // Postgres content, accounts and admin APIs remain on v0.4.0 server-side.
    await loadScript('/app.js?v=0.4.1');
    await loadScript('/features.js?v=0.4.1');
    if(document.readyState==='complete') window.dispatchEvent(new Event('load'));
  }

  boot().catch(error=>{
    console.error('Forked Paths boot failed:',error);
    const start=document.querySelector('#startScreen .hero-card');
    if(start) start.insertAdjacentHTML('beforeend','<p class="system">The road could not be opened. Please refresh the page.</p>');
  });
})();
