import { field } from "../core/dom.js";

export const createSession = () => {
  const session = {
    auth: {
      keys: {
        login: "wp-login",
        password: "wp-password",
      },
      get(key) {
        try {
          return localStorage.getItem(key) || "";
        } catch {
          return "";
        }
      },
      set(key, value) {
        try {
          localStorage.setItem(key, String(value || "").trim());
        } catch {}
      },
      ensure(key, label) {
        const current = session.auth.get(key);
        if (current) return current;
        const value = prompt(label);
        if (!value) throw new Error(label);
        session.auth.set(key, value);
        return value;
      },
    },
    field: {
      set(selector, value) {
        const element = document.querySelector(selector);
        if (!element) return false;
        field.set(element, value);
        return true;
      },
      check(selector, value) {
        const element = document.querySelector(selector);
        if (!element) return false;
        element.checked = Boolean(value);
        return true;
      },
      click(selector) {
        const element = document.querySelector(selector);
        if (!element) return false;
        element.click();
        return true;
      },
    },
    redirect() {
      const post = new URLSearchParams(location.search).get("post");
      if (post) {
        return `${location.origin}/wp-admin/post.php?post=${post}&action=edit`;
      }
      return `${location.origin}/wp-admin/edit.php`;
    },
    run() {
      try {
        session.field.set(
          "#user_login",
          session.auth.ensure(session.auth.keys.login, "username"),
        );
        session.field.set(
          "#user_pass",
          session.auth.ensure(session.auth.keys.password, "password"),
        );
        session.field.check("#rememberme", true);
        session.field.set('input[name="redirect_to"]', session.redirect());
        return session.field.click("#wp-submit");
      } catch (error) {
        alert(error.message);
        return false;
      }
    },
  };
  return {
    session: {
      login: {
        run: session.run,
      },
    },
  };
};
