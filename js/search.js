const qEl = document.getElementById("q");
const boxEl = document.getElementById("searchBox");

let searchResults = [];
let activeIndex = -1;

function closeSearch(){
  boxEl.style.display = "none";
  boxEl.innerHTML = "";
  activeIndex = -1;
}

function openSearch(){
  if(searchResults.length){
    boxEl.style.display = "block";
  }else{
    closeSearch();
  }
}

function renderSearch(){
  if(!searchResults.length){
    closeSearch();
    return;
  }

  boxEl.innerHTML = searchResults.map((p, i) => `
    <div class="searchItem ${i===activeIndex?"active":""}" data-id="${p.id}">
      <div>${p.name}</div>
      <div class="searchMuted">
        ${p.nickname && p.nickname !== "-" ? "Panggilan: "+p.nickname+" · " : ""}
        ${p.gender==="L"?"Laki-laki":"Perempuan"}
      </div>
    </div>
  `).join("");

  boxEl.querySelectorAll(".searchItem").forEach(el=>{
    el.addEventListener("mousedown", e=>{
      e.preventDefault(); // cegah blur
      choose(el.dataset.id);
    });
  });

  openSearch();
}

function choose(id){
  closeSearch();
  qEl.value = "";
  setRoot(id);
}

qEl.addEventListener("input", ()=>{
  const q = qEl.value.trim().toLowerCase();
  if(!q){
    closeSearch();
    return;
  }

  searchResults = DATA.people
    .filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.nickname && p.nickname.toLowerCase().includes(q))
    )
    .slice(0, 8); // batasi 8 saran

  activeIndex = -1;
  renderSearch();
});

qEl.addEventListener("keydown", e=>{
  if(!searchResults.length) return;

  if(e.key === "ArrowDown"){
    e.preventDefault();
    activeIndex = (activeIndex + 1) % searchResults.length;
    renderSearch();
  }

  if(e.key === "ArrowUp"){
    e.preventDefault();
    activeIndex = (activeIndex - 1 + searchResults.length) % searchResults.length;
    renderSearch();
  }

  if(e.key === "Enter"){
    e.preventDefault();
    if(activeIndex >= 0){
      choose(searchResults[activeIndex].id);
    }else{
      choose(searchResults[0].id);
    }
  }

  if(e.key === "Escape"){
    closeSearch();
  }
});

document.addEventListener("click", e=>{
  if(!boxEl.contains(e.target) && e.target !== qEl){
    closeSearch();
  }
});
