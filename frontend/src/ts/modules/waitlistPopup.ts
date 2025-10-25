const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

export class WaitlistPopup {
  private container: HTMLDivElement | null = null;
  private form: HTMLFormElement | null = null;
  private emailInput: HTMLInputElement | null = null;
  private submitButton: HTMLButtonElement | null = null;
  private messageEl: HTMLParagraphElement | null = null;
  private isSubmitting = false;

  constructor() {
    this.container = this.buildPopup();
    document.body.append(this.container);

    this.form = this.container.querySelector("form");
    this.emailInput = this.container.querySelector("input[type='email']");
    this.submitButton = this.container.querySelector("button[type='submit']");
    this.messageEl = this.container.querySelector(".waitlist-popup__message");

    const closeButton = this.container.querySelector<HTMLButtonElement>(
      ".waitlist-popup__close",
    );

    closeButton?.addEventListener("click", () => this.dismiss());
    this.form?.addEventListener("submit", (event) => this.handleSubmit(event));
  }

  private buildPopup(): HTMLDivElement {
    const wrapper = document.createElement("div");
    wrapper.className = "waitlist-popup";
    wrapper.role = "dialog";
    wrapper.setAttribute("aria-label", "Join the Interactive Resume waitlist");
    wrapper.innerHTML = `
      <button class="waitlist-popup__close" type="button" aria-label="Dismiss waitlist popup">
        &times;
      </button>
      <div class="waitlist-popup__content">
        <h2 class="waitlist-popup__title">Want your own interactive resume?</h2>
        <p class="waitlist-popup__description">
          Join the waitlist to be the first to know when the builder launches.
        </p>
        <form class="waitlist-popup__form" novalidate>
          <label class="waitlist-popup__label" for="waitlist-email">Email address</label>
          <div class="waitlist-popup__input-row">
            <input
              id="waitlist-email"
              type="email"
              name="email"
              required
              autocomplete="email"
              placeholder="you@example.com"
              class="waitlist-popup__input"
            />
            <button type="submit" class="waitlist-popup__submit">Join Waitlist</button>
          </div>
        </form>
        <p class="waitlist-popup__message" aria-live="polite"></p>
      </div>
    `;
    return wrapper;
  }

  private setMessage(message: string, intent: "success" | "error" | "info" = "info"): void {
    if (!this.messageEl) {
      return;
    }
    this.messageEl.textContent = message;
    this.messageEl.classList.toggle("waitlist-popup__message--success", intent === "success");
    this.messageEl.classList.toggle("waitlist-popup__message--error", intent === "error");
  }

  private setSubmitting(state: boolean): void {
    this.isSubmitting = state;
    if (this.submitButton) {
      this.submitButton.disabled = state;
    }
    if (this.emailInput && !this.emailInput.disabled) {
      this.emailInput.readOnly = state;
    }
  }

  private async handleSubmit(event: Event): Promise<void> {
    event.preventDefault();
    if (this.isSubmitting || !this.emailInput || !this.form) {
      return;
    }

    const inputValue = this.emailInput.value.trim().toLowerCase();
    if (!EMAIL_REGEX.test(inputValue)) {
      this.setMessage("Please enter a valid email address.", "error");
      this.emailInput.focus();
      return;
    }

    this.setSubmitting(true);
    this.setMessage("Joining waitlist...", "info");

    let completed = false;

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: inputValue }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        message?: string;
        error?: string;
      };

      if (response.ok) {
        this.setMessage(data.message ?? "Thanks! We'll be in touch soon.", "success");
        this.emailInput.disabled = true;
        this.submitButton && (this.submitButton.disabled = true);
        this.form.classList.add("waitlist-popup__form--complete");
        completed = true;
      }

      if (!completed && response.status === 409) {
        this.setMessage("You're already on the waitlist — thanks!", "success");
        this.emailInput.disabled = true;
        this.submitButton && (this.submitButton.disabled = true);
        this.form.classList.add("waitlist-popup__form--complete");
        completed = true;
      }

      if (!completed) {
        this.setMessage(data.error ?? "Something went wrong. Please try again.", "error");
      }
    } catch (error) {
      console.error("[WaitlistPopup] Failed to join waitlist", error);
      this.setMessage("Unable to reach the server. Please try again later.", "error");
    }

    if (completed) {
      this.isSubmitting = false;
      return;
    }

    this.setSubmitting(false);
  }

  private dismiss(): void {
    this.container?.remove();
  }
}
