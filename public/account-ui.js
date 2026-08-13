(() => {
  const BUILD = "0.4.2";
  const drawerBody = document.getElementById("drawerBody");

  function enhanceAccountPanel(){
    const legacyForm = document.querySelector("#drawerBody .player-login-form");
    if(!legacyForm) return;
    legacyForm.outerHTML = `
      <div class="account-entry-choice">
        <button class="primary" type="button" data-account-ui="login">Sign In to Existing Account</button>
        <div class="account-choice-divider"><span>or</span></div>
        <button class="secondary" type="button" data-account-ui="register">Create an Account</button>
      </div>`;
    const engineLine=document.querySelector(".engine-line");
    if(engineLine) engineLine.textContent=`InN8 Labs · Forked Paths Engine v${BUILD}`;
  }

  function ensureModal(){
    if(document.getElementById("accountModal")) return;
    document.body.insertAdjacentHTML("beforeend", `
      <div id="accountModal" class="account-modal-backdrop" hidden>
        <section class="account-modal" role="dialog" aria-modal="true" aria-labelledby="accountModalTitle">
          <div class="account-modal-head">
            <div><div class="eyebrow">PLAYER ACCOUNT</div><h2 id="accountModalTitle">Sign In</h2></div>
            <button class="ghost-btn account-modal-close" type="button" aria-label="Close">✕</button>
          </div>
          <p id="accountModalIntro" class="muted"></p>
          <div class="account-modal-form">
            <label>Email<input id="accountModalEmail" type="email" autocomplete="email" inputmode="email" placeholder="you@example.com"></label>
            <label>Password<input id="accountModalPassword" type="password" autocomplete="current-password" minlength="8" maxlength="128"></label>
            <label id="accountConfirmWrap" hidden>Confirm password<input id="accountModalConfirm" type="password" autocomplete="new-password" minlength="8" maxlength="128"></label>
            <label id="marketingOptInWrap" class="marketing-optin" hidden>
              <input id="marketingOptIn" type="checkbox">
              <span><strong>Keep me posted.</strong><small>Send me occasional InN8 Labs news, Forked Paths updates, playtests, and release announcements. You can unsubscribe later.</small></span>
            </label>
            <div id="accountModalError" class="account-modal-error" aria-live="polite"></div>
            <button id="accountModalSubmit" class="primary" type="button">Sign In</button>
          </div>
        </section>
      </div>`);
  }

  function openModal(mode){
    ensureModal();
    const modal=document.getElementById("accountModal");
    const creating=mode==="register";
    modal.dataset.mode=mode;
    document.getElementById("accountModalTitle").textContent=creating?"Create Your Account":"Welcome Back";
    document.getElementById("accountModalIntro").textContent=creating
      ? "Create one account for your travelers, then link existing characters or start new ones from any device."
      : "Sign in to retrieve the travelers already linked to your account.";
    document.getElementById("accountConfirmWrap").hidden=!creating;
    document.getElementById("marketingOptInWrap").hidden=!creating;
    const password=document.getElementById("accountModalPassword");
    password.autocomplete=creating?"new-password":"current-password";
    document.getElementById("accountModalSubmit").textContent=creating?"Create Account":"Sign In";
    document.getElementById("accountModalError").textContent="";
    password.value="";
    document.getElementById("accountModalConfirm").value="";
    document.getElementById("marketingOptIn").checked=false;
    modal.hidden=false;
    setTimeout(()=>document.getElementById("accountModalEmail")?.focus(),0);
  }

  function closeModal(){const modal=document.getElementById("accountModal");if(modal) modal.hidden=true;}

  async function request(url, options={}){
    const response=await fetch(url,{headers:{"Content-Type":"application/json",...(options.headers||{})},...options});
    let body={};try{body=await response.json();}catch{}
    if(!response.ok) throw new Error(body.error||"Request failed");
    return body;
  }

  async function submitAccount(){
    const modal=document.getElementById("accountModal");if(!modal)return;
    const mode=modal.dataset.mode||"login";
    const email=document.getElementById("accountModalEmail").value.trim();
    const password=document.getElementById("accountModalPassword").value;
    const confirm=document.getElementById("accountModalConfirm").value;
    const error=document.getElementById("accountModalError");
    const submit=document.getElementById("accountModalSubmit");
    error.textContent="";
    if(!email||!password){error.textContent="Enter your email and password.";return;}
    if(mode==="register"&&password!==confirm){error.textContent="Those passwords do not match.";return;}
    submit.disabled=true;submit.textContent=mode==="register"?"Creating…":"Signing In…";
    try{
      await request(`/api/player/${mode}`,{method:"POST",body:JSON.stringify({email,password})});
      if(mode==="register"&&document.getElementById("marketingOptIn").checked){
        try{await request("/api/marketing/subscribe",{method:"POST",body:"{}"});}
        catch(marketingError){console.warn("Marketing opt-in could not be stored",marketingError);}
      }
      location.reload();
    }catch(accountError){
      error.textContent=accountError.message;submit.disabled=false;submit.textContent=mode==="register"?"Create Account":"Sign In";
    }
  }

  document.addEventListener("click", event => {
    const action=event.target.closest?.("[data-account-ui]");
    if(action){event.preventDefault();event.stopPropagation();openModal(action.dataset.accountUi);return;}
    if(event.target.closest?.(".account-modal-close")){closeModal();return;}
    if(event.target.id==="accountModalSubmit"){submitAccount();return;}
    if(event.target.id==="accountModal"&&event.target.classList.contains("account-modal-backdrop")) closeModal();
    if(event.target.closest?.("#menuBtn")){setTimeout(enhanceAccountPanel,80);setTimeout(enhanceAccountPanel,240);}
  }, true);

  document.addEventListener("keydown", event => {
    const modal=document.getElementById("accountModal");
    if(event.key==="Escape"&&modal&&!modal.hidden){closeModal();return;}
    if(event.key==="Enter"&&modal&&!modal.hidden&&["accountModalEmail","accountModalPassword","accountModalConfirm"].includes(event.target.id)){event.preventDefault();submitAccount();}
  });

  if(drawerBody){const observer=new MutationObserver(()=>enhanceAccountPanel());observer.observe(drawerBody,{childList:true,subtree:true});}
  ensureModal();
})();
