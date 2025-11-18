document.addEventListener("DOMContentLoaded", () => {
  const uploadInput = document.getElementById("fileInput");
  const preview = document.getElementById("preview");
  const placeholderText = document.getElementById("placeholderText");

  let base64String = "";
  const TAMANHO_MAXIMO_MB = 3;
  const TAMANHO_MAXIMO_BYTES = TAMANHO_MAXIMO_MB * 1024 * 3024;

  if (uploadInput) {
    uploadInput.addEventListener("change", (event) => {
      const file = event.target.files[0];
      if (!file) return;

      if (file.size > TAMANHO_MAXIMO_BYTES) {
        alert(`A imagem é muito grande! Limite: ${TAMANHO_MAXIMO_MB}MB.`);
        preview.style.display = "none";
        uploadInput.value = "";
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        base64String = reader.result.replace(/^data:.+;base64,/, "");
        preview.src = reader.result;
        preview.style.display = "block";
        if (placeholderText) placeholderText.style.display = "none";
      };
      reader.readAsDataURL(file);
    });
  }

  // ===== 2️⃣ Função publicar =====
  window.publicar = async function () {
    if (!base64String) {
      alert("Escolha uma imagem primeiro!");
      return;
    }

    const foto = {
      nome: uploadInput.files[0].name,
      mimetype: uploadInput.files[0].type,
      data: base64String,
    };

    // 🔹 Primeiro envia a foto
    try {
      const response = await fetch("http://localhost:3000/fotos_casa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(foto),
      });

      if (!response.ok) throw new Error("Erro ao enviar foto");

      console.log("📸 Foto enviada com sucesso");
    } catch (error) {
      console.error("❌ Erro no envio da foto:", error.message);
      alert("Falha ao enviar foto. Tente novamente.");
      return;
    }

    // 🔹 Depois envia o imóvel
    const nome_casa = document.querySelector(".titulo")?.innerText.trim() || "";
    const preco = parseFloat(document.getElementById("preco")?.value || "0") || 0;
    const rua = document.getElementById("rua")?.value || "";
    const bairro = document.getElementById("bairro")?.value || "";
    const numero = document.getElementById("numero")?.value || "";
    const cidade = document.getElementById("cidade")?.value || "";
    const estado = document.getElementById("estado")?.value || "";
    const area_total = parseInt(document.getElementById("areaAte")?.value || "0", 10);
    const quartos = document.querySelectorAll(".quantity-btns button.ativo")?.length || 0;
    const banheiros = parseInt(document.getElementById("banheiros")?.value || "0", 10);
    const vagas_garagem = parseInt(document.getElementById("vagas")?.value || "0", 10);

    // 🔹 Agora finalidade e tipo_moradia corretos
    const tipo_moradia = document.getElementById("tipo_moradia")?.value || "Apartamento";
    const finalidade = document.getElementById("finalidade")?.value || "Venda"; // << CORRIGIDO
    const disponibilidade = document.getElementById("disponibilidade")?.value || "Disponível";

    if (!nome_casa || !rua || !preco || !cidade || !estado) {
      alert("Preencha todos os campos obrigatórios!");
      return;
    }

    // 🔹 Captura checkboxes e converte para "Sim"/"Não"
    const camposCheckbox = [
      "brinquedoteca","churrasqueira","espaco_gourmet","piscina","playground","salao_festas","salao_jogos",
      "ar_condicionado","armarios_planejados","elevador","hidromassagem","jardim","lareira","mobilidade",
      "quintal","sauna","varanda"
    ];

    const imovelCheckbox = {};
    camposCheckbox.forEach(name => {
      const el = document.querySelector(`[name="${name}"]`);
      imovelCheckbox[name] = el?.checked ? "Sim" : "Não";
    });

    const imovel = {
      nome_casa,
      tipo_moradia,
      finalidade, // agora é string
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
      foto: base64String,
      ...imovelCheckbox
    };

    try {
      const response = await fetch("http://localhost:3000/imovel/cadastrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(imovel),
      });

      if (!response.ok) throw new Error("Erro ao cadastrar imóvel");

      alert("✅ Imóvel cadastrado com sucesso!");

      // Resetar formulário
      base64String = "";
      preview.style.display = "none";
      uploadInput.value = "";
      if (placeholderText) placeholderText.style.display = "block";
      document.querySelectorAll("input, select").forEach(el => (el.value = ""));
    } catch (err) {
      console.error(err);
      alert("❌ Erro ao cadastrar imóvel. Veja o console.");
    }
  };

  // ===== 3️⃣ Funções de interface =====
  window.toggleAtivo = (btn) => btn.classList.toggle("ativo");

  window.toggleSection = (header) => {
    const section = header.parentElement;
    const tags = section.querySelector(".tags");
    const toggleIcon = header.querySelector(".toggle");
    if (tags.style.display === "none" || tags.style.display === "") {
      tags.style.display = "flex";
      toggleIcon.textContent = "▼";
    } else {
      tags.style.display = "none";
      toggleIcon.textContent = "▲";
    }
  };
});
