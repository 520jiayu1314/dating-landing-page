```javascript
let currentStep = 1;

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


/*
========================================
页面加载
========================================
*/

document.addEventListener("DOMContentLoaded", () => {

    showStep(1);

    const continue1 = document.getElementById("continue1");
    const continue2 = document.getElementById("continue2");
    const submitProfile = document.getElementById("submitProfile");
    const back2 = document.getElementById("back2");
    const back3 = document.getElementById("back3");


    /*
    ========================================
    Step 1 → Step 2
    ========================================
    */

    if (continue1) {
        continue1.addEventListener("click", () => {

            const name =
                document.getElementById("name")?.value.trim();

            const age =
                Number(document.getElementById("age")?.value);

            const city =
                document.getElementById("city")?.value.trim();


            if (!name) {
                alert("Please enter your name.");
                return;
            }

            if (!age || age < 18 || age > 100) {
                alert("Please enter a valid age.");
                return;
            }

            if (!city) {
                alert("Please enter your city.");
                return;
            }


            userProfile.name = name;
            userProfile.age = age;
            userProfile.city = city;

            showStep(2);
        });
    }


    /*
    ========================================
    Step 2 → Step 3
    ========================================
    */

    if (continue2) {
        continue2.addEventListener("click", () => {

            const ageRange =
                document.querySelector(
                    'input[name="ageRange"]:checked'
                )?.value || "";

            const personality =
                Array.from(
                    document.querySelectorAll(
                        'input[name="personality"]:checked'
                    )
                ).map(el => el.value);

            const relationshipGoal =
                document.querySelector(
                    'input[name="relationshipGoal"]:checked'
                )?.value || "";


            if (!ageRange) {
                alert("Please select a preferred age range.");
                return;
            }

            if (personality.length === 0) {
                alert("Please select at least one personality.");
                return;
            }

            if (!relationshipGoal) {
                alert("Please select your relationship goal.");
                return;
            }


            userProfile.ageRange = ageRange;
            userProfile.personality = personality;
            userProfile.relationshipGoal = relationshipGoal;

            showStep(3);
        });
    }


    /*
    ========================================
    Step 2 返回
    ========================================
    */

    if (back2) {
        back2.addEventListener("click", () => {
            showStep(1);
        });
    }


    /*
    ========================================
    Step 3 返回
    ========================================
    */

    if (back3) {
        back3.addEventListener("click", () => {
            showStep(2);
        });
    }


    /*
    ========================================
    Step 3 → 提交
    ========================================
    */

    if (submitProfile) {
        submitProfile.addEventListener("click", async () => {

            userProfile.interests =
                document.getElementById("interests")?.value.trim() || "";

            userProfile.about =
                document.getElementById("about")?.value.trim() || "";


            userProfile.activities =
                Array.from(
                    document.querySelectorAll(
                        'input[name="activities"]:checked'
                    )
                ).map(el => el.value);


            /*
            ========================================
            防止重复点击
            ========================================
            */

            submitProfile.disabled = true;

            const originalText = submitProfile.textContent;

            submitProfile.textContent = "Saving...";


            try {

                const response = await fetch("/api/profile", {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify(userProfile)
                });


                const result = await response.json();


                /*
                ========================================
                已经提交过
                ========================================
                */

                if (
                    response.status === 409 &&
                    result.alreadySubmitted
                ) {

                    alert(
                        "Your profile has already been submitted."
                    );

                    submitProfile.disabled = false;
                    submitProfile.textContent = originalText;

                    return;
                }


                /*
                ========================================
                其他错误
                ========================================
                */

                if (!response.ok || !result.success) {

                    alert(
                        result.error ||
                        "Something went wrong. Please try again."
                    );

                    submitProfile.disabled = false;
                    submitProfile.textContent = originalText;

                    return;
                }


                /*
                ========================================
                成功
                ========================================
                */

                showMatch();

            } catch (error) {

                console.error(error);

                alert(
                    "Unable to connect to the server. Please try again."
                );

                submitProfile.disabled = false;
                submitProfile.textContent = originalText;
            }

        });
    }

});


/*
========================================
切换步骤
========================================
*/

function showStep(step) {

    currentStep = step;


    document.querySelectorAll(".step").forEach(el => {

        el.classList.remove("active");

    });


    const target =
        document.getElementById(`step${step}`);

    if (target) {
        target.classList.add("active");
    }


    /*
    ========================================
    更新进度条
    ========================================
    */

    document.querySelectorAll(".progress-step").forEach(el => {

        const stepNumber =
            Number(el.dataset.step);

        el.classList.remove("active", "completed");

        if (stepNumber === step) {
            el.classList.add("active");
        }

        if (stepNumber < step) {
            el.classList.add("completed");
        }

    });


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/*
========================================
显示推荐对象
========================================
*/

function showMatch() {

    showStep(4);


    /*
    ========================================
    当前先使用演示对象
    后面可以改成 D1 自动匹配
    ========================================
    */

    const match = {

        name: "Sophia",

        age: 42,

        city: "Los Angeles, CA",

        about:
            "Sophia is kind, warm, and enjoys traveling, cooking, and discovering new places.",

        interests:
            "Travel, Cooking, Music, Movies",

        whatsapp:
            "15551234567",

        telegram:
            "sophia_match"

    };


    const matchName =
        document.getElementById("matchName");

    const matchAge =
        document.getElementById("matchAge");

    const matchCity =
        document.getElementById("matchCity");

    const matchAbout =
        document.getElementById("matchAbout");

    const matchInterests =
        document.getElementById("matchInterests");

    const whatsapp =
        document.getElementById("whatsappButton");

    const telegram =
        document.getElementById("telegramButton");


    if (matchName) {
        matchName.textContent = match.name;
    }

    if (matchAge) {
        matchAge.textContent =
            `${match.age} years old`;
    }

    if (matchCity) {
        matchCity.textContent = match.city;
    }

    if (matchAbout) {
        matchAbout.textContent = match.about;
    }

    if (matchInterests) {
        matchInterests.textContent = match.interests;
    }


    if (whatsapp) {

        whatsapp.href =
            `https://wa.me/${match.whatsapp}`;

        whatsapp.target = "_blank";

        whatsapp.rel = "noopener noreferrer";

    }


    if (telegram) {

        telegram.href =
            `https://t.me/${match.telegram}`;

        telegram.target = "_blank";

        telegram.rel = "noopener noreferrer";

    }

}
```
