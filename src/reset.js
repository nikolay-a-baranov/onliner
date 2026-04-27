(() => {
  const query = (selector, root = document) => root.querySelector(selector);
  const all = (selector, root = document) => [
    ...root.querySelectorAll(selector),
  ];
  const input = (element, value) => {
    if (!element) return;
    element.value = value;
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  };
  const click = (element, checked) => {
    if (!element) return;
    element.checked = checked;
    element.dispatchEvent(new Event("click", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  };
  const press = (selector) => {
    const element = query(selector);
    if (element) element.click();
  };
  const rotation = (values) => {
    const addButton = query("#rotation-titles-add");
    values.forEach((value, index) => {
      let inputs = all(
        "#rotation-titles-list .rt__item:not([hidden]) .rt__input",
      );
      while (
        inputs.length <= index &&
        addButton &&
        addButton.style.display !== "none"
      ) {
        addButton.click();
        inputs = all(
          "#rotation-titles-list .rt__item:not([hidden]) .rt__input",
        );
      }
      input(inputs[index], value);
    });
  };
  const tags = () => {
    all("#post_tag .tagchecklist .ntdelbutton").forEach((button) =>
      button.click(),
    );
    input(query("#tax-input-post_tag"), "");
    input(query("#new-tag-post_tag"), "");
  };
  const title =
    '  Тестовый  заголовок — "с неправильными" кавычками -- и лишними   пробелами  ';
  const rotationTitles = [
    "  Первый  ротационный -- заголовок  ",
    '  Второй — "ротационный" заголовок  ',
    "  Третий  тестовый -- вариант  ",
  ];
  input(query("#title"), title);
  rotation(rotationTitles);
  input(query("#excerpt"), "");
  input(query("#post_source"), '  Источник -- "тестовый" Onliner  ');
  input(query("#photo_author"), '  Фотограф -- "тестовый" Onliner  ');
  input(query("#video_author"), '  Видеограф -- "тестовый" Onliner  ');
  press(".edit-post-status");
  input(query("#post_status"), "draft");
  press(".save-post-status");
  press(".edit-visibility");
  click(query("#visibility-radio-private"), true);
  press(".save-post-visibility");
  press(".edit-timestamp");
  input(query("#mm"), "02");
  input(query("#jj"), "20");
  input(query("#aa"), "2002");
  input(query("#hh"), "20");
  input(query("#mn"), "02");
  press(".save-timestamp");
  tags();
  input(query("#layout_select"), "news");
  input(query("#favourite_title"), '  Крик -- "тестовый"  ');
  input(query('input[name="seo_title"]'), '  SEO -- "тестовый" заголовок  ');
  const enableComments = query("#enableComments");
  const enableReactions = query("#enableReactions");
  const livecast = query("#livecast");
  click(query("#juicyVideo"), false);
  click(query("#updated"), false);
  const specialArticle = query("#specialArticle");
  const specialArticleText = query("#specialArticle_text");
  const specialArticleBackground = query("#specialArticle_bg");
  const specialArticleColor = query("#specialArticle_color");
  const showTitleUnderPhoto = query("#show_title_under_photo");
  const enableParallax = query("#enable_parallax");
  const photoAmount = query("#photoAmount");
  const mainPageFavorite = query("#mainPageFavorite");
  const markOnListPage = query("#mark_on_list_page");
  const newsListPhoto = query("#news_list_photo");
  const includeDzen = query("#includeDzen");
})();
