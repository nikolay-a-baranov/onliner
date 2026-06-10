(() => {
  const auth = {
    login: "wp-login",
    password: "wp-password",
    get(key) {
      return localStorage.getItem(key) || "";
    },
    set(key, value) {
      localStorage.setItem(key, String(value || "").trim());
    },
    ensure(key, label) {
      const current = auth.get(key);
      if (current) return current;
      const value = prompt(label);
      if (!value) {
        throw new Error(`${label}`);
      }
      auth.set(key, value);
      return value;
    },
    clear() {
      localStorage.removeItem(auth.login);
      localStorage.removeItem(auth.password);
    },
  };
  const post = new URLSearchParams(location.search).get("post");
  const redirect = post
    ? `${location.origin}/wp-admin/post.php?post=${post}&action=edit`
    : `${location.origin}/wp-admin/edit.php`;
  document.querySelector("#user_login").value = auth.ensure(
    auth.login,
    "username",
  );
  document.querySelector("#user_pass").value = auth.ensure(
    auth.password,
    "password",
  );
  document.querySelector("#rememberme").checked = true;
  document.querySelector("input[name='redirect_to']").value = redirect;
  document.querySelector("#wp-submit").click();
})();
