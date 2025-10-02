from pathlib import Path
from typing import Optional, Set

from markitdown import MarkItDown


# Supported input file extensions (lowercase, without leading dots)
ALLOWED_EXTENSIONS: Set[str] = {
    "pdf",
    "docx",
    "txt",
    "pptx",
    "xlsx",
    "csv",
    "doc",
    "md",
}


def _extract_markdown_from_result(result: object) -> Optional[str]:
    """Best-effort extraction of Markdown text from MarkItDown.convert result.

    MarkItDown's return type may vary between versions. This function probes common
    attributes and shapes to retrieve a Markdown string without tightly coupling to
    a specific version.
    """

    # Direct string
    if isinstance(result, str):
        return result

    # Object with common attributes
    for attr_name in ("text_content", "text", "markdown", "output_text"):
        markdown = getattr(result, attr_name, None)
        if isinstance(markdown, str):
            return markdown

    # Mapping/dict-like
    if isinstance(result, dict):  # type: ignore[unreachable]
        for key in ("text", "markdown", "content", "text_content"):
            value = result.get(key)  # type: ignore[attr-defined]
            if isinstance(value, str):
                return value

    return None


def process_file(file_path: str) -> str:
    """Convert a supported file to Markdown using MarkItDown and return the content.

    Args:
        file_path: Absolute or relative path to the input file.

    Returns:
        Markdown string produced by MarkItDown.

    Raises:
        FileNotFoundError: If the path does not exist or is not a file.
        ValueError: If the file extension is not supported.
        RuntimeError: If conversion does not yield Markdown text.
    """

    path = Path(file_path)

    if not path.exists() or not path.is_file():
        raise FileNotFoundError(f"Input path is not a file: {file_path}")

    ext = path.suffix.lower().lstrip(".")
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(
            f"Unsupported file type '.{ext}'. Supported: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

    converter = MarkItDown()
    conversion_result = converter.convert(str(path))

    markdown = _extract_markdown_from_result(conversion_result)
    if not isinstance(markdown, str) or markdown.strip() == "":
        raise RuntimeError("MarkItDown conversion did not return Markdown text")

    return markdown
