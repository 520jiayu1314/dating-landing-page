const form = document.getElementById("profileForm");

form.addEventListener("submit", function(event) {

    event.preventDefault();

    const name =
        document.getElementById("name").value;

    const age =
        document.getElementById("age").value;

    const city =
        document.getElementById("city").value;

    const interests =
        document.getElementById("interests").value;

    const about =
        document.getElementById("about").value;


    console.log({
        name,
        age,
        city,
        interests,
        about
    });


    document.getElementById("successMessage").innerHTML =
        "Your profile has been submitted successfully!";


    form.reset();

});
