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
    await loadScript('/data/decision-cards-v2.js?v=2.0.0');
    await loadScript('/app-v2.js?v=2.0.0');
    await loadScript('/features.js?v=2.0.0');
    if(document.readyState==='complete') window.dispatchEvent(new Event('load'));
  }

  boot().catch(error=>{
    console.error('Forked Kingdoms 2.0 boot failed:',error);
    const start=document.querySelector('#startScreen .hero-card');
    if(start) start.insertAdjacentHTML('beforeend','<p class="system">The road could not be opened. Please refresh the page.</p>');
  });
})();