(() => {
  const query = (selector) => document.querySelector(selector);
  const setDate = (selector, value) => {
    const field = query(selector);
    field.value = value;
    field.dispatchEvent(new Event("change", { bubbles: true }));
  };
  const currentDate = new Date();
  const publishDate = new Date(currentDate);
  if (currentDate.getHours() >= 8) {
    publishDate.setDate(publishDate.getDate() + 1);
  }
  publishDate.setHours(8, 0, 0, 0);
  const pad = (value) => String(value).padStart(2, "0");
  
  query(".edit-visibility").click();
  query("#visibility-radio-public").checked = true;
  query('input[name="sticky"][value="right"]').checked = true;
  query(".save-post-visibility").click();

  query(".edit-timestamp").click();
  setDate("#mm", pad(publishDate.getMonth() + 1));
  setDate("#jj", pad(publishDate.getDate()));
  setDate("#aa", String(publishDate.getFullYear()));
  setDate("#hh", "08");
  setDate("#mn", "00");
  query(".save-timestamp").click();

  query("#new-tag-post_tag").value = "Onliner";
  query("#post_tag .tagadd").click();

  const layoutSelect = [...document.querySelectorAll("select")].find((select) =>
    [...select.options].some((option) => option.value === "longread"),
  );
  const isLongread = layoutSelect && layoutSelect.value === "longread";
  const hasThumbnail = !!query("#postimagediv #set-post-thumbnail img");
  if (!isLongread && confirm("Не лонгрид! Меняем?")) {
    layoutSelect.value = "longread";
    layoutSelect.dispatchEvent(new Event("change", { bubbles: true }));
  }
  if (!hasThumbnail) {
    alert("Минус мини");
  }
})();
