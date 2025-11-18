document.addEventListener("DOMContentLoaded", () => {

  // ============================================
  // 🚫 BLOQUEIO DE ACESSO SEM LOGIN (NOVO COMPORTAMENTO)
  // ============================================
  function exigirLogin(callback) {
    const loggedUser = localStorage.getItem("user");
    const signupModal = document.getElementById("signupModal");

    if (loggedUser) {
      callback(); // usuário logado → executa ação
    } else {
      if (signupModal) signupModal.showModal(); // abre modal de login
    }
  }

  // ============================================
  // 🔐 MODAL DE CADASTRO / LOGIN
  // ============================================
  const signupModal = document.getElementById("signupModal");
  const btnSignup = document.getElementById("btn-signup");
  const registerFormElement = document.getElementById("registerForm");
  const loginFormElement = document.getElementById("loginForm");

  if (signupModal && btnSignup && registerFormElement && loginFormElement) {

    const btnClose = document.createElement("button");
    btnClose.textContent = "✕";
    Object.assign(btnClose.style, {
      position: "absolute",
      top: "10px",
      right: "10px",
      background: "transparent",
      border: "none",
      fontSize: "24px",
      cursor: "pointer",
      color: "#333"
    });

    const modalContainer = signupModal.querySelector(".signupModal-container");
    if (modalContainer) modalContainer.appendChild(btnClose);

    btnSignup.addEventListener("click", () => signupModal.showModal());
    btnClose.addEventListener("click", () => signupModal.close());

    signupModal.addEventListener("click", (e) => {
      const rect = signupModal.getBoundingClientRect();
      if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) {
        signupModal.close();
      }
    });
  }

  // ============================================
  // 🔁 TOGGLE LOGIN / REGISTER
  // ============================================
  const toggleBtn = document.getElementById("toggleBtn");
  const welcomeTitle = document.getElementById("welcomeTitle");
  const welcomeText = document.getElementById("welcomeText");
  let isRegister = false;

  if (toggleBtn && welcomeTitle && welcomeText && registerFormElement && loginFormElement) {
    toggleBtn.addEventListener("click", () => {
      isRegister = !isRegister;
      if (isRegister) {
        loginFormElement.classList.remove("active");
        registerFormElement.classList.add("active");
        welcomeTitle.textContent = "Hello, Friend!";
        welcomeText.textContent = "Enter your personal details and start your journey with us";
        toggleBtn.textContent = "LOGIN";
      } else {
        registerFormElement.classList.remove("active");
        loginFormElement.classList.add("active");
        welcomeTitle.textContent = "Welcome";
        welcomeText.textContent = "Join Our Unique Platform, Explore a New Experience";
        toggleBtn.textContent = "REGISTER";
      }
    });
  }

  // ============================================
  // 👤 UI DO USUÁRIO LOGADO
  // ============================================
  function setUserUI(userEmail) {
    const btnLogin = document.getElementById("btn-signup");
    if (!btnLogin) return;

    const profileDiv = document.createElement("div");
    Object.assign(profileDiv.style, {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      background: "var(--btn-bg)",
      padding: "6px 12px",
      borderRadius: "12px",
      color: "#fff",
      fontWeight: "600",
      fontFamily: "'Poppins', sans-serif",
      boxShadow: "0 2px 6px rgba(0,0,0,0.2)"
    });

    const icon = document.createElement("span");
    icon.textContent = "👤";
    icon.style.fontSize = "18px";

    const name = document.createElement("span");
    name.textContent = userEmail.split("@")[0];
    name.style.color = "#b50affff";
    name.style.textShadow = "0 0 4px rgba(153, 152, 153, 0.86)";

    const logoutBtn = document.createElement("button");
    logoutBtn.textContent = "Sair";
    Object.assign(logoutBtn.style, {
      background: "var(--accent)",
      border: "none",
      color: "#fff",
      padding: "4px 10px",
      borderRadius: "8px",
      cursor: "pointer",
      fontWeight: "600",
      transition: "0.2s"
    });
    logoutBtn.addEventListener("mouseenter", () => logoutBtn.style.opacity = "0.8");
    logoutBtn.addEventListener("mouseleave", () => logoutBtn.style.opacity = "1");
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("user");
      location.reload();
    });

    profileDiv.append(icon, name, logoutBtn);
    btnLogin.replaceWith(profileDiv);
  }

  const loggedUser = localStorage.getItem("user");
  if (loggedUser) {
    setUserUI(loggedUser);
  }

  // ============================================
  // 📝 REGISTRO
  // ============================================
  if (registerFormElement) {
    const registerMsg = document.createElement("p");
    registerMsg.style.color = "red";
    registerMsg.style.fontSize = "14px";
    registerMsg.style.marginTop = "6px";
    registerFormElement.appendChild(registerMsg);

    registerFormElement.addEventListener("submit", async (e) => {
      e.preventDefault();
      registerMsg.textContent = "";
      const emailInput = registerFormElement.querySelector('input[type="email"]');
      const senhaInput = registerFormElement.querySelectorAll('input[type="password"]');
      const email = emailInput.value.trim();
      const senha = senhaInput[0].value.trim();
      const confirmar = senhaInput[1].value.trim();

      if (!email || !senha || !confirmar) return registerMsg.textContent = "Preencha todos os campos!";
      if (senha !== confirmar) return registerMsg.textContent = "As senhas não coincidem!";

      try {
        const res = await fetch("http://192.168.1.44:3000/cadastrar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, senha }),
        });
        const data = await res.json();
        if (!res.ok) return registerMsg.textContent = data.message || "Erro ao cadastrar!";
        registerMsg.style.color = "green";
        registerMsg.textContent = data.message || "Cadastro realizado com sucesso!";
        localStorage.setItem("user", email);
        setUserUI(email);
        registerFormElement.reset();
        setTimeout(() => signupModal.close(), 1200);
      } catch (err) {
        console.error("Erro no cadastro:", err);
        registerMsg.textContent = "Falha ao cadastrar. Verifique o console.";
      }
    });
  }

  // ============================================
  // 🔑 LOGIN
  // ============================================
  if (loginFormElement) {
    loginFormElement.addEventListener("submit", async (e) => {
      e.preventDefault();
      const registerMsg = registerFormElement.querySelector("p");
      if (registerMsg) registerMsg.textContent = "";

      const emailInput = loginFormElement.querySelector('input[type="email"]');
      const senhaInput = loginFormElement.querySelector('input[type="password"]');
      const email = emailInput.value.trim();
      const senha = senhaInput.value.trim();

      if (!email || !senha) return registerMsg.textContent = "Preencha todos os campos!";

      try {
        const res = await fetch("http://192.168.1.44:3000/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, senha }),
        });
        const data = await res.json();
        if (!res.ok) return registerMsg.textContent = data.message || "Usuário ou senha inválidos!";
        registerMsg.style.color = "green";
        registerMsg.textContent = "Login realizado com sucesso!";
        localStorage.setItem("user", data.email);
        setUserUI(data.email);
        loginFormElement.reset();
        setTimeout(() => signupModal.close(), 1000);
      } catch (err) {
        console.error("Erro no login:", err);
        if (registerMsg) registerMsg.textContent = "Falha ao conectar com o servidor.";
      }
    });
  }

  // ============================================
  // 🏠 BUSCA DE IMÓVEIS
  // ============================================
  const searchInput = document.querySelector('.search input[type="search"]');
  const typeSelect = document.querySelector('.search select');
  const searchButton = document.querySelector('.search .go');
  const gridList = document.querySelector('.grid-list');

  async function fetchImoveis() {
    try {
      const res = await fetch("http://192.168.1.44:3000/imoveis");
      if (!res.ok) throw new Error("Falha ao conectar ao servidor");
      const imoveis = await res.json();

      const imoveisComFotos = await Promise.all(imoveis.map(async (imovel) => {
        try {
          const resImg = await fetch(`http://192.168.1.44:3000/fotos_casa?id_imovel=${imovel.id_imovel}`);
          const fotos = resImg.ok ? await resImg.json() : [];
          const imgUrl = fotos.length > 0 ? `data:${fotos[0].mimetype};base64,${fotos[0].data}` : 'img/padrao.jpg';
          return { ...imovel, img: imgUrl, fotos };
        } catch {
          return { ...imovel, img: 'img/padrao.jpg', fotos: [] };
        }
      }));

      return imoveisComFotos;
    } catch (err) {
      console.error("Erro ao buscar imóveis:", err);
      return [];
    }
  }

  function renderImoveis(imoveis) {
    if (!gridList) return;
    gridList.innerHTML = "";
    if (imoveis.length === 0) {
      gridList.innerHTML = '<p style="color:var(--muted)">Nenhum imóvel encontrado.</p>';
      return;
    }

    imoveis.forEach((imovel) => {
      const article = criarCard(imovel);
      gridList.appendChild(article);
    });

    activateHotelModal();
  }

  async function filterImoveis() {
    const query = searchInput?.value.toLowerCase() || "";
    const type = typeSelect?.value.toLowerCase() || "";
    const imoveis = await fetchImoveis();
    const filtered = imoveis.filter((imovel) => {
      const matchesType = type === "todos os tipos" || imovel.tipo_moradia.toLowerCase() === type;
      const matchesQuery = !query || imovel.nome_casa.toLowerCase().includes(query) || imovel.cidade.toLowerCase().includes(query);
      return matchesType && matchesQuery;
    });
    renderImoveis(filtered);
  }

  searchButton?.addEventListener("click", filterImoveis);
  searchInput?.addEventListener("keyup", (e) => { if (e.key === "Enter") filterImoveis(); });

  function criarCard(imovel) {
    const article = document.createElement("article");
    article.className = "listing grid-style";
    article.dataset.id = imovel.id_imovel;

    const fotos = imovel.fotos.length > 0 ? imovel.fotos.slice(0, 3) : [{ data: imovel.img, mimetype: "image/jpeg" }];
    const localizacao = `${imovel.rua}, ${imovel.numero} - ${imovel.bairro}, ${imovel.cidade} - ${imovel.estado}`;

    article.innerHTML = `
  <div class="grid-container">
    <div class="grid-large">
      <img src="data:${String(fotos[0]?.mimetype || '')};base64,${String(fotos[0]?.data || '')}" alt="${String(imovel.nome_casa || 'Imóvel')}">
    </div>
    <div class="grid-small">
      ${fotos.slice(1).map(f => `
        <img src="data:${String(f.mimetype || '')};base64,${String(f.data || '')}" alt="${String(imovel.nome_casa || 'Imóvel')}">
      `).join('')}
    </div>
  </div>

  <div class="info">
    <div>
      <div style="font-weight:700">${String(imovel.nome_casa || 'Sem nome')}</div>
      <div class="meta">
        ${String(imovel.tipo_moradia || 'N/A')} • ${String(imovel.area_total || 'N/A')}m² • ${String(imovel.quartos || 'N/A')} quartos • ${String(imovel.banheiros || 'N/A')} banheiros
      </div>
    </div>

    <div class="card-footer">
      <div class="price">R$ ${String(Number(imovel.preco || 0).toLocaleString("pt-BR"))}</div>
      <button class="btn btn-primary open-hotel"
        data-title="${String(imovel.nome_casa || '')}"
        data-price="R$ ${String(Number(imovel.preco || 0).toLocaleString('pt-BR'))}"
        data-location="${String(localizacao || '')}"
        data-rooms="${String(imovel.quartos || 0)} quartos • ${String(imovel.banheiros || 0)} banheiros"
        data-garage="${String(imovel.vagas_garagem || 0)} vaga(s)"
        data-area="${String(imovel.area_total || 'N/A')}m²"
        data-finalidade="${String(imovel.finalidade || '')}"
        data-desc="${String(imovel.descricao || '')}"
        data-fotos='${JSON.stringify(imovel.fotos || [])}'
      >Ver mais</button>
    </div>
  </div>
`;
    return article;
  }

  function activateHotelModal() {
    const modal = document.getElementById("hotelModal");
    if (!modal) return;
    const closeBtn = document.getElementById("closeModal");

    const titleEl = document.getElementById("hotel-title");
    const priceEl = document.getElementById("hotel-price");
    const locationEl = document.getElementById("hotel-location");
    const roomsEl = document.getElementById("hotel-rooms");
    const garageEl = document.getElementById("hotel-garage");
    const areaEl = document.getElementById("hotel-area");
    const descEl = document.getElementById("hotel-desc");
    const amenitiesEl = document.getElementById("hotel-amenities");
    const mainImg = document.getElementById("hotel-image");
    const thumbsWrapper = document.getElementById("thumbs-wrapper");

    const openButtons = document.querySelectorAll(".open-hotel");

    openButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        exigirLogin(() => {
          const fotos = JSON.parse(btn.dataset.fotos || "[]");
          const mainImage = fotos.length ? `data:${fotos[0].mimetype};base64,${fotos[0].data}` : "img/padrao.jpg";

          titleEl.textContent = btn.dataset.title || "Imóvel";
          priceEl.textContent = btn.dataset.price || "";
          locationEl.innerHTML = `<strong> Localização:</strong> ${btn.dataset.location || ""}`;
          roomsEl.innerHTML = `<strong> Quartos / Banheiros:</strong> ${btn.dataset.rooms || ""}`;
          garageEl.innerHTML = `<strong> Garagem:</strong> ${btn.dataset.garage || "N/A"}`;
          areaEl.innerHTML = `<strong> Área Total:</strong> ${btn.dataset.area || "N/A"}`;
          descEl.textContent = btn.dataset.desc?.trim() || "Sem descrição detalhada.";

          amenitiesEl.innerHTML = "";
          const comodidades = [
            btn.dataset.finalidade && `Finalidade: ${btn.dataset.finalidade}`,
          ].filter(Boolean);

          if (comodidades.length > 0) {
            comodidades.forEach((item) => {
              const li = document.createElement("li");
              li.textContent = item;
              amenitiesEl.appendChild(li);
            });
          } else {
            amenitiesEl.innerHTML = "<li>Sem comodidades informadas</li>";
          }

          mainImg.src = mainImage;
          thumbsWrapper.innerHTML = "";
          fotos.forEach((f, i) => {
            const thumb = document.createElement("img");
            thumb.src = `data:${f.mimetype};base64,${f.data}`;
            thumb.className = "thumb";
            thumb.addEventListener("click", () => {
              mainImg.src = thumb.src;
              document.querySelectorAll(".thumb").forEach(t => t.classList.remove("active"));
              thumb.classList.add("active");
            });
            thumbsWrapper.appendChild(thumb);
            if (i === 0) thumb.classList.add("active");
          });

          modal.showModal();
        });
      });
    });

    closeBtn?.addEventListener("click", () => modal.close());
  }

  // ============================================
  // 🚫 BLOQUEIO DE LINKS SEM LOGIN
  // ============================================
  document.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", (e) => {
      const loggedUser = localStorage.getItem("user");
      if (!loggedUser) {
        e.preventDefault();
        const signupModal = document.getElementById("signupModal");
        if (signupModal) signupModal.showModal();
      }
    });
  });
function abrirContato() {
  const linkWhatsApp = "https://wa.me/5517991020080";
 
  window.open(linkWhatsApp, "_blank");
}
  fetchImoveis().then(renderImoveis);
// ========== FUNÇÕES DO CALENDÁRIO ==========
function abrirCalendario() {
  const calendario = document.getElementById("calendario-visita");
  calendario.classList.remove("hidden");
}

function fecharCalendario() {
  const calendario = document.getElementById("calendario-visita");
  calendario.classList.add("hidden");
}

function confirmarVisita() {
  const data = document.getElementById("data-visita").value;
  if (!data) {
    alert("Por favor, selecione uma data para a visita.");
    return;
  }

  alert(`Visita agendada para o dia ${new Date(data).toLocaleDateString("pt-BR")}!`);
  fecharCalendario();
}
}); // Fim do DOMContentLoaded
