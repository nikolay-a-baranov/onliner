from pathlib import Path
import json

ROOT = Path(__file__).parent
SRC = ROOT / "src"
TEMPLATE = ROOT / "index.template.html"
OUTPUT = ROOT / "index.html"

FILES = {
    "cleanup": SRC / "cleanup.js",
    "excerpt": SRC / "excerpt.js",
    "schedule": SRC / "schedule.js",
}

def minify_js(js: str) -> str:
    lines = []
    for line in js.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("//"):
            continue
        lines.append(stripped)
    return " ".join(lines).strip()

def bookmarklet(js: str) -> str:
    return "javascript:" + minify_js(js)

def main() -> None:
    html = TEMPLATE.read_text(encoding="utf-8")
    for name, path in FILES.items():
        code = bookmarklet(path.read_text(encoding="utf-8"))
        upper = name.upper()
        html = html.replace(f"__{upper}_HREF__", code)
        html = html.replace(f"__{upper}_JSON__", json.dumps(code))
    OUTPUT.write_text(html, encoding="utf-8")
    print("Built index.html")

if __name__ == "__main__":
    main()
