const response = await fetch("/api/profile", {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify(userProfile)
});

const result = await response.json();

if (result.success) {
    showMatch();
}
