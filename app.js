const header = document.querySelector("[data-header]");
const navToggle = document.querySelector("[data-nav-toggle]");
const cartPanel = document.querySelector("[data-cart-panel]");
const cartOpen = document.querySelector("[data-cart-open]");
const cartClose = document.querySelector("[data-cart-close]");
const cartCount = document.querySelector("[data-cart-count]");
const cartItems = document.querySelector("[data-cart-items]");
const cartTotal = document.querySelector("[data-cart-total]");
const whatsapp = document.querySelector("[data-whatsapp]");
const checkoutForm = document.querySelector("[data-checkout-form]");
const toast = document.querySelector("[data-toast]");
const topButton = document.querySelector("[data-top]");
const productGrid = document.querySelector("[data-public-products]");
const productSearch = document.querySelector("[data-product-search]");
const categoryFilter = document.querySelector("[data-category-filter]");
const pagination = document.querySelector("[data-pagination]");
const imageModal = document.querySelector("[data-image-modal]");
const imageModalImg = document.querySelector("[data-image-modal-img]");
const imageModalTitle = document.querySelector("[data-image-modal-title]");
const imageModalClose = document.querySelector("[data-image-modal-close]");
const cart = [];
const whatsappNumber = "22945556311";
let allProducts = [];
let currentPage = 1;
const productsPerPage = 6;

window.addEventListener("load", () => {
  document.body.classList.add("loaded");
});

const updateHeader = () => {
  header.classList.toggle("scrolled", window.scrollY > 24);
  topButton.classList.toggle("visible", window.scrollY > 520);
};

window.addEventListener("scroll", updateHeader);
updateHeader();

navToggle.addEventListener("click", () => {
  const open = header.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(open));
});

document.querySelectorAll(".site-nav a").forEach((link) => {
  link.addEventListener("click", () => {
    header.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  });
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("visible");
    });
  },
  { threshold: 0.14 }
);

document.querySelectorAll(".reveal").forEach((item) => observer.observe(item));

const formatPrice = (value) => `${Number(value).toLocaleString("fr-FR")} FCFA`;

const escapeHtml = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const showToast = (message = "Produit ajoute au panier") => {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2000);
};

const availabilityLabel = (value) => ({
  in_stock: "Disponible",
  made_to_order: "Sur commande",
  out_of_stock: "Indisponible"
}[value] || "Disponible");

const openImageModal = (src, title) => {
  if (!src || !imageModal || !imageModalImg) return;
  imageModalImg.src = src;
  imageModalImg.alt = title ? `Image du produit ${title}` : "Image du produit";
  if (imageModalTitle) imageModalTitle.textContent = title || "Produit EHE";
  imageModal.classList.add("open");
  imageModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
};

const closeImageModal = () => {
  if (!imageModal || !imageModalImg) return;
  imageModal.classList.remove("open");
  imageModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  imageModalImg.src = "";
};

const getCustomerInfo = () => {
  const data = Object.fromEntries(new FormData(checkoutForm).entries());
  const firstName = String(data.first_name || "").trim();
  const lastName = String(data.last_name || "").trim();
  const phone = String(data.phone || "").trim();
  const address = String(data.address || "").trim();

  return {
    firstName,
    lastName,
    fullName: [firstName, lastName].filter(Boolean).join(" "),
    phone,
    address
  };
};

const buildOrderText = (customer = null) => {
  const lines = ["Bonjour EHE", "", "Je souhaite commander :", ""];

  cart.forEach((item, index) => {
    lines.push(`${index + 1}. ${item.name}`);
    lines.push(`Pointure : ${item.size}`);
    if (item.color) lines.push(`Couleur : ${item.color}`);
    if (item.availability === "made_to_order") lines.push("Type : sur commande");
    lines.push(`Quantite : ${item.quantity}`);
    lines.push(`Prix unitaire : ${formatPrice(item.price)}`);
    lines.push(`Total ligne : ${formatPrice(item.price * item.quantity)}`);
    lines.push("------------------");
  });

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  lines.push(`TOTAL : ${formatPrice(total)}`);
  lines.push("");
  lines.push("Informations client :");
  lines.push(`Nom : ${customer?.lastName || ""}`);
  lines.push(`Prenom : ${customer?.firstName || ""}`);
  lines.push(`Telephone : ${customer?.phone || ""}`);
  lines.push(`Adresse : ${customer?.address || ""}`);
  lines.push("");
  lines.push("Merci.");

  return lines.join("\n");
};

const buildWhatsAppLink = (customer = null) => {
  if (!cart.length) return `https://wa.me/${whatsappNumber}`;
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(buildOrderText(customer))}`;
};

const renderCart = () => {
  cartItems.innerHTML = "";

  if (!cart.length) {
    cartItems.innerHTML = '<p class="empty-cart">Votre panier est vide.</p>';
  }

  cart.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "cart-row";
    row.innerHTML = `
      <div>
        <strong>${escapeHtml(item.name)}</strong>
        <small>Pointure ${escapeHtml(item.size)}${item.color ? ` · ${escapeHtml(item.color)}` : ""}</small>
        <small>${formatPrice(item.price * item.quantity)}</small>
      </div>
      <div class="cart-row-actions">
        <label>
          Qte
          <input type="number" min="1" max="99" value="${item.quantity}" data-quantity="${index}" aria-label="Quantite ${escapeHtml(item.name)}">
        </label>
        <button type="button" aria-label="Supprimer ${escapeHtml(item.name)}" data-remove="${index}">Retirer</button>
      </div>
    `;
    cartItems.appendChild(row);
  });

  const quantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  cartCount.textContent = quantity;
  cartTotal.textContent = formatPrice(total);
  whatsapp.href = buildWhatsAppLink();
};

function renderFilters(products) {
  if (!categoryFilter) return;
  const current = categoryFilter.value;
  const categories = [...new Set(products.map((product) => product.category).filter(Boolean))].sort();
  categoryFilter.innerHTML = '<option value="">Toutes les categories</option>' + categories.map((category) => (
    `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`
  )).join("");
  categoryFilter.value = categories.includes(current) ? current : "";
}

function filteredProducts() {
  const query = (productSearch?.value || "").toLowerCase().trim();
  const category = categoryFilter?.value || "";
  return allProducts.filter((product) => {
    const text = `${product.name} ${product.category} ${product.description || ""}`.toLowerCase();
    return (!query || text.includes(query)) && (!category || product.category === category);
  });
}

function renderPagination(total) {
  if (!pagination) return;
  const pages = Math.max(1, Math.ceil(total / productsPerPage));
  if (pages <= 1) {
    pagination.innerHTML = "";
    return;
  }
  pagination.innerHTML = Array.from({ length: pages }, (_, index) => {
    const page = index + 1;
    return `<button type="button" class="${page === currentPage ? "active" : ""}" data-page="${page}">${page}</button>`;
  }).join("");
}

function renderPublicProducts(products) {
  if (!productGrid || !products.length) return;
  allProducts = products;
  renderFilters(products);
  renderVisibleProducts();
}

function renderVisibleProducts() {
  const products = filteredProducts();
  const pages = Math.max(1, Math.ceil(products.length / productsPerPage));
  currentPage = Math.min(currentPage, pages);
  const start = (currentPage - 1) * productsPerPage;
  const visibleProducts = products.slice(start, start + productsPerPage);

  if (!visibleProducts.length) {
    productGrid.innerHTML = '<p class="empty-cart">Aucun produit ne correspond a votre recherche.</p>';
    renderPagination(0);
    return;
  }

  productGrid.innerHTML = visibleProducts.map((product) => {
    const availability = product.availability_status || "in_stock";
    const canOrder = availability !== "out_of_stock" && (Number(product.stock || 0) > 0 || availability === "made_to_order");
    const buttonText = availability === "made_to_order" ? "Commander" : (canOrder ? "Ajouter" : "Indisponible");
    return `
    <article class="product-card reveal visible" data-product data-id="${product.id}" data-name="${escapeHtml(product.name)}" data-price="${Number(product.price)}" data-availability="${escapeHtml(availability)}">
      <button class="favorite" type="button" aria-label="Ajouter aux favoris">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7.5-4.4-9.2-9.1C1.6 7.4 3.5 4.5 6.7 4.5c1.8 0 3.2.9 4 2.1.8-1.2 2.2-2.1 4-2.1 3.2 0 5.1 2.9 3.9 6.4C19.5 15.6 12 20 12 20z"/></svg>
      </button>
      <div class="product-image product-photo" role="button" tabindex="0" aria-label="Voir ${escapeHtml(product.name)} en grand" data-image-preview data-image-src="${escapeHtml(product.image || "assets/hero-ehe.png")}" data-image-title="${escapeHtml(product.name)}" style="background-image:url('${escapeHtml(product.image || "assets/hero-ehe.png")}')"></div>
      <div class="product-body">
        <p class="rating">★★★★★</p>
        <h3><a href="./product.html?id=${encodeURIComponent(product.id)}">${escapeHtml(product.name)}</a></h3>
        <span class="product-badge">${escapeHtml(availabilityLabel(availability))}</span>
        <p>${escapeHtml(product.description || product.short_description || "")}</p>
        <div class="product-meta">
          <strong>${formatPrice(product.price)}</strong>
          <select aria-label="Pointure">
            ${(product.sizes || "39,40,41,42,43,44").split(",").map((size) => `<option>${escapeHtml(size.trim())}</option>`).join("")}
          </select>
        </div>
        <select class="product-color" aria-label="Couleur">
          ${(product.colors || "Noir,Marron").split(",").map((color) => `<option>${escapeHtml(color.trim())}</option>`).join("")}
        </select>
        <button class="btn btn-small" type="button" data-add-cart ${canOrder ? "" : "disabled"}>${buttonText}</button>
      </div>
    </article>
  `}).join("");
  renderPagination(products.length);
}

async function loadPublicProducts() {
  try {
    const response = await fetch("./api/products.php");
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || "Produits indisponibles");
    renderPublicProducts(result.products || []);
  } catch {
    // Keep the static fallback products already present in the HTML.
  }
}

productGrid?.addEventListener("click", (event) => {
  const preview = event.target.closest("[data-image-preview]");
  if (preview) {
    openImageModal(preview.dataset.imageSrc, preview.dataset.imageTitle);
    return;
  }

  const favorite = event.target.closest(".favorite");
  if (favorite) {
    favorite.classList.toggle("active");
    return;
  }

  const button = event.target.closest("[data-add-cart]");
  if (!button || button.disabled) return;

  const card = button.closest("[data-product]");
  const name = card.dataset.name;
  const price = Number(card.dataset.price);
  const availability = card.dataset.availability || "in_stock";
  const size = card.querySelector("select").value;
  const color = card.querySelector(".product-color")?.value || "";
  const existing = cart.find((item) => item.name === name && item.size === size && item.color === color);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ name, price, size, color, availability, quantity: 1 });
  }

  renderCart();
  showToast();
});

productGrid?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const preview = event.target.closest("[data-image-preview]");
  if (!preview) return;
  event.preventDefault();
  openImageModal(preview.dataset.imageSrc, preview.dataset.imageTitle);
});

imageModalClose?.addEventListener("click", closeImageModal);

imageModal?.addEventListener("click", (event) => {
  if (event.target === imageModal) closeImageModal();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && imageModal?.classList.contains("open")) {
    closeImageModal();
  }
});

productSearch?.addEventListener("input", () => {
  currentPage = 1;
  renderVisibleProducts();
});

categoryFilter?.addEventListener("change", () => {
  currentPage = 1;
  renderVisibleProducts();
});

pagination?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-page]");
  if (!button) return;
  currentPage = Number(button.dataset.page);
  renderVisibleProducts();
});

cartItems.addEventListener("click", (event) => {
  const button = event.target.closest("[data-remove]");
  if (!button) return;
  cart.splice(Number(button.dataset.remove), 1);
  renderCart();
});

cartItems.addEventListener("change", (event) => {
  const input = event.target.closest("[data-quantity]");
  if (!input) return;

  const index = Number(input.dataset.quantity);
  const quantity = Math.max(1, Math.min(99, Number(input.value) || 1));

  if (!cart[index]) return;
  cart[index].quantity = quantity;
  renderCart();
});

cartItems.addEventListener("input", (event) => {
  const input = event.target.closest("[data-quantity]");
  if (!input) return;

  const index = Number(input.dataset.quantity);
  const quantity = Math.max(1, Math.min(99, Number(input.value) || 1));

  if (!cart[index]) return;
  cart[index].quantity = quantity;

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartTotal.textContent = formatPrice(total);
  cartCount.textContent = count;
  whatsapp.href = buildWhatsAppLink();
});

cartOpen.addEventListener("click", () => {
  cartPanel.classList.add("open");
  cartPanel.setAttribute("aria-hidden", "false");
});

cartClose.addEventListener("click", () => {
  cartPanel.classList.remove("open");
  cartPanel.setAttribute("aria-hidden", "true");
});

topButton.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

whatsapp.addEventListener("click", async (event) => {
  if (!cart.length) {
    event.preventDefault();
    showToast("Votre panier est vide");
    return;
  }

  event.preventDefault();
  if (!checkoutForm.reportValidity()) return;

  const customer = getCustomerInfo();
  const whatsappLink = buildWhatsAppLink(customer);
  const whatsappWindow = window.open("about:blank", "_blank", "noopener");
  whatsapp.textContent = "Preparation...";

  try {
    await fetch("./api/orders.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_name: customer.fullName || "Client WhatsApp",
        customer_phone: customer.phone,
        customer_address: customer.address,
        items: cart,
        whatsapp_message: buildOrderText(customer)
      })
    });
  } catch {
    // WhatsApp still opens even if local order logging fails.
  } finally {
    whatsapp.textContent = "Commander sur WhatsApp";
    if (whatsappWindow) {
      whatsappWindow.location.href = whatsappLink;
    } else {
      window.location.href = whatsappLink;
    }
  }
});

document.querySelector("[data-contact-form]").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const submit = form.querySelector('button[type="submit"]');
  const payload = Object.fromEntries(new FormData(form).entries());

  if (window.location.protocol === "file:") {
    showToast("Ouvrez le site avec http://localhost/ventes/");
    return;
  }

  submit.disabled = true;
  submit.textContent = "Envoi...";

  try {
    const response = await fetch("./api/contact.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Message non envoye");
    }

    form.reset();
    showToast("Message envoye a EHE");
  } catch (error) {
    showToast(error.message || "Erreur pendant l envoi");
  } finally {
    submit.disabled = false;
    submit.textContent = "Envoyer le message";
  }
});

loadPublicProducts();
renderCart();
