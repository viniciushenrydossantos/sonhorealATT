// favoritos.js — versão completa
const API_BASE = "https://sonho-real-back.onrender.com";

/* ---------------------------
   Utilitários pequenos
----------------------------*/
function $qs(sel, root = document) { return root.querySelector(sel); }
function $qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

function sleep(ms){ return new Promise(res=>setTimeout(res, ms)); }

function showToast(msg, timeout = 2500){
  const t = $qs("#toast");
  if(!t) return alert(msg);
  t.textContent = msg;
  t.classList.remove("hidden");
  clearTimeout(t._to);
  t._to = setTimeout(()=> t.classList.add("hidden"), timeout);
}

/* ---------------------------
   FavoritosAPI — encapsula requests + cache
----------------------------*/
class FavoritosAPI {
  constructor(base){
    this.base = base;
    this.cache = {
      fotos: new Map(),   // imovelId -> fotos[]
      favoritos: new Map() // userId -> favoritos[]
    };
  }

  async getFavorites(userId, force = false){
    if(!force && this.cache.favoritos.has(userId)) return this.cache.favoritos.get(userId);
    const res = await fetch(`${this.base}/favorites/${userId}`);
    if(!res.ok) throw new Error("Erro ao buscar favoritos");
    const data = await res.json();
    // normalizar nomes (suporta id_imovel, id, imovel_id)
    const norm = data.map(i => ({
      raw: i,
      id_imovel: i.id_imovel ?? i.id ?? i.imovel_id ?? i.imovelId ?? i.idimovel ?? null,
      titulo: i.titulo ?? i.nome_casa ?? i.nome ?? i.nome_casa,
      preco: i.preco ?? i.valor ?? i.price ?? 0,
      descricao: i.descricao ?? i.desc ?? i.description ?? "",
      cidade: i.cidade ?? i.city ?? "",
      estado: i.estado ?? i.uf ?? "",
      imagem: i.imagem ?? i.foto_principal ?? null,
      quartos: i.quartos ?? null,
      banheiros: i.banheiros ?? null,
      area_total: i.area_total ?? null,
      vagas_garagem: i.vagas_garagem ?? null
    }));
    this.cache.favoritos.set(userId, norm);
    return norm;
  }

  async toggleFavorite(userId, imovelId){
    // POST /favorites toggles server-side (as implemented no seu backend)
    const res = await fetch(`${this.base}/favorites`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ user_id: userId, imovel_id: imovelId })
    });
    if(!res.ok) throw new Error("Erro ao atualizar favorito");
    // invalidate cache
    this.cache.favoritos.delete(userId);
    return res.text();
  }

  async getAllFotos(force=false){
    // busca todas fotos (usado apenas como fallback)
    if(!force && this._allFotosCache) return this._allFotosCache;
    const res = await fetch(`${this.base}/fotos_casa`);
    if(!res.ok) throw new Error("Erro ao buscar fotos");
    const data = await res.json();
    this._allFotosCache = data;
    return data;
  }

  async getFotosForImovel(imovelId){
    // cache by imovelId
    if(this.cache.fotos.has(imovelId)) return this.cache.fotos.get(imovelId);

    // primeira tentativa: endpoint /fotos_casa?imovel_id=<id> (por se existir query)
    try {
      const qres = await fetch(`${this.base}/fotos_casa?imovel_id=${imovelId}`);
      if(qres.ok){
        const arr = await qres.json();
        if(Array.isArray(arr) && arr.length) {
          this.cache.fotos.set(imovelId, arr);
          return arr;
        }
      }
    } catch(e){ /* ignora e tenta fallback */ }

    // fallback: buscar todas e filtrar por id_imovel / imovel_id / nome
    const todas = await this.getAllFotos();
    const fotos = todas.filter(f => {
      const cand = (f.id_imovel ?? f.imovel_id ?? f.imovelId ?? f.nome ?? f.name ?? "").toString();
      return cand === String(imovelId);
    });
    this.cache.fotos.set(imovelId, fotos);
    return fotos;
  }
}

/* ---------------------------
   UI & Paginação
----------------------------*/
const api = new FavoritosAPI(API_BASE);

const PAGE_SIZE = 6;
let currentPage = 1;
let currentList = []; // lista completa de favoritos (após filtros)
let filteredList = []; // lista depois de filtros
let userId = null;

/* elements */
const listaEl = document.getElementById("listaFavoritos");
const filterBusca = document.getElementById("filterBusca");
const filterCidade = document.getElementById("filterCidade");
const filterFaixa = document.getElementById("filterFaixa");
const prevPageBtn = document.getElementById("prevPage");
const nextPageBtn = document.getElementById("nextPage");
const pageInfo = document.getElementById("pageInfo");
const modalEl = document.getElementById("modalDetalhes");
const closeModalBtn = document.getElementById("closeModal");
const hotelImage = document.getElementById("hotel-image");
const hotelThumbs = document.getElementById("hotel-thumbs");
const modalTitle = document.getElementById("modalTitulo");
const modalPreco = document.getElementById("modalPreco");
const modalDetails = document.getElementById("modalDetails");
const toast = document.getElementById("toast");
const btnSignup = document.getElementById("btn-signup");

/* debounce util */
function debounce(fn, wait=300){
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(()=>fn(...args), wait); }
}

/* show skeleton */
function showSkeletons(count = 6){
  listaEl.innerHTML = Array.from({length:count}).map(()=>`
    <div class="skeleton">
      <div class="s-img"></div>
      <div class="s-line"></div>
      <div class="s-line short"></div>
    </div>
  `).join("");
}

/* render page of items */
function renderPage(page=1){
  const start = (page-1)*PAGE_SIZE;
  const pageItems = filteredList.slice(start, start+PAGE_SIZE);
  listaEl.innerHTML = "";

  if(pageItems.length === 0){
    listaEl.innerHTML = `<div class="empty-state"><h4>Nenhum favorito encontrado</h4><p>Adicione imóveis aos favoritos para vê-los aqui.</p></div>`;
    pageInfo.textContent = `Página ${page}`;
    return;
  }

  // create cards (async photo loading)
  pageItems.forEach(async imovel => {
    const idImovel = imovel.id_imovel ?? imovel.raw?.id_imovel ?? imovel.raw?.id ?? imovel.raw?.imovel_id ?? imovel.id;
    // create article
    const article = document.createElement("article");
    article.className = "card-imovel";

    // placeholder markup while loading photos
    article.innerHTML = `
      <div class="grid-container">
        <div class="grid-large"><div style="width:100%;height:100%;display:grid;place-items:center;color:#999">Carregando imagem...</div></div>
        <div class="grid-small"></div>
      </div>
      <div class="info">
        <div>
          <div class="title">${escapeHtml(imovel.titulo || "Sem nome")}</div>
          <div class="meta">${escapeHtml([imovel.cidade, imovel.estado].filter(Boolean).join(" • "))}</div>
          <div class="desc-short">${escapeHtml((imovel.descricao||"").slice(0,120))}...</div>
        </div>
        <div>
          <div class="card-footer">
            <button class="btn-fav" data-id="${idImovel}" title="Favorito">♡</button>
            <div class="price">R$ ${Number(imovel.preco||0).toLocaleString("pt-BR")}</div>
            <button class="btn btn-primary open-hotel" data-id="${idImovel}">Ver mais</button>
          </div>
        </div>
      </div>
    `;

    listaEl.appendChild(article);

    // fetch fotos
    try {
      const fotos = await api.getFotosForImovel(idImovel);
      // prefer fotos com data/mimetype (bytea) ou url
      const main = fotos[0] ?? { mimetype: null, data: null, imagem: imovel.imagem ?? null };
      let mainSrc = "";
      if(main.data && main.mimetype) mainSrc = `data:${main.mimetype};base64,${main.data}`;
      else if(main.imagem) mainSrc = main.imagem;
      else mainSrc = imovel.imagem ?? '';

      // render images area
      const gridLarge = article.querySelector(".grid-large");
      const gridSmall = article.querySelector(".grid-small");

      gridLarge.innerHTML = `<img src="${escapeAttr(mainSrc)}" alt="${escapeAttr(imovel.titulo||'Imóvel')}" />`;
      gridSmall.innerHTML = fotos.slice(1,3).map(f => {
        let src = f.data && f.mimetype ? `data:${f.mimetype};base64,${f.data}` : (f.imagem||f.url||'');
        return `<img src="${escapeAttr(src)}" alt="${escapeAttr(imovel.titulo||'Imóvel')}">`;
      }).join('');

    } catch(err){
      console.warn("Fotos:", err);
      // fallback: if imovel has imagem field show it
      const gridLarge = article.querySelector(".grid-large");
      gridLarge.innerHTML = `<img src="${escapeAttr(imovel.imagem||'')}" alt="${escapeAttr(imovel.titulo||'Imóvel')}">`;
    }

    // wire buttons
    const btnFav = article.querySelector(".btn-fav");
    const btnVer = article.querySelector(".open-hotel");

    // initial fav state
    updateFavButtonState(btnFav, idImovel);

    btnFav.addEventListener("click", async (ev) => {
      ev.stopPropagation();
      try {
        await handleToggleFavorite(idImovel);
        updateFavButtonState(btnFav, idImovel);
      } catch(e){
        console.error(e);
        showToast("Erro ao atualizar favorito");
      }
    });

    btnVer.addEventListener("click", (ev) => {
      ev.stopPropagation();
      openModalWithImovel(imovel);
    });

    // click card opens modal too
    article.addEventListener("click", () => openModalWithImovel(imovel));
  });

  pageInfo.textContent = `Página ${page}`;
}

/* helper: mark fav button state */
async function updateFavButtonState(btn, imovelId){
  const u = userId;
  if(!u || !btn) return;
  try {
    const favs = await api.getFavorites(u);
    const found = favs.some(f => String(f.id_imovel ?? f.id ?? f.imovel_id ?? f.raw?.id) === String(imovelId));
    btn.classList.toggle("favorited", !!found);
    btn.textContent = found ? "♥" : "♡";
  } catch(e){
    // ignore
  }
}

/* handle toggle favorite and refresh current list/page */
async function handleToggleFavorite(imovelId){
  if(!userId) { showToast("Faça login para favoritar."); return; }
  const resp = await api.toggleFavorite(userId, imovelId);
  showToast(String(resp).slice(0,120));
  await refreshAll(); // reload favorites + ui
}

/* escape helpers */
function escapeHtml(s=''){ return String(s).replace(/[&<>"]/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c])); }
function escapeAttr(s=''){ return String(s).replace(/"/g,'&quot;') }

/* ---------------------------
   Filters & pagination wiring
----------------------------*/
async function rebuildFilterOptions(list){
  // populate unique cities
  const cities = Array.from(new Set(list.map(i=> (i.cidade||'').trim()).filter(Boolean))).sort();
  filterCidade.innerHTML = `<option value="">Todas as cidades</option>` + cities.map(c=>`<option value="${escapeAttr(c)}">${escapeHtml(c)}</option>`).join('');
}

/* apply filters */
function applyFilters(){
  const q = (filterBusca.value||'').toLowerCase().trim();
  const cidade = filterCidade.value;
  const faixa = filterFaixa.value;

  filteredList = currentList.filter(i=>{
    const text = `${i.titulo} ${i.descricao} ${i.cidade} ${i.estado}`.toLowerCase();
    if(q && !text.includes(q)) return false;
    if(cidade && (i.cidade||'') !== cidade) return false;
    if(faixa){
      const num = Number(i.preco||0);
      const [min,max] = faixa.split("-").map(Number);
      if(min && num < min) return false;
      if(max && num > max) return false;
    }
    return true;
  });

  currentPage = 1;
  renderPage(currentPage);
}

/* pagination handlers */
prevPageBtn?.addEventListener("click", ()=> {
  if(currentPage > 1){ currentPage--; renderPage(currentPage); window.scrollTo({top:200, behavior:'smooth'}); }
});
nextPageBtn?.addEventListener("click", ()=> {
  const maxPage = Math.ceil(filteredList.length / PAGE_SIZE) || 1;
  if(currentPage < maxPage){ currentPage++; renderPage(currentPage); window.scrollTo({top:200, behavior:'smooth'}); }
});

filterBusca?.addEventListener("input", debounce(()=> applyFilters(), 350));
filterCidade?.addEventListener("change", ()=> applyFilters());
filterFaixa?.addEventListener("change", ()=> applyFilters());

/* ---------------------------
   Modal functions
----------------------------*/
function openModalWithImovel(imovel){
  const idImovel = imovel.id_imovel ?? imovel.raw?.id_imovel ?? imovel.raw?.id ?? imovel.id;
  modalTitle.textContent = imovel.titulo || imovel.nome_casa || "Imóvel";
  modalPreco.textContent = `R$ ${Number(imovel.preco||0).toLocaleString('pt-BR')}`;
  modalDetails.innerHTML = `
    <div class="meta-row small">
      <span>${imovel.tipo_moradia || ''}</span>
      <span>${imovel.area_total ? imovel.area_total + "m²" : ""}</span>
      <span>${imovel.quartos ? imovel.quartos + " quartos" : ""}</span>
    </div>
    <div style="margin-top:8px">${escapeHtml(imovel.descricao || '')}</div>
  `;

  // load photos and fill gallery
  api.getFotosForImovel(idImovel).then(fotos => {
    // prefer data/mimetype -> build src
    const lista = fotos.map(f=>{
      if(f.data && f.mimetype) return `data:${f.mimetype};base64,${f.data}`;
      return f.imagem || f.url || '';
    }).filter(Boolean);
    // fallback: main imagem
    if(lista.length === 0 && imovel.imagem) lista.push(imovel.imagem);

    hotelImage.src = lista[0] || '';
    hotelThumbs.innerHTML = lista.map(src=>`<img class="thumb" src="${escapeAttr(src)}">`).join('');
    hotelThumbs.querySelectorAll("img.thumb").forEach(img=>{
      img.addEventListener("click", ()=> hotelImage.src = img.src);
    });
  }).catch(err=>{
    // fallback: single image
    hotelImage.src = imovel.imagem || '';
    hotelThumbs.innerHTML = '';
  });

  modalEl.classList.add("ativo");
  modalEl.classList.add("modal-open");
  modalEl.classList.add("ativo"); // adds right:0 via CSS
  modalEl.setAttribute("aria-hidden","false");
  document.body.style.overflow = "hidden";
}

/* close */
closeModalBtn?.addEventListener("click", closeModal);
function closeModal(){
  modalEl.classList.remove("ativo");
  modalEl.classList.remove("modal-open");
  modalEl.setAttribute("aria-hidden","true");
  document.body.style.overflow = "";
}

/* close on escape */
window.addEventListener("keydown", (e)=> { if(e.key === "Escape") closeModal(); });

/* ---------------------------
   user UI logic (replaces login button)
----------------------------*/
function setUserUIFromLocal(){
  const raw = localStorage.getItem("user");
  if(!raw) return;
  let user;
  try { user = typeof raw === "string" ? JSON.parse(raw) : raw; } catch(e){ user = raw; }
  // user may be stored as object or string
  const email = (user && user.email) ? user.email : (typeof user === "string" ? user : (user?.user?.email || 'user'));

  // replace btn-signup
  const btn = btnSignup;
  if(!btn) return;
  const profileDiv = document.createElement("div");
  profileDiv.className = "user-profile";
  profileDiv.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px">
      <div style="width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,var(--accent-dark),var(--accent));display:grid;place-items:center;color:#fff;font-weight:700">${(email[0]||'U').toUpperCase()}</div>
      <div style="display:flex;flex-direction:column">
        <div style="font-weight:700;color:var(--accent-dark)">${escapeHtml(String(email).split('@')[0])}</div>
        <div style="font-size:12px;color:#666">Conta</div>
      </div>
    </div>
    <div style="display:flex;gap:8px;align-items:center">
      <button id="btn-logout" class="small-action">Sair</button>
    </div>
  `;
  btn.replaceWith(profileDiv);
  document.getElementById("btn-logout")?.addEventListener("click", ()=>{
    localStorage.removeItem("user");
    location.reload();
  });
}

/* ---------------------------
   boot / refresh logic
----------------------------*/
async function refreshAll(){
  if(!userId) {
    // if user not available try to parse local storage
    const raw = localStorage.getItem("user");
    if(!raw){ listaEl.innerHTML = `<p style="padding:18px;font-size:18px">Faça login para ver seus favoritos</p>`; return; }
    try { const u = JSON.parse(raw); userId = u.id ?? u.user?.id ?? u.id_usuario ?? null; } catch(e){}
    if(!userId){ listaEl.innerHTML = `<p style="padding:18px;font-size:18px">Faça login para ver seus favoritos</p>`; return; }
  }

  showSkeletons(6);
  try {
    const favs = await api.getFavorites(userId, true);
    currentList = favs;
    await rebuildFilterOptions(currentList);
    filteredList = [...currentList];
    currentPage = 1;
    renderPage(currentPage);
  } catch(err){
    console.error(err);
    listaEl.innerHTML = `<div class="empty-state"><h4>Erro ao carregar favoritos</h4><p>Tente novamente mais tarde.</p></div>`;
  }
}

/* initial boot */
(async function boot(){
  // set user UI
  setUserUIFromLocal();

  // wait a tick so UI elements exist
  await sleep(50);

  // wire modal close if clicked outside (on mobile right slide)
  modalEl?.addEventListener("click", (e)=>{
    if(e.target === modalEl) closeModal();
  });

  // initial refresh
  await refreshAll();
})();

/* small helper to escape for safer insertion into attributes/text */
(function exposeHelpers(){ window._favoritos_helpers = { escapeHtml, escapeAttr }; })();
