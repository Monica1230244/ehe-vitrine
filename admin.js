const form = document.querySelector("[data-product-form]");
const list = document.querySelector("[data-product-list]");
const orderList = document.querySelector("[data-order-list]");
const messageList = document.querySelector("[data-message-list]");
const resetButton = document.querySelector("[data-reset-form]");
const refreshMessagesButton = document.querySelector("[data-refresh-messages]");
const imageInput = document.querySelector("[data-product-image]");
const imagePreview = document.querySelector("[data-image-preview]");
const logoutButton = document.querySelector("[data-logout]");
const passwordForm = document.querySelector("[data-password-form]");
const passwordMessage = document.querySelector("[data-password-message]");
const backupButton = document.querySelector("[data-backup]");
const backupMessage = document.querySelector("[data-backup-message]");
const productsApi = "./api/products.php";
const ordersApi = "./api/orders.php";
let productsCache = [];
let currentImage = "";
let csrfToken = "";

async function requireAuth() {
  try {
    const response = await fetch("./api/auth.php?action=status");
    const result = await response.json();

    if (!result.authenticated) {
      window.location.href = "./login.html";
      return null;
    }

    csrfToken = result.csrfToken || "";
    document.querySelector("[data-admin-name]").textContent = result.user?.name || "EHE";
    return result.user;
  } catch {
    window.location.href = "./login.html";
    return null;
  }
}

function formatPrice(value) {
  return `${Number(value).toLocaleString("fr-FR")} FCFA`;
}

function availabilityLabel(value) {
  return {
    in_stock: "Disponible",
    made_to_order: "Sur commande",
    out_of_stock: "Indisponible"
  }[value] || "Disponible";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value) {
  if (!value) return "Date inconnue";
  const date = new Date(value.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function renderImagePreview(src) {
  currentImage = src || "";
  if (!src) {
    imagePreview.innerHTML = "<span>Aucune image selectionnee</span>";
    return;
  }

  imagePreview.innerHTML = `<img src="${escapeHtml(src)}" alt="Apercu du produit">`;
}

function resetForm() {
  form.reset();
  form.elements.id.value = "";
  imageInput.value = "";
  renderImagePreview("");
}

async function loadProducts() {
  list.innerHTML = '<div class="product-row"><div class="product-thumb product-thumb-placeholder">EHE</div><div><strong>Chargement</strong><small>Recuperation des produits...</small></div></div>';
  const response = await fetch(productsApi);
  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Impossible de charger les produits");
  }

  productsCache = result.products || [];
  renderProducts(productsCache);
}

function renderProducts(products) {
  if (!products.length) {
    list.innerHTML = '<div class="product-row"><div class="product-thumb product-thumb-placeholder">EHE</div><div><strong>Aucun produit</strong><small>Ajoutez votre premier produit EHE.</small></div></div>';
  } else {
    list.innerHTML = products.map((product) => `
      <div class="product-row">
        ${product.image
          ? `<img class="product-thumb" src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}">`
          : `<div class="product-thumb product-thumb-placeholder">EHE</div>`}
        <div>
          <strong>${escapeHtml(product.name)}</strong>
          <small>${escapeHtml(product.category)} · ${formatPrice(product.price)} · Stock ${Number(product.stock || 0)}</small>
          <small>Disponibilite: ${escapeHtml(availabilityLabel(product.availability_status))}</small>
          <small>Pointures: ${escapeHtml(product.sizes || "-")} · Couleurs: ${escapeHtml(product.colors || "-")}</small>
          <small>${escapeHtml(product.description || product.short_description || "")}</small>
        </div>
        <div class="row-actions">
          <button class="icon-btn" type="button" title="Modifier" data-edit="${product.id}">Edit</button>
          <button class="icon-btn delete" type="button" title="Supprimer" data-delete="${product.id}">Del</button>
        </div>
      </div>
    `).join("");
  }

  document.querySelector("[data-stat-products]").textContent = products.length;
}

async function saveProduct(event) {
  event.preventDefault();
  const submit = form.querySelector('button[type="submit"]');
  const data = new FormData(form);

  submit.disabled = true;
  submit.textContent = "Enregistrement...";

  try {
    const response = await fetch(productsApi, {
      method: "POST",
      headers: { "X-CSRF-Token": csrfToken },
      body: data
    });
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Impossible d enregistrer le produit");
    }

    productsCache = result.products || [];
    renderProducts(productsCache);
    resetForm();
  } catch (error) {
    alert(error.message || "Erreur produit");
  } finally {
    submit.disabled = false;
    submit.textContent = "Enregistrer";
  }
}

async function deleteProduct(id) {
  const response = await fetch(`${productsApi}?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { "X-CSRF-Token": csrfToken }
  });
  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Suppression impossible");
  }

  productsCache = result.products || [];
  renderProducts(productsCache);
}

function editProduct(id) {
  const product = productsCache.find((item) => String(item.id) === String(id));
  if (!product) return;

  form.elements.id.value = product.id;
  form.elements.name.value = product.name;
  form.elements.price.value = product.price;
  form.elements.category.value = product.category;
  form.elements.stock.value = product.stock || 0;
  form.elements.sizes.value = product.sizes || "";
  form.elements.colors.value = product.colors || "";
  form.elements.availability_status.value = product.availability_status || "in_stock";
  form.elements.description.value = product.description || product.short_description || "";
  imageInput.value = "";
  renderImagePreview(product.image || "");
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function loadOrders() {
  orderList.innerHTML = '<div class="order-row"><div><strong>Chargement</strong><small>Recuperation des commandes...</small></div></div>';

  try {
    const response = await fetch(ordersApi);
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Impossible de charger les commandes");
    }

    const orders = result.orders || [];
    const revenue = orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
    document.querySelector("[data-stat-orders]").textContent = orders.length;
    document.querySelector("[data-stat-revenue]").textContent = formatPrice(revenue);

    if (!orders.length) {
      orderList.innerHTML = '<div class="order-row"><div><strong>Aucune commande</strong><small>Les commandes WhatsApp apparaitront ici.</small></div></div>';
      return;
    }

    orderList.innerHTML = orders.map((order) => {
      const items = order.items || [];
      const itemsText = items.map((item) => `${escapeHtml(item.product_name)} x${item.quantity}`).join(", ");
      const detailRows = items.map((item) => `
        <li>${escapeHtml(item.product_name)} · Pointure ${escapeHtml(item.size_label)} · Qté ${item.quantity} · Prix unitaire ${formatPrice(item.unit_price)} · Total ${formatPrice(item.total_price)}</li>
      `).join("");
      return `
        <div class="order-row order-card">
          <div>
            <strong>${escapeHtml(order.order_number)} · ${escapeHtml(order.customer_name)}</strong>
            <small>${itemsText || "Commande"} · ${formatPrice(order.total_amount)}</small>
            <small>${escapeHtml(order.customer_phone || "Telephone non renseigne")} - ${escapeHtml(order.customer_address || "Adresse non renseignee")}</small>
            <small>${escapeHtml(formatDate(order.created_at))}</small>
            <details>
              <summary>Voir details</summary>
              <p><strong>Client :</strong> ${escapeHtml(order.customer_name)}</p>
              <p><strong>Telephone :</strong> ${escapeHtml(order.customer_phone || "Non renseigne")}</p>
              <p><strong>Adresse :</strong> ${escapeHtml(order.customer_address || "Non renseignee")}</p>
              <ul>${detailRows}</ul>
              ${order.whatsapp_message ? `<pre>${escapeHtml(order.whatsapp_message)}</pre>` : ""}
            </details>
          </div>
          <select class="status-select" data-order-status="${order.id}" aria-label="Statut commande ${escapeHtml(order.order_number)}">
            <option value="pending" ${order.status === "pending" ? "selected" : ""}>En attente</option>
            <option value="confirmed" ${order.status === "confirmed" ? "selected" : ""}>Confirmee</option>
            <option value="preparing" ${order.status === "preparing" ? "selected" : ""}>Preparation</option>
            <option value="delivered" ${order.status === "delivered" ? "selected" : ""}>Livree</option>
            <option value="cancelled" ${order.status === "cancelled" ? "selected" : ""}>Annulee</option>
          </select>
        </div>
      `;
    }).join("");
  } catch (error) {
    document.querySelector("[data-stat-orders]").textContent = "!";
    orderList.innerHTML = `<div class="order-row"><div><strong>Erreur</strong><small>${escapeHtml(error.message)}</small></div></div>`;
  }
}

async function loadMessages() {
  messageList.innerHTML = '<div><strong>Chargement</strong><span>Recuperation des messages...</span></div>';

  try {
    const response = await fetch("./api/messages.php");
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Impossible de charger les messages");
    }

    document.querySelector("[data-stat-messages]").textContent = result.count;

    if (!result.messages.length) {
      messageList.innerHTML = '<div><strong>Aucun message</strong><span>Les messages envoyes depuis le site apparaitront ici.</span></div>';
      return;
    }

    messageList.innerHTML = result.messages.map((message) => `
      <div>
        <strong>${escapeHtml(message.name)}</strong>
        <div class="message-meta">
          <small>${escapeHtml(message.subject || "Message")}</small>
          <small>${escapeHtml(message.phone || "Sans telephone")}</small>
          <small>${escapeHtml(message.email || "Sans email")}</small>
          <small>${escapeHtml(formatDate(message.created_at))}</small>
        </div>
        <span>${escapeHtml(message.message)}</span>
      </div>
    `).join("");
  } catch (error) {
    document.querySelector("[data-stat-messages]").textContent = "!";
    messageList.innerHTML = `<div><strong>Erreur</strong><span>${escapeHtml(error.message || "Connexion impossible au backend")}</span></div>`;
  }
}

form.addEventListener("submit", saveProduct);
resetButton.addEventListener("click", resetForm);
refreshMessagesButton.addEventListener("click", loadMessages);
logoutButton.addEventListener("click", async () => {
  await fetch("./api/auth.php?action=logout", {
    method: "POST",
    headers: { "X-CSRF-Token": csrfToken }
  });
  window.location.href = "./login.html";
});

passwordForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submit = passwordForm.querySelector('button[type="submit"]');
  const payload = Object.fromEntries(new FormData(passwordForm).entries());

  passwordMessage.textContent = "";
  submit.disabled = true;
  submit.textContent = "Modification...";

  try {
    const response = await fetch("./api/auth.php?action=change_password", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
      body: JSON.stringify(payload)
    });
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Modification impossible.");
    }

    passwordForm.reset();
    passwordMessage.style.color = "var(--green)";
    passwordMessage.textContent = "Mot de passe modifie avec succes.";
  } catch (error) {
    passwordMessage.style.color = "var(--red)";
    passwordMessage.textContent = error.message || "Erreur pendant la modification.";
  } finally {
    submit.disabled = false;
    submit.textContent = "Modifier";
  }
});

backupButton.addEventListener("click", async () => {
  backupButton.disabled = true;
  backupMessage.style.color = "var(--gray)";
  backupMessage.textContent = "Sauvegarde en cours...";

  try {
    const response = await fetch("./api/backup.php", {
      method: "POST",
      headers: { "X-CSRF-Token": csrfToken }
    });
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Sauvegarde impossible.");
    }

    backupMessage.style.color = "var(--green)";
    backupMessage.textContent = `Sauvegarde creee : ${result.file}`;
  } catch (error) {
    backupMessage.style.color = "var(--red)";
    backupMessage.textContent = error.message || "Erreur pendant la sauvegarde.";
  } finally {
    backupButton.disabled = false;
  }
});

imageInput.addEventListener("change", () => {
  const file = imageInput.files?.[0];
  if (!file) {
    renderImagePreview(currentImage);
    return;
  }

  if (!file.type.startsWith("image/")) {
    imageInput.value = "";
    alert("Veuillez selectionner un fichier image.");
    return;
  }

  renderImagePreview(URL.createObjectURL(file));
});

list.addEventListener("click", async (event) => {
  const edit = event.target.closest("[data-edit]");
  const remove = event.target.closest("[data-delete]");

  if (edit) {
    editProduct(edit.dataset.edit);
    return;
  }

  if (remove) {
    try {
      await deleteProduct(remove.dataset.delete);
    } catch (error) {
      alert(error.message || "Suppression impossible");
    }
  }
});

orderList.addEventListener("change", async (event) => {
  const select = event.target.closest("[data-order-status]");
  if (!select) return;

  const previousText = select.options[select.selectedIndex].textContent;
  select.disabled = true;

  try {
    const response = await fetch(ordersApi, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
      body: JSON.stringify({ id: select.dataset.orderStatus, status: select.value })
    });
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Statut non modifie");
    }

    await loadOrders();
  } catch (error) {
    alert(error.message || `Impossible de passer la commande en ${previousText}`);
    await loadOrders();
  } finally {
    select.disabled = false;
  }
});

requireAuth().then(async (user) => {
  if (!user) return;
  try {
    await loadProducts();
  } catch (error) {
    list.innerHTML = `<div class="product-row"><div class="product-thumb product-thumb-placeholder">EHE</div><div><strong>Erreur</strong><small>${escapeHtml(error.message)}</small></div></div>`;
  }
  loadOrders();
  loadMessages();
});
