const form = document.querySelector("[data-contact-form]");
const toast = document.querySelector("[data-toast]");

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2000);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submit = form.querySelector("button");
  const status = form.querySelector("[data-form-status]");

  if (window.location.protocol === "file:") {
    const message = "Veuillez ouvrir le site avec http://localhost/ventes/ pour envoyer le message.";
    if (status) {
      status.textContent = message;
      status.className = "form-status error";
    }
    showToast(message);
    return;
  }

  submit.disabled = true;
  submit.textContent = "Envoi...";
  if (status) {
    status.textContent = "";
    status.className = "form-status";
  }

  try {
    const response = await fetch("./api/contact.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(form).entries()))
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || "Message non envoye");
    form.reset();
    if (status) {
      status.textContent = "Votre message a bien ete envoye. EHE vous repondra rapidement.";
      status.className = "form-status success";
    }
    showToast("Message envoye a EHE");
  } catch (error) {
    if (status) {
      status.textContent = error.message || "Erreur pendant l envoi. Veuillez reessayer.";
      status.className = "form-status error";
    }
    showToast(error.message || "Erreur pendant l envoi");
  } finally {
    submit.disabled = false;
    submit.textContent = "Envoyer";
  }
});
