// icon: 🔐
// name: login
(()=>{
  document.querySelector('#user_login').value='login';
  document.querySelector('#user_pass').value='password';
  document.querySelector('#rememberme').checked=true;
  document.querySelector("input[name='redirect_to']").value=location.origin+'/wp-admin/edit.php?';
  document.querySelector('#wp-submit').click();
})();
