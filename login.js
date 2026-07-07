const form = document.querySelector("[data-login-form]");
const message = document.querySelector("[data-login-message]");

async function checkExistingSession() {
  try {
    const response = await fetch("./api/auth.php?action=status");
    const result = await response.json();
    if (result.authenticated) {
      window.location.href = "./admin.html";
    }
  } catch {
    // The form will show a clearer error if login fails.
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submit = form.querySelector('button[type="submit"]');
  const payload = Object.fromEntries(new FormData(form).entries());

  message.textContent = "";
  submit.disabled = true;
  submit.textContent = "Connexion...";

  try {
    const response = await fetch("./api/auth.php?action=login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Connexion impossible.");
    }

    window.location.href = "./admin.html";
  } catch (error) {
    message.textContent = error.message || "Identifiants incorrects.";
  } finally {
    submit.disabled = false;
    submit.textContent = "Se connecter";
  }
});

checkExistingSession();
