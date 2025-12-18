function exportPDF(){
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ unit: "pt", format: "a4" });

  // Layout
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const marginX = 40;
  const topY = 50;
  const lineH = 16;
  const boxPad = 10;
  const boxGap = 12;

  let y = topY;

  // Helpers
  function ensureSpace(heightNeeded){
    if (y + heightNeeded > pageH - 40) {
      pdf.addPage();
      y = topY;
    }
  }

  function textLines(text, maxW){
    return pdf.splitTextToSize(text, maxW);
  }

  function writeLines(lines, x, startY){
    let yy = startY;
    for(const ln of lines){
      pdf.text(ln, x, yy);
      yy += lineH;
    }
    return yy;
  }

  function labelValue(label, value){
    return `${label}: ${value && value !== "" ? value : "-"}`;
  }

  function fmtGender(g){
    return g === "L" ? "Laki-laki" : "Perempuan";
  }

  function fmtNick(n){
    return (n && n !== "-") ? n : "-";
  }

  function fmtBorn(b){
    return (b && b !== "") ? b : "-";
  }

  function fmtNameWithNick(p){
    const nick = (p.nickname && p.nickname !== "-") ? ` (${p.nickname})` : "";
    return `${p.name}${nick}`;
  }

  // Compute parents: pakai fungsi parentsOf yang sudah ada
  function parentNames(id){
    const ps = parentsOf(id).map(get).filter(Boolean);
    if(!ps.length) return ["-"];
    return ps.map(p => p.name);
  }

  function spouseNames(p){
    const sp = arr(p.spouse).map(get).filter(Boolean);
    if(!sp.length) return ["-"];
    return sp.map(x => x.name);
  }

  function childNames(p){
    const ch = arr(p.children).map(get).filter(Boolean);
    if(!ch.length) return ["-"];
    return ch.map(x => x.name);
  }

  // Header / Cover mini (simple, rapi)
  const root = get(DATA.rootId);
  pdf.setFont("helvetica","bold");
  pdf.setFontSize(14);
  const title = `Silsilah Keluarga (Root): ${root ? root.name : "-"}`;
  const titleLines = textLines(title, pageW - marginX*2);
  ensureSpace(titleLines.length * lineH + 30);
  y = writeLines(titleLines, marginX, y);

  pdf.setFont("helvetica","normal");
  pdf.setFontSize(11);
  const printed = `Dicetak: ${new Date().toLocaleString("id-ID")}`;
  y = writeLines([printed], marginX, y);
  y += 8;

  // Traverse dari root (preorder)
  function traverse(id, depth, out){
    const p = get(id);
    if(!p) return;
    out.push({ id, depth });
    for(const cid of arr(p.children)){
      traverse(cid, depth + 1, out);
    }
  }
  const nodes = [];
  traverse(DATA.rootId, 0, nodes);

  // Draw each person as a box block
  const boxW = pageW - marginX*2;
  const innerW = boxW - boxPad*2;

  function drawBlock(id, depth){
    const p = get(id);
    if(!p) return;

    // Build block lines
    const indent = "  ".repeat(Math.min(depth, 6)); // batasi supaya tidak kepanjangan
    const header = `${indent}${p.name}`;
    const nickLine = labelValue("Panggilan", fmtNick(p.nickname));
    const genderLine = labelValue("Jenis Kelamin", fmtGender(p.gender));
    const bornLine = labelValue("Lahir", fmtBorn(p.born));

    const parents = parentNames(p.id);
    const spouses = spouseNames(p);
    const children = childNames(p);

    // format multi-line list
    const parentLines = parents[0] === "-" ? ["Orang Tua: -"] : ["Orang Tua:"].concat(parents.map(n => `- ${n}`));
    const spouseLines = spouses[0] === "-" ? ["Pasangan: -"] : ["Pasangan:"].concat(spouses.map(n => `- ${n}`));
    const childLines  = children[0] === "-" ? ["Anak: -"] : ["Anak:"].concat(children.map(n => `- ${n}`));

    // gabungkan semua, lalu wrap
    let rawLines = [
      header,
      nickLine,
      genderLine,
      bornLine,
      ...parentLines,
      ...spouseLines,
      ...childLines
    ];

    // Wrap semua line ke lebar innerW
    const wrapped = [];
    for(const ln of rawLines){
      const w = textLines(ln, innerW);
      wrapped.push(...w);
    }

    // Calculate box height
    const boxH = boxPad*2 + wrapped.length*lineH;

    ensureSpace(boxH + boxGap);

    // Box border
    pdf.setDrawColor(170); // abu-abu (default)
    pdf.rect(marginX, y, boxW, boxH);

    // Text
    let ty = y + boxPad + lineH;
    pdf.setFont("helvetica","bold");
    // baris pertama (header) bold
    const headWrapped = textLines(header, innerW);
    pdf.text(headWrapped[0] || header, marginX + boxPad, y + boxPad + lineH);
    pdf.setFont("helvetica","normal");

    // sisa baris
    const rest = wrapped.slice(Math.max(1, headWrapped.length));
    ty = y + boxPad + lineH*2;
    for(const ln of rest){
      pdf.text(ln, marginX + boxPad, ty);
      ty += lineH;
    }

    y += boxH + boxGap;
  }

  for(const n of nodes){
    drawBlock(n.id, n.depth);
  }

  const safeName = (root ? root.name : "Silsilah")
    .replace(/[^\w\s-]/g,"")
    .slice(0,40)
    .trim()
    .replace(/\s+/g,"_");

  pdf.save(`Silsilah_Rapi_${safeName}.pdf`);
}