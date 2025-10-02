import re
from urllib.parse import urlparse, urljoin
import requests
from bs4 import BeautifulSoup
from github import Github
from youtube_transcript_api import YouTubeTranscriptApi
from markdownify import markdownify as md


def detect_url_type(url):
    if "github.com" in url:
        return "github"
    elif "youtube.com" in url:
        return "youtube"
    else:
        return "web"


def process_web_url(url, timeout=30):
    """
    Extract webpage HTML and convert to markdown.

    Args:
        url (str): The URL to process
        timeout (int): Request timeout in seconds

    Returns:
        str: Markdown content or error message
    """
    try:
        # Validate URL
        parsed = urlparse(url)
        if not parsed.scheme or not parsed.netloc:
            return "Error: Invalid URL format"

        # Get HTML content
        html_content = fetch_with_requests(url, timeout)

        if html_content.startswith("Error:"):
            return html_content

        # Convert HTML to markdown
        markdown = html_to_markdown(html_content, url)

        if not markdown or len(markdown.strip()) < 50:
            return "Error: Could not extract meaningful content from webpage"

        return markdown

    except Exception as e:
        return f"Error processing web URL: {type(e).__name__} - {str(e)}"


def fetch_with_requests(url, timeout=30):
    """Fetch HTML using requests with enhanced headers."""
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Connection": "keep-alive",
        }

        session = requests.Session()
        response = session.get(
            url, headers=headers, timeout=timeout, allow_redirects=True
        )
        response.raise_for_status()

        # Ensure proper encoding
        response.encoding = response.apparent_encoding or "utf-8"

        return response.text

    except requests.exceptions.RequestException as e:
        return f"Error: Request failed - {str(e)}"


def html_to_markdown(html, base_url=None):
    """Convert raw HTML to cleaned markdown."""
    try:
        soup = BeautifulSoup(html, "html.parser")

        # Remove scripts, styles, and noscript tags
        for tag in soup(["script", "style", "noscript"]):
            tag.extract()

        # Convert relative links to absolute
        if base_url:
            for a in soup.find_all("a", href=True):
                a["href"] = urljoin(base_url, a["href"])

        # Convert cleaned HTML to markdown
        markdown = md(str(soup), heading_style="ATX")
        return markdown.strip()

    except Exception as e:
        return f"Error: Markdown conversion failed - {str(e)}"


def get_repo_tree(repo, path="", depth=0, max_depth=2):
    """Recursively fetch repo contents up to max_depth and return as Markdown."""
    try:
        contents = repo.get_contents(path)
    except Exception:
        return ""

    tree_md = ""
    for content in contents:
        indent = "  " * depth
        tree_md += f"{indent}- {content.name}\n"
        if content.type == "dir" and depth < max_depth:
            tree_md += get_repo_tree(repo, content.path, depth + 1, max_depth)
    return tree_md


def process_github_url(url):
    try:
        # Extract user/repo
        parts = url.split("github.com/")[1].split("/")
        user, repo_name = parts[0], parts[1].replace(".git", "")

        g = Github()  # unauthenticated (60 req/hr)
        repo = g.get_repo(f"{user}/{repo_name}")

        markdown_output = f"# Repository: {user}/{repo_name}\n\n"
        markdown_output += f"**URL:** https://github.com/{user}/{repo_name}\n\n"
        markdown_output += (
            f"**Description:** {repo.description or '*No description*'}\n\n"
        )
        markdown_output += "---\n\n"

        # Add README
        try:
            readme = repo.get_readme()
            readme_content = readme.decoded_content.decode("utf-8")
            markdown_output += "## README\n\n"
            markdown_output += readme_content + "\n\n"
        except Exception:
            markdown_output += "## README\n\n*No README found*\n\n"

        # Add repo structure
        markdown_output += "## Repository Structure\n\n"
        markdown_output += get_repo_tree(repo)

        return markdown_output

    except IndexError:
        return "Error: Invalid GitHub URL format. Expected format: https://github.com/user/repo"
    except Exception as e:
        return f"Error processing GitHub URL: {e}"


def process_youtube_url(url):
    try:
        # Extract video ID
        video_id = None
        if "youtu.be" in url:
            video_id = url.split("/")[-1].split("?")[0]
        else:
            match = re.search(r"(?:v=|embed/)([\w-]+)", url)
            if match:
                video_id = match.group(1)

        if not video_id:
            return "Error: Could not extract video ID from URL"

        transcript = YouTubeTranscriptApi.get_transcript(video_id)

        markdown = f"# YouTube Transcript: {video_id}\n\n"
        markdown += f"**URL:** {url}\n\n"
        markdown += "---\n\n"
        markdown += "## Transcript\n\n"

        for t in transcript:
            timestamp = format_timestamp(t["start"])
            markdown += f"**[{timestamp}]** {t['text']}\n\n"

        return markdown
    except Exception as e:
        return f"Error processing YouTube URL: {e}\n\nNote: Make sure the video has captions/subtitles available."


def format_timestamp(seconds):
    """Convert seconds to MM:SS or HH:MM:SS format"""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)

    if hours > 0:
        return f"{hours:02d}:{minutes:02d}:{secs:02d}"
    else:
        return f"{minutes:02d}:{secs:02d}"


def url_to_markdown(url):
    url_type = detect_url_type(url)

    if url_type == "web":
        return process_web_url(url)
    elif url_type == "github":
        return process_github_url(url)
    elif url_type == "youtube":
        return process_youtube_url(url)
    else:
        raise ValueError("Unknown URL type")
