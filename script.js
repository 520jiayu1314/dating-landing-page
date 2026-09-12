const response = await fetch("/api/profile", {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify(userProfile)
});

const result = await response.json();


/*
==========================================
已经提交过
==========================================
*/

if (response.status === 409 && result.alreadySubmitted) {

    alert("Your profile has already been submitted.");

    return;
}


/*
==========================================
其他错误
==========================================
*/

if (!response.ok || !result.success) {

    alert(
        result.error ||
        "Something went wrong. Please try again."
    );

    return;
}


/*
==========================================
提交成功
==========================================
*/

showMatch();
