"""Exercise the checker through its CLI with isolated repository fixtures."""

from pathlib import Path
import subprocess
import sys
import tempfile
import unittest


SCRIPT = Path(__file__).with_name("check-adr-links.py")
ADR_DIRS = (("docs/adr", "M"), ("frontend/docs/adr", "F"), ("backend/docs/adr", "B"))


class AdrLinksTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="adr-links-", dir="/tmp")
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        for directory, prefix in ADR_DIRS:
            self.write(f"{directory}/ADR-{prefix}01-example.md", "# Example\n")
            self.write(
                f"{directory}/INDEX.md",
                f"| [ADR-{prefix}01](ADR-{prefix}01-example.md) | Example | accepted |\n",
            )

    def write(self, relative, text):
        path = self.root / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8")

    def assert_result(self, expected, message=""):
        result = subprocess.run(
            [sys.executable, str(SCRIPT), "--root", str(self.root)],
            text=True,
            capture_output=True,
            check=False,
        )
        self.assertEqual(result.returncode, expected, result.stdout + result.stderr)
        if message:
            self.assertIn(message, result.stdout)

    def test_valid_links_across_and_within_directories(self):
        self.write("README.md", "[ADR](docs/adr/ADR-M01-example.md) [Index](docs/adr/INDEX.md)\n")
        self.write(
            "frontend/docs/adr/ADR-F01-example.md",
            "[Index](INDEX.md) [Same](ADR-F01-example.md) "
            "[Backend](../../../backend/docs/adr/ADR-B01-example.md)\n",
        )
        self.assert_result(0, "OK:")

    def test_missing_adr_targets(self):
        for target in ("ADR-F02-missing.md", "../../../backend/docs/adr/ADR-B02-missing.md"):
            with self.subTest(target=target):
                self.write("frontend/docs/adr/ADR-F01-example.md", f"[Missing]({target})\n")
                self.assert_result(1, "missing ADR link target")

    def test_missing_index_link_target(self):
        self.write("README.md", "[Missing](missing/adr/INDEX.md)\n")
        self.assert_result(1, "missing ADR link target")

    def test_moved_cross_directory_path_is_rejected(self):
        self.write(
            "frontend/docs/adr/ADR-F01-example.md",
            "[Backend](../../backend/docs/adr/ADR-B01-example.md)\n",
        )
        self.assert_result(1, "missing ADR link target")

    def test_old_filename_in_each_document_scope(self):
        for relative in ("README.md", ".github/prompts/review.txt", ".claude/rules.md"):
            with self.subTest(relative=relative):
                self.write(relative, "Old docs/adr.md\n")
                self.assert_result(1, "old ADR filename")
                (self.root / relative).unlink()

    def test_old_anchor_without_old_filename(self):
        self.write("README.md", "[Old](#adr-f01)\n")
        self.assert_result(1, "old ADR anchor")

    def test_missing_index_row(self):
        self.write("docs/adr/INDEX.md", "# No rows\n")
        self.assert_result(1, "missing row: ADR-M01-example.md")

    def test_missing_index_file(self):
        (self.root / "docs/adr/INDEX.md").unlink()
        self.assert_result(1, "missing INDEX")

    def test_duplicate_index_row(self):
        row = "| [ADR-M01](ADR-M01-example.md) | Example | accepted |\n"
        self.write("docs/adr/INDEX.md", row + row)
        self.assert_result(1, "duplicate row")

    def test_wrong_index_file(self):
        self.write("docs/adr/ADR-M02-other.md", "# Other\n")
        self.write(
            "docs/adr/INDEX.md",
            "| [ADR-M01](ADR-M02-other.md) | Wrong | accepted |\n"
            "| [ADR-M02](ADR-M01-example.md) | Wrong | accepted |\n",
        )
        self.assert_result(1, "wrong ADR file")

    def test_index_row_requires_link(self):
        self.write("docs/adr/INDEX.md", "| ADR-M01 | No link | accepted |\n")
        self.assert_result(1, "ADR row needs one file link")

    def test_reference_links_and_index_rows(self):
        self.write(
            "docs/adr/INDEX.md",
            "| [ADR-M01][decision] | Example | accepted |\n"
            "[decision]: ADR-M01-example.md\n",
        )
        for link in ("[Example][decision]", "[decision][]", "[decision]"):
            with self.subTest(link=link):
                self.write("README.md", f"{link}\n[decision]: docs/adr/ADR-M01-example.md\n")
                self.assert_result(0)
        self.write("README.md", "[Example][decision]\n[decision]: docs/adr/ADR-M02-missing.md\n")
        self.assert_result(1, "missing ADR link target")

    def test_tasks_and_code_fixtures_are_outside_document_scope(self):
        self.write("tasks/plan.md", "adr.md [Old](#adr-f01)\n")
        self.write("scripts/fixture.py", "adr.md\n")
        self.write("scripts/fixture.txt", "adr.md\n")
        self.assert_result(0)

    def test_empty_adr_inventories_are_valid(self):
        for directory, prefix in ADR_DIRS:
            (self.root / directory / f"ADR-{prefix}01-example.md").unlink()
            self.write(f"{directory}/INDEX.md", "# No decisions yet\n")
        self.assert_result(0)


if __name__ == "__main__":
    unittest.main()
