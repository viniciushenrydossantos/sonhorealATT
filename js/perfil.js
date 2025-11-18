document.addEventListener("DOMContentLoaded", async () => {

  // ============================================
  // 🔍 CARREGAR ID OU EMAIL DO USUÁRIO
  // ============================================
  let userId =
    localStorage.getItem("userId") ||
    localStorage.getItem("user") ||
    localStorage.getItem("id");

  let loggedEmail = localStorage.getItem("user"); // usado no menu

  // ============================================
  // 🔐 MOSTRAR USUÁRIO NO MENU (EM TODAS AS PÁGINAS)
  // ============================================
  function setUserUI(email) {
    const btnLogin = document.getElementById("btn-signup");
    if (!btnLogin) return; // página sem botão

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
    name.textContent = email.split("@")[0];
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
      fontWeight: "600"
    });

    logoutBtn.addEventListener("click", () => {
      localStorage.clear();
      location.reload();
    });

    profileDiv.append(icon, name, logoutBtn);
    btnLogin.replaceWith(profileDiv);
  }

  if (loggedEmail) {
    setUserUI(loggedEmail);
  }

  // ============================================
  // ❗ SÓ CONTINUA SE A PÁGINA TIVER PERFIL
  // ============================================
  if (!document.getElementById("nomeExibido")) return;

  // ============================================
  // 🔒 BLOQUEAR ACESSO SEM LOGIN
  // ============================================
  if (!userId || userId === "null" || userId === "undefined") {
    alert("Você precisa estar logado para acessar o perfil.");
    window.location.href = "homepage.html";
    return;
  }

  userId = Number(userId);

  // Elementos do DOM
  const nomeExibido = document.getElementById("nomeExibido");
  const bioExibida = document.getElementById("bioExibida");

  const nomeInput = document.getElementById("nomeInput");
  const bioInput = document.getElementById("bioInput");

  const btnSalvar = document.getElementById("btnSalvar");

  try {
    // ================================
    // 1️⃣ BUSCAR DADOS DO USUÁRIO
    // ================================
    const resUser = await fetch(`https://sonho-real-back.onrender.com/people/${userId}`);
    const user = await resUser.json();

    // Preenche textos exibidos
    nomeExibido.textContent = user.nome || "Usuário";
    bioExibida.textContent = user.bio || "Clique aqui para adicionar uma bio";

    nomeInput.value = user.nome;
    bioInput.value = user.bio || "";

    // ================================
    // 2️⃣ BUSCAR FAVORITOS
    // ================================
    const resFav = await fetch(`https://sonho-real-back.onrender.com/favorites/${userId}`);
    const favoritos = await resFav.json();

    const lista = document.querySelector(".lista-favoritos");
    lista.innerHTML = "";

    if (!favoritos.length) {
      lista.innerHTML = "<p>Você ainda não favoritou nenhum imóvel.</p>";
    } else {
      favoritos.forEach((imovel) => {
        const div = document.createElement("div");
        div.classList.add("imovel");

        div.innerHTML = `
          <img src="${imovel.imagem}" alt="${imovel.titulo}">
          <div class="imovel-info">
            <h3>${imovel.titulo}</h3>
            <p>R$ ${Number(imovel.preco).toLocaleString("pt-BR")}</p>
          </div>
        `;

        lista.appendChild(div);
      });
    }

  } catch (err) {
    console.error("Erro ao carregar perfil:", err);
  }

  // ============================================
  // 🟢 ATIVAR MODO DE EDIÇÃO
  // ============================================

  nomeExibido.addEventListener("click", () => {
    nomeExibido.style.display = "none";
    nomeInput.style.display = "block";
    btnSalvar.style.display = "inline-block";
  });

  bioExibida.addEventListener("click", () => {
    bioExibida.style.display = "none";
    bioInput.style.display = "block";
    btnSalvar.style.display = "inline-block";
  });

  // ============================================
  // 3️⃣ SALVAR ALTERAÇÕES DO PERFIL
  // ============================================

  btnSalvar.addEventListener("click", async () => {
    const novoNome = nomeInput.value.trim();
    const novaBio = bioInput.value.trim();

    if (!novoNome) {
      alert("O nome não pode ficar vazio.");
      return;
    }

    try {
      const res = await fetch(`https://sonho-real-back.onrender.com/people/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: novoNome, bio: novaBio })
      });

      if (!res.ok) throw new Error("Falha ao atualizar.");

      alert("Perfil atualizado com sucesso!");

      nomeExibido.textContent = novoNome;
      bioExibida.textContent = novaBio || "Clique aqui para adicionar uma bio";

      nomeInput.style.display = "none";
      bioInput.style.display = "none";

      nomeExibido.style.display = "block";
      bioExibida.style.display = "block";

      btnSalvar.style.display = "none";

    } catch (err) {
      console.error("Erro ao atualizar:", err);
    }
  });

});
