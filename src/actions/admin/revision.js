export const attachRevision = (admin, { host, css, ui }) => {
  admin.diff = {
      ids: {
        style: "diff-style",
        panel: "diff-panel",
        inlineBox: "diff-inline-box",
      },
      legacy: {
        styles: ["odi-style", "diff-panel-style"],
        panels: ["odi-panel"],
        inlineBox: "odi-inline-box",
      },
      state: {
        panelSnapshot: null,
      },
      tables() {
        return [...document.querySelectorAll("table.diff")].filter((table) =>
          table.querySelector(".diff-deletedline,.diff-addedline,.diff-context"),
        );
      },
      decode(value) {
        const textarea = document.createElement("textarea");
        textarea.innerHTML = String(value || "");
        return textarea.value;
      },
      unwrap(value) {
        return String(value || "").replace(/<\/?(ins|del)[^>]*>/gi, "");
      },
      analyze(value) {
        return admin.diff.decode(admin.diff.unwrap(value));
      },
      visible(value) {
        return admin.diff
          .analyze(value)
          .replace(/<[^>]*>/g, "")
          .replace(/\s+/g, " ")
          .trim();
      },
      skeleton(value) {
        return (admin.diff.analyze(value).match(/<\/?[a-z][^>]*>/gi) || [])
          .map((tag) => tag.replace(/\s+/g, " ").toLowerCase())
          .join("\n");
      },
      escape(value) {
        return String(value || "")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
      },
      payloads(value) {
        const source = String(value || "");
        const patch = {
          "onliner-promo-widget"(data) {
            if (typeof data.text === "string") {
              data.text = admin.diff.decode(data.text);
            }
            return data;
          },
          "onliner-vote"(data) {
            const next = { ...data };
            next.variants = Array.isArray(data?.variants)
              ? data.variants.map((item) => ({
                ...item,
                description: typeof item?.description === "string"
                  ? admin.diff.decode(item.description)
                  : item?.description,
              }))
              : data?.variants;
            return next;
          },
        };
        return widget.tag.list.reduce((result, tag) =>
          result.replace(
            new RegExp(`(\\[${tag}\\])({[\\s\\S]*?})(\\[\\/${tag}\\])`, "g"),
            (match, open, json, close) => {
              try {
                const data = JSON.parse(admin.diff.decode(json));
                const current = patch[tag] ? patch[tag](data) : data;
                return `${open}<pre>${admin.diff.escape(
                  JSON.stringify(current, null, 2),
                )}</pre>${close}`;
              } catch {
                return match;
              }
            },
          ), source);
      },
      display(value) {
        return admin.diff.payloads(value);
      },
      classify(deleted, added) {
        const deletedHtml = deleted ? deleted.innerHTML : "";
        const addedHtml = added ? added.innerHTML : "";
        if (!deleted || !added) {
          const html = deleted ? deletedHtml : addedHtml;
          return {
            text: Boolean(admin.diff.visible(html)),
            markup: Boolean(admin.diff.skeleton(html)),
          };
        }
        return {
          text: admin.diff.visible(deletedHtml) !== admin.diff.visible(addedHtml),
          markup:
            admin.diff.skeleton(deletedHtml) !== admin.diff.skeleton(addedHtml),
        };
      },
      stats(tables) {
        const stats = {
          inserted: 0,
          deleted: 0,
          addedLines: 0,
          deletedLines: 0,
          text: 0,
          markup: 0,
          mixed: 0,
          warnings: [],
        };
        tables.forEach((table) => {
          stats.inserted += table.querySelectorAll("ins").length;
          stats.deleted += table.querySelectorAll("del").length;
          stats.addedLines += table.querySelectorAll(".diff-addedline").length;
          stats.deletedLines += table.querySelectorAll(".diff-deletedline").length;
          table.querySelectorAll("tr").forEach((row) => {
            const deleted = row.querySelector(".diff-deletedline");
            const added = row.querySelector(".diff-addedline");
            if (!deleted && !added) return;
            const type = admin.diff.classify(deleted, added);
            if (type.text) stats.text += 1;
            if (type.markup) stats.markup += 1;
            if (type.text && type.markup) stats.mixed += 1;
          });
        });
        if (stats.deletedLines > 20) stats.warnings.push("много удалённых строк");
        if (stats.addedLines > 20) stats.warnings.push("много добавленных строк");
        if (stats.markup > 10) stats.warnings.push("много правок разметки");
        if (stats.mixed > 10) stats.warnings.push("много смешанных строк");
        return stats;
      },
      theme() {
        return (
          document.querySelector('.panel[data-ui-surface="toolbar"]')?.dataset
            ?.theme ||
          document.getElementById("reader-panel")?.dataset?.theme ||
          "light"
        );
      },
      mode: {
        get() {
          return document.body.dataset.diffMode || document.body.dataset.odiMode || "";
        },
        set(value) {
          document.body.dataset.diffMode = value;
          document.body.dataset.diffTheme = admin.diff.themeValue();
          delete document.body.dataset.odiMode;
        },
        clear() {
          delete document.body.dataset.diffMode;
          delete document.body.dataset.diffTheme;
          delete document.body.dataset.diffOrder;
          delete document.body.dataset.odiMode;
        },
      },
      order: {
        get() {
          return document.body.dataset.diffOrder === "deleted-first"
            ? "deleted-first"
            : "added-first";
        },
        toggle() {
          const next = admin.diff.order.get() === "added-first"
            ? "deleted-first"
            : "added-first";
          document.body.dataset.diffOrder = next;
          return next;
        },
        clear() {
          delete document.body.dataset.diffOrder;
        },
      },
      themeValue() {
        const value = document.body.dataset.diffTheme || admin.diff.theme();
        return value === "dark" ? "dark" : "light";
      },
      themeSet(value) {
        const next = value === "dark" ? "dark" : "light";
        document.body.dataset.diffTheme = next;
        const element = document.getElementById(admin.diff.ids.panel);
        if (!element) return next;
        ui.surface.sync(element, { theme: next, surface: "toolbar" });
        ui.controls.chrome.theme(element, {
          theme: next,
          action: "diff.theme",
        });
        return next;
      },
      themeToggle() {
        return admin.diff.themeSet(
          admin.diff.themeValue() === "dark" ? "light" : "dark",
        );
      },
      style() {
        host.mount(admin.diff.ids.style, css.diff.panel());
      },
      markers() {
        document
          .querySelectorAll("td.diff-deletedline,td.diff-addedline,td.diff-context")
          .forEach((cell) => {
            const marker = cell.previousElementSibling;
            if (
              marker &&
              marker.tagName === "TD" &&
              /^[+\-\s\u00a0]*$/.test(marker.textContent)
            ) {
              marker.dataset.diffMarker = "1";
              marker.dataset.diffDisplay = marker.style.display || "";
              marker.style.display = "none";
            }
          });
      },
      restoreMarkers() {
        document.querySelectorAll("[data-diff-marker],[data-odi-marker]").forEach((marker) => {
          marker.style.display =
            marker.dataset.diffDisplay || marker.dataset.odiDisplay || "";
          marker.removeAttribute("data-diff-marker");
          marker.removeAttribute("data-diff-display");
          marker.removeAttribute("data-odi-marker");
          marker.removeAttribute("data-odi-display");
        });
      },
      cells() {
        document
          .querySelectorAll("td.diff-deletedline,td.diff-addedline,td.diff-context")
          .forEach((cell) => {
            if (cell.dataset.diffHtml || cell.dataset.odiHtml) return;
            cell.dataset.diffHtml = cell.innerHTML;
            cell.innerHTML = admin.diff.display(cell.innerHTML);
          });
      },
      restoreCells() {
        document.querySelectorAll("[data-diff-html],[data-odi-html]").forEach((cell) => {
          cell.innerHTML = cell.dataset.diffHtml || cell.dataset.odiHtml || "";
          cell.removeAttribute("data-diff-html");
          cell.removeAttribute("data-odi-html");
        });
      },
      sourceCell(row, kind) {
        if (kind === "deleted") return row.querySelector(".diff-deletedline");
        if (kind === "added") return row.querySelector(".diff-addedline");
        const list = [...row.querySelectorAll(".diff-context")];
        if (!list.length) return null;
        return kind === "right" ? list[list.length - 1] : list[0];
      },
      sourceValue(cell) {
        if (!cell) return "";
        return admin.diff.analyze(cell.innerHTML).replace(/\s+$/g, "");
      },
      sourceLine(row) {
        const deleted = admin.diff.sourceCell(row, "deleted");
        const added = admin.diff.sourceCell(row, "added");
        const left = deleted || admin.diff.sourceCell(row, "left");
        const right = added || admin.diff.sourceCell(row, "right");
        return {
          left: admin.diff.sourceValue(left),
          right: admin.diff.sourceValue(right),
        };
      },
      source(tables) {
        const rows = tables.flatMap((table) => [...table.querySelectorAll("tr")]);
        const lines = rows.map(admin.diff.sourceLine);
        return {
          left: lines.map((line) => line.left).join("\n"),
          right: lines.map((line) => line.right).join("\n"),
          origin: "table",
        };
      },
      revision: {
        cache: {},
        selected(name) {
          return String(
            document.querySelector(`#post-revisions input[name="${name}"]:checked`)
              ?.value || "",
          );
        },
        selectedPair() {
          return {
            leftId: admin.diff.revision.selected("left"),
            rightId: admin.diff.revision.selected("right"),
          };
        },
        row(id) {
          const value = String(id || "");
          if (!value) return null;
          return document
            .querySelector(`#post-revisions input[value="${value}"]`)
            ?.closest("tr") || null;
        },
        target(id) {
          const value = String(id || "");
          const row = admin.diff.revision.row(value);
          const link = row?.querySelector('a[href*="action=edit"]');
          return {
            id: value,
            found: Boolean(row),
            url: link?.href || "",
            label: String(row?.textContent || "").replace(/\s+/g, " ").trim(),
          };
        },
        url(id) {
          return admin.diff.revision.target(id).url;
        },
        contentInfo(documentNode) {
          const selectors = [
            "#content",
            "textarea[name='content']",
            "textarea[name='post_content']",
            ".wp-editor-area",
            "#post_content",
            "textarea",
          ];
          const matches = selectors.flatMap((selector) =>
            [...documentNode.querySelectorAll(selector)].map((element) => {
              const value = String(element.value || element.textContent || "");
              return {
                selector,
                tag: String(element.tagName || "").toLowerCase(),
                id: element.id || "",
                name: element.getAttribute("name") || "",
                length: value.length,
                value,
              };
            }),
          );
          const seen = new Set();
          const unique = matches.filter((item) => {
            const key = [item.selector, item.tag, item.id, item.name, item.length]
              .join("::");
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
          const picked = unique.find((item) => item.id === "content") ||
            unique.find((item) => item.name === "content") ||
            unique.find((item) => item.name === "post_content") ||
            unique.find((item) => item.length > 200) ||
            unique[0] ||
            null;
          return {
            selector: picked?.selector || "",
            tag: picked?.tag || "",
            id: picked?.id || "",
            name: picked?.name || "",
            length: picked?.length || 0,
            value: picked?.value || "",
            candidates: unique.map(({ value, ...item }) => item),
          };
        },
        content(documentNode) {
          return admin.diff.revision.contentInfo(documentNode).value;
        },
        sample(value, limit = 1400) {
          const current = String(value || "").replace(/\r\n?/g, "\n");
          if (current.length <= limit) return current;
          return `${current.slice(0, limit)}\n…`;
        },
        attr(element, name) {
          return String(element?.getAttribute?.(name) || "");
        },
        formInfo(documentNode) {
          return [...documentNode.querySelectorAll("form")].map((form, index) => ({
            index,
            id: form.id || "",
            name: admin.diff.revision.attr(form, "name"),
            action: admin.diff.revision.attr(form, "action"),
            method: admin.diff.revision.attr(form, "method"),
            text: admin.diff.revision.sample(form.textContent, 220),
          }));
        },
        hiddenInfo(documentNode) {
          return [...documentNode.querySelectorAll('input[type="hidden"]')]
            .slice(0, 80)
            .map((input) => ({
              id: input.id || "",
              name: input.name || "",
              value: admin.diff.revision.sample(input.value, 220),
            }));
        },
        markerInfo(html) {
          const value = String(html || "");
          return {
            content: /post_content|name=["']content["']|id=["']content["']/i.test(value),
            textarea: /<textarea/i.test(value),
            revision: /revision/i.test(value),
            diff: /table[^>]+class=["'][^"']*diff/i.test(value),
            login: /wp-login|loginform|user_login/i.test(value),
          };
        },
        documentInfo(documentNode, html, response) {
          return {
            responseUrl: response?.url || "",
            title: documentNode.title || "",
            htmlLength: String(html || "").length,
            bodyText: admin.diff.revision.sample(documentNode.body?.textContent || ""),
            forms: admin.diff.revision.formInfo(documentNode),
            hidden: admin.diff.revision.hiddenInfo(documentNode),
            markers: admin.diff.revision.markerInfo(html),
          };
        },
        emptyInspect(target, error) {
          return {
            ...target,
            ok: false,
            status: 0,
            error,
            content: admin.diff.revision.contentInfo(document),
            document: admin.diff.revision.documentInfo(document, document.documentElement?.outerHTML || ""),
          };
        },
        async inspect(id) {
          const target = admin.diff.revision.target(id);
          if (!target.id || !target.url) {
            return admin.diff.revision.emptyInspect(
              target,
              target.id ? "edit link not found" : "revision id not selected",
            );
          }
          if (Object.hasOwn(admin.diff.revision.cache, target.id)) {
            return admin.diff.revision.cache[target.id];
          }
          try {
            const response = await fetch(target.url, {
              credentials: "same-origin",
              cache: "no-store",
            });
            const html = await response.text();
            const documentNode = new DOMParser().parseFromString(html, "text/html");
            const content = admin.diff.revision.contentInfo(documentNode);
            const info = admin.diff.revision.documentInfo(documentNode, html, response);
            const result = {
              ...target,
              ok: response.ok && Boolean(content.value),
              status: response.status,
              htmlLength: html.length,
              title: info.title,
              content,
              document: info,
              error: response.ok
                ? content.value ? "" : "content not found"
                : `http ${response.status}`,
            };
            admin.diff.revision.cache[target.id] = result;
            return result;
          } catch (error) {
            const result = admin.diff.revision.emptyInspect(
              target,
              error.message || "revision fetch failed",
            );
            admin.diff.revision.cache[target.id] = result;
            return result;
          }
        },
        async fetch(id) {
          return (await admin.diff.revision.inspect(id)).content.value;
        },
        async source() {
          const pair = admin.diff.revision.selectedPair();
          const [left, right] = await Promise.all([
            admin.diff.revision.fetch(pair.leftId),
            admin.diff.revision.fetch(pair.rightId),
          ]);
          if (!left || !right) return null;
          return {
            left,
            right,
            origin: "revision",
          };
        },
      },
      async fullSource(tables) {
        return (await admin.diff.revision.source()) || admin.diff.source(tables);
      },
      token(value, index) {
        const raw = String(value || "");
        const word = /^[\p{L}\p{N}_-]+$/u.test(raw);
        const html = /^<[^>]+>$/u.test(raw);
        const comment = /^<!--[\s\S]*-->$/u.test(raw);
        const widget = /^\[onliner-/u.test(raw);
        const space = /^\s+$/u.test(raw);
        const breakable = /\n/u.test(raw);
        const symbol = !word && !html && !comment && !widget && !space;
        const lower = raw.toLocaleLowerCase("ru-RU");
        return {
          value: raw,
          key: word ? lower : raw,
          index,
          word,
          html,
          comment,
          widget,
          space,
          breakable,
          symbol,
          anchor: !space && (html || comment || widget || word && lower.length > 2),
        };
      },
      tokenize(value) {
        const source = String(value || "").replace(/\r\n?/g, "\n");
        const pattern = /\[onliner-[\s\S]*?\[\/onliner-[^\]]+\]|<!--[\s\S]*?-->|<\/?[^>]+>|&[a-z0-9#]+;|[\p{L}\p{N}_-]+|\n+|[ \t]+|[^\s]/giu;
        return (source.match(pattern) || []).map(admin.diff.token);
      },
      anchorIndex(tokens, range) {
        const result = {};
        tokens.slice(range.start, range.end).forEach((token, offset) => {
          if (!token.anchor) return;
          const list = result[token.key] || [];
          list.push(range.start + offset);
          result[token.key] = list;
        });
        Object.keys(result).forEach((key) => {
          if (result[key].length > 32) delete result[key];
        });
        return result;
      },
      tokenIndex(tokens) {
        return admin.diff.anchorIndex(tokens, {
          start: 0,
          end: tokens.length,
        });
      },
      tokenMatch(left, right, index, range) {
        let best = {
          left: range.leftStart,
          right: range.rightStart,
          size: 0,
        };
        let previous = new Map();
        for (let leftIndex = range.leftStart; leftIndex < range.leftEnd; leftIndex += 1) {
          const token = left[leftIndex];
          const positions = token.anchor ? index[token.key] || [] : [];
          const current = new Map();
          positions.forEach((rightIndex) => {
            if (rightIndex < range.rightStart || rightIndex >= range.rightEnd) return;
            const size = (previous.get(rightIndex - 1) || 0) + 1;
            current.set(rightIndex, size);
            if (size <= best.size) return;
            best = {
              left: leftIndex - size + 1,
              right: rightIndex - size + 1,
              size,
            };
          });
          previous = current;
        }
        return best;
      },
      tokenEqual(left, right) {
        if (!left || !right) return false;
        if (left.space && right.space) return left.breakable === right.breakable;
        return left.key === right.key;
      },
      tokenExact(left, right) {
        const limit = 70000;
        if (!left.length || !right.length || left.length * right.length > limit) {
          return [
            { type: "deleted", tokens: left },
            { type: "added", tokens: right },
          ].filter((item) => item.tokens.length);
        }
        const width = right.length + 1;
        const score = new Uint16Array((left.length + 1) * width);
        for (let leftIndex = left.length - 1; leftIndex >= 0; leftIndex -= 1) {
          for (let rightIndex = right.length - 1; rightIndex >= 0; rightIndex -= 1) {
            const index = leftIndex * width + rightIndex;
            if (admin.diff.tokenEqual(left[leftIndex], right[rightIndex])) {
              score[index] = score[(leftIndex + 1) * width + rightIndex + 1] + 1;
            } else {
              score[index] = Math.max(
                score[(leftIndex + 1) * width + rightIndex],
                score[leftIndex * width + rightIndex + 1],
              );
            }
          }
        }
        const result = [];
        let leftIndex = 0;
        let rightIndex = 0;
        while (leftIndex < left.length && rightIndex < right.length) {
          if (admin.diff.tokenEqual(left[leftIndex], right[rightIndex])) {
            result.push({ type: "context", tokens: [left[leftIndex]] });
            leftIndex += 1;
            rightIndex += 1;
          } else if (
            score[(leftIndex + 1) * width + rightIndex] >=
            score[leftIndex * width + rightIndex + 1]
          ) {
            result.push({ type: "deleted", tokens: [left[leftIndex]] });
            leftIndex += 1;
          } else {
            result.push({ type: "added", tokens: [right[rightIndex]] });
            rightIndex += 1;
          }
        }
        if (leftIndex < left.length) {
          result.push({ type: "deleted", tokens: left.slice(leftIndex) });
        }
        if (rightIndex < right.length) {
          result.push({ type: "added", tokens: right.slice(rightIndex) });
        }
        return admin.diff.tokenMerge(result);
      },
      tokenDiffRange(left, right, index, range) {
        const match = admin.diff.tokenMatch(left, right, index, range);
        if (!match.size) {
          return admin.diff.tokenExact(
            left.slice(range.leftStart, range.leftEnd),
            right.slice(range.rightStart, range.rightEnd),
          );
        }
        return [
          ...admin.diff.tokenDiffRange(left, right, index, {
            leftStart: range.leftStart,
            leftEnd: match.left,
            rightStart: range.rightStart,
            rightEnd: match.right,
          }),
          {
            type: "context",
            tokens: left.slice(match.left, match.left + match.size),
          },
          ...admin.diff.tokenDiffRange(left, right, index, {
            leftStart: match.left + match.size,
            leftEnd: range.leftEnd,
            rightStart: match.right + match.size,
            rightEnd: range.rightEnd,
          }),
        ];
      },
      tokenMerge(list) {
        return list.reduce((result, item) => {
          if (!item.tokens.length) return result;
          const last = result[result.length - 1];
          if (last && last.type === item.type) {
            last.tokens = [...last.tokens, ...item.tokens];
            return result;
          }
          result.push({ ...item });
          return result;
        }, []);
      },
      tokenFine(left, right) {
        const index = admin.diff.tokenIndex(right);
        return admin.diff.tokenMerge(
          admin.diff.tokenDiffRange(left, right, index, {
            leftStart: 0,
            leftEnd: left.length,
            rightStart: 0,
            rightEnd: right.length,
          }),
        );
      },
      blockTokens(tokens) {
        const blocks = [[]];
        tokens.forEach((token) => {
          blocks[blocks.length - 1].push(token);
          if (!token.breakable || !/\n\s*\n/u.test(token.value)) return;
          blocks.push([]);
        });
        return blocks.filter((block) => block.length);
      },
      blockText(tokens) {
        return tokens
          .filter((token) => !token.space)
          .map((token) => token.key)
          .join("\n");
      },
      blockDiff(left, right) {
        const leftBlocks = admin.diff.blockTokens(admin.diff.tokenize(left));
        const rightBlocks = admin.diff.blockTokens(admin.diff.tokenize(right));
        if (leftBlocks.length < 2 || rightBlocks.length < 2) {
          return admin.diff.tokenFine(admin.diff.tokenize(left), admin.diff.tokenize(right));
        }
        const leftKeys = leftBlocks.map(admin.diff.blockText);
        const rightKeys = rightBlocks.map(admin.diff.blockText);
        const result = [];
        let leftIndex = 0;
        let rightIndex = 0;
        while (leftIndex < leftBlocks.length || rightIndex < rightBlocks.length) {
          if (
            leftIndex < leftBlocks.length &&
            rightIndex < rightBlocks.length &&
            leftKeys[leftIndex] === rightKeys[rightIndex]
          ) {
            result.push({ type: "context", tokens: leftBlocks[leftIndex] });
            leftIndex += 1;
            rightIndex += 1;
            continue;
          }
          const nextLeft = rightIndex < rightBlocks.length
            ? leftKeys.indexOf(rightKeys[rightIndex], leftIndex + 1)
            : -1;
          const nextRight = leftIndex < leftBlocks.length
            ? rightKeys.indexOf(leftKeys[leftIndex], rightIndex + 1)
            : -1;
          if (nextLeft > -1 && (nextRight < 0 || nextLeft - leftIndex <= nextRight - rightIndex)) {
            result.push(...admin.diff.tokenFine(
              leftBlocks.slice(leftIndex, nextLeft).flat(),
              rightBlocks.slice(rightIndex, rightIndex + 1).flat(),
            ));
            leftIndex = nextLeft;
            rightIndex += 1;
            continue;
          }
          if (nextRight > -1) {
            result.push(...admin.diff.tokenFine(
              leftBlocks.slice(leftIndex, leftIndex + 1).flat(),
              rightBlocks.slice(rightIndex, nextRight).flat(),
            ));
            leftIndex += 1;
            rightIndex = nextRight;
            continue;
          }
          if (leftIndex < leftBlocks.length && rightIndex < rightBlocks.length) {
            result.push(...admin.diff.tokenFine(leftBlocks[leftIndex], rightBlocks[rightIndex]));
            leftIndex += 1;
            rightIndex += 1;
            continue;
          }
          if (leftIndex < leftBlocks.length) {
            result.push({ type: "deleted", tokens: leftBlocks[leftIndex] });
            leftIndex += 1;
            continue;
          }
          result.push({ type: "added", tokens: rightBlocks[rightIndex] });
          rightIndex += 1;
        }
        return admin.diff.tokenMerge(result);
      },
      tokenDiff(left, right) {
        return admin.diff.blockDiff(left, right);
      },
      tokenHtml(tokens) {
        return tokens.map((token) => admin.diff.escape(token.value)).join("\n");
      },
      inlineToken(type, token) {
        const value = admin.diff.escape(token.value);
        if (type === "context") return value;
        if (token.space || token.symbol) return value;
        return `<span class="diff-inline-token" data-diff-token="${type}">${value}</span>`;
      },
      inlineTokens(item) {
        return item.tokens
          .map((token) => admin.diff.inlineToken(item.type, token))
          .join("\n");
      },
      inlineHtml(items) {
        return items.map(admin.diff.inlineTokens).join("\n");
      },
      stat(label, value, tone = "neutral") {
        return `<div class="diff-stat" data-diff-tone="${tone}"><span class="diff-stat-label">${label}</span><span class="diff-stat-value">${value}</span></div>`;
      },
      statCluster(label, value, tone = "neutral") {
        return ui.controls.cluster({
          content: admin.diff.stat(label, value, tone),
          group: {
            classes: "diff-stat-cluster",
          },
        });
      },
      statRow(items, classes = "") {
        const value = items.join("");
        const className = ["diff-stat-row", classes].filter(Boolean).join(" ");
        return `<div class="${className}">${value}</div>`;
      },
      modeTitle(value = admin.diff.mode.get()) {
        if (value === "fit") return "Исходный";
        if (value === "inline") return "Инлайн";
        if (value === "split" || value === "reader") return "Слева / справа";
        return "Дифф";
      },
      actionButton({ action = "", title = "", fluent = "", fallback = "", active = false } = {}) {
        return ui.controls.button({
          fluent,
          fallback,
          action,
          title,
          attrs: ` type="button" data-diff-mode-button="true"${active ? ' data-active="true"' : ""}`,
        });
      },
      marker() {
        return ui.controls.marker({
          content: ui.controls.icon(icon.emoji("balance-scale")),
          button: {
            attrs: ' type="button" tabindex="-1" aria-label="Дифф"',
          },
        });
      },
      modeToggle(mode) {
        const inline = mode === "inline";
        return ui.controls.button({
          fluent: inline ? "Column Single Compare" : "Column Double Compare",
          fallback: inline ? "Column Single Compare" : "Column Double Compare",
          action: inline ? "diff.split" : "diff.inline",
          title: inline ? "Полотно" : "Столбы",
          attrs: ' type="button" data-diff-mode-button="true"',
        });
      },
      snapshot() {
        const element = document.getElementById(admin.diff.ids.panel);
        if (!element) return null;
        const rect = element.getBoundingClientRect();
        return {
          left: rect.left,
          top: rect.top,
        };
      },
      restore(element, snapshot = admin.diff.state.panelSnapshot) {
        if (!element || !snapshot) return;
        element.style.position = "fixed";
        element.style.left = `${Math.round(snapshot.left)}px`;
        element.style.top = `${Math.round(snapshot.top)}px`;
        element.style.right = "auto";
        element.style.bottom = "auto";
      },
      scrollSnapshot() {
        const canvas = document.querySelector(".diff-reader-list");
        return {
          top: canvas ? canvas.scrollTop : window.scrollY,
        };
      },
      scrollRestore(snapshot) {
        if (!snapshot) return;
        requestAnimationFrame(() => {
          const canvas = document.querySelector(".diff-reader-list");
          if (canvas) {
            canvas.scrollTop = snapshot.top;
            return;
          }
          window.scrollTo(0, snapshot.top);
        });
      },
      panel(stats) {
        const theme = admin.diff.themeValue();
        const mode = admin.diff.mode.get();
        const head = ui.shell.frame({
          classes: "diff-head",
          attrs: ' data-panel-drag-handle="true"',
          left: admin.diff.marker(),
          main: admin.diff.modeToggle(mode),
          right: ui.controls.chrome({
            theme,
            themeAction: "diff.theme",
            closeAction: "diff.clear",
          }),
        });
        const changes = admin.diff.statRow([
          admin.diff.statCluster("Вставки", `${stats.inserted} / ${stats.addedLines}`, "add"),
          admin.diff.statCluster("Удаления", `${stats.deleted} / ${stats.deletedLines}`, "del"),
        ], "diff-stat-row-primary");
        const types = admin.diff.statRow([
          admin.diff.statCluster("Текст", stats.text),
          admin.diff.statCluster("HTML", stats.markup),
          admin.diff.statCluster("Микс", stats.mixed),
        ], "diff-stat-row-secondary");
        const element = host.create({
          id: admin.diff.ids.panel,
          html: ui.shell.stack(`${head}${changes}${types}`),
          draggable: true,
        });
        element.dataset.uiSurface = "toolbar";
        element.dataset.uiFrame = "capsule";
        element.dataset.toolbarFlow = "stack";
        ui.surface.sync(element, { theme, surface: "toolbar" });
        element.addEventListener("click", admin.diff.click);
        ui.controls.chrome.theme(element, {
          theme,
          action: "diff.theme",
        });
        admin.diff.restore(element);
        admin.diff.state.panelSnapshot = null;
      },
      async click(event) {
        const action = event.target.closest("[data-action]")?.dataset?.action;
        if (action === "diff.clear") {
          admin.diff.clear();
          admin.diff.mode.clear();
          return;
        }
        if (action === "diff.theme") {
          admin.diff.themeToggle();
          return;
        }
        if (action === "diff.split") {
          admin.diff.switch("split");
          return;
        }
        if (action === "diff.inline") {
          admin.diff.switch("inline");
          return;
        }
        if (action === "diff.order") {
          const mode = admin.diff.mode.get();
          const scroll = admin.diff.scrollSnapshot();
          admin.diff.order.toggle();
          await admin.diff.switch(mode === "inline" ? "inline" : "split");
          admin.diff.scrollRestore(scroll);
        }
      },
      lineLabel(kind) {
        return {
          added: "Стало",
          deleted: "Было",
          context: "Контекст",
        }[kind] || "";
      },
      linePart(kind, value) {
        return `<div class="diff-line-part" data-diff-part="${kind}"><div class="diff-line-content">${admin.diff.display(value)}</div></div>`;
      },
      cell(kind, value = "") {
        const empty = value ? "" : ' data-diff-empty="true"';
        return `<div class="diff-cell" data-diff-cell="${kind}"${empty}>${
          value ? admin.diff.display(value) : ""
        }</div>`;
      },
      splitLine(row) {
        const deleted = row.querySelector(".diff-deletedline");
        const added = row.querySelector(".diff-addedline");
        const context = row.querySelector(".diff-context");
        if (deleted && added) {
          return `<div class="diff-row" data-diff-row="change">${admin.diff.cell(
            "deleted",
            deleted.innerHTML,
          )}${admin.diff.cell("added", added.innerHTML)}</div>`;
        }
        if (added) {
          return `<div class="diff-row" data-diff-row="added">${admin.diff.cell(
            "deleted",
          )}${admin.diff.cell("added", added.innerHTML)}</div>`;
        }
        if (deleted) {
          return `<div class="diff-row" data-diff-row="deleted">${admin.diff.cell(
            "deleted",
            deleted.innerHTML,
          )}${admin.diff.cell("added")}</div>`;
        }
        if (context) {
          return `<div class="diff-row" data-diff-row="context">${admin.diff.cell(
            "context",
            context.innerHTML,
          )}</div>`;
        }
        return "";
      },
      inlinePart(kind, value) {
        return `<span class="diff-inline-part" data-diff-part="${kind}">${admin.diff.display(value)}</span>`;
      },
      pretty(value) {
        return admin.diff.display(value).replace(
          /(&lt;\/?[^&]*?&gt;|&lt;!--[\s\S]*?--&gt;)/g,
          (match) => `<span class="diff-html-token">${match}</span>`,
        );
      },
      changeGlyph(kind) {
        return `<div class="diff-change-glyph" data-diff-glyph="${kind}">${ui.controls.icon(
          ui.controls.glyph("Text Paragraph Direction", 16),
        )}</div>`;
      },
      changeSide(kind, value = "", options = {}) {
        const empty = value ? "" : ' data-diff-empty="true"';
        const glyph = options.glyph ? admin.diff.changeGlyph(kind) : "";
        return `<div class="diff-change-side" data-diff-side="${kind}"${empty}>${glyph}<div class="diff-change-content">${value ? admin.diff.pretty(value) : ""}</div></div>`;
      },
      changePair(deleted, added) {
        return `<div class="diff-change-card" data-diff-change="pair">${admin.diff.changeSide(
          "deleted",
          deleted ? deleted.innerHTML : "",
        )}${admin.diff.changeSide("added", added ? added.innerHTML : "")}</div>`;
      },
      changeSingle(kind, value = "") {
        return `<div class="diff-change-card" data-diff-change="${kind}">${admin.diff.changeSide(
          kind,
          value,
        )}</div>`;
      },
      changeContext(value = "") {
        return `<div class="diff-change-card" data-diff-change="context"><div class="diff-change-content">${admin.diff.pretty(value)}</div></div>`;
      },
      splitCell(kind, value = "", options = {}) {
        const empty = value ? "" : ' data-diff-empty="true"';
        const glyph = options.glyph ? admin.diff.changeGlyph(kind) : "";
        return `<div class="diff-change-side" data-diff-side="${kind}"${empty}>${glyph}<div class="diff-change-content">${value ? admin.diff.pretty(value) : ""}</div></div>`;
      },
      splitContext(row) {
        const left = admin.diff.sourceCell(row, "left");
        const right = admin.diff.sourceCell(row, "right");
        const value = left?.innerHTML || right?.innerHTML || "";
        if (!value) return "";
        return `<div class="diff-change-card" data-diff-change="context"><div class="diff-change-content">${admin.diff.pretty(value)}</div></div>`;
      },
      splitSides(deleted = "", added = "", options = {}) {
        const deletedCell = admin.diff.splitCell("deleted", deleted, {
          glyph: options.deletedGlyph,
        });
        const addedCell = admin.diff.splitCell("added", added, {
          glyph: options.addedGlyph,
        });
        return admin.diff.order.get() === "deleted-first"
          ? `${deletedCell}${addedCell}`
          : `${addedCell}${deletedCell}`;
      },
      splitGroup(group) {
        const deletedCount = group.deleted.filter(Boolean).length;
        const addedCount = group.added.filter(Boolean).length;
        const reflow = group.rows === 2 && (
          deletedCount === 2 && addedCount === 1 ||
          deletedCount === 1 && addedCount === 2
        );
        if (reflow) {
          const deleted = group.deleted.filter(Boolean).join("\n");
          const added = group.added.filter(Boolean).join("\n");
          return `<div class="diff-change-card" data-diff-change="paragraph">${admin.diff.splitSides(
            deleted,
            added,
            {
              deletedGlyph: Boolean(deleted),
              addedGlyph: Boolean(added),
            },
          )}</div>`;
        }
        return group.deleted.map((deleted, index) => {
          const added = group.added[index] || "";
          if (!deleted && !added) return "";
          const type = deleted && added ? "pair" : added ? "added" : "deleted";
          return `<div class="diff-change-card" data-diff-change="${type}">${admin.diff.splitSides(
            deleted,
            added,
          )}</div>`;
        }).filter(Boolean).join("\n");
      },
      splitChangeRows(table) {
        const result = [];
        let group = { deleted: [], added: [], rows: 0 };
        const flush = () => {
          const html = admin.diff.splitGroup(group);
          if (html) result.push(html);
          group = { deleted: [], added: [], rows: 0 };
        };
        [...table.querySelectorAll("tr")].forEach((row) => {
          const deleted = row.querySelector(".diff-deletedline");
          const added = row.querySelector(".diff-addedline");
          if (!deleted && !added) {
            flush();
            const context = admin.diff.splitContext(row);
            if (context) result.push(context);
            return;
          }
          group.deleted.push(deleted ? deleted.innerHTML : "");
          group.added.push(added ? added.innerHTML : "");
          group.rows += 1;
        });
        flush();
        return result.join("\n");
      },
      inlineChangeData(row) {
        const deleted = row.querySelector(".diff-deletedline");
        const added = row.querySelector(".diff-addedline");
        if (!deleted && !added) return null;
        return {
          deleted: deleted ? deleted.innerHTML : "",
          added: added ? added.innerHTML : "",
        };
      },
      inlineGroup(group) {
        const deleted = group.deleted.filter(Boolean).join("\n");
        const added = group.added.filter(Boolean).join("\n");
        const sides = [
          deleted ? admin.diff.changeSide("deleted", deleted) : "",
          added ? admin.diff.changeSide("added", added) : "",
        ].join("\n");
        if (!sides) return "";
        return `<div class="diff-change-card" data-diff-change="inline">${sides}</div>`;
      },
      inlineChangeRows(table) {
        const result = [];
        let group = { deleted: [], added: [] };
        const flush = () => {
          const html = admin.diff.inlineGroup(group);
          if (html) result.push(html);
          group = { deleted: [], added: [] };
        };
        [...table.querySelectorAll("tr")].forEach((row) => {
          const data = admin.diff.inlineChangeData(row);
          if (!data) {
            flush();
            return;
          }
          group.deleted.push(data.deleted);
          group.added.push(data.added);
        });
        flush();
        return result.join("\n");
      },
      changeRows(table, mode = "inline") {
        if (mode === "inline") return admin.diff.inlineChangeRows(table);
        return admin.diff.splitChangeRows(table);
      },
      changeBox(table, index, mode = "inline") {
        const rows = admin.diff.changeRows(table, mode);
        if (!rows) return "";
        const titleAction = mode === "split" ? ' data-action="diff.order" title="Поменять стороны"' : "";
        return `<section class="diff-change-section" data-diff-section="${mode}"><button class="diff-change-title" type="button"${titleAction}>${admin.diff.escape(
          admin.diff.tableTitle(table, index),
        )}</button><div class="diff-change-list">${rows}</div></section>`;
      },
      inlineLine(row) {
        return admin.diff.inlineChangeRow(row);
      },
      tableTitle(table, index) {
        const title = table
          .closest(".postbox,section,article,div")
          ?.querySelector("h2,h3,.hndle")
          ?.textContent;
        const value = String(title || "").replace(/\s+/g, " ").trim();
        const names = ["Текст", "Цитата"];
        return value || names[index] || `Фрагмент ${index + 1}`;
      },
      box(table, index, mode = "split") {
        const rows = admin.diff.changeBox(table, index, "split");
        return `<div class="${admin.diff.ids.inlineBox}" data-diff-box="true" data-diff-view="${mode}">${rows}</div>`;
      },
      inlineBox(tables) {
        const boxes = tables
          .map((table, index) => admin.diff.changeBox(table, index, "inline"))
          .filter(Boolean)
          .join("\n");
        const body = boxes || `<div class="diff-box-title">Изменения не найдены</div>`;
        return `<div class="${admin.diff.ids.inlineBox}" data-diff-box="true" data-diff-view="inline" data-diff-source="table"><div class="diff-inline-flow">${body}</div></div>`;
      },
      hideTables(tables) {
        tables.forEach((table) => {
          table.dataset.diffHidden = "1";
          table.dataset.diffDisplay = table.style.display || "";
          table.style.display = "none";
        });
      },
      fit() {
        const tables = admin.diff.tables();
        if (!tables.length) {
          alert("Diff-таблицы не найдены");
          return false;
        }
        admin.diff.mode.set("fit");
        return true;
      },
      async view(value = "split") {
        const mode = value === "inline" ? "inline" : "split";
        const tables = admin.diff.tables();
        if (!tables.length) {
          alert("Diff-таблицы не найдены");
          return false;
        }
        const html = mode === "inline"
          ? admin.diff.inlineBox(tables)
          : tables.map((table, index) => admin.diff.box(table, index, mode)).join("\n");
        admin.diff.hideTables(tables);
        tables[0].insertAdjacentHTML(
          "beforebegin",
          `<div class="diff-reader-list" data-diff-view="${mode}">${html}</div>`,
        );
        tables[0].previousElementSibling?.addEventListener("click", admin.diff.click);
        admin.diff.mode.set(mode);
        admin.diff.panel(admin.diff.stats(tables));
        return true;
      },
      async split() {
        return admin.diff.view("split");
      },
      async reader() {
        return admin.diff.split();
      },
      async inline() {
        return admin.diff.view("inline");
      },
      async switch(value) {
        admin.diff.state.panelSnapshot = admin.diff.snapshot();
        admin.diff.clear();
        admin.diff.style();
        if (value === "fit") return admin.diff.fit();
        if (value === "inline") return admin.diff.inline();
        return admin.diff.split();
      },
      clear() {
        document.getElementById(admin.diff.ids.style)?.remove();
        document.getElementById(admin.diff.ids.panel)?.remove();
        admin.diff.legacy.styles.forEach((id) => document.getElementById(id)?.remove());
        admin.diff.legacy.panels.forEach((id) => document.getElementById(id)?.remove());
        document
          .querySelectorAll(
            `.diff-reader-list,.${admin.diff.ids.inlineBox},.${admin.diff.legacy.inlineBox}`,
          )
          .forEach((box) => box.remove());
        document.querySelectorAll("[data-diff-hidden],[data-odi-hidden]").forEach((table) => {
          table.style.display =
            table.dataset.diffDisplay || table.dataset.odiDisplay || "";
          table.removeAttribute("data-diff-hidden");
          table.removeAttribute("data-diff-display");
          table.removeAttribute("data-odi-hidden");
          table.removeAttribute("data-odi-display");
        });
        admin.diff.restoreCells();
        admin.diff.restoreMarkers();
      },
      async run() {
        const mode = admin.diff.mode.get();
        admin.diff.state.panelSnapshot = mode === "inline" ? null : admin.diff.snapshot();
        admin.diff.clear();
        if (mode === "inline") {
          admin.diff.mode.clear();
          return true;
        }
        admin.diff.style();
        if (mode === "fit") return admin.diff.split();
        if (mode === "split" || mode === "reader") return admin.diff.inline();
        return admin.diff.fit();
      },
  };
};
