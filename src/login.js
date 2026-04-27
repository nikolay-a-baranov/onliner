(() => {
  const post = new URLSearchParams(location.search).get("post");
  const redirect = post
    ? location.origin + "/wp-admin/post.php?post=" + post + "&action=edit"
    : location.origin + "/wp-admin/edit.php?";
  document.querySelector("#user_login").value = "username";
  document.querySelector("#user_pass").value = "password";
  document.querySelector("#rememberme").checked = true;
  document.querySelector("input[name='redirect_to']").value = redirect;
  document.querySelector("#wp-submit").click();
})();
