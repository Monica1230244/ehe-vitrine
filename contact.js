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
  submit.disabled = true;
  submit.textContent = "Envoi...";

  try {
    const response = await fetch("./api/contact.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(form).entries()))
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || "Message non envoye");
    form.reset();
    showToast("Message envoye a EHE");
  } catch (error) {
    showToast(error.message || "Erreur pendant l envoi");
  } finally {
    submit.disabled = false;
    submit.textContent = "Envoyer";
  }
});
