import re
import os
from urllib.parse import urlparse, urljoin
import requests
from bs4 import BeautifulSoup
from github import Github
from youtube_transcript_api import YouTubeTranscriptApi
from markdownify import markdownify as md
import wikipedia
import tweepy
from dotenv import load_dotenv

load_dotenv()
BEARER_TOKEN = os.getenv("X_BEARER_TOKEN")


def detect_url_type(url):
    if "github.com" in url:
        return "github"
    elif "youtube.com" in url or "youtu.be" in url:
        return "youtube"
    elif "linkedin.com" in url:
        return "linkedin"
    elif "twitter.com" in url or "x.com" in url:
        return "x"
    elif "reddit.com" in url:
        return "reddit"
    elif "wikipedia.org" in url:
        return "wikipedia"
    else:
        return "web"
    

def process_linkedin_url(url):
    is_post = any(path in url for path in ["/posts/", "/feed/update/"])
    is_doc = any(path in url for path in ["/help/", "/business/"])

    if not is_post and is_doc:
        print(f"INFO: LinkedIn URL looks like documentation. Treating as web content.")
        return process_web_url(url)
    try:
        html = fetch_with_requests(url)
        if html.startswith("Error:"):
            return html

        soup = BeautifulSoup(html, "html.parser")

        title = soup.find("meta", property="og:title")
        desc = soup.find("meta", property="og:description")

        markdown = f"# LinkedIn Post\n\n**URL:** {url}\n\n---\n\n"
        markdown += f"**Title:** {title['content'] if title else '*No title*'}\n\n"
        markdown += f"**Content:** {desc['content'] if desc else '*No description*'}\n\n"
        return markdown

    except Exception as e:
        return f"Error processing LinkedIn URL: {e}"
    
def process_reddit_url(url: str) -> str:
    if "/comments/" not in url:
        print(f"INFO: Reddit URL is not a post (missing '/comments/'). Treating as web content.")
        return process_web_url(url)
    
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        
        # Try JSON API first (most reliable)
        json_url = url.rstrip('/') + '.json'
        try:
            resp = requests.get(json_url, headers=headers, timeout=10)
            resp.raise_for_status()
            data = resp.json()
            
            # Extract from JSON structure
            post_data = data[0]['data']['children'][0]['data']
            title = post_data.get('title', 'No title found')
            body = post_data.get('selftext', '')
            author = post_data.get('author', '')
            subreddit = post_data.get('subreddit', '')
            score = post_data.get('score', 0)
            
            # Format output
            result = [f"# {title}"]
            meta = []
            if author:
                meta.append(f"Posted by u/{author}")
            if subreddit:
                meta.append(f"in r/{subreddit}")
            if score:
                meta.append(f"({score} points)")
            if meta:
                result.append(" ".join(meta))
            
            result.append("")  # blank line
            result.append(body if body else "(No body text found)")
            
            return "\n".join(result)
            
        except (requests.RequestException, KeyError, IndexError, ValueError):
            # JSON fetch failed, try HTML scraping
            pass
        
        # Fallback to HTML scraping
        resp = requests.get(url, headers=headers, timeout=10)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "lxml")
        
        # Extract title
        title_tag = soup.find("h1")
        title = title_tag.get_text(strip=True) if title_tag else "No title found"
        
        # Extract body - try multiple selectors
        body = ""
        
        # New Reddit layout
        body_tag = soup.find("div", {"data-test-id": "post-content"})
        if body_tag:
            body = body_tag.get_text(separator="\n", strip=True)
        else:
            # Try shreddit-post element
            body_tag = soup.find("div", {"slot": "text-body"})
            if body_tag:
                body = body_tag.get_text(separator="\n", strip=True)
            else:
                # Old Reddit layout
                body_tag = soup.find("div", class_="expando")
                if body_tag:
                    body = body_tag.get_text(separator="\n", strip=True)
                else:
                    # Try usertext-body
                    body_tag = soup.find("div", class_="usertext-body")
                    if body_tag:
                        body = body_tag.get_text(separator="\n", strip=True)
        
        # Extract metadata
        author = ""
        author_tag = soup.find("a", href=lambda x: x and "/user/" in x)
        if author_tag:
            author = author_tag.get_text(strip=True)
        
        subreddit = ""
        sub_tag = soup.find("a", href=lambda x: x and x.startswith("/r/"))
        if sub_tag:
            subreddit = sub_tag.get_text(strip=True)
        
        # Format output
        result = [f"# {title}"]
        meta = []
        if author:
            meta.append(f"Posted by {author}")
        if subreddit:
            meta.append(f"in {subreddit}")
        if meta:
            result.append(" ".join(meta))
        
        result.append("")  # blank line
        result.append(body if body else "(No body text found)")
        
        return "\n".join(result)
        
    except requests.RequestException as e:
        return f"Error: Network request failed - {e}"
    except Exception as e:
        return f"Error: Failed to extract Reddit post - {e}"

def process_wikipedia_url(url):
    """
    Extract full content from a Wikipedia URL using the dedicated 'wikipedia' library.
    This is much more reliable than using the REST API /summary endpoint.
    """
    try:
        parsed = urlparse(url)
        # Decode the URL path to get the actual title (e.g., handles spaces/underscores)
        # We unquote the last part of the path (the title)
        title = requests.utils.unquote(parsed.path.split("/")[-1]) 

        # Retrieve the page content using the wikipedia library
        # auto_suggest=False prevents correcting the title if it's slightly wrong, 
        # which is usually what we want when the URL is given directly.
        page = wikipedia.page(title, auto_suggest=False, redirect=True)

        markdown = f"# Wikipedia: {page.title}\n\n"
        markdown += f"**URL:** {url}\n\n"
        markdown += f"**Summary:** {page.summary}\n\n"
        markdown += "---\n\n"
        # Extract full content (plain text)
        markdown += "## Full Content\n\n"
        markdown += page.content 
        
        return markdown

    except wikipedia.exceptions.PageError:
        return f"Error: Wikipedia page '{title}' not found."
    except Exception as e:
        return f"Error processing Wikipedia URL: {type(e).__name__} - {e}"
    
def process_x_url(url):
    if "/status/" not in url:
        print(f"INFO: X URL is not a post (missing '/status/'). Treating as web content.")
        return process_web_url(url)
    
    if not BEARER_TOKEN:
        return "Error: X API key not found. Ensure 'BEARER_TOKEN' is set in your .env file and loaded correctly."
        
    # 1. Extract the Tweet/Post ID
    # Handles both x.com and twitter.com URLs
    tweet_id_match = re.search(r"/status/(\d+)", url)
    if not tweet_id_match:
        return "Error: Could not extract X post ID. Ensure the URL is for a specific post (e.g., /status/12345)."

    tweet_id = tweet_id_match.group(1)

    try:
        # 2. Initialize the Tweepy Client
        client = tweepy.Client(BEARER_TOKEN)
        
        # 3. Fetch Tweet Data (V2 API)
        response = client.get_tweet(
            id=tweet_id,
            # Request necessary fields
            tweet_fields=["created_at", "public_metrics"],
            expansions=["author_id"],
            user_fields=["username", "name"]
        )

        if not response.data:
            return f"Error: X post (ID: {tweet_id}) not found, is private, or has been deleted."

        tweet = response.data
        author = response.includes.get('users', [None])[0] if response.includes else None

        # 4. Extract and Format Data
        text = tweet.text
        author_name = author.name if author else 'Unknown User'
        author_username = author.username if author else 'N/A'
        created_at = tweet.created_at.strftime("%Y-%m-%d %H:%M:%S") if tweet.created_at else 'N/A'
        
        metrics = tweet.public_metrics
        likes = metrics.get('like_count', 0)
        reposts = metrics.get('retweet_count', 0)
        quotes = metrics.get('quote_count', 0)
        views = metrics.get('impression_count', 0)

        # 5. Format the Output into Markdown
        markdown = f"# X Post (Tweet ID: {tweet_id})\n\n"
        markdown += f"**URL:** {url}\n\n"
        markdown += f"**Author:** {author_name} (@{author_username})\n"
        markdown += f"**Posted:** {created_at}\n"
        # Using formatted numbers for readability
        markdown += f"**Metrics:** {likes:,} Likes, {reposts:,} Reposts, {quotes:,} Quotes, {views:,} Views\n\n"
        markdown += "---\n\n"
        markdown += text
        
        return markdown

    except tweepy.errors.NotFound:
        return f"Error: X post (ID: {tweet_id}) not found or may have been deleted."
    except Exception as e:
        return f"Error accessing X API: {type(e).__name__} - {e}. Check your Bearer Token."

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
    elif url_type == "linkedin":
        return process_linkedin_url(url)
    elif url_type == "x":
        return process_x_url(url)
    elif url_type == "reddit":
        return process_reddit_url(url)
    elif url_type == "wikipedia":
        return process_wikipedia_url(url)
    else:
        raise ValueError("Unknown URL type")
    
if __name__ == "__main__":
    url = input("Enter a URL: ").strip()
    try:
        content = url_to_markdown(url)  # your dispatcher function
        print("\n--- Extracted Content ---\n")
        print(content[:1000])  # print first 1000 chars for readability
    except Exception as e:
        print(f"Error: {e}")

