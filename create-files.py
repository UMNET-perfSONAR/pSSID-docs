#!/usr/bin/env python3

import re
import ast
from pathlib import Path

JS_FILE = "main.js"
OUTPUT_DIR = Path("docs")


def extract_tree(js_text):
    match = re.search(
        r"const\s+TREE\s*=\s*(\[.*?\]);",
        js_text,
        re.DOTALL
    )

    if not match:
        raise RuntimeError("Could not find TREE definition")

    tree_text = match.group(1)

    tree_text = re.sub(
        r"([{,]\s*)([a-zA-Z_][a-zA-Z0-9_-]*)\s*:",
        r"\1'\2':",
        tree_text
    )

    return ast.literal_eval(tree_text)


def walk_tree(nodes):
    for node in nodes:
        yield node

        if "children" in node:
            yield from walk_tree(node["children"])


def create_markdown(node):
    return f"""# {node['title']}

This page has not been written yet.

```txt
Content coming soon.
```
"""

def main():
    OUTPUT_DIR.mkdir(exist_ok=True)
    js_text = Path(JS_FILE).read_text(encoding="utf-8")
    tree = extract_tree(js_text)
    for node in walk_tree(tree):
        filename = OUTPUT_DIR / f"{node['id']}.md"
        if filename.exists():
            print(f"Skipped {filename} (already exists)")
            continue
        filename.write_text(
            create_markdown(node),
            encoding="utf-8"
        )

        print(f"Created {filename}")

if __name__ == "__main__":
    main()
