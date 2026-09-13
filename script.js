// ==========================================
// Dating Landing Page - Main Script
// ==========================================

let currentStep = 1;

let userProfile = {
    name: "",
    age: "",
    city: "",

    ageRange: "",
    personality: [],
    relationshipGoal: "",

    interests: "",
    about: "",
    activities: []
};


// ==========================================
// Page Loaded
// ==========================================

document.addEventListener("DOMContentLoaded", function () {

    const profileForm = document.getElementById("profileForm");

    if (profileForm) {
        profileForm.addEventListener("submit", function (event) {
            event.preventDefault();

            goToStep2();
        });
    }

    showStep(1);
});


// ==========================================
// STEP 1
// ==========================================

function goToStep2() {

    const nameInput = document.getElementById("name");
    const ageInput = document.getElementById("age");
    const cityInput = document.getElementById("city");

    const name = nameInput.value.trim();
    const age = Number(ageInput.value);
    const city = cityInput.value.trim();


    // -----------------------------
    // Validation
    // -----------------------------

    if (!name) {
        alert("Please enter your name.");
        nameInput.focus();
        return;
    }

    if (!Number.isInteger(age) || age < 18 || age > 100) {
        alert("Please enter a valid age between 18 and 100.");
        ageInput.focus();
        return;
    }

    if (!city) {
        alert("Please enter your city.");
        cityInput.focus();
        return;
    }


    // -----------------------------
    // Save information
    // -----------------------------

    userProfile.name = name;
    userProfile.age = age;
    userProfile.city = city;


    // -----------------------------
    // Go to Step 2
    // -----------------------------

    showStep(2);
}


// ==========================================
// STEP 2
// ==========================================

function goToStep3() {

    // -----------------------------
    // Age range
    // -----------------------------

    const ageRangeElement =
        document.querySelector('input[name="ageRange"]:checked');

    if (!ageRangeElement) {
        alert("Please select a preferred age range.");
        return;
    }


    // -----------------------------
    // Personality
    // -----------------------------

    const personalityElements =
        document.querySelectorAll('input[name="personality"]:checked');

    const personality = Array.from(personalityElements)
        .map(function (element) {
            return element.value;
        });


    if (personality.length === 0) {
        alert("Please select at least one personality.");
        return;
    }


    // -----------------------------
    // Relationship goal
    // -----------------------------

    const relationshipGoalElement =
        document.getElementById("relationshipGoal");

    if (!relationshipGoalElement) {
        alert("Relationship goal field was not found.");
        return;
    }

    const relationshipGoal =
        relationshipGoalElement.value.trim();


    if (!relationshipGoal) {
        alert("Please select your relationship goal.");
        relationshipGoalElement.focus();
        return;
    }


    // -----------------------------
    // Save information
    // -----------------------------

    userProfile.ageRange = ageRangeElement.value;

    userProfile.personality = personality;

    userProfile.relationshipGoal =
        relationshipGoal;


    // -----------------------------
    // Go to Step 3
    // -----------------------------

    showStep(3);
}


// ==========================================
// STEP 3
// ==========================================

async function submitProfile() {

    const interestsElement =
        document.getElementById("interests");

    const aboutElement =
        document.getElementById("about");


    // -----------------------------
    // Collect text fields
    // -----------------------------

    const interests =
        interestsElement
            ? interestsElement.value.trim()
            : "";

    const about =
        aboutElement
            ? aboutElement.value.trim()
            : "";


    // -----------------------------
    // Activities
    // -----------------------------

    const activityElements =
        document.querySelectorAll(
            'input[name="activities"]:checked'
        );

    const activities =
        Array.from(activityElements)
            .map(function (element) {
                return element.value;
            });


    // -----------------------------
    // Save information
    // -----------------------------

    userProfile.interests = interests;

    userProfile.about = about;

    userProfile.activities = activities;


    // -----------------------------
    // Disable submit button
    // -----------------------------

    const submitButton =
        document.querySelector(
            '#step3 button[onclick="submitProfile()"]'
        );

    if (submitButton) {
        submitButton.disabled = true;
        submitButton.dataset.originalText =
            submitButton.textContent;

        submitButton.textContent =
            "Finding Your Match...";
    }


    // -----------------------------
    // Clear previous error
    // -----------------------------

    const errorMessage =
        document.getElementById("errorMessage");

    if (errorMessage) {
        errorMessage.textContent = "";
    }


    try {

        // ==========================================
        // Send to Cloudflare Worker
        // ==========================================

        const response = await fetch(
            "/api/profile",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(userProfile)
            }
        );


        let result = {};

        try {
            result = await response.json();
        } catch (jsonError) {
            result = {};
        }


        // ==========================================
        // Already submitted
        // ==========================================

        if (
            response.status === 409 &&
            result.alreadySubmitted
        ) {

            alert(
                "This browser has already submitted a profile."
            );

            return;
        }


        // ==========================================
        // Server error
        // ==========================================

        if (
            !response.ok ||
            !result.success
        ) {

            const errorText =
                result.error ||
                "Something went wrong. Please try again.";

            if (errorMessage) {
                errorMessage.textContent =
                    errorText;
            } else {
                alert(errorText);
            }

            return;
        }


        // ==========================================
        // SUCCESS
        // ==========================================

        console.log(
            "Profile submitted successfully:",
            result
        );


        // Go to matching page
        showMatch();


    } catch (error) {

        console.error(
            "Submit error:",
            error
        );


        if (errorMessage) {

            errorMessage.textContent =
                "Unable to connect to the server. Please check your internet connection and try again.";

        } else {

            alert(
                "Unable to connect to the server. Please try again."
            );

        }

    } finally {

        // Re-enable button

        if (submitButton) {

            submitButton.disabled = false;

            submitButton.textContent =
                submitButton.dataset.originalText ||
                "Find My Match ❤️";
        }
    }
}


// ==========================================
// STEP NAVIGATION
// ==========================================

function showStep(step) {

    const steps =
        document.querySelectorAll(".step");


    steps.forEach(function (element) {

        element.classList.remove("active");

    });


    const targetStep =
        document.getElementById(
            "step" + step
        );


    if (!targetStep) {

        console.error(
            "Step not found:",
            step
        );

        return;
    }


    targetStep.classList.add("active");


    currentStep = step;


    // Scroll to top
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });


    console.log(
        "Current step:",
        currentStep
    );
}


// ==========================================
// SHOW MATCH
// ==========================================

function showMatch() {

    // --------------------------------------
    // Match information
    // --------------------------------------

    const match = {

        name: "Sophia",

        age: 42,

        city: "Los Angeles, CA",

        about:
            "She enjoys traveling, cooking, music and spending time with family. She is looking for a meaningful relationship with someone who shares similar interests.",

        interests: [
            "Travel",
            "Cooking",
            "Music",
            "Family"
        ],

        whatsapp:
            "https://wa.me/15551234567",

        telegram:
            "https://t.me/sophia_match"
    };


    // --------------------------------------
    // Name
    // --------------------------------------

    const matchName =
        document.getElementById("matchName");

    if (matchName) {
        matchName.textContent =
            match.name;
    }


    // --------------------------------------
    // Age
    // --------------------------------------

    const matchAge =
        document.getElementById("matchAge");

    if (matchAge) {
        matchAge.textContent =
            match.age + " years old";
    }


    // --------------------------------------
    // City
    // --------------------------------------

    const matchCity =
        document.getElementById("matchCity");

    if (matchCity) {
        matchCity.textContent =
            match.city;
    }


    // --------------------------------------
    // About
    // --------------------------------------

    const matchAbout =
        document.getElementById("matchAbout");

    if (matchAbout) {
        matchAbout.textContent =
            match.about;
    }


    // --------------------------------------
    // Interests
    // --------------------------------------

    const tagsContainer =
        document.querySelector(
            "#step4 .tags"
        );

    if (tagsContainer) {

        tagsContainer.innerHTML = "";

        match.interests.forEach(
            function (interest) {

                const tag =
                    document.createElement("span");

                tag.textContent =
                    interest;

                tagsContainer.appendChild(tag);
            }
        );
    }


    // --------------------------------------
    // WhatsApp
    // --------------------------------------

    const whatsappLink =
        document.getElementById(
            "whatsappLink"
        );

    if (whatsappLink) {

        whatsappLink.href =
            match.whatsapp;

        whatsappLink.target =
            "_blank";

        whatsappLink.rel =
            "noopener noreferrer";
    }


    // --------------------------------------
    // Telegram
    // --------------------------------------

    const telegramLink =
        document.getElementById(
            "telegramLink"
        );

    if (telegramLink) {

        telegramLink.href =
            match.telegram;

        telegramLink.target =
            "_blank";

        telegramLink.rel =
            "noopener noreferrer";
    }


    // --------------------------------------
    // Show Step 4
    // --------------------------------------

    showStep(4);
}
