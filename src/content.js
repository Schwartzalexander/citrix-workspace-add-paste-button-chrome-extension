(function () {
  const BUTTON_ID = "citrix-otp-paste-submit";

  function findOtpInput() {
    const input = document.querySelector('input[name="otp"], #input_1.credentials_input_password');
    if (!input || input.tagName !== "INPUT") {
      return null;
    }

    const label = document.querySelector(`label[for="${input.id}"]`);
    const labelText = label ? label.textContent.trim().toLowerCase() : "";
    const name = input.getAttribute("name") || "";

    if (name.toLowerCase() === "otp" || labelText.includes("einmalpasswort") || labelText.includes("one-time password")) {
      return input;
    }

    return null;
  }

  function submitForm(form, submitButton) {
    if (typeof form.requestSubmit === "function") {
      form.requestSubmit(submitButton || undefined);
      return;
    }

    const event = new Event("submit", { bubbles: true, cancelable: true });
    if (form.dispatchEvent(event)) {
      form.submit();
    }
  }

  async function pasteAndSubmit(input, form, submitButton, button) {
    button.disabled = true;
    const originalText = button.textContent;
    button.textContent = "Pasting...";

    try {
      const clipboardText = await navigator.clipboard.readText();
      const otp = clipboardText.trim();

      if (!otp) {
        throw new Error("Clipboard is empty");
      }

      input.focus();
      input.value = otp;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));

      button.textContent = "Submitting...";
      submitForm(form, submitButton);
    } catch (error) {
      console.warn("Citrix OTP paste failed:", error);
      button.textContent = "Clipboard unavailable";
      window.setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
      }, 2500);
      return;
    }

    window.setTimeout(() => {
      button.disabled = false;
      button.textContent = originalText;
    }, 2500);
  }

  function addButton() {
    if (document.getElementById(BUTTON_ID)) {
      return;
    }

    const input = findOtpInput();
    const form = input ? input.closest("form") : null;
    if (!input || !form) {
      return;
    }

    const submitButton = form.querySelector('input[type="submit"], button[type="submit"]');
    const target = submitButton ? submitButton.parentElement : input.parentElement;
    if (!target) {
      return;
    }

    const button = document.createElement("button");
    button.id = BUTTON_ID;
    button.type = "button";
    button.name = "paste_submit_otp";
    button.className = submitButton && submitButton.className
      ? `${submitButton.className} citrix-otp-paste-button`
      : "citrix-otp-paste-button";
    button.textContent = "Paste OTP and continue";
    button.title = "Pastes the one-time password from the clipboard and submits the form.";
    button.setAttribute("aria-label", button.title);

    button.addEventListener("click", () => {
      pasteAndSubmit(input, form, submitButton, button);
    });

    if (submitButton) {
      submitButton.insertAdjacentElement("afterend", button);
    } else {
      target.appendChild(button);
    }
  }

  addButton();

  const observer = new MutationObserver(addButton);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();
