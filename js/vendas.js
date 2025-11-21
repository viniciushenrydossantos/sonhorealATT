  document.addEventListener("DOMContentLoaded", () => {
    const API_URL = "https://sonho-real-back.onrender.com";
    const uploadInput = document.getElementById("fileInput");
    const preview = document.getElementById("preview");
    const placeholderText = document.getElementById("placeholderText");
    const thumbnails = document.getElementById("thumbnails");
    const cardContainer = document.getElementById("cardContainer");
    const modalEditar = document.getElementById("modalEditar");
    const formEditar = document.getElementById("formEditar");

    let base64Imagens = [];

    const ADMINS = [
      "IsabelaRF24@gmail.com.br",
      "ViniciusHenry@gmail.com.br",
      "KauanHenrique@gmail.com.br",
      "Marialulu@gmail.com.br",
      "MariaJuliaDePaula@gmail.com.br",
      "AnaBeatriz@gmail.com.br"
    ];

    // ==============================
    // 📸 UPLOAD DE IMAGENS
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
    // 🚀 PUBLICAR IMÓVEL (CORRIGIDO)
    // ==============================
    window.publicar = async function publicar() {
      try {
        const usuarioLogado = localStorage.getItem("user");
        if (!usuarioLogado) {
          alert("Você precisa estar logado para publicar um imóvel!");
          return;
        }

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
            usuario: usuarioLogado
          }),
        });

        if (!res.ok) throw new Error("Erro ao cadastrar imóvel");

        // 🔥 PEGAR O ID DIRETO DA RESPOSTA DO BACKEND
        const dadosCriacao = await res.json();
        const id_imovel = dadosCriacao.id_imovel;

        console.log("ID recebido do backend:", id_imovel);

        // ==============================
        // 📸 SALVAR FOTOS (AGORA FUNCIONA)
        // ==============================
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

        alert("Imóvel cadastrado com sucesso!");

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
    // 📦 CARREGAR IMÓVEIS
    // ==============================
    async function carregarImoveis() {
      try {
        const user = localStorage.getItem("user");
        if (!user) {
          alert("Você precisa estar logado!");
          return;
        }

        const ehAdmin = ADMINS.includes(user);
        const imoveis = await (await fetch(`${API_URL}/imoveis`)).json();
        const imagens = await (await fetch(`${API_URL}/fotos_casa`)).json();

        cardContainer.innerHTML = "";

        const imoveisFiltrados = ehAdmin
          ? imoveis
          : imoveis.filter((i) => i.usuario === user);

        if (imoveisFiltrados.length === 0) {
          cardContainer.innerHTML = "<p style='color:gray'>Nenhum imóvel encontrado.</p>";
          return;
        }

        imoveisFiltrados.forEach((casa) => {
          const imagensDaCasa = imagens.filter(
            (img) => Number(img.id_imovel) === Number(casa.id_imovel)
          );

          let src = "../img/no-image.jpg";
          if (imagensDaCasa.length > 0) {
            src = `data:${imagensDaCasa[0].mimetype};base64,${imagensDaCasa[0].data}`;
          }

          const card = document.createElement("div");
          card.classList.add("card-imovel");

          const podeEditar = ehAdmin || casa.usuario === user;

          card.innerHTML = `
            <img src="${src}" alt="${casa.nome_casa}">
            <h3>${casa.nome_casa}</h3>
            <p>${casa.cidade} - ${casa.estado}</p>
            <p><strong>R$ ${Number(casa.preco).toLocaleString("pt-BR")}</strong></p>
            <div class="acoes">
              <button class="btn-editar" data-id="${casa.id_imovel}" ${!podeEditar ? "disabled style='opacity:0.5;cursor:not-allowed'" : ""}>✏️ Editar</button>
              <button class="btn-excluir" data-id="${casa.id_imovel}" ${!podeEditar ? "disabled style='opacity:0.5;cursor:not-allowed'" : ""}>🗑️ Excluir</button>
            </div>
          `;

          cardContainer.appendChild(card);
        });

        document.querySelectorAll(".btn-editar").forEach((btn) => {
          if (!btn.disabled) btn.addEventListener("click", () => abrirModalEditar(btn.dataset.id));
        });

        document.querySelectorAll(".btn-excluir").forEach((btn) => {
          if (!btn.disabled) btn.addEventListener("click", () => excluirImovel(btn.dataset.id));
        });
      } catch (err) {
        console.error(err);
      }
    }

    // ==============================
    // 📝 EDITAR
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
    // ❌ DELETAR
    // ==============================
    async function excluirImovel(id) {
      if (!confirm("Deseja realmente excluir este imóvel?")) return;
      await fetch(`${API_URL}/imovel/${id}`, { method: "DELETE" });
      alert("Imóvel excluído com sucesso!");
      carregarImoveis();
    }

    carregarImoveis();
  });
