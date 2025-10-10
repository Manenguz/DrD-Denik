/* App logic: stats with 3-state boxes, dynamic items, import/export, persistence */
const STORAGE_KEY = "drd2_denik_v3";

/* Character data model */
let character = {
  name: "",
  race: "",
  money: { gros: 0, halir: 0 },
  xp: { total: 0, free: 0 },
  stats: {
    body: { max: 6, states: [] },
    soul: { max: 6, states: [] },
    influence: { max: 6, states: [] }
  },
  classes: [], // {name, level, desc}
  skills: [],      // {name, source, desc}
  weapons: [],     // {name, price, desc}
  equipment: [],   // {name, price, desc}
  story: { origin: "", adventures: "" },
  extras: { racial: "", personality: "" },
  helper: {
    name: "",
    bond: { max: 6, states: [] },
    description: "",
    boundary: "",
    payment: "",
    abilities: ""
  },
  collapsibles: {} // store collapsed state
};

/* ---------- Utilities: save/load ---------- */
function saveAll() {
  // capture header fields
  character.name = document.getElementById("character-name").value || "";
  character.race = document.getElementById("character-race").value || "";
  character.money.gros = parseInt(document.getElementById("money-gros").value) || 0;
  character.money.halir = parseInt(document.getElementById("money-hal").value) || 0;
  character.classes = readItemRows("classes-list", ["name", "level"]);
  // normalize halirs -> gros
  character.money.gros += Math.floor(character.money.halir / 10);
  character.money.halir = character.money.halir % 10;
  document.getElementById("money-gros").value = character.money.gros;
  document.getElementById("money-hal").value = character.money.halir;

  character.xp.total = parseInt(document.getElementById("xp-total").value) || 0;
  character.xp.free = parseInt(document.getElementById("xp-free").value) || 0;

  // stats max & states
  ["body","soul","influence"].forEach(stat=>{
    const maxInput = document.getElementById(stat + "-max");
    const max = parseInt(maxInput.value) || 0;
    character.stats[stat].max = max;
    const boxes = document.getElementById(stat + "-boxes").children;
    character.stats[stat].states = [];
    for (let i = 0; i < boxes.length; i++) {
      const s = parseInt(boxes[i].dataset.state) || 0;
      character.stats[stat].states.push(s);
    }
  });

  // story & extras
  character.story.origin = document.getElementById("origin-story").value || "";
  character.story.adventures = document.getElementById("adventures").value || "";
  character.extras.racial = document.getElementById("racial-ability").value || "";
  character.extras.personality = document.getElementById("personality-trait").value || "";

  // items
  character.skills = readItemRows("skills-list", ["name","source","desc"]);
  character.weapons = readItemRows("weapons-list", ["name","price","desc"]);
  character.equipment = readItemRows("equipment-list", ["name","price","desc"]);

  // helper
  character.helper.name = document.getElementById("helper-name").value || "";
  character.helper.description = document.getElementById("helper-description").value || "";
  character.helper.boundary = document.getElementById("helper-boundary").value || "";
  character.helper.payment = document.getElementById("helper-payment").value || "";
  character.helper.abilities = document.getElementById("helper-abilities").value || "";

  const bondBoxes = document.getElementById("helper-bond-boxes").children;
  character.helper.bond.states = [];
  for(let i=0;i<bondBoxes.length;i++){
    const s = parseInt(bondBoxes[i].dataset.state) || 0;
    character.helper.bond.states.push(s);
  }
  character.helper.bond.max = parseInt(document.getElementById("helper-bond-max").value) || 0;

  // collapsibles state
  document.querySelectorAll(".collapsible").forEach(btn=>{
    const content = btn.nextElementSibling;
    character.collapsibles[btn.textContent] = content.classList.contains("active");
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(character));
}

function loadAll() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if(raw){
    try{
      const obj = JSON.parse(raw);
      character = Object.assign(character,obj);
    }catch(e){
      console.warn("Chyba při načítání localStorage:",e);
    }
  }
  renderAll();
}

/* ---------- Rendering ---------- */
function renderAll(){
  // header
  document.getElementById("character-name").value = character.name || "";
  document.getElementById("character-race").value = character.race || "";
  document.getElementById("money-gros").value = character.money.gros || 0;
  document.getElementById("money-hal").value = character.money.halir || 0;
  document.getElementById("xp-total").value = character.xp.total || 0;
  document.getElementById("xp-free").value = character.xp.free || 0;

  // story & extras
  document.getElementById("origin-story").value = character.story.origin || "";
  document.getElementById("adventures").value = character.story.adventures || "";
  document.getElementById("racial-ability").value = character.extras.racial || "";
  document.getElementById("personality-trait").value = character.extras.personality || "";

  // stats
  ["body","soul","influence"].forEach(stat=>{
    const maxInput = document.getElementById(stat + "-max");
    maxInput.value = character.stats[stat].max || 0;
    renderStatBoxes(stat);
  });

  // items
  clearContainer("skills-list"); character.skills.forEach(s=>createSkillRow(s.name,s.source,s.desc));
  clearContainer("weapons-list"); character.weapons.forEach(w=>createWeaponRow(w.name,w.price,w.desc));
  clearContainer("equipment-list"); character.equipment.forEach(g=>createEquipmentRow(g.name,g.price,g.desc));

  // classes  
  clearContainer("classes-list");
  character.classes.forEach(c => createClassRow(c.name, c.level));

  // helper
  renderHelper();

  // collapsibles
  document.querySelectorAll(".collapsible").forEach(btn=>{
    const content = btn.nextElementSibling;
    const saved = character.collapsibles[btn.textContent];
    if(saved) content.classList.add("active");
    else content.classList.remove("active");
  });
}

/* ---------- Stat boxes 3-stavové ---------- */
function renderStatBoxes(stat){
  const container = document.getElementById(stat + "-boxes");
  const max = parseInt(document.getElementById(stat + "-max").value) || 0;
  const savedStates = character.stats[stat].states || [];
  container.innerHTML="";

  for(let i=0;i<max;i++){
    const b = document.createElement("div");
    b.className="box";
    const state = savedStates[i] ?? 0;
    b.dataset.state = state;
    updateBoxVisual(b,state);

    b.addEventListener("click",()=>{
      let newState = (parseInt(b.dataset.state)+1)%3;
      b.dataset.state=newState;
      updateBoxVisual(b,newState);
      saveAll();
    });
    container.appendChild(b);
  }
}

function updateBoxVisual(box,state){
  box.classList.remove("active","injured");
  if(state===1) box.classList.add("active");
  if(state===2) box.classList.add("injured");
}

/* ---------- Helper bond boxes ---------- */
function renderHelper(){
  document.getElementById("helper-name").value = character.helper.name || "";
  document.getElementById("helper-description").value = character.helper.description || "";
  document.getElementById("helper-boundary").value = character.helper.boundary || "";
  document.getElementById("helper-payment").value = character.helper.payment || "";
  document.getElementById("helper-abilities").value = character.helper.abilities || "";

  const maxInput = document.getElementById("helper-bond-max");
  maxInput.value = character.helper.bond.max || 0;
  renderHelperBondBoxes();
}

function renderHelperBondBoxes(){
  const container = document.getElementById("helper-bond-boxes");
  const max = parseInt(document.getElementById("helper-bond-max").value) || 0;
  const savedStates = character.helper.bond.states || [];
  container.innerHTML="";

  for(let i=0;i<max;i++){
    const b=document.createElement("div");
    b.className="box";
    const state = savedStates[i] ?? 0;
    b.dataset.state=state;
    updateBoxVisual(b,state);

    b.addEventListener("click",()=>{
      let newState = (parseInt(b.dataset.state)+1)%3;
      b.dataset.state=newState;
      updateBoxVisual(b,newState);
      saveAll();
    });
    container.appendChild(b);
  }
}

/* ---------- Item rows helpers ---------- */
function clearContainer(id){ document.getElementById(id).innerHTML=""; }

function readItemRows(containerId,fieldNames){
  const res=[];
  const container=document.getElementById(containerId);
  for(let r of container.children){
    const inputs = r.querySelectorAll("input,textarea");
    if(!inputs.length) continue;
    const obj={};
    fieldNames.forEach((f,i)=> obj[f]=(inputs[i] && inputs[i].value)?inputs[i].value:"");
    res.push(obj);
  }
  return res;
}

/* ---------- Create dynamic rows ---------- */
function createSkillRow(name="", source="", desc=""){
  const div=document.createElement("div");
  div.className="skill-row";

  const nameInput=document.createElement("input");
  nameInput.className="name"; nameInput.placeholder="Název (max 50)"; nameInput.maxLength=50; nameInput.value=name;

  const srcInput=document.createElement("input");
  srcInput.className="small"; srcInput.placeholder="Zdroj"; srcInput.maxLength=50; srcInput.value=source;

  const descInput=document.createElement("textarea");
  descInput.placeholder="Popis"; descInput.value=desc;

  const delBtn=document.createElement("button");
  delBtn.className="delete-btn"; delBtn.textContent="✖";
  delBtn.addEventListener("click",()=>{ div.remove(); saveAll(); });

  [nameInput, srcInput, descInput].forEach(el=>el.addEventListener("input", saveAll));

  div.append(nameInput, srcInput, descInput, delBtn);
  document.getElementById("skills-list").appendChild(div);
}

function createWeaponRow(name="", price="", desc=""){
  const div=document.createElement("div");
  div.className="weapon-row";

  const nameInput=document.createElement("input");
  nameInput.className="name"; nameInput.placeholder="Název"; nameInput.value=name;

  const priceInput=document.createElement("input");
  priceInput.className="small"; priceInput.placeholder="Cena"; priceInput.value=price;

  const descInput=document.createElement("textarea");
  descInput.placeholder="Popis"; descInput.value=desc;

  const delBtn=document.createElement("button");
  delBtn.className="delete-btn"; delBtn.textContent="✖";
  delBtn.addEventListener("click",()=>{ div.remove(); saveAll(); });

  [nameInput, priceInput, descInput].forEach(el=>el.addEventListener("input", saveAll));

  div.append(nameInput, priceInput, descInput, delBtn);
  document.getElementById("weapons-list").appendChild(div);
}

function createClassRow(name = "", level = "") {
  const div = document.createElement("div");
  div.className = "class-row";

  const nameInput = document.createElement("input");
  nameInput.className = "name";
  nameInput.placeholder = "Název povolání";
  nameInput.value = name;

  const levelInput = document.createElement("input");
  levelInput.className = "level";
  levelInput.type = "number";
  levelInput.min = "1";
  levelInput.max = "5";
  levelInput.placeholder = "Úroveň";
  levelInput.value = level;

  const delBtn = document.createElement("button");
  delBtn.className = "delete-btn";
  delBtn.textContent = "✖";
  delBtn.addEventListener("click", () => {
    div.remove();
    saveAll();
  });

  // teď už jen name a level reagují na input
  [nameInput, levelInput].forEach(el => el.addEventListener("input", saveAll));

  div.append(nameInput, levelInput, delBtn);
  document.getElementById("classes-list").appendChild(div);
}



function createEquipmentRow(name="", price="", desc=""){
  const div=document.createElement("div");
  div.className="equipment-row";

  const nameInput=document.createElement("input");
  nameInput.className="name"; nameInput.placeholder="Název"; nameInput.value=name;

  const priceInput=document.createElement("input");
  priceInput.className="small"; priceInput.placeholder="Cena"; priceInput.value=price;

  const descInput=document.createElement("textarea");
  descInput.placeholder="Popis"; descInput.value=desc;

  const delBtn=document.createElement("button");
  delBtn.className="delete-btn"; delBtn.textContent="✖";
  delBtn.addEventListener("click",()=>{ div.remove(); saveAll(); });

  [nameInput, priceInput, descInput].forEach(el=>el.addEventListener("input", saveAll));

  div.append(nameInput, priceInput, descInput, delBtn);
  document.getElementById("equipment-list").appendChild(div);
}

/* ---------- Buttons and wiring ---------- */
document.getElementById("add-skill").addEventListener("click",()=>{ createSkillRow(); saveAll(); });
document.getElementById("add-weapon").addEventListener("click",()=>{ createWeaponRow(); saveAll(); });
document.getElementById("add-equipment").addEventListener("click",()=>{ createEquipmentRow(); saveAll(); });
document.getElementById("add-class").addEventListener("click", () => {
  createClassRow();
  saveAll();
});
document.getElementById("save-btn").addEventListener("click",()=>{ saveAll(); alert("Deník uložen do localStorage ✅"); });

document.getElementById("export-btn").addEventListener("click",()=>{
  saveAll();
  const blob=new Blob([JSON.stringify(character,null,2)],{type:"application/json"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download=(character.name?character.name.replace(/\s+/g,'_'):"denik")+".json";
  a.click();
});

document.getElementById("import-file").addEventListener("change",(e)=>{
  const f=e.target.files[0];
  if(!f) return;
  const r=new FileReader();
  r.onload=()=>{
    try{
      const data=JSON.parse(r.result);
      character=Object.assign(character,data);
      renderAll();
      saveAll();
      alert("Import dokončen ✅");
    }catch(err){
      alert("Chyba při importu: špatný formát JSON");
      console.error(err);
    }
  };
  r.readAsText(f);
});

/* persist inputs */
["character-name","character-race","money-gros","money-hal","xp-total","xp-free",
 "origin-story","adventures","racial-ability","personality-trait",
 "body-max","soul-max","influence-max",
 "helper-name","helper-description","helper-boundary","helper-payment","helper-abilities",
 "helper-bond-max"].forEach(id=>{
   const el=document.getElementById(id);
   if(!el) return;
   el.addEventListener("input",()=>{
     if(id==="body-max"||id==="soul-max"||id==="influence-max") renderStatBoxes(id.replace("-max",""));
     if(id==="helper-bond-max") renderHelperBondBoxes();
     saveAll();
   });
});

/* collapsibles */
document.querySelectorAll(".collapsible").forEach(btn=>{
  btn.addEventListener("click",()=>{
    const content=btn.nextElementSibling;
    content.classList.toggle("active");
    saveAll();
  });
});

/* initial empty rows */
window.addEventListener("DOMContentLoaded",()=>{
  loadAll();
  if(!character.skills.length) createSkillRow();
  if(!character.weapons.length) createWeaponRow();
  if(!character.equipment.length) createEquipmentRow();
});