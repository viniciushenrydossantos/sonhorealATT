// ===== CONFIGURAÇÕES =====
const API = "http://localhost:3000";

let imagensSelecionadas = []; 
let idDoImovelCriado = null;

// =========================================
// 📌 PREVIEW DAS IMAGENS
// =========================================
document.getElementById("fileInput").addEventListener("change", async function (e) {
    const files = e.target.files;

    for (const file of files) {
        const base64 = await toBase64(file);
        imagensSelecionadas.push({ file, base64 });
        criarThumbnail(base64);
    }

    document.getElementById("placeholderText").style.display = "none";
});

// Converter arquivo → Base64
function toBase64(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.readAsDataURL(file);
    });
}

// Criar miniaturas
function criarThumbnail(base64) {
    const cont = document.getElementById("thumbnails");

    const img = document.createElement("img");
    img.src = "data:image/jpeg;base64," + base64;
    img.classList.add("thumb");

    cont.appendChild(img);
}


async function publicar() {
    const titulo = document.getElementById("titulo_anuncio").value;
    const rua = document.getElementById("rua").value;
    const bairro = document.getElementById("bairro").value;
    const numero = document.getElementById("numero").value;
    const cidade = document.getElementById("cidade").value;
    const estado = document.getElementById("estado").value;
    const descricao = document.getElementById("descricao").value;

    const tipo_moradia = document.getElementById("tipo_moradia").value;
    const finalidade = document.getElementById("finalidade").value;

    const area = document.getElementById("area").value;
    const quartos = document.getElementById("quartos").value;
    const banheiros = document.getElementById("banheiros").value;
    const vagas = document.getElementById("vagas").value;

    const preco = document.getElementById("preco").value;

    if (!titulo || imagensSelecionadas.length === 0) {
        alert("Preencha o título e selecione imagens.");
        return;
    }

    // CADASTRAR O IMÓVEL
    const body = {
        nome_casa: titulo,
        tipo_moradia,
        finalidade,
        preco,
        rua,
        bairro,
        numero,
        cidade,
        estado,
        area_total: area,
        quartos,
        banheiros,
        vagas_garagem: vagas,
        disponibilidade: "Disponível",
        descricao
    };

    const req = await fetch(`${API}/imovel/cadastrar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });

    const resp = await req.json();

    if (!req.ok) return alert("Erro ao cadastrar imóvel!");

    // 🔥 Agora recebemos o ID correto da API!
    idDoImovelCriado = resp.id_imovel;

    alert("Imóvel cadastrado... enviando imagens");

    // ENVIAR AS IMAGENS BYTEA
    for (const img of imagensSelecionadas) {
        await fetch(`${API}/fotos_casa`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                nome: img.file.name,
                mimetype: img.file.type,
                data: img.base64,
                id_imovel: idDoImovelCriado
            })
        });
    }

    alert("Imóvel e imagens cadastrados com sucesso!");
    carregarImoveis();
}




async function carregarImoveis() {
    const cards = document.getElementById("cardContainer");
    cards.innerHTML = "";

    const imoveis = await fetch(`${API}/imoveis`).then(r => r.json());
    const fotos = await fetch(`${API}/fotos_casa`).then(r => r.json());

    imoveis.forEach(imovel => {
        const imgs = fotos.filter(f => f.id_imovel === imovel.id_imovel);

        const primeiraImg = imgs.length > 0
            ? `data:${imgs[0].mimetype};base64,${arrayBufferToBase64(imgs[0].data.data)}`
            : "../img/placeholder.png";

        const card = document.createElement("div");
        card.classList.add("card-imovel");

        card.innerHTML = `
            <img class="card-img" src="${primeiraImg}">
            <h3>${imovel.nome_casa}</h3>
            <p><strong>R$ ${Number(imovel.preco).toLocaleString()}</strong></p>
            <p>${imovel.cidade} - ${imovel.estado}</p>

            <div class="btns">
                <button onclick="editar(${imovel.id_imovel})">Editar</button>
                <button onclick="excluir(${imovel.id_imovel})">Excluir</button>
            </div>
        `;

        cards.appendChild(card);
    });
}



// converter BYTEA (array buffer) → base64
function arrayBufferToBase64(buffer) {
    let binary = "";
    const bytes = new Uint8Array(buffer);

    for (let b of bytes) {
        binary += String.fromCharCode(b);
    }

    return window.btoa(binary);
}



async function excluir(id) {
    if (!confirm("Deseja excluir?")) return;

    await fetch(`${API}/imovel/${id}`, { method: "DELETE" });
    carregarImoveis();
}


async function editar(id) {
    const modal = document.getElementById("modalEditar");
    const form = document.getElementById("formEditar");

    const imovel = await fetch(`${API}/imovel/${id}`).then(r => r.json());

    form.nome_casa.value = imovel.nome_casa;
    form.rua.value = imovel.rua;
    form.bairro.value = imovel.bairro;
    form.numero.value = imovel.numero;
    form.cidade.value = imovel.cidade;
    form.estado.value = imovel.estado;
    form.preco.value = imovel.preco;

    document.getElementById("tipo_moradia_editar").value = imovel.tipo_moradia;
    document.getElementById("finalidade_editar").value = imovel.finalidade;

    form.onsubmit = async (e) => {
        e.preventDefault();

        const dados = Object.fromEntries(new FormData(form).entries());

        await fetch(`${API}/imovel/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dados)
        });

        modal.close();
        carregarImoveis();
    };

    modal.showModal();
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
  if (loggedUser) setUserUI(loggedUser);



document.addEventListener("DOMContentLoaded", carregarImoveis);
