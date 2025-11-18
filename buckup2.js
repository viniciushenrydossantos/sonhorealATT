document.addEventListener("DOMContentLoaded", () => {

  // MODAL DE CADASTRO / LOGIN
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
      cursor: "pointer"
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

  // TOGGLE LOGIN / REGISTER
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

  // UI DO USUÁRIO LOGADO
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
  if (loggedUser) setUserUI(loggedUser);

  // REGISTRO
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
        const res = await fetch("http://192.168.1.14:3000/cadastrar", {
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

  // LOGIN
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
        const res = await fetch("http://192.168.1.14:3000/login", {
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

  const searchInput = document.querySelector('.search input[type="search"]');
  const typeSelect = document.querySelector('.search select');
  const searchButton = document.querySelector('.search .go');
  const gridList = document.querySelector('.grid-list');

  async function fetchImoveis() {
    try {
      const res = await fetch("http://192.168.1.14:3000/imoveis");
      if (!res.ok) throw new Error("Falha ao conectar ao servidor");
      const imoveis = await res.json();

      const imoveisComFotos = await Promise.all(imoveis.map(async (imovel) => {
        try {
          const resImg = await fetch(`http://192.168.1.14:3000/fotos_casa?id_imovel=${imovel.id_imovel}`);
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

  // FUNÇÃO DE RENDER EM GRID 1 GRANDE + 2 PEQUENAS
  function renderImoveis(imoveis) {
    if (!gridList) return;
    gridList.innerHTML = "";
    if (imoveis.length === 0) {
      gridList.innerHTML = '<p style="color:var(--muted)">Nenhum imóvel encontrado.</p>';
      return;
    }

    imoveis.forEach((imovel) => {
      const localizacao = `${imovel.rua}, ${imovel.numero} - ${imovel.bairro}, ${imovel.cidade} - ${imovel.estado}`;
      const article = document.createElement("article");
      article.className = "listing grid-style";
      article.setAttribute("role", "listitem");

      const fotos = imovel.fotos.length > 0 ? imovel.fotos.slice(0, 3) : [{ data: imovel.img, mimetype: "image/jpeg" }];
      
      article.innerHTML = `
        <div class="grid-container">
          <div class="grid-large">
            <img src="data:${fotos[0].mimetype};base64,${fotos[0].data}" alt="${imovel.nome_casa}">
          </div>
          <div class="grid-small">
            ${fotos.slice(1).map(f => `<img src="data:${f.mimetype};base64,${f.data}" alt="${imovel.nome_casa}">`).join('')}
          </div>
        </div>
        <div class="info">
          <div>
            <div style="font-weight:700">${imovel.nome_casa}</div>
            <div class="meta">${imovel.tipo_moradia} • ${imovel.area_total || ""}m²</div>
          </div>
          <div class="card-footer">
            <div class="price">R$ ${Number(imovel.preco).toLocaleString("pt-BR")}</div>
            <button class="btn btn-primary open-hotel"
              data-title="${imovel.nome_casa}"
              data-price="R$ ${Number(imovel.preco).toLocaleString('pt-BR')}"
              data-location="${localizacao}"
              data-rooms="${imovel.quartos} quartos • ${imovel.banheiros} banheiros"
              data-desc="Área total: ${imovel.area_total}m² • Garagem: ${imovel.vagas_garagem} vaga(s) • ${imovel.finalidade}"
              data-img="${imovel.img}"
              data-fotos='${JSON.stringify(imovel.fotos)}'
            >Ver mais</button>
          </div>
        </div>
      `;
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

  function activateHotelModal() {
    const openButtons = document.querySelectorAll(".open-hotel");
    const modal = document.getElementById("hotelModal");
    const closeModal = document.getElementById("closeModal");
    const titleEl = document.getElementById("hotel-title");
    const mainImgEl = document.getElementById("hotel-image");
    const sideImagesContainer = document.getElementById("hotel-thumbs");
    const priceEl = document.getElementById("hotel-price");
    const locationEl = document.getElementById("hotel-location");
    const roomsEl = document.getElementById("hotel-rooms");
    const descEl = document.getElementById("hotel-desc");

    openButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const fotos = JSON.parse(btn.dataset.fotos || "[]");

        if (titleEl) titleEl.textContent = btn.dataset.title;
        if (mainImgEl) mainImgEl.src = fotos[0] ? `data:${fotos[0].mimetype};base64,${fotos[0].data}` : btn.dataset.img;
        if (priceEl) priceEl.textContent = btn.dataset.price;
        if (locationEl) locationEl.textContent = btn.dataset.location;
        if (roomsEl) roomsEl.textContent = btn.dataset.rooms;
        if (descEl) descEl.textContent = btn.dataset.desc;

        if (sideImagesContainer) {
          sideImagesContainer.innerHTML = "";
          fotos.slice(0, 2).forEach((f, i) => {
            const thumb = document.createElement("img");
            thumb.src = `data:${f.mimetype};base64,${f.data}`;
            thumb.alt = `Imagem ${i + 1} - ${btn.dataset.title}`;
            thumb.className = "thumb";
            thumb.addEventListener("click", () => {
              mainImgEl.style.opacity = 0;
              setTimeout(() => {
                mainImgEl.src = thumb.src;
                mainImgEl.style.opacity = 1;
              }, 150);
            });
            sideImagesContainer.appendChild(thumb);
          });
        }

        if (modal) modal.showModal();
      });
    });

    if (closeModal && modal) {
      closeModal.addEventListener("click", () => modal.close());
      modal.addEventListener("click", (event) => {
        const rect = modal.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) {
          modal.close();
        }
      });
    }
  }

  // =============================
  // INICIALIZAÇÃO
  // =============================
  filterImoveis();
  activateHotelModal();

});
