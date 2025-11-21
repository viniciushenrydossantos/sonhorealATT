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
      const params = new URLSearchParams();

      for (const key in filtros) {
        if (filtros[key]) params.append(key, filtros[key]);
      }

      // Busca os imóveis
const res = await fetch(`https://sonho-real-back.onrender.com/imoveis?${params.toString()}`);
      if (!res.ok) throw new Error("Falha ao conectar ao servidor");

      const imoveis = await res.json();

      async function processarEmLotes(imoveis, tamanhoDoLote = 5) {
        const resultado = [];
        for (let i = 0; i < imoveis.length; i += tamanhoDoLote) {
          const lote = imoveis.slice(i, i + tamanhoDoLote);
          const resultadosLote = await Promise.all(lote.map(async (imovel) => {
            try {
const resImg = await fetch(`https://sonho-real-back.onrender.com/fotos_casa?id_imovel=${imovel.id_imovel}`);
              const fotos = resImg.ok ? await resImg.json() : [];
              const imgUrl = fotos.length > 0 
                ? `data:${fotos[0].mimetype};base64,${fotos[0].data}` 
                : 'https://via.placeholder.com/300x200';
              return { ...imovel, imagem: imgUrl, fotos };
            } catch {
              return { ...imovel, imagem: 'https://via.placeholder.com/300x200', fotos: [] };
            }
          }));
          resultado.push(...resultadosLote);
        }
        return resultado;
      }

      const imoveisComFotos = await processarEmLotes(imoveis, 5);
      renderCards(imoveisComFotos);

    } catch (err) {
      console.error("Erro ao buscar imóveis:", err);
      cardsContainer.innerHTML = "<p>Erro ao carregar imóveis</p>";
      resultCount.textContent = "0 imóveis encontrados";
    }
  }

  function renderCards(imoveis) {
    if (!imoveis.length) {
      cardsContainer.innerHTML = "<p>Nenhum imóvel encontrado</p>";
      resultCount.textContent = "0 imóveis encontrados";
      return;
    }

    const html = imoveis.map(imovel => `
      <div class="card">
        <img src="${imovel.imagem}" alt="Imagem do imóvel" />
        <div class="info">
          <h3>${imovel.nome_casa || "Imóvel"} - ${imovel.rua || ""}, ${imovel.bairro || ""}</h3>
          <p>${imovel.tipo_moradia || ""} · ${imovel.area_total || 0}m² · ${imovel.quartos || 0} quartos · ${imovel.banheiros || 0} banheiros · ${imovel.vagas_garagem || 0} vagas</p>
          <p>Finalidade: ${imovel.finalidade || "Não informado"}</p>
          <strong>R$ ${Number(imovel.preco || 0).toLocaleString('pt-BR')}</strong>
          <p>Disponível: ${imovel.disponibilidade ? 'Sim' : 'Não'}</p>
          <button class="btn-detalhes" data-imovel='${JSON.stringify(imovel)}'>Ver mais</button>
        </div>
      </div>
    `).join("");

    cardsContainer.innerHTML = html;
    resultCount.textContent = `${imoveis.length} imóveis encontrados`;

    document.querySelectorAll(".btn-detalhes").forEach(btn => {
      btn.addEventListener("click", e => {
        const imovel = JSON.parse(e.target.dataset.imovel);
        abrirModalDetalhes(imovel);
      });
    });
  }

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

// Abre o calendário
function abrirCalendario() {
  document.getElementById("calendario-visita").classList.remove("hidden");
}

// Fecha o calendário
function fecharCalendario() {
  document.getElementById("calendario-visita").classList.add("hidden");
}

// Envia mensagem pro WhatsApp do dono
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

  // Agora pegando exatamente o nome_casa do modal
  const nome_casa = document.getElementById("modalTitulo").textContent.trim() || "Imóvel";

  // Formata data
  const dataFormatada = new Date(data).toLocaleDateString("pt-BR");

  // WhatsApp do dono
  const telefoneDono = "5517992731437";

  // Mensagem com nome_casa
  const mensagem = encodeURIComponent(
    `Olá! Gostaria de agendar uma visita para *${nome_casa}*.\n\n📅 *Data:* ${dataFormatada}\n⏰ *Hora:* ${hora}\n\nAguardo confirmação!`
  );

  const url = `https://wa.me/${telefoneDono}?text=${mensagem}`;

  // Abre conversa com o dono
  window.open(url, "_blank");

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
