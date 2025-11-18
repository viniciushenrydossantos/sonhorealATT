document.addEventListener("DOMContentLoaded", () => {
  const API_URL = "http://192.168.1.44:3000";
  const uploadInput = document.getElementById("fileInput");
  const preview = document.getElementById("preview");
  const placeholderText = document.getElementById("placeholderText");
  const thumbnails = document.getElementById("thumbnails");
  const cardContainer = document.getElementById("cardContainer");
  const modalEditar = document.getElementById("modalEditar");
  const formEditar = document.getElementById("formEditar");

  let base64Imagens = [];

  // ==============================
  // 👑 Lista de administradores
  // ==============================
  const ADMINS = [
    "IsabelaRF24@gmail.com.br",
    "ViniciusHenry@gmail.com.br",
    "KauanHenrique@gmail.com.br",
    "Marialulu@gmail.com.br",
    "MariaJuliaDePaula@gmail.com.br",
    "AnaBeatriz@gmail.com.br"
  ];

  // ==============================
  // 📸 Upload de imagens
  // ==============================
  uploadInput.addEventListener("change", (event) => {
    const files = Array.from(event.target.files);
    thumbnails.innerHTML = "";
    base64Imagens = [];

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.replace(/^data:.+;base64,/, "");
        base64Imagens.push({
          nome: file.name,
          mimetype: file.type,
          data: base64,
        });

        const img = document.createElement("img");
        img.src = reader.result;
        img.classList.add("thumb");
        thumbnails.appendChild(img);
      };
      reader.readAsDataURL(file);
    });

    if (files.length > 0) {
      preview.src = URL.createObjectURL(files[0]);
      preview.style.display = "block";
      placeholderText.style.display = "none";
    }
  });

  // ==============================
  // 🚀 Publicar imóvel
  // ==============================
  window.publicar = async function publicar() {
    try {
      const usuarioLogado = localStorage.getItem("user");
      if (!usuarioLogado) {
        alert("Você precisa estar logado para publicar um imóvel!");
        return;
      }

      const userEmail = JSON.parse(usuarioLogado).email;

      const nome_casa = document.getElementById("titulo_anuncio").value.trim();
      const tipo_moradia = document.getElementById("tipo_moradia").value;
      const finalidade = document.getElementById("finalidade").value;
      const preco = document.getElementById("preco").value;
      const rua = document.getElementById("rua").value;
      const bairro = document.getElementById("bairro").value;
      const numero = document.getElementById("numero").value;
      const cidade = document.getElementById("cidade").value;
      const estado = document.getElementById("estado").value;
      const area_total = document.getElementById("area").value;
      const quartos = document.getElementById("quartos").value;
      const banheiros = document.getElementById("banheiros").value;
      const vagas_garagem = document.getElementById("vagas").value;
      const disponibilidade = "Disponível";

      const res = await fetch(`${API_URL}/imovel/cadastrar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome_casa,
          tipo_moradia,
          finalidade,
          preco,
          rua,
          bairro,
          numero,
          cidade,
          estado,
          area_total,
          quartos,
          banheiros,
          vagas_garagem,
          disponibilidade,
          usuario: userEmail, // ✅ associa apenas o e-mail do dono
        }),
      });

      if (!res.ok) throw new Error("Erro ao cadastrar imóvel");

      alert("Imóvel cadastrado com sucesso!");

      const imoveis = await (await fetch(`${API_URL}/imoveis`)).json();
      const ultimo = imoveis[imoveis.length - 1];
      const id_imovel = ultimo.id_imovel;

      for (const img of base64Imagens) {
        await fetch(`${API_URL}/fotos_casa`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome: img.nome,
            mimetype: img.mimetype,
            data: img.data,
            id_imovel,
          }),
        });
      }

      base64Imagens = [];
      uploadInput.value = "";
      preview.style.display = "none";
      thumbnails.innerHTML = "";
      carregarImoveis();
    } catch (err) {
      console.error(err);
      alert("Erro ao publicar o anúncio.");
    }
  };

  // ==============================
  // 📦 Carregar imóveis
  // ==============================
  async function carregarImoveis() {
    try {
      const userData = JSON.parse(localStorage.getItem("user"));
      if (!userData) {
        alert("Você precisa estar logado!");
        return;
      }

      const userEmail = userData.email;
      const ehAdmin = ADMINS.includes(userEmail);
      const imoveis = await (await fetch(`${API_URL}/imoveis`)).json();
      const imagens = await (await fetch(`${API_URL}/fotos_casa`)).json();

      cardContainer.innerHTML = "";

      // 🔎 Se for usuário normal, mostra só os imóveis dele
      const imoveisFiltrados = ehAdmin
        ? imoveis
        : imoveis.filter((i) => i.usuario === userEmail);

      if (imoveisFiltrados.length === 0) {
        cardContainer.innerHTML = "<p style='color:gray'>Nenhum imóvel encontrado.</p>";
        return;
      }

      imoveisFiltrados.forEach((casa) => {
        const imgCasa = imagens.find((img) => img.id_imovel === casa.id_imovel);
        const src = imgCasa
          ? `data:${imgCasa.mimetype};base64,${imgCasa.data}`
          : "../img/no-image.jpg";

        const card = document.createElement("div");
        card.classList.add("card-imovel");
        card.innerHTML = `
          <img src="${src}" alt="${casa.nome_casa}">
          <h3>${casa.nome_casa}</h3>
          <p>${casa.cidade} - ${casa.estado}</p>
          <p><strong>R$ ${Number(casa.preco).toLocaleString("pt-BR")}</strong></p>
          <div class="acoes">
            <button class="btn-editar" data-id="${casa.id_imovel}">✏️ Editar</button>
            <button class="btn-excluir" data-id="${casa.id_imovel}">🗑️ Excluir</button>
          </div>
        `;
        cardContainer.appendChild(card);
      });

      document.querySelectorAll(".btn-editar").forEach((btn) => {
        btn.addEventListener("click", () => abrirModalEditar(btn.dataset.id));
      });

      document.querySelectorAll(".btn-excluir").forEach((btn) => {
        btn.addEventListener("click", () => excluirImovel(btn.dataset.id));
      });
    } catch (err) {
      console.error(err);
    }
  }

  // ==============================
  // 📝 Editar imóvel
  // ==============================
  async function abrirModalEditar(id) {
    try {
      const res = await fetch(`${API_URL}/imovel/${id}`);
      const casa = await res.json();

      for (let campo of formEditar.elements) {
        if (campo.name && casa[campo.name] !== undefined) {
          campo.value = casa[campo.name];
        }
      }

      formEditar.dataset.id = id;
      modalEditar.showModal();
    } catch (err) {
      console.error(err);
    }
  }

  formEditar.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = formEditar.dataset.id;
    const dados = {};

    for (let campo of formEditar.elements) {
      if (campo.name) dados[campo.name] = campo.value;
    }

    await fetch(`${API_URL}/imovel/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });

    modalEditar.close();
    carregarImoveis();
  });

  // ==============================
  // ❌ Deletar imóvel
  // ==============================
  async function excluirImovel(id) {
    if (!confirm("Deseja realmente excluir este imóvel?")) return;
    await fetch(`${API_URL}/imovel/${id}`, { method: "DELETE" });
    alert("Imóvel excluído com sucesso!");
    carregarImoveis();
  }

  // ==============================
  // 🚀 Inicialização
  // ==============================
  carregarImoveis();
});
