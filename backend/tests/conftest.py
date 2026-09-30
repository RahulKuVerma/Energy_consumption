import sys
from pathlib import Path

# Add project root to sys.path for test discovery
REPO_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(REPO_ROOT))
