(() => {
  const form=document.querySelector("#loginForm");
  const message=document.querySelector("#loginMessage");
  const config=window.REFRAME_SUPABASE_CONFIG;
  if(!window.supabase || !config){message.textContent="Login is not configured yet. Please try again later.";return;}
  const client=window.supabase.createClient(config.url,config.publishableKey);
  form.addEventListener("submit",async event=>{
    event.preventDefault();message.textContent="Signing you in…";
    const {data,error}=await client.auth.signInWithPassword({
      email:document.querySelector("#email").value.trim(),
      password:document.querySelector("#password").value
    });
    if(error){message.textContent="We couldn't sign you in. Check your details or contact Estelle.";return;}
    const {data:access,error:accessError}=await client.from("client_access").select("status").eq("user_id",data.user.id).maybeSingle();
    if(accessError || !access || access.status!=="active"){
      await client.auth.signOut();
      message.textContent="Your client access is not active. Please contact Estelle.";
      return;
    }
    window.location.href="client-hub.html";
  });
})();