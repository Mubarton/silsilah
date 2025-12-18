function parentsOf(childId){
  const res = [];
  for(const p of DATA.people){
    if(arr(p.children).includes(childId)){
      res.push(p.id);
    }
  }
  return res;
}

function firstSpouseId(id){
  const p = get(id);
  if(!p) return null;
  return p.spouse.length ? p.spouse[0] : null;
}

function buildPathToTop(id){
  const path = [];
  let cur = id;
  const visited = new Set();

  while(cur && get(cur) && !visited.has(cur)){
    visited.add(cur);
    path.unshift(cur);
    const ps = parentsOf(cur);
    cur = ps.length ? ps[0] : null;
  }
  return path;
}
