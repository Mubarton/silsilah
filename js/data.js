let DATA = null;
let byId = new Map();

async function loadData(){
  const res = await fetch("data/family.json");
  if(!res.ok) throw new Error("Gagal memuat family.json");
  DATA = await res.json();

  byId.clear();
  DATA.people.forEach(p => {
    p.spouse = Array.isArray(p.spouse) ? p.spouse : [];
    p.children = Array.isArray(p.children) ? p.children : [];
    p.born = p.born || "-";
    p.died = p.died || "-";
    p.note = p.note || "";
    p.gender = p.gender || "L";
    p.nickname = p.nickname || "-";
    byId.set(p.id, p);
  });
}

function get(id){
  return byId.get(id);
}

function arr(x){
  return Array.isArray(x) ? x : [];
}
