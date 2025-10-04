import logging
import os
import re
from pathlib import Path

logging.basicConfig(level=logging.INFO)

from mcp.server.fastmcp import FastMCP

mcp = FastMCP("local_tools")

BASE_DIR = Path(__file__).resolve().parents[2] / "uploads"

def get_user_dir() -> Path:
    """Get the user's directory based on USER_ID and SUBDIRECTORY environment variables.
    
    Returns:
        Path to user's directory: uploads/<user_id>/processed/<subdirectory>/
    """
    user_id = os.getenv("USER_ID")
    if not user_id:
        raise ValueError("USER_ID environment variable is not set")
    
    subdirectory = os.getenv("SUBDIRECTORY")
    if not subdirectory:
        raise ValueError("SUBDIRECTORY environment variable is not set")
    
    user_dir = BASE_DIR / user_id / "processed" / subdirectory
    
    return user_dir


def validate_path(user_dir: Path, rel_path: str) -> Path:
    """Validate that a relative path resolves within the user's directory."""
    full_path = (user_dir / rel_path).resolve()
    user_dir_resolved = user_dir.resolve()
    if not str(full_path).startswith(str(user_dir_resolved)):
        raise ValueError(f"Access denied: path '{rel_path}' is outside user directory")
    return full_path


@mcp.tool()
def read_file(file_path: str) -> str:
    """Read and return the contents of a file.
    
    Args:
        file_path: Relative path to the file.
        
    Returns:
        The contents of the file as a string.
    """
    user_dir = get_user_dir()
    full_path = validate_path(user_dir, file_path)
    
    if not full_path.exists():
        raise FileNotFoundError(f"File '{file_path}' not found")
    
    if not full_path.is_file():
        raise ValueError(f"'{file_path}' is not a file")
    
    try:
        with open(full_path, 'r', encoding='utf-8') as f:
            return f.read()
    except UnicodeDecodeError:
        raise ValueError(f"'{file_path}' is not a text file or uses unsupported encoding")


@mcp.tool()
def list_file(directory_path: str = "") -> str:
    """List files and directories in the specified directory.
    
    Args:
        directory_path: Relative path to directory (empty string for root directory)

    Returns:
        Formatted listing of files and directories with [DIR] or [FILE] indicators
    """
    user_dir = get_user_dir()
    full_path = validate_path(user_dir, directory_path)
    
    if not full_path.exists():
        raise FileNotFoundError(f"Directory '{directory_path or '.'}' not found")
    
    if not full_path.is_dir():
        raise ValueError(f"'{directory_path}' is not a directory")
    
    items = []
    for item in sorted(full_path.iterdir()):
        if item.is_dir():
            items.append(f"[DIR]  {item.name}")
        else:
            items.append(f"[FILE] {item.name}")
    
    if not items:
        return f"Directory '{directory_path or '.'}' is empty"
    
    return "\n".join(items)


@mcp.tool()
def grep(pattern: str, file_path: str | None = None) -> str:
    """Search for a regex pattern in files.
    
    Args:
        pattern: Regular expression pattern to search for.
        file_path: Optional relative path to a specific file. If None, searches all files recursively.
        
    Returns:
        Matching lines in format 'filename:line_number:line_content' (max 100 matches)
    """
    try:
        regex = re.compile(pattern)
    except re.error as e:
        raise ValueError(f"Invalid regex pattern: {str(e)}")
    
    user_dir = get_user_dir()
    matches = []
    max_matches = 100
    
    if file_path:
        full_path = validate_path(user_dir, file_path)
        
        if not full_path.exists():
            raise FileNotFoundError(f"File '{file_path}' not found")
        
        if not full_path.is_file():
            raise ValueError(f"'{file_path}' is not a file")
        
        matches = _search_file(full_path, regex, file_path, max_matches)
    else:
        user_dir_resolved = user_dir.resolve()
        
        if not user_dir_resolved.exists():
            raise FileNotFoundError(f"User directory does not exist. Please create it first.")
        
        for file in user_dir_resolved.rglob("*"):
            if file.is_file():
                rel_path = file.relative_to(user_dir_resolved)
                file_matches = _search_file(file, regex, str(rel_path), max_matches - len(matches))
                matches.extend(file_matches)
                
                if len(matches) >= max_matches:
                    break
    
    if not matches:
        return f"No matches found for pattern: {pattern}"
    
    result = "\n".join(matches)
    if len(matches) >= max_matches:
        result += f"\n\n(Showing first {max_matches} matches)"
    
    return result


def _search_file(file_path: Path, regex: re.Pattern, display_name: str, max_matches: int) -> list[str]:
    """Helper function to search for pattern in a single file."""
    matches = []
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            for line_num, line in enumerate(f, 1):
                if regex.search(line):
                    matches.append(f"{display_name}:{line_num}:{line.rstrip()}")
                    
                    if len(matches) >= max_matches:
                        break
    except UnicodeDecodeError:
        pass
    except PermissionError:
        pass
    
    return matches


if __name__ == "__main__":
    mcp.run(transport="stdio")
