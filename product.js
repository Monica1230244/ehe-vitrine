const root = document.querySelector("[data-product-detail]");
const params = new URLSearchParams(window.location.search);
const id = params.get("id");
const slug = params.get("slug");
const whatsappNumber = "22945556311";

const escapeHtml = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const formatPrice = (value) => `${Number(value).toLocaleString("fr-FR")} FCFA`;
const availabilityLabel = (value) => ({
  in_stock: "Disponible",
  made_to_order: "Sur commande",
  out_of_stock: "Indisponible"
}[value] || "Disponible");

function buildWhatsAppLink(product, size, color) {
  const lines = [
    "Bonjour EHE",
    "",
    "Je souhaite commander :",
    "",
    product.name,
    `Pointure : ${size}`,
    color ? `Couleur : ${color}` : "",
    product.availability_status === "made_to_order" ? "Type : sur commande" : "",
    `Prix : ${formatPrice(product.price)}`,
    "",
    "Nom :",
    "Adresse :",
    "Telephone :",
    "",
    "Merci."
  ].filter(Boolean);

  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(lines.join("\n"))}`;
}

async function loadProduct() {
  const query = id ? `id=${encodeURIComponent(id)}` : `slug=${encodeURIComponent(slug || "")}`;
  const response = await fetch(`./api/products.php?${query}`);
  const result = await response.json();

  if (!response.ok || !result.success) {
    root.innerHTML = '<p class="eyebrow">Produit</p><h1>Produit introuvable</h1><a class="btn btn-primary" href="./index.html#boutique">Retour boutique</a>';
    return;
  }

  const product = result.product;
  const sizes = (product.sizes || "39,40,41,42,43,44").split(",").map((item) => item.trim()).filter(Boolean);
  const colors = (product.colors || "Noir,Marron").split(",").map((item) => item.trim()).filter(Boolean);
  const canOrder = product.availability_status !== "out_of_stock" && (Number(product.stock || 0) > 0 || product.availability_status === "made_to_order");

  document.title = `${product.name} | EHE`;
  root.innerHTML = `
    <section class="product-detail-grid">
      <div class="detail-image">
        <img src="${escapeHtml(product.image || "assets/hero-ehe.png")}" alt="${escapeHtml(product.name)}">
      </div>
      <div class="detail-copy">
        <p class="eyebrow">${escapeHtml(product.category)}</p>
        <h1>${escapeHtml(product.name)}</h1>
        <span class="product-badge">${escapeHtml(availabilityLabel(product.availability_status))}</span>
        <strong class="detail-price">${formatPrice(product.price)}</strong>
        <p>${escapeHtml(product.description || product.short_description || "")}</p>
        <label>Pointure<select data-size>${sizes.map((size) => `<option>${escapeHtml(size)}</option>`).join("")}</select></label>
        <label>Couleur<select data-color>${colors.map((color) => `<option>${escapeHtml(color)}</option>`).join("")}</select></label>
        <button class="btn btn-primary" data-order ${canOrder ? "" : "disabled"}>${canOrder ? "Commander sur WhatsApp" : "Indisponible"}</button>
      </div>
    </section>
  `;

  root.querySelector("[data-order]")?.addEventListener("click", () => {
    const size = root.querySelector("[data-size]").value;
    const color = root.querySelector("[data-color]").value;
    window.open(buildWhatsAppLink(product, size, color), "_blank", "noopener");
  });
}

loadProduct();
