"use strict";

document.addEventListener("DOMContentLoaded", function () {
  setupProfileFlow();
  setupContactForm();
});

function showStep(number, focusHeading = true) {
  const target = document.getElementById("step" + number);
  if (!target) return;

  document.querySelectorAll(".step").forEach(function (step) {
    const active = step === target;
    step.hidden = !active;
    step.classList.toggle("active", active);
  });

  window.scrollTo({ top: 0, behavior: "smooth" });

  if (focusHeading) {
    const heading = target.querySelector("h2, h1");
    if (heading) heading.focus({ preventScroll: true });
  }
}

function checkedValues(form, name) {
  return Array.from(
    form.querySelectorAll('input[name="' + name + '"]:checked')
  ).map(function (input) {
    return input.value;
  });
}

async function postJSON(path, payload) {
  let response;

  try {
    response = await fetch(path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
  } catch {
    throw new Error(
      "Unable to connect to the server. Please check your connection and try again."
    );
  }

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error(
      "The server returned an unexpected response. Please try again later."
    );
  }

  if (!response.ok || !data || data.success !== true) {
    throw new Error(
      (data && data.error) ||
      "Unable to save your information. Please try again."
    );
  }

  return data;
}

function setupProfileFlow() {
  const basicForm = document.getElementById("profileForm");
  if (!basicForm) return;

  const preferencesForm = document.getElementById("preferencesForm");
  const interestsForm = document.getElementById("interestsForm");

  const basicError = document.getElementById("basicError");
  const preferencesError = document.getElementById("preferencesError");
  const profileError = document.getElementById("profileError");

  const submitButton = document.getElementById("findMatch");
  const backButton = document.getElementById("profileBack");

  let submitting = false;

  document.querySelectorAll("[data-step]").forEach(function (button) {
    button.addEventListener("click", function () {
      if (submitting) return;
      showStep(Number(button.dataset.step));
    });
  });

  function validBasicInformation() {
    basicError.textContent = "";

    const name = document.getElementById("name").value.trim();
    const age = Number(document.getElementById("age").value);
    const city = document.getElementById("city").value.trim();

    if (!name) {
      basicError.textContent = "Please enter your name.";
      return false;
    }

    if (!Number.isInteger(age) || age < 18 || age > 100) {
      basicError.textContent = "Please enter an age between 18 and 100.";
      return false;
    }

    if (!city) {
      basicError.textContent = "Please enter your city.";
      return false;
    }

    return true;
  }

  function validPreferences() {
    preferencesError.textContent = "";

    const ageRange = preferencesForm.querySelector(
      'input[name="ageRange"]:checked'
    );

    const personality = checkedValues(preferencesForm, "personality");

    const goal = document.getElementById("relationshipGoal").value;

    if (!ageRange) {
      preferencesError.textContent = "Please select a preferred age range.";
      return false;
    }

    if (personality.length === 0) {
      preferencesError.textContent = "Please select at least one personality.";
      return false;
    }

    if (!goal) {
      preferencesError.textContent = "Please select your relationship goal.";
      return false;
    }

    return true;
  }

  basicForm.addEventListener("submit", function (event) {
    event.preventDefault();

    if (validBasicInformation()) {
      showStep(2);
    }
  });

  preferencesForm.addEventListener("submit", function (event) {
    event.preventDefault();

    if (validPreferences()) {
      showStep(3);
    }
  });

  interestsForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    if (submitting) return;

    if (!validBasicInformation()) {
      showStep(1);
      return;
    }

    if (!validPreferences()) {
      showStep(2);
      return;
    }

    const profile = {
      name: document.getElementById("name").value.trim(),
      age: Number(document.getElementById("age").value),
      city: document.getElementById("city").value.trim(),

      ageRange: preferencesForm.querySelector(
        'input[name="ageRange"]:checked'
      ).value,

      personality: checkedValues(preferencesForm, "personality"),

      relationshipGoal: document.getElementById("relationshipGoal").value,

      interests: document.getElementById("interests").value.trim(),
      about: document.getElementById("about").value.trim(),
      activities: checkedValues(interestsForm, "activities")
    };

    submitting = true;
    submitButton.disabled = true;
    backButton.disabled = true;
    submitButton.textContent = "Finding Your Match...";
    profileError.textContent = "";

    try {
      await postJSON("/api/profile", profile);

      showStep(4);

      // Remember the result in the URL without saving personal form data.
      try {
        window.history.replaceState(null, "", "/#match");
      } catch {
        // The result remains visible if changing the URL is unavailable.
      }
    } catch (error) {
      profileError.textContent = error.message;
    } finally {
      submitting = false;
      submitButton.disabled = false;
      backButton.disabled = false;
      submitButton.textContent = "Find My Match ♥";
    }
  });

  showStep(window.location.hash === "#match" ? 4 : 1, false);
}

function setupContactForm() {
  const form = document.getElementById("contactForm");
  if (!form) return;

  const emailInput = document.getElementById("email");
  const phoneInput = document.getElementById("phone");
  const button = document.getElementById("submitContact");
  const message = document.getElementById("contactMessage");

  let submitting = false;

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    if (submitting) return;

    const email = emailInput.value.trim();
    const phone = phoneInput.value.trim();
    const digitCount = phone.replace(/\D/g, "").length;

    message.className = "message";
    message.textContent = "";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      message.className = "message error";
      message.textContent = "Please enter a valid email address.";
      emailInput.focus();
      return;
    }

    if (
      !/^\+?[0-9\s().-]+$/.test(phone) ||
      digitCount < 7 ||
      digitCount > 15 ||
      phone.length > 30
    ) {
      message.className = "message error";
      message.textContent =
        "Please enter a valid phone number, including your country code.";
      phoneInput.focus();
      return;
    }

    submitting = true;
    button.disabled = true;
    button.textContent = "Sending...";

    try {
      await postJSON("/api/contact", { email, phone });

      form.reset();
      message.className = "message success";
      message.textContent =
        "Thank you! Your contact information has been received.";
    } catch (error) {
      message.className = "message error";
      message.textContent = error.message;
    } finally {
      submitting = false;
      button.disabled = false;
      button.textContent = "Send Contact Information";
    }
  });
}
