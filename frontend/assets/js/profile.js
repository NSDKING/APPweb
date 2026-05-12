const editBtn = document.getElementById("edit-profile-btn");

const inputs = document.querySelectorAll(".form-row input");

let editing = false;

editBtn.addEventListener("click", () => {

    editing = !editing;

    inputs.forEach(input => {
        input.disabled = !editing;
    });

    if (editing) {
        editBtn.textContent = "Enregistrer";
    } else {
        editBtn.textContent = "Modifier le profil";
        alert("Profil mis à jour !");
    }

});