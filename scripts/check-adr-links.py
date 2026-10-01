#!/usr/bin/env python3
"""Check ADR links and inventories using only the Python standard library."""

import argparse
from collections import Counter
import os
from pathlib import Path
import re
from urllib.parse import unquote, urlsplit


ADR_DIRS = ("docs/adr", "frontend/docs/adr", "backend/docs/adr")
SKIP_DIRS = {".git", "node_modules", ".next", ".venv", "__pycache__"}
INLINE_LINK = re.compile(r"\[([^\]]*)\]\(\s*(<[^>]+>|[^\s)]+)(?:\s+[^)]*)?\)")
REFERENCE_DEFINITION = re.compile(r'^\s{0,3}\[([^\]]+)\]:\s*(<[^>]+>|\S+)', re.MULTILINE)
REFERENCE_LINK = re.compile(r"\[([^\]]+)\]\[([^\]]*)\]")
ADR_NUMBER = re.compile(r"ADR-[FBM]\d+", re.IGNORECASE)


def reference_key(label):
    return " ".join(label.split()).casefold()


def markdown_links(text, definitions=None, include_definitions=True):
    """Yield inline, reference-definition, full and collapsed reference links."""
    if definitions is None:
        definitions = {
            reference_key(label): target.strip("<>")
            for label, target in REFERENCE_DEFINITION.findall(text)
        }
    for match in INLINE_LINK.finditer(text):
        yield match.group(1), match.group(2).strip("<>")
    if include_definitions:
        for label, target in REFERENCE_DEFINITION.findall(text):
            yield label, target.strip("<>")
    for label, reference in REFERENCE_LINK.findall(text):
        key = reference_key(reference or label)
        if key in definitions:
            yield label, definitions[key]
    shortcut_pattern = r"(?<!\])\[([^\]]+)\](?![\[(:])"
    for label in re.findall(shortcut_pattern, text):
        key = reference_key(label)
        if key in definitions:
            yield label, definitions[key]


def document_paths(root):
    for directory, subdirs, names in os.walk(root):
        subdirs[:] = sorted(
            name for name in subdirs
            if name not in SKIP_DIRS and not (Path(directory) == root and name == "tasks")
        )
        for name in sorted(names):
            path = Path(directory) / name
            relative = path.relative_to(root)
            github_text = relative.parts[0] == ".github" and path.suffix == ".txt"
            if path.suffix == ".md" or github_text:
                yield path


def check_repository(root):
    root = root.resolve()
    errors = []
    for source in document_paths(root):
        text = source.read_text(encoding="utf-8")
        relative = source.relative_to(root)
        for line_number, line in enumerate(text.splitlines(), 1):
            if "adr.md" in line.lower():
                errors.append(f"{relative}:{line_number}: old ADR filename")
            if re.search(r"#adr-", line, re.IGNORECASE):
                errors.append(f"{relative}:{line_number}: old ADR anchor")
        for _, target in markdown_links(text):
            url = urlsplit(target)
            if url.scheme or url.netloc or not url.path:
                continue
            path = Path(unquote(url.path))
            adr_file = bool(re.fullmatch(r"ADR-[FBM]\d+-.+\.md", path.name, re.IGNORECASE))
            adr_index = path.name == "INDEX.md" and (
                path.parent.name == "adr" or source.parent.name == "adr"
            )
            if not (adr_file or adr_index):
                continue
            destination = (source.parent / path).resolve()
            if not destination.is_file():
                errors.append(f"{relative}: missing ADR link target: {target}")

    for directory in ADR_DIRS:
        adr_dir = root / directory
        index = adr_dir / "INDEX.md"
        if not index.is_file():
            errors.append(f"{directory}/INDEX.md: missing INDEX")
            continue
        actual = {p.name for p in adr_dir.glob("ADR-*.md") if p.is_file()}
        entries = []
        numbers = []
        text = index.read_text(encoding="utf-8")
        definitions = {
            reference_key(label): target.strip("<>")
            for label, target in REFERENCE_DEFINITION.findall(text)
        }
        for line_number, line in enumerate(text.splitlines(), 1):
            if not line.lstrip().startswith("|"):
                continue
            cell = line.strip().split("|")[1].strip()
            number = ADR_NUMBER.search(cell)
            if not number:
                continue
            links = list(markdown_links(cell, definitions, include_definitions=False))
            if len(links) != 1:
                errors.append(f"{directory}/INDEX.md:{line_number}: ADR row needs one file link")
                continue
            label, target = links[0]
            url = urlsplit(target)
            path = Path(unquote(url.path))
            expected_number = number.group().upper()
            valid = (
                not url.scheme and not url.netloc and not url.fragment and not url.query
                and path.parent == Path(".") and path.name in actual
                and path.name.startswith(expected_number + "-")
                and label.upper() == expected_number
            )
            if not valid:
                errors.append(f"{directory}/INDEX.md:{line_number}: wrong ADR file: {target}")
            entries.append(path.name)
            numbers.append(expected_number)
        counts = Counter(entries)
        for filename in sorted(actual - counts.keys()):
            errors.append(f"{directory}/INDEX.md: missing row: {filename}")
        for filename, count in sorted(counts.items()):
            if count > 1:
                errors.append(f"{directory}/INDEX.md: duplicate row: {filename}")
        for number, count in sorted(Counter(numbers).items()):
            if count > 1:
                errors.append(f"{directory}/INDEX.md: duplicate ADR number: {number}")
    return errors


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    args = parser.parse_args()
    errors = check_repository(args.root)
    for error in errors:
        print(error)
    if errors:
        return 1
    print("OK: ADR links and INDEX inventories match")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
