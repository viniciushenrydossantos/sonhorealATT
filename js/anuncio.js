function toggleSection(el) {
  const parent = el.parentElement;
  parent.classList.toggle("expanded");
}

function abrirModalTipo() {
  document.getElementById("modalTipo").classList.remove("hidden");
}

function fecharModalTipo() {
  document.getElementById("modalTipo").classList.add("hidden");
}

function abrirModalDetalhes(imovel) {
  document.getElementById("modalImagem").src = imovel.imagem;
  document.getElementById("modalTitulo").textContent = imovel.nome_casa || "Imóvel";
  document.getElementById("modalDescricao").textContent = imovel.descricao || "Sem descrição disponível.";
  document.getElementById("modalArea").textContent = imovel.area_total || 0;
  document.getElementById("modalQuartos").textContent = imovel.quartos || 0;
  document.getElementById("modalBanheiros").textContent = imovel.banheiros || 0;
  document.getElementById("modalVagas").textContent = imovel.vagas_garagem || 0;
  document.getElementById("modalFinalidade").textContent = imovel.finalidade || "Não informado";
  document.getElementById("modalPreco").textContent = Number(imovel.preco || 0).toLocaleString('pt-BR');
  document.getElementById("modalDisponibilidade").textContent = imovel.disponibilidade ? "Sim" : "Não";

  document.getElementById("modalDetalhes").classList.remove("hidden");
}

function fecharModalDetalhes() {
  document.getElementById("modalDetalhes").classList.add("hidden");
}
document.addEventListener("DOMContentLoaded", () => {
  const btnLoginMenu = document.getElementById("btn-signup");
  const menuToggle = document.getElementById("menu-toggle");
  const modal = document.getElementById("signupModal");

  if (btnLoginMenu) {
    btnLoginMenu.addEventListener("click", () => {
      // Fecha o menu hambúrguer
      menuToggle.checked = false;

      // Abre o modal de login/cadastro
      if (modal) modal.showModal();
    });
  }
});
document.addEventListener("DOMContentLoaded", () => {

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
});
document.addEventListener("DOMContentLoaded", () => {

  const estadoSelect = document.getElementById("estado");
  const cidadeSelect = document.getElementById("cidade");
  const localizacaoInput = document.querySelector('[placeholder="Digite bairro, rua ou cidade"]');
  const tipoBotoes = document.querySelectorAll(".types button, .tipo-card");
  const precoMin = document.querySelector('[placeholder="Mínimo"]');
  const precoMax = document.querySelector('[placeholder="Máximo"]');
  const quartosBotoes = document.querySelectorAll(".quantity-btns button");
  const cardsContainer = document.querySelector(".results");
  const resultCount = document.querySelector(".result-count");
  const btnFiltrar = document.querySelector(".btn-filtrar");

  let filtros = {
    estado: "",
    cidade: "",
    rua: "",
    bairro: "",
    numero: "",
    tipo_moradia: "",
    preco_minimo: "",
    preco_maximo: "",
    quartos: "",
    area_total: "",
    banheiros: "",
    vagas_garagem: "",
    disponibilidade: ""
  };

  // ---------------------------
  estadoSelect.addEventListener("change", () => {
    filtros.estado = estadoSelect.value;
    filtros.cidade = "";
    cidadeSelect.innerHTML = '<option value="">Selecione uma cidade</option>';
    cidadeSelect.disabled = !filtros.estado;
  });

  cidadeSelect.addEventListener("change", () => {
    filtros.cidade = cidadeSelect.value;
  });

  localizacaoInput.addEventListener("input", () => {
    filtros.localizacao = localizacaoInput.value;
  });

  tipoBotoes.forEach(btn => {
    btn.addEventListener("click", () => {
      btn.parentElement.querySelectorAll("button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      filtros.tipo_moradia = btn.textContent;
    });
  });

  precoMin.addEventListener("input", () => {
    filtros.preco_minimo = precoMin.value;
  });

  precoMax.addEventListener("input", () => {
    filtros.preco_maximo = precoMax.value;
  });

  quartosBotoes.forEach(btn => {
    btn.addEventListener("click", () => {
      btn.parentElement.querySelectorAll("button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      filtros.quartos = btn.textContent.replace("+", "");
    });
  });

async function fetchImoveis() {
  try {
    // Criar parâmetros da requisição com base nos filtros
    const params = new URLSearchParams();
    for (const key in filtros) {
      if (filtros[key]) params.append(key, filtros[key]);
    }

    // Buscar imóveis
    const res = await fetch(`http://192.168.1.44:3000/imoveis?${params.toString()}`);
    if (!res.ok) throw new Error("Falha ao conectar ao servidor");
    const imoveis = await res.json();

    // Buscar todas as fotos de uma vez
    const resFotos = await fetch(`http://192.168.1.44:3000/fotos_casa`);
    const fotos = resFotos.ok ? await resFotos.json() : [];

    // Associar as fotos aos imóveis
    const imoveisComFotos = imoveis.map(imovel => {
      const imgs = fotos.filter(f => f.id_imovel === imovel.id_imovel);

      // Se houver fotos, usa a primeira
      const primeiraImg = imgs.length > 0
        ? `data:${imgs[0].mimetype};base64,${arrayBufferToBase64(imgs[0].data.data)}`
        : 'https://via.placeholder.com/300x200'; // Caso não tenha fotos

      return { ...imovel, imagem: primeiraImg, fotos: imgs };
    });

    // Renderizar os imóveis com as fotos
    renderCards(imoveisComFotos);
  } catch (err) {
    console.error("Erro ao buscar imóveis:", err);
    cardsContainer.innerHTML = "<p>Erro ao carregar imóveis</p>";
    resultCount.textContent = "0 imóveis encontrados";
  }
}

// Função de renderização dos imóveis na tela
function renderCards(imoveis) {
  if (!imoveis.length) {
    cardsContainer.innerHTML = "<p>Nenhum imóvel encontrado</p>";
    resultCount.textContent = "0 imóveis encontrados";
    return;
  }

  const html = imoveis.map(imovel => {
    const primeiraImg = imovel.fotos.length > 0
      ? `data:${imovel.fotos[0].mimetype};base64,${arrayBufferToBase64(imovel.fotos[0].data.data)}`
      : 'https://via.placeholder.com/300x200';

    return `
      <div class="card">
        <img src="${primeiraImg}" alt="Imagem do imóvel" />
        <div class="info">
          <h3>${imovel.nome_casa || "Imóvel"} - ${imovel.rua || ""}, ${imovel.bairro || ""}</h3>
          <p>${imovel.tipo_moradia || ""} · ${imovel.area_total || 0}m² · ${imovel.quartos || 0} quartos · ${imovel.banheiros || 0} banheiros · ${imovel.vagas_garagem || 0} vagas</p>
          <p>Finalidade: ${imovel.finalidade || "Não informado"}</p>
          <strong>R$ ${Number(imovel.preco || 0).toLocaleString('pt-BR')}</strong>
          <p>Disponível: ${imovel.disponibilidade ? 'Sim' : 'Não'}</p>
          <button class="btn-detalhes" data-id="${imovel.id_imovel}">Ver mais</button>
        </div>
      </div>
    `;
  }).join("");

  cardsContainer.innerHTML = html;
  resultCount.textContent = `${imoveis.length} imóveis encontrados`;

  // Adicionar evento de click para o botão de detalhes
  document.querySelectorAll(".btn-detalhes").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const idImovel = e.target.dataset.id;
      const imovel = imoveis.find(i => i.id_imovel == idImovel);
      if (imovel) abrirModalDetalhes(imovel);
    });
  });
}

// Função para converter arrayBuffer para base64 (igual no segundo código)
function arrayBufferToBase64(buffer) {
  const binary = String.fromCharCode(...new Uint8Array(buffer));
  return window.btoa(binary);
}

// Chamar ao carregar a página
fetchImoveis();


  btnFiltrar.addEventListener("click", fetchImoveis);

  const cidades = document.querySelector('#cidade');
  cidades.addEventListener('click', async () => {
    const estado = document.querySelector('#estado').value;
    if (!estado) {
      alert("Selecione um estado primeiro!");
      return;
    }

    try {
      const resposta = await fetch(
        `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estado}/municipios`
      );

      if (!resposta.ok) throw new Error("Erro ao buscar cidades");

      const dados = await resposta.json();
      cidades.innerHTML = '<option value="">Selecione uma cidade</option>';
      dados.forEach(cidade => {
        cidades.innerHTML += `<option value="${cidade.nome}">${cidade.nome}</option>`;
      });

    } catch (erro) {
      console.error("Erro ao carregar cidades:", erro);
      cidades.innerHTML = '<option value="">Erro ao carregar cidades</option>';
    }
  });

  fetchImoveis();
});
// ================================
// 🏠 FUNÇÕES DO MODAL DE DETALHES
// ================================

// Abre o modal e preenche as informações do imóvel
function abrirModalDetalhes(imovel) {
  const modal = document.getElementById("modalDetalhes");

  // Preenche os campos
  document.getElementById("modalImagem").src = imovel.imagem || "https://via.placeholder.com/400x300";
  document.getElementById("modalTitulo").textContent = imovel.nome_casa || "Imóvel";
  document.getElementById("modalDescricao").textContent = imovel.descricao || "Sem descrição disponível.";
  document.getElementById("modalArea").textContent = imovel.area_total ? `${imovel.area_total} m²` : "—";
  document.getElementById("modalQuartos").textContent = imovel.quartos || "—";
  document.getElementById("modalBanheiros").textContent = imovel.banheiros || "—";
  document.getElementById("modalVagas").textContent = imovel.vagas_garagem || "—";
  document.getElementById("modalFinalidade").textContent = imovel.finalidade || "Não informado";
  document.getElementById("modalPreco").textContent = imovel.preco
    ? `R$ ${Number(imovel.preco).toLocaleString("pt-BR")}`
    : "R$ —";
  document.getElementById("modalDisponibilidade").textContent = imovel.disponibilidade
    ? "Sim"
    : "Não";

  // Mostra o modal
  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden"; // bloqueia scroll do fundo
}

// Fecha o modal
function fecharModalDetalhes() {
  const modal = document.getElementById("modalDetalhes");
  modal.classList.add("hidden");
  document.body.style.overflow = ""; // restaura scroll
}

// Fecha o modal ao clicar fora do conteúdo
document.addEventListener("click", (e) => {
  const modal = document.getElementById("modalDetalhes");
  if (e.target === modal) {
    fecharModalDetalhes();
  }
});

// Fecha com tecla ESC
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") fecharModalDetalhes();
});
function abrirContato() {
  const linkWhatsApp = "https://wa.me/5517992731437"
 
  window.open(linkWhatsApp, "_blank");
}
// ========== FUNÇÕES DO CALENDÁRIO ==========

/// Data de postagem do imóvel
const dataPostagem = "2025-11-21";

function abrirCalendario() {
  const calendario = document.getElementById("calendario-visita");
  const inputData = document.getElementById("data-visita");

  calendario.classList.remove("hidden");

  // trava para não escolher antes da postagem
  inputData.min = dataPostagem;

  // abre já posicionado no mês/ano correto
  inputData.value = dataPostagem;

  // ====== FORÇA ABRIR O CALENDÁRIO ======
  setTimeout(() => {
    if (inputData.showPicker) {
      inputData.showPicker();   // 🔥 abre o calendário automaticamente!
    } else {
      inputData.focus();        // fallback para navegadores antigos
    }
  }, 150);
}

// Fecha o calendário
function fecharCalendario() {
  document.getElementById("calendario-visita").classList.add("hidden");
}

// Envia mensagem pro WhatsApp com nome_casa
function confirmarVisita() {
  const data = document.getElementById("data-visita").value;
  const hora = document.getElementById("hora-visita").value;

  if (!data) {
    alert("Por favor, selecione uma data para a visita.");
    return;
  }

  if (!hora) {
    alert("Por favor, selecione um horário para a visita.");
    return;
  }

  const nome_casa = document.getElementById("modalTitulo").textContent.trim();

  const dataFormatada = new Date(data).toLocaleDateString("pt-BR");

  const telefoneDono = "5517992731437";

  const mensagem = encodeURIComponent(
    `Olá! Gostaria de agendar uma visita para *${nome_casa}*.\n\n📅 *Data:* ${dataFormatada}\n⏰ *Hora:* ${hora}\n\nAguardo confirmação!`
  );

  window.open(`https://wa.me/${telefoneDono}?text=${mensagem}`, "_blank");

  fecharCalendario();
}

// ================================
// 🩷 BOTÃO DE FAVORITAR (CARDS E MODAL)
// ================================
function toggleFavorito(el, idImovel) {
  let favoritos = JSON.parse(localStorage.getItem("favoritos")) || [];

  if (favoritos.includes(idImovel)) {
    favoritos = favoritos.filter(id => id !== idImovel);
    el.classList.remove("favoritado");
  } else {
    favoritos.push(idImovel);
    el.classList.add("favoritado");
  }

  localStorage.setItem("favoritos", JSON.stringify(favoritos));
}
// ================================
// 🩷 BOTÃO DE FAVORITAR (CARDS E MODAL)
// ================================
function toggleFavorito(el, idImovel) {
  let favoritos = JSON.parse(localStorage.getItem("favoritos")) || [];

  if (favoritos.includes(idImovel)) {
    favoritos = favoritos.filter(id => id !== idImovel);
    el.classList.remove("favoritado");
  } else {
    favoritos.push(idImovel);
    el.classList.add("favoritado");
  }

  localStorage.setItem("favoritos", JSON.stringify(favoritos));
}
