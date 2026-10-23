const order = {
  get(value = "") {
    return value === "deleted-first" ? "deleted-first" : "added-first";
  },
  toggle(value = "") {
    return order.get(value) === "added-first" ? "deleted-first" : "added-first";
  },
  arrange(deleted, added, value = "") {
    return order.get(value) === "deleted-first"
      ? [deleted, added]
      : [added, deleted];
  },
};

const text = {
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
      key: raw,
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
    return (source.match(pattern) || []).map(text.token);
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
    return text.anchorIndex(tokens, { start: 0, end: tokens.length });
  },
  tokenMatch(left, right, index, range) {
    let best = {
      left: range.leftStart,
      right: range.rightStart,
      size: 0,
    };
    for (let leftIndex = range.leftStart; leftIndex < range.leftEnd; leftIndex += 1) {
      const token = left[leftIndex];
      const positions = token.anchor ? index[token.key] || [] : [];
      positions.forEach((rightIndex) => {
        if (rightIndex < range.rightStart || rightIndex >= range.rightEnd) return;
        let leftStart = leftIndex;
        let rightStart = rightIndex;
        while (
          leftStart > range.leftStart &&
          rightStart > range.rightStart &&
          text.tokenEqual(left[leftStart - 1], right[rightStart - 1])
        ) {
          leftStart -= 1;
          rightStart -= 1;
        }
        let leftEnd = leftIndex + 1;
        let rightEnd = rightIndex + 1;
        while (
          leftEnd < range.leftEnd &&
          rightEnd < range.rightEnd &&
          text.tokenEqual(left[leftEnd], right[rightEnd])
        ) {
          leftEnd += 1;
          rightEnd += 1;
        }
        const size = leftEnd - leftStart;
        if (size <= best.size) return;
        best = {
          left: leftStart,
          right: rightStart,
          size,
        };
      });
    }
    return best;
  },
  tokenEqual(left, right) {
    if (!left || !right) return false;
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
        if (text.tokenEqual(left[leftIndex], right[rightIndex])) {
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
      if (text.tokenEqual(left[leftIndex], right[rightIndex])) {
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
    return text.tokenMerge(result);
  },
  tokenDiffRange(left, right, index, range) {
    const match = text.tokenMatch(left, right, index, range);
    if (!match.size) {
      return text.tokenExact(
        left.slice(range.leftStart, range.leftEnd),
        right.slice(range.rightStart, range.rightEnd),
      );
    }
    return [
      ...text.tokenDiffRange(left, right, index, {
        leftStart: range.leftStart,
        leftEnd: match.left,
        rightStart: range.rightStart,
        rightEnd: match.right,
      }),
      {
        type: "context",
        tokens: left.slice(match.left, match.left + match.size),
      },
      ...text.tokenDiffRange(left, right, index, {
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
    if (left.length * right.length <= 70000) {
      return text.tokenExact(left, right);
    }
    const index = text.tokenIndex(right);
    return text.tokenMerge(
      text.tokenDiffRange(left, right, index, {
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
    return JSON.stringify(tokens.map((token) => token.key));
  },
  blockDiff(left, right) {
    const leftBlocks = text.blockTokens(text.tokenize(left));
    const rightBlocks = text.blockTokens(text.tokenize(right));
    if (leftBlocks.length < 2 || rightBlocks.length < 2) {
      return text.tokenFine(text.tokenize(left), text.tokenize(right));
    }
    const leftKeys = leftBlocks.map(text.blockText);
    const rightKeys = rightBlocks.map(text.blockText);
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
        result.push(...text.tokenFine(
          leftBlocks.slice(leftIndex, nextLeft).flat(),
          rightBlocks.slice(rightIndex, rightIndex + 1).flat(),
        ));
        leftIndex = nextLeft;
        rightIndex += 1;
        continue;
      }
      if (nextRight > -1) {
        result.push(...text.tokenFine(
          leftBlocks.slice(leftIndex, leftIndex + 1).flat(),
          rightBlocks.slice(rightIndex, nextRight).flat(),
        ));
        leftIndex += 1;
        rightIndex = nextRight;
        continue;
      }
      if (leftIndex < leftBlocks.length && rightIndex < rightBlocks.length) {
        result.push(...text.tokenFine(leftBlocks[leftIndex], rightBlocks[rightIndex]));
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
    return text.tokenMerge(result);
  },
  diff(left, right) {
    return text.blockDiff(left, right);
  },
};

export const comparison = {
  order,
  text,
};
