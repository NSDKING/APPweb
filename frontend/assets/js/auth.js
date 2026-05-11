 function toggleForms() {
      document.getElementById('loginForm').classList.toggle('hidden');
      document.getElementById('registerForm').classList.toggle('hidden');
    }

    function showForgot() {
      document.getElementById('loginForm').classList.add('hidden');
      document.getElementById('forgotForm').classList.remove('hidden');
    }

    function backToLogin() {
      document.getElementById('forgotForm').classList.add('hidden');
      document.getElementById('loginForm').classList.remove('hidden');
    }

    function fakeEmailSent() {
      alert("Un lien de réinitialisation a été envoyé (simulation)");
      document.getElementById('forgotForm').classList.add('hidden');
      document.getElementById('resetForm').classList.remove('hidden');
      return false;
    }

    function resetPassword() {
      const pass = document.getElementById('newPass').value;
      const confirm = document.getElementById('confirmPass').value;

      if(pass !== confirm) {
        alert("Les mots de passe ne correspondent pas");
        return false;
      }

      alert("Mot de passe modifié avec succès (simulation)");
      document.getElementById('resetForm').classList.add('hidden');
      document.getElementById('loginForm').classList.remove('hidden');
      return false;
    }
  
  function togglePassword(icon) {
    const input = icon.previousElementSibling;
    if (input.type === "password") {
      input.type = "text";
      icon.src = "assets/img/eye-open.png";
      icon.alt = "Hide password";
    } else {
      input.type = "password";
      icon.src = "assets/img/eye-closed.png";
      icon.alt = "Show password";
    }
  }