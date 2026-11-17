// Secure sign-in gate: the hub stays hidden until Supabase confirms an active client.
(async function initialiseClientAccess(){
  const loginScreen = document.querySelector("#loginScreen");
  const hubShell = document.querySelector("#hubShell");
  const loginForm = document.querySelector("#loginForm");
  const loginMessage = document.querySelector("#loginMessage");
  const loginSubmit = document.querySelector("#loginSubmit");
  const signOutButton = document.querySelector("#signOutButton");
  const config = window.REFRAME_SUPABASE_CONFIG;
  const showMessage = (message, isError = true) => {
    if (!loginMessage) return;
    loginMessage.textContent = message;
    loginMessage.dataset.state = isError ? "error" : "success";
  };
  if (!window.supabase || !config?.url || !config?.publishableKey) {
    showMessage("The sign-in service is not available just now. Please try again later.");
    return;
  }
  const client = window.supabase.createClient(config.url, config.publishableKey);
  async function checkAccess(session) {
    if (!session?.user) {
      hubShell.hidden = true;
      loginScreen.hidden = false;
      return false;
    }
    const { data, error } = await client
      .from("client_access")
      .select("status")
      .eq("user_id", session.user.id)
      .maybeSingle();
    if (error || data?.status !== "active") {
      await client.auth.signOut();
      hubShell.hidden = true;
      loginScreen.hidden = false;
      showMessage("We couldn't verify active client access for this account. Please contact Reframe Life if you think this is a mistake.");
      return false;
    }
    loginScreen.hidden = true;
    hubShell.hidden = false;
    return true;
  }
  const { data: { session } } = await client.auth.getSession();
  await checkAccess(session);
  loginForm?.addEventListener("submit", async event => {
    event.preventDefault();
    loginSubmit.disabled = true;
    loginSubmit.textContent = "Signing in…";
    showMessage("");
    const email = document.querySelector("#loginEmail").value.trim();
    const password = document.querySelector("#loginPassword").value;
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) {
      showMessage("We couldn't sign you in with those details. Please check your email and password and try again.");
    } else {
      await checkAccess(data.session);
    }
    loginSubmit.disabled = false;
    loginSubmit.innerHTML = 'Sign in <span>↗</span>';
  });
  signOutButton?.addEventListener("click", async () => {
    await client.auth.signOut();
    hubShell.hidden = true;
    loginScreen.hidden = false;
    document.querySelector("#loginPassword").value = "";
    showMessage("You have been signed out.", false);
  });
})();

const recipes = {
  berry: {category:"BREAKFAST",title:"Berry yoghurt breakfast bowl",description:"A fresh, flexible bowl for slow mornings or busy starts.",ingredients:["200g plain Greek-style yoghurt","A handful of mixed berries","30g granola or toasted oats","1 tsp nut butter or seeds (optional)"],method:["Spoon the yoghurt into a bowl.","Top with berries and granola.","Finish with nut butter or seeds, if you like."]},
  fajita: {category:"LUNCH",title:"Chicken fajita rice bowl",description:"A colourful, build-your-own bowl with plenty of flavour.",ingredients:["Chicken breast, sliced","Cooked rice","1 red pepper, sliced","½ red onion, sliced","Fajita seasoning","Lime and fresh coriander"],method:["Season the chicken and vegetables.","Cook in a hot pan until the chicken is thoroughly cooked and the vegetables are tender.","Serve over rice with lime and coriander."]},
  salmon: {category:"DINNER",title:"Lemon salmon orzo",description:"A comforting one-pan inspired dinner with greens and a little zing.",ingredients:["Salmon fillets","Orzo","Vegetable stock","A handful of spinach","Lemon zest and juice","Black pepper"],method:["Cook the orzo in stock, stirring regularly.","Add spinach towards the end and allow it to wilt.","Cook the salmon separately until safely cooked through, then serve with the orzo, lemon and black pepper."]},
  oats: {category:"BREAKFAST",title:"Apple & cinnamon overnight oats",description:"A make-ahead breakfast that can be adapted to what you have in the fridge.",ingredients:["50g rolled oats","120ml milk of choice","½ apple, grated","A pinch of cinnamon","A spoonful of yoghurt"],method:["Mix the oats, milk, apple and cinnamon in a jar.","Cover and refrigerate overnight.","Stir, add yoghurt and a splash of milk if needed, then enjoy."]},
  tray: {category:"DINNER",title:"Sweet potato & chickpea traybake",description:"A colourful, low-fuss traybake with warming spices.",ingredients:["1 sweet potato, cubed","1 tin chickpeas, drained","1 red onion, cut into wedges","1 tsp smoked paprika","Olive oil","Yoghurt and herbs to serve"],method:["Heat the oven to 200°C (180°C fan).","Toss the sweet potato, chickpeas and onion with paprika and a little oil.","Roast for 25–30 minutes, turning once, until tender and golden. Serve with yoghurt and herbs."]},
  bites: {category:"SNACKS & SWEET",title:"Chocolate banana yoghurt bites",description:"A simple freezer treat for when you fancy something sweet.",ingredients:["1 banana","A few spoonfuls of thick yoghurt","Melted dark chocolate","Optional chopped nuts or coconut"],method:["Slice the banana and arrange on a lined tray.","Add a small spoonful of yoghurt to each slice and freeze until firm.","Drizzle with melted chocolate and return to the freezer until set."]}
};
const search = document.querySelector("#recipeSearch");
const cards = [...document.querySelectorAll(".recipe-card")];
const filters = [...document.querySelectorAll(".filter")];
let activeFilter = "all";
function filterRecipes(){
  const term = (search?.value || "").trim().toLowerCase();
  let visible = 0;
  cards.forEach(card=>{
    const categoryMatch = activeFilter === "all" || card.dataset.category === activeFilter;
    const searchMatch = !term || (card.dataset.search + " " + card.textContent).toLowerCase().includes(term);
    const show = categoryMatch && searchMatch;
    card.hidden = !show;
    if(show) visible++;
  });
  document.querySelector("#recipeCount").textContent = String(visible).padStart(2,"0") + (visible === 1 ? " RECIPE" : " RECIPES");
  document.querySelector("#emptyState").hidden = visible !== 0;
}
search?.addEventListener("input",filterRecipes);
filters.forEach(button=>button.addEventListener("click",()=>{
  activeFilter = button.dataset.filter;
  filters.forEach(item=>{
    const active = item === button;
    item.classList.toggle("active",active);
    item.setAttribute("aria-pressed",String(active));
  });
  filterRecipes();
}));
const dialog = document.querySelector("#recipeDialog");
document.querySelectorAll(".recipe-open").forEach(button=>button.addEventListener("click",()=>{
  const recipe = recipes[button.dataset.recipe];
  if(!recipe || !dialog) return;
  document.querySelector("#dialogCategory").textContent = recipe.category;
  document.querySelector("#dialogTitle").textContent = recipe.title;
  document.querySelector("#dialogDescription").textContent = recipe.description;
  document.querySelector("#dialogIngredients").replaceChildren(...recipe.ingredients.map(item=>{const li=document.createElement("li");li.textContent=item;return li;}));
  document.querySelector("#dialogMethod").replaceChildren(...recipe.method.map(item=>{const li=document.createElement("li");li.textContent=item;return li;}));
  dialog.showModal();
}));
document.querySelector("#dialogClose")?.addEventListener("click",()=>dialog.close());
dialog?.addEventListener("click",event=>{if(event.target===dialog) dialog.close();});
