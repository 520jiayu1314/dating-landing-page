document.addEventListener(
  "DOMContentLoaded",
  function () {

    setupContactForm();

  }
);


function setupContactForm() {

  const form =
    document.getElementById(
      "contactForm"
    );


  // 不是 contact 页面
  if (!form) {
    return;
  }


  const emailInput =
    document.getElementById(
      "email"
    );


  const phoneInput =
    document.getElementById(
      "phone"
    );


  const button =
    document.getElementById(
      "submitContact"
    );


  const message =
    document.getElementById(
      "contactMessage"
    );


  form.addEventListener(
    "submit",
    async function (event) {

      event.preventDefault();


      const email =
        emailInput
        .value
        .trim();


      const phone =
        phoneInput
        .value
        .trim();


      message.className =
        "form-message";

      message.textContent =
        "";


      button.disabled =
        true;

      button.textContent =
        "Sending...";


      try {

        const response =
          await fetch(
            "/api/contact",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body: JSON.stringify({
                email,
                phone
              })
            }
          );


        let data = {};


        try {

          data =
            await response.json();

        } catch (_) {

          data = {};

        }


        if (!response.ok) {

          throw new Error(
            data.error ||
            "Unable to submit your information."
          );

        }


        form.reset();


        message.className =
          "form-message success";


        message.textContent =
          "Thank you! Your contact information has been received.";


      } catch (error) {

        message.className =
          "form-message error";


        message.textContent =
          error.message ||
          "Something went wrong. Please try again.";

      } finally {

        button.disabled =
          false;


        button.textContent =
          "Send Contact Information";

      }

    }
  );

}
