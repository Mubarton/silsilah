let selectedId = null;
const openChildrenSet = new Set();

const treeEl = document.getElementById("tree");
const detailEl = document.getElementById("detail");
const selHint = document.getElementById("selHint");
const breadcrumbEl = document.getElementById("breadcrumb");
const rootLabelEl = document.getElementById("rootLabel");

function esc(s){
  return String(s ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
}

function setRoot(id){
  if(!get(id)) return;

  DATA.rootId = id;
  selectedId = id;

  openChildrenSet.clear();
  openChildrenSet.add(id);

  render();
}

function render(){
  treeEl.innerHTML = "";
  const root = get(DATA.rootId);
  rootLabelEl.textContent = root ? root.name : "-";

  renderBreadcrumb();
  treeEl.appendChild(makeFamilyNode(DATA.rootId));
  renderDetail();
}

function renderBreadcrumb(){
  const path = buildPathToTop(DATA.rootId);
  const parts = path.map(id =>
    `<span class="crumb" data-crumb="${esc(id)}">${esc(get(id).name)}</span>`
  ).join(" &nbsp;›&nbsp; ");

  breadcrumbEl.innerHTML = path.length ? `Breadcrumb: ${parts}` : "";

  breadcrumbEl.querySelectorAll("[data-crumb]").forEach(el => {
    el.addEventListener("click", () => setRoot(el.getAttribute("data-crumb")));
  });
}

function renderDetail(){
  const p = selectedId ? get(selectedId) : null;
  if(!p){
    selHint.textContent = "-";
    detailEl.className = "empty";
    detailEl.textContent = "Klik salah satu kartu di pohon.";
    return;
  }

  selHint.textContent = p.name;

  const spouses = arr(p.spouse).map(get).filter(Boolean);
  const children = arr(p.children).map(get).filter(Boolean);
  const parents = parentsOf(p.id).map(get).filter(Boolean);

  detailEl.className = "";
  detailEl.innerHTML = `
    <div class="kv">
      <div class="k">Nama</div><div class="v">${esc(p.name)}</div>
      <div class="k">Panggilan</div><div class="v">${esc(p.nickname || "-")}</div>
      <div class="k">Gender</div><div class="v">${p.gender==="L"?"Laki-laki":"Perempuan"}</div>
      <div class="k">Lahir</div><div class="v">${esc(p.born || "-")}</div>
      <div class="k">Wafat</div><div class="v">${esc(p.died || "-")}</div>
      <div class="k">Catatan</div><div class="v">${esc(p.note || "-")}</div>
    </div>

    <div class="tag">Klik nama di bawah → langsung jadi <b>Root</b>.</div>

    <div style="margin-top:14px;font-weight:800">Orang tua</div>
    ${parents.length
      ? `<ul class="list">${parents.map(x=>`<li data-jump="${esc(x.id)}">${esc(x.name)}</li>`).join("")}</ul>`
      : `<div class="empty">Tidak ada data orang tua.</div>`}

    <div style="margin-top:14px;font-weight:800">Pasangan</div>
    ${spouses.length
      ? `<ul class="list">${spouses.map(x=>`<li data-jump="${esc(x.id)}">${esc(x.name)}</li>`).join("")}</ul>`
      : `<div class="empty">Tidak ada pasangan.</div>`}

    <div style="margin-top:14px;font-weight:800">Anak</div>
    ${children.length
      ? `<ul class="list">${children.map(x=>`<li data-jump="${esc(x.id)}">${esc(x.name)}</li>`).join("")}</ul>`
      : `<div class="empty">Tidak ada anak.</div>`}
  `;

  detailEl.querySelectorAll("[data-jump]").forEach(el => {
    el.addEventListener("click", () => setRoot(el.getAttribute("data-jump")));
  });
}

function renderPersonCard(id, showChildrenToggle, isChildrenOpen){
  const p = get(id);
  const hasChildren = arr(p.children).length > 0;

  const card = document.createElement("div");
  card.className = "card" + (selectedId === id ? " active" : "");
  card.setAttribute("data-id", id);

  const chev = document.createElement("div");
  chev.className = "chev";
  if(showChildrenToggle && hasChildren) chev.textContent = isChildrenOpen ? "▾" : "▸";
  else chev.textContent = "•";

  const info = document.createElement("div");
  info.className = "info";

  const genderTxt = p.gender === "L" ? "Laki-laki" : "Perempuan";
  const nickTxt = (p.nickname && p.nickname !== "-") ? ` · Panggilan: ${esc(p.nickname)}` : "";
  info.innerHTML = `
    <p class="name">${esc(p.name)}</p>
    <div class="meta">${genderTxt}${nickTxt} · Lahir: ${esc(p.born || "-")} · Anak: ${arr(p.children).length}</div>
    <div class="actions">
      ${showChildrenToggle && hasChildren ? `<button class="mini" data-act="toggle-children">${isChildrenOpen ? "Tutup Anak" : "Buka Anak"}</button>` : ``}
      <button class="mini" data-act="set-root">Jadikan Root</button>
    </div>
  `;

  card.appendChild(chev);
  card.appendChild(info);

  card.addEventListener("click", (e) => {
    if(e.target && e.target.matches("button.mini")) return;
    selectedId = id;
    renderDetail();
  });

  info.querySelectorAll("button.mini").forEach(btn => {
    btn.addEventListener("click", () => {
      const act = btn.getAttribute("data-act");
      if(act === "toggle-children"){
        if(openChildrenSet.has(id)) openChildrenSet.delete(id);
        else openChildrenSet.add(id);
        selectedId = id;
        render();
      }
      if(act === "set-root"){
        setRoot(id);
      }
    });
  });

  return card;
}

function makeFamilyNode(id){
  const p = get(id);
  if(!p) return document.createTextNode("");

  const wrapper = document.createElement("div");

  const spouseId = firstSpouseId(id);
  const hasChildren = arr(p.children).length > 0;
  const isOpenChildren = openChildrenSet.has(id);

  const coupleRow = document.createElement("div");
  coupleRow.className = "coupleRow";

  coupleRow.appendChild(renderPersonCard(id, true, isOpenChildren));

  if(spouseId && get(spouseId)){
    coupleRow.appendChild(renderPersonCard(spouseId, false, false));
  }

  wrapper.appendChild(coupleRow);

  if(hasChildren && isOpenChildren){
    const childrenBox = document.createElement("div");
    childrenBox.className = "children";
    arr(p.children).forEach(cid => childrenBox.appendChild(makeFamilyNode(cid)));
    wrapper.appendChild(childrenBox);
  }

  return wrapper;
}
