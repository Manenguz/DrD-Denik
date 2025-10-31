/* App logic: stats with 3-state boxes, dynamic items, import/export, persistence */
const STORAGE_KEY = "drd2_denik_v3";

/* Load class descriptions from JSON */
let classDescriptions = {};

fetch('classes.json')
    .then(res => res.json())
    .then(data => {
        classDescriptions = data;
        console.log("Načteny popisy povolání:", data);
        // teď můžeme vykreslit všechny classRows
        renderAll();
    });

/* Character data model */
let character = {
    name: "",
    race: "",
    money: {dukat: 0, gros: 0, halir: 0},
    xp: {total: 0, free: 0},
    stats: {
        body: {max: 6, states: []},
        bodyInjuries: "",
        soul: {max: 6, states: []},
        soulInjuries: "",
        influence: {max: 6, states: []},
        influenceInjuries: ""
    },
    danger: {states: Array(9).fill(0)},
    advantage: {states: Array(9).fill(0)},
    classes: [], // {name, level, desc}
    skills: [],      // {name, source, desc}
    spells: [],      // {name, source, desc}
    weapons: [],     // {name, price, desc}
    equipment: [],   // {name, price, desc}
    story: {origin: "", adventures: ""},
    extras: {racial: "", personality: ""},
    helper: {
        name: "",
        bond: {max: 6, states: []},
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
    character.money.dukat = parseInt(document.getElementById("money-dukat").value) || 0;
    character.money.gros = parseInt(document.getElementById("money-gros").value) || 0;
    character.money.halir = parseInt(document.getElementById("money-hal").value) || 0;
    character.classes = readItemRows("classes-list", ["name", "level"]);
    document.getElementById("money-dukat").value = character.money.dukat;
    document.getElementById("money-gros").value = character.money.gros;
    document.getElementById("money-hal").value = character.money.halir;

    character.xp.total = parseInt(document.getElementById("xp-total").value) || 0;
    character.xp.free = parseInt(document.getElementById("xp-free").value) || 0;

    // stats max & states
    ["body", "soul", "influence"].forEach(stat => {
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

    character.stats.bodyInjuries = document.getElementById("body-injuries").value || "";
    character.stats.soulInjuries = document.getElementById("soul-injuries").value || "";
    character.stats.influenceInjuries = document.getElementById("influence-injuries").value || "";

    // danger
    const dangerBoxes = document.getElementById("danger-boxes").children;
    character.danger.states = [];
    for (let i = 0; i < dangerBoxes.length; i++) {
        const s = parseInt(dangerBoxes[i].dataset.state) || 0;
        character.danger.states.push(s);
    }

    // advantage
    const advantageBoxes = document.getElementById("advantage-boxes").children;
    character.advantage.states = [];
    for (let i = 0; i < advantageBoxes.length; i++) {
        const s = parseInt(advantageBoxes[i].dataset.state) || 0;
        character.advantage.states.push(s);
    }


    // story & extras
    character.story.origin = document.getElementById("origin-story").value || "";
    character.story.adventures = document.getElementById("adventures").value || "";
    character.extras.racial = document.getElementById("racial-ability").value || "";
    character.extras.personality = document.getElementById("personality-trait").value || "";

    // items
    character.skills = readItemRows("skills-list", ["name", "source", "desc"]);
    character.spells = readItemRows("spells-list", ["name", "source", "desc"]);
    character.weapons = readItemRows("weapons-list", ["name", "price", "desc"]);
    character.equipment = readItemRows("equipment-list", ["name", "price", "desc"]);

    // helper
    character.helper.name = document.getElementById("helper-name").value || "";
    character.helper.description = document.getElementById("helper-description").value || "";
    character.helper.boundary = document.getElementById("helper-boundary").value || "";
    character.helper.payment = document.getElementById("helper-payment").value || "";
    character.helper.abilities = document.getElementById("helper-abilities").value || "";

    const bondBoxes = document.getElementById("helper-bond-boxes").children;
    character.helper.bond.states = [];
    for (let i = 0; i < bondBoxes.length; i++) {
        const s = parseInt(bondBoxes[i].dataset.state) || 0;
        character.helper.bond.states.push(s);
    }
    character.helper.bond.max = parseInt(document.getElementById("helper-bond-max").value) || 0;

    // collapsibles state
    document.querySelectorAll(".collapsible").forEach(btn => {
        const content = btn.nextElementSibling;
        character.collapsibles[btn.textContent] = content.classList.contains("active");
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(character));
}

function loadAll(render = true) {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
        try { character = Object.assign(character, JSON.parse(raw)); }
        catch(e){ console.warn(e); }
    }
    if (render) renderAll();
}

/* ---------- Rendering ---------- */
function renderAll() {
    // header
    document.getElementById("character-name").value = character.name || "";
    document.getElementById("character-race").value = character.race || "";
    document.getElementById("money-dukat").value = character.money.dukat || 0;
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
    ["body", "soul", "influence"].forEach(stat => {
        const maxInput = document.getElementById(stat + "-max");
        maxInput.value = character.stats[stat].max || 0;
        renderStatBoxes(stat);
    });

    document.getElementById("body-injuries").value = character.stats.bodyInjuries || "";
    document.getElementById("soul-injuries").value = character.stats.soulInjuries || "";
    document.getElementById("influence-injuries").value = character.stats.influenceInjuries || "";

    renderDangerBoxes();
    renderAdvantageBoxes();

    // items
    clearContainer("skills-list");
    character.skills.forEach(s => createSkillRow(s.name, s.source, s.desc));
    clearContainer("spells-list");
    character.spells.forEach(s => createSpellRow(s.name, s.source, s.desc));

    clearContainer("weapons-list");
    character.weapons.forEach(w => createWeaponRow(w.name, w.price, w.desc));
    clearContainer("equipment-list");
    character.equipment.forEach(g => createEquipmentRow(g.name, g.price, g.desc));

    // classes
    clearContainer("classes-list");
    character.classes.forEach(c => createClassRow(c.name, c.level));

    // helper
    renderHelper();

    // collapsibles
    document.querySelectorAll(".collapsible").forEach(btn => {
        const content = btn.nextElementSibling;
        const saved = character.collapsibles[btn.textContent];
        if (saved) content.classList.add("active");
        else content.classList.remove("active");
    });
}

/* ---------- Stat boxes 3-stavové ---------- */
function renderStatBoxes(stat) {
    const container = document.getElementById(stat + "-boxes");
    const max = parseInt(document.getElementById(stat + "-max").value) || 0;
    const savedStates = character.stats[stat].states || [];
    container.innerHTML = "";

    for (let i = 0; i < max; i++) {
        const b = document.createElement("div");
        b.className = "box";
        const state = savedStates[i] ?? 0;
        b.dataset.state = state;
        updateBoxVisual(b, state);

        b.addEventListener("click", () => {
            let newState = (parseInt(b.dataset.state) + 1) % 3;
            b.dataset.state = newState;
            updateBoxVisual(b, newState);
            saveAll();
        });
        container.appendChild(b);
    }
}

function updateBoxVisual(box, state) {
    box.classList.remove("active", "injured");
    if (state === 1) box.classList.add("active");
    if (state === 2) box.classList.add("injured");
}

function renderDangerBoxes() {
    const container = document.getElementById("danger-boxes");
    if (!container) return;
    container.innerHTML = "";
    const savedStates = character.danger.states || Array(9).fill(0);

    for (let i = 0; i < 9; i++) {
        const box = document.createElement("div");
        box.className = "box";
        const state = savedStates[i] ?? 0;
        box.dataset.state = state;
        updateDangerBoxVisual(box, state);

        box.addEventListener("click", () => {
            const newState = (parseInt(box.dataset.state) + 1) % 2;
            box.dataset.state = newState;
            updateDangerBoxVisual(box, newState);
            saveAll();
        });

        container.appendChild(box);
    }
}

function updateDangerBoxVisual(box, state) {
    box.classList.remove("active");
    if (state === 1) box.classList.add("active");
}

function renderAdvantageBoxes() {
    const container = document.getElementById("advantage-boxes");
    if (!container) return;
    container.innerHTML = "";
    const savedStates = character.advantage.states || Array(9).fill(0);

    for (let i = 0; i < 9; i++) {
        const box = document.createElement("div");
        box.className = "box";
        const state = savedStates[i] ?? 0;
        box.dataset.state = state;
        updateAdvantageBoxVisual(box, state);

        box.addEventListener("click", () => {
            const newState = (parseInt(box.dataset.state) + 1) % 2;
            box.dataset.state = newState;
            updateAdvantageBoxVisual(box, newState);
            saveAll();
        });

        container.appendChild(box);
    }
}

function updateAdvantageBoxVisual(box, state) {
    box.classList.remove("active");
    if (state === 1) box.classList.add("active");
}



/* ---------- Helper bond boxes ---------- */
function renderHelper() {
    document.getElementById("helper-name").value = character.helper.name || "";
    document.getElementById("helper-description").value = character.helper.description || "";
    document.getElementById("helper-boundary").value = character.helper.boundary || "";
    document.getElementById("helper-payment").value = character.helper.payment || "";
    document.getElementById("helper-abilities").value = character.helper.abilities || "";

    const maxInput = document.getElementById("helper-bond-max");
    maxInput.value = character.helper.bond.max || 0;
    renderHelperBondBoxes();
}

function renderHelperBondBoxes() {
    const container = document.getElementById("helper-bond-boxes");
    const max = parseInt(document.getElementById("helper-bond-max").value) || 0;
    const savedStates = character.helper.bond.states || [];
    container.innerHTML = "";

    for (let i = 0; i < max; i++) {
        const b = document.createElement("div");
        b.className = "box";
        const state = savedStates[i] ?? 0;
        b.dataset.state = state;
        updateBoxVisual(b, state);

        b.addEventListener("click", () => {
            let newState = (parseInt(b.dataset.state) + 1) % 3;
            b.dataset.state = newState;
            updateBoxVisual(b, newState);
            saveAll();
        });
        container.appendChild(b);
    }
}

/* ---------- Item rows helpers ---------- */
function clearContainer(id) {
    document.getElementById(id).innerHTML = "";
}

function readItemRows(containerId, fieldNames) {
    const res = [];
    const container = document.getElementById(containerId);
    for (let r of container.children) {
        const inputs = r.querySelectorAll("input, textarea, select");
        if (!inputs.length) continue;
        const obj = {};
        fieldNames.forEach((f, i) => {
            if (!inputs[i]) return;
            if (inputs[i].tagName === 'SELECT') obj[f] = inputs[i].value;
            else obj[f] = inputs[i].value || "";
        });
        res.push(obj);
    }
    return res;
}

/* ---------- Create dynamic rows ---------- */
function createSkillRow(name = "", source = "", desc = "") {
    const div = document.createElement("div");
    div.className = "skill-row";

    const nameInput = document.createElement("input");
    nameInput.className = "name";
    nameInput.placeholder = "Název (max 50)";
    nameInput.maxLength = 50;
    nameInput.value = name;

    const srcInput = document.createElement("input");
    srcInput.className = "small";
    srcInput.placeholder = "Zdroj";
    srcInput.maxLength = 50;
    srcInput.value = source;

    const descInput = document.createElement("textarea");
    descInput.placeholder = "Popis";
    descInput.value = desc;

    const delBtn = document.createElement("button");
    delBtn.className = "delete-btn";
    delBtn.textContent = "✖";
    delBtn.addEventListener("click", () => {
        div.remove();
        saveAll();
    });

    [nameInput, srcInput, descInput].forEach(el => el.addEventListener("input", saveAll));

    div.append(nameInput, srcInput, descInput, delBtn);
    document.getElementById("skills-list").appendChild(div);
}

/* ---------- Create dynamic rows ---------- */
function createSpellRow(name = "", source = "", desc = "") {
    const div = document.createElement("div");
    div.className = "skill-row";

    const nameInput = document.createElement("input");
    nameInput.className = "name";
    nameInput.placeholder = "Název (max 50)";
    nameInput.maxLength = 50;
    nameInput.value = name;

    const srcInput = document.createElement("input");
    srcInput.className = "small";
    srcInput.placeholder = "Zdroj";
    srcInput.maxLength = 50;
    srcInput.value = source;

    const descInput = document.createElement("textarea");
    descInput.placeholder = "Popis";
    descInput.value = desc;

    const delBtn = document.createElement("button");
    delBtn.className = "delete-btn";
    delBtn.textContent = "✖";
    delBtn.addEventListener("click", () => {
        div.remove();
        saveAll();
    });

    [nameInput, srcInput, descInput].forEach(el => el.addEventListener("input", saveAll));

    div.append(nameInput, srcInput, descInput, delBtn);
    document.getElementById("spells-list").appendChild(div);
}

function createWeaponRow(name = "", price = "", desc = "") {
    const div = document.createElement("div");
    div.className = "weapon-row";

    const nameInput = document.createElement("input");
    nameInput.className = "name";
    nameInput.placeholder = "Název";
    nameInput.value = name;

    const priceInput = document.createElement("input");
    priceInput.className = "small";
    priceInput.placeholder = "Cena";
    priceInput.value = price;

    const descInput = document.createElement("textarea");
    descInput.placeholder = "Popis";
    descInput.value = desc;

    const delBtn = document.createElement("button");
    delBtn.className = "delete-btn";
    delBtn.textContent = "✖";
    delBtn.addEventListener("click", () => {
        div.remove();
        saveAll();
    });

    [nameInput, priceInput, descInput].forEach(el => el.addEventListener("input", saveAll));

    div.append(nameInput, priceInput, descInput, delBtn);
    document.getElementById("weapons-list").appendChild(div);
}

function createClassRow(selectedClass = '', level = '') {
    const row = document.createElement('div');
    row.classList.add('class-row');

    // Dropdown pro výběr povolání
    const select = document.createElement('select');
    select.className = 'class-select';
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Vyber povolání';
    select.appendChild(defaultOption);

    Object.keys(classDescriptions).forEach(cls => {
        const opt = document.createElement('option');
        opt.value = cls;
        opt.textContent = cls;
        if (cls === selectedClass) opt.selected = true;
        select.appendChild(opt);
    });

    // Úroveň
    const levelInput = document.createElement("input");
    levelInput.className = "small";
    levelInput.type = "number";
    levelInput.min = "1";
    levelInput.max = "5";
    levelInput.placeholder = "Úroveň";
    levelInput.value = level;

    // Tlačítko mazání
    const delBtn = document.createElement("button");
    delBtn.className = "delete-btn";
    delBtn.textContent = "✖";
    delBtn.title = "Smazat toto povolání";
    delBtn.addEventListener("click", () => {
        row.remove();
        saveAll();
    });

    // Tlačítko info
    const infoBtn = document.createElement('button');
    infoBtn.className = 'info-btn';
    infoBtn.textContent = 'Zobraz schopnosti';
    infoBtn.title = 'Zobraz schopnosti';

    // Box s popisem (schopnosti)
    const descBox = document.createElement('div');
    descBox.classList.add('class-description');
    descBox.style.display = 'none';

    // Klik na ℹ️
    infoBtn.addEventListener('click', () => {
        const className = select.value;
        const abilities = classDescriptions[className];

        if (abilities && abilities.length > 0) {
            descBox.innerHTML = `
                <strong> ${className}:</strong>
                <ul>${abilities.map(a => `<li>${a}</li>`).join('')}</ul>
            `;
        } else {
            descBox.innerHTML = `<em>Pro zobrazení schopností je potřeba vybrat class.</em>`;
        }

        descBox.style.display = descBox.style.display === 'none' ? 'block' : 'none';
    });

    // Horní část řádku
    const topRow = document.createElement('div');
    topRow.classList.add('class-top');
    topRow.append(select, levelInput, infoBtn, delBtn);

    row.append(topRow, descBox);

    document.getElementById("classes-list").appendChild(row);
    return row;
}

function createEquipmentRow(name = "", price = "", desc = "") {
    const div = document.createElement("div");
    div.className = "equipment-row";

    const nameInput = document.createElement("input");
    nameInput.className = "name";
    nameInput.placeholder = "Název";
    nameInput.value = name;

    const priceInput = document.createElement("input");
    priceInput.className = "small";
    priceInput.placeholder = "Cena";
    priceInput.value = price;

    const descInput = document.createElement("textarea");
    descInput.placeholder = "Popis";
    descInput.value = desc;

    const delBtn = document.createElement("button");
    delBtn.className = "delete-btn";
    delBtn.textContent = "✖";
    delBtn.addEventListener("click", () => {
        div.remove();
        saveAll();
    });

    [nameInput, priceInput, descInput].forEach(el => el.addEventListener("input", saveAll));

    div.append(nameInput, priceInput, descInput, delBtn);
    document.getElementById("equipment-list").appendChild(div);
}

/* ---------- Buttons and wiring ---------- */
document.getElementById("add-skill").addEventListener("click", () => {
    createSkillRow();
    saveAll();
});
document.getElementById("add-spell").addEventListener("click", () => {
    createSpellRow();
    saveAll();
});
document.getElementById("add-weapon").addEventListener("click", () => {
    createWeaponRow();
    saveAll();
});
document.getElementById("add-equipment").addEventListener("click", () => {
    createEquipmentRow();
    saveAll();
});
document.getElementById("add-class").addEventListener("click", () => {
    createClassRow();
    saveAll();
});
document.getElementById("save-btn").addEventListener("click", () => {
    saveAll();
    alert("Deník uložen do localStorage ✅");
});

document.getElementById("export-btn").addEventListener("click", () => {
    saveAll();
    const blob = new Blob([JSON.stringify(character, null, 2)], {type: "application/json"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = (character.name ? character.name.replace(/\s+/g, '_') : "denik") + ".json";
    a.click();
});

document.getElementById("import-file").addEventListener("change", (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
        try {
            const data = JSON.parse(r.result);
            character = Object.assign(character, data);
            renderAll();
            saveAll();
            alert("Import dokončen ✅");
        } catch (err) {
            alert("Chyba při importu: špatný formát JSON");
            console.error(err);
        }
    };
    r.readAsText(f);
});

// --- Reset button ---
document.getElementById("reset-btn").addEventListener("click", () => {
    if (!confirm("Opravdu chcete vymazat všechny údaje a začít od začátku?")) return;

    // reset data model
    character = {
        name: "",
        race: "",
        money: {dukat: 0, gros: 0, halir: 0},
        xp: {total: 0, free: 0},
        stats: {
            body: {max: 6, states: []},
            bodyInjuries: "",
            soul: {max: 6, states: []},
            soulInjuries: "",
            influence: {max: 6, states: []},
            influenceInjuries: ""
        },
        classes: [],
        skills: [],
        weapons: [],
        equipment: [],
        story: {origin: "", adventures: ""},
        extras: {racial: "", personality: ""},
        helper: {name: "", bond: {max: 6, states: []}, description: "", boundary: "", payment: "", abilities: ""},
        collapsibles: {}
    };

    // znovu vykreslit všechny vstupy
    renderAll();
    saveAll();
});


/* persist inputs */
["character-name", "character-race", "money-dukat", "money-gros", "money-hal", "xp-total", "xp-free",
    "origin-story", "adventures", "racial-ability", "personality-trait",
    "body-max", "soul-max", "influence-max",
    "helper-name", "helper-description", "helper-boundary", "helper-payment", "helper-abilities",
    "helper-bond-max"].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("input", () => {
        if (id === "body-max" || id === "soul-max" || id === "influence-max") renderStatBoxes(id.replace("-max", ""));
        if (id === "helper-bond-max") renderHelperBondBoxes();
        saveAll();
    });
});

/* collapsibles */
document.querySelectorAll(".collapsible").forEach(btn => {
    btn.addEventListener("click", () => {
        const content = btn.nextElementSibling;
        content.classList.toggle("active");
        saveAll();
    });
});

/* initial empty rows */
window.addEventListener("DOMContentLoaded", () => {
    loadAll(false); // loadAll bez renderu
    // jen prázdné rows pro skill/spell/weapon/equipment
});

const addClassBtn = document.getElementById('add-class');
const classesList = document.getElementById('classes-list');

// addClassBtn.addEventListener('click', () => {
//     const newRow = createClassRow();
//     classesList.appendChild(newRow);
// });