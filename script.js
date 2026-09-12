const form = document.getElementById("profileForm");

form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const age = Number(document.getElementById("age").value);
    const city = document.getElementById("city").value.trim();
    const interests = document.getElementById("interests").value.trim();
    const about = document.getElementById("about").value.trim();

    const successMessage = document.getElementById("successMessage");

    // 基本检查
    if (!name || !age || !city) {
        successMessage.textContent =
            "Please fill in your name, age and city.";
        return;
    }

    try {
        const response = await fetch("/api/profile", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name,
                age,
                city,
                interests,
                about
            })
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.error || "Submission failed");
        }

        successMessage.textContent =
            "Your profile has been submitted successfully!";

        form.reset();

    } catch (error) {
        console.error(error);

        successMessage.textContent =
            "Something went wrong. Please try again.";
    }
});
