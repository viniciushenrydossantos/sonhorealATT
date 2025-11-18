document.addEventListener("DOMContentLoaded", carregarFavoritos);

async function carregarFavoritos() {
  const user = JSON.parse(localStorage.getItem("user"));
  const container = document.getElementById("listaFavoritos");

  if (!user) {
    container.innerHTML = "<p>Você precisa estar logado para ver seus favoritos.</p>";
    return;
  }

  try {
    // Busca os imóveis favoritados
    const response = await fetch(`https://sonho-real-back.onrender.com/favorites/${user.id}`);
    const favoritos = await response.json();

    if (!favoritos.length) {
      container.innerHTML = "<p>Nenhum imóvel favoritado ainda.</p>";
      return;
    }

    container.innerHTML = ""; // limpa antes de renderizar

    for (const imovel of favoritos) {
      // Buscar as fotos do imóvel
      const fotosResponse = await fetch(`https://sonho-real-back.onrender.com/fotos_casa`);
      const todasFotos = await fotosResponse.json();

      const fotos = todasFotos.filter(f => f.nome == imovel.id); // ajuste caso necessário

      // Criar o elemento article
      const article = document.createElement("article");
      article.classList.add("card-imovel");

      const localizacao = `${imovel.cidade || ''} - ${imovel.estado || ''}`;

      // Render do card COMPLETO (do jeito que você pediu)
      article.innerHTML = `
        <div class="grid-container">
          <div class="grid-large">
            <img src="data:${String(fotos[0]?.mimetype || '')};base64,${String(fotos[0]?.data || '')}" 
                 alt="${String(imovel.nome_casa || 'Imóvel')}">
          </div>
          <div class="grid-small">
            ${fotos.slice(1).map(f => `
              <img src="data:${String(f.mimetype || '')};base64,${String(f.data || '')}" 
                   alt="${String(imovel.nome_casa || 'Imóvel')}">
            `).join('')}
          </div>
        </div>

        <div class="info">
          <div>
            <div style="font-weight:700">${String(imovel.nome_casa || 'Sem nome')}</div>
            <div class="meta">
              ${String(imovel.tipo_moradia || 'N/A')} • 
              ${String(imovel.area_total || 'N/A')}m² • 
              ${String(imovel.quartos || 'N/A')} quartos • 
              ${String(imovel.banheiros || 'N/A')} banheiros
            </div>
          </div>

          <div class="card-footer"> 
            <button class="btn-fav" data-id="${imovel.id_imovel}" title="Favoritar ♥"></button>

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
              data-fotos='${JSON.stringify(fotos)}'
            >Ver mais</button>
          </div>
        </div>
      `;

      container.appendChild(article);
    }

    ativarFavoritos(); // ativa os botões

  } catch (error) {
    console.error("Erro ao carregar favoritos:", error);
    container.innerHTML = "<p>Erro ao buscar favoritos.</p>";
  }
}

/* ---------------------------------------------------------
   FAVORITAR / DESFAVORITAR
------------------------------------------------------------ */
function ativarFavoritos() {
  const botoes = document.querySelectorAll(".btn-fav");

  botoes.forEach(btn => {
    const imovelId = btn.getAttribute("data-id");

    btn.addEventListener("click", () => toggleFavorite(imovelId));
    atualizarIconeFavorito(imovelId);
  });
}

async function toggleFavorite(imovelId) {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    alert("Você precisa estar logado!");
    return;
  }

  try {
    await fetch(`https://sonho-real-back.onrender.com/favorites`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: user.id,
        imovel_id: imovelId
      })
    });

    atualizarIconeFavorito(imovelId);

  } catch (error) {
    console.error("Erro ao favoritar:", error);
  }
}

async function atualizarIconeFavorito(imovelId) {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) return;

  try {
    const favoritos = await fetch(`https://sonho-real-back.onrender.com/favorites/${user.id}`)
      .then(res => res.json());

    const btn = document.querySelector(`.btn-fav[data-id="${imovelId}"]`);
    if (!btn) return;

    const isFav = favoritos.some(f => f.id == imovelId);

    btn.style.backgroundColor = isFav ? "#ff0000" : "#ccc";
    btn.textContent = isFav ? "♥" : "♡";

  } catch (error) {
    console.error("Erro ao atualizar ícone:", error);
  }
}
