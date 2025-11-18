  // // ============================================
  // // ❤️ FAVORITOS / DESTAQUES
  // // ============================================
  // function atualizarDestaque() {
  //   const destaqueSection = document.getElementById("destaques");
  //   const gridList = document.querySelector(".grid-list");
  //   if (!destaqueSection || !gridList) return;

  //   const favoritos = JSON.parse(localStorage.getItem("favoritos") || "[]");
  //   const articles = Array.from(gridList.querySelectorAll("article"));
  //   const maisFavoritos = articles.filter(a => favoritos.includes(a.dataset.id));

  //   const container = destaqueSection.querySelector(".grid-list");
  //   if (!container) return;
  //   container.innerHTML = "";

  //   maisFavoritos.forEach(a => container.appendChild(a.cloneNode(true)));
  // }

//   function initFavoritos() {
//     document.querySelectorAll('.btn-outline').forEach(btn => {
//       const imovelId = btn.closest('article')?.dataset.id;
//       if (!imovelId) return;

//       let favoritos = JSON.parse(localStorage.getItem('favoritos') || '[]');
//       if (favoritos.includes(imovelId)) btn.textContent = "❤️ Favoritado";

//       btn.addEventListener('click', () => {
//         let favoritos = JSON.parse(localStorage.getItem('favoritos') || '[]');
//         if (!favoritos.includes(imovelId)) {
//           favoritos.push(imovelId);
//           btn.textContent = "❤️ Favoritado";
//         } else {
//           favoritos = favoritos.filter(id => id !== imovelId);
//           btn.textContent = "❤️ Favoritar";
//         }
//         localStorage.setItem('favoritos', JSON.stringify(favoritos));
//         atualizarDestaque();
//       });
//     });
//   }
// function atualizarDestaque() {
//   const destaqueSection = document.getElementById("destaques");
//   const gridList = document.querySelector(".grid-list");
//   if (!destaqueSection || !gridList) return;

//   const favoritos = JSON.parse(localStorage.getItem("favoritos") || "[]");
//   const articles = Array.from(gridList.querySelectorAll("article"));
//   const maisFavoritos = articles.filter(a => favoritos.includes(a.dataset.id));

//   destaqueSection.innerHTML = ""; // limpa os favoritos
//   maisFavoritos.forEach(a => destaqueSection.appendChild(a.cloneNode(true)));
