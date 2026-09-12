let userProfile = {
    name: "",
    age: 0,
    city: "",
    ageRange: "",
    personality: [],
    relationshipGoal: "",
    interests: "",
    about: "",
    activities: []
};


// ============================
// STEP CONTROL
// ============================

function showStep(stepNumber) {

    document.querySelectorAll(".step").forEach(step => {
        step.classList.remove("active");
    });

    const target = document.getElementById("step" + stepNumber);

    if (target) {
        target.classList.add("active");
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// ============================
// STEP 1
// ============================

const form = document.getElementById("profileForm");

form.addEventListener("submit", function(event) {

    event.preventDefault();

    userProfile.name =
        document.getElementById("name").value.trim();

    userProfile.age =
        Number(document.getElementById("age").value);

    userProfile.city =
        document.getElementById("city").value.trim();

    if (
        !userProfile.name ||
        !userProfile.age ||
        !userProfile.city
    ) {
        return;
    }

    showStep(2);
});


// ============================
// STEP 2
// ============================

function goToStep3() {

    const ageRange =
        document.querySelector(
            'input[name="ageRange"]:checked'
        );

    userProfile.ageRange =
        ageRange ? ageRange.value : "";

    userProfile.personality =
        Array.from(
            document.querySelectorAll(
                'input[name="personality"]:checked'
            )
        ).map(item => item.value);

    userProfile.relationshipGoal =
        document.getElementById(
            "relationshipGoal"
        ).value;

    showStep(3);
}


// ============================
// STEP 3
// ============================

async function submitProfile() {

    const errorMessage =
        document.getElementById("errorMessage");

    errorMessage.textContent = "";

    userProfile.interests =
        document.getElementById(
            "interests"
        ).value.trim();

    userProfile.about =
        document.getElementById(
            "about"
        ).value.trim();

    userProfile.activities =
        Array.from(
            document.querySelectorAll(
                'input[name="activities"]:checked'
            )
        ).map(item => item.value);


    if (!userProfile.interests) {

        errorMessage.textContent =
            "Please enter at least one hobby or interest.";

        return;
    }


    // ============================
    // SAVE TO CLOUDFLARE D1
    // ============================

    try {

        const response = await fetch(
            "/api/profile",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    name: userProfile.name,

                    age: userProfile.age,

                    city: userProfile.city,

                    interests:
                        userProfile.interests,

                    about:
                        userProfile.about,

                    ageRange:
                        userProfile.ageRange,

                    personality:
                        userProfile.personality.join(", "),

                    relationshipGoal:
                        userProfile.relationshipGoal,

                    activities:
                        userProfile.activities.join(", ")

                })
            }
        );


        const result = await response.json();


        if (
            !response.ok ||
            !result.success
        ) {

            throw new Error(
                result.error ||
                "Unable to save profile."
            );
        }


        // 保存成功以后显示匹配结果

        showMatch();

    } catch (error) {

        console.error(error);

        errorMessage.textContent =
            "Something went wrong. Please try again.";
    }
}


// ============================
// MATCH RESULT
// ============================

function showMatch() {

    /*
       这里暂时使用一个演示匹配对象。

       后面我们会把这里改成：
       Worker → D1 → 自动寻找匹配对象
    */

    const match = {

        name: "Sophia",

        age: 42,

        city: "Los Angeles, CA",

        about:
            "She enjoys traveling, cooking, music and spending time with family. She is looking for a meaningful relationship with someone who shares similar interests.",

        whatsapp:
            "15551234567",

        telegram:
            "sophia_match",

    };


    document.getElementById(
        "matchName"
    ).textContent = match.name;


    document.getElementById(
        "matchAge"
    ).textContent =
        match.age + " years old";


    document.getElementById(
        "matchCity"
    ).textContent =
        match.city;


    document.getElementById(
        "matchAbout"
    ).textContent =
        match.about;


    document.getElementById(
        "whatsappLink"
    ).href =
        "https://wa.me/" + match.whatsapp;


    document.getElementById(
        "telegramLink"
    ).href =
        "https://t.me/" + match.telegram;


    showStep(4);
}
