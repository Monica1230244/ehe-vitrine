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

function buildWhatsAppLink(product, size, color, customer) {
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
    "Informations client :",
    `Nom : ${customer.lastName}`,
    `Prenom : ${customer.firstName}`,
    `Telephone : ${customer.phone}`,
    `Adresse : ${customer.address}`,
    "",
    "Merci."
  ].filter(Boolean);

  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(lines.join("\n"))}`;
}

function buildOrderText(product, size, color, customer) {
  const url = buildWhatsAppLink(product, size, color, customer);
  return decodeURIComponent(url.split("text=")[1] || "");
}

function getCustomerInfo(form) {
  const data = Object.fromEntries(new FormData(form).entries());
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
        <form class="checkout-form product-checkout-form" data-product-checkout>
          <label>Nom<input name="last_name" type="text" autocomplete="family-name" required></label>
          <label>Prenom<input name="first_name" type="text" autocomplete="given-name" required></label>
          <label>Telephone<input name="phone" type="tel" autocomplete="tel" required></label>
          <label>Adresse de livraison<textarea name="address" rows="3" autocomplete="street-address" required></textarea></label>
        </form>
        <button class="btn btn-primary" data-order ${canOrder ? "" : "disabled"}>${canOrder ? "Commander sur WhatsApp" : "Indisponible"}</button>
      </div>
    </section>
  `;

  root.querySelector("[data-order]")?.addEventListener("click", async (event) => {
    const form = root.querySelector("[data-product-checkout]");
    if (!form.reportValidity()) return;

    const size = root.querySelector("[data-size]").value;
    const color = root.querySelector("[data-color]").value;
    const customer = getCustomerInfo(form);
    const whatsappLink = buildWhatsAppLink(product, size, color, customer);
    const whatsappWindow = window.open("about:blank", "_blank", "noopener");
    event.currentTarget.textContent = "Preparation...";

    try {
      await fetch("./api/orders.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: customer.fullName || "Client WhatsApp",
          customer_phone: customer.phone,
          customer_address: customer.address,
          items: [{
            name: product.name,
            price: product.price,
            size,
            color,
            quantity: 1
          }],
          whatsapp_message: buildOrderText(product, size, color, customer)
        })
      });
    } catch {
      // WhatsApp still opens even if order logging fails.
    } finally {
      event.currentTarget.textContent = "Commander sur WhatsApp";
      if (whatsappWindow) {
        whatsappWindow.location.href = whatsappLink;
      } else {
        window.location.href = whatsappLink;
      }
    }
  });
}

loadProduct();
