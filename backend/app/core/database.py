import sqlite3
import os
from pathlib import Path
from contextlib import contextmanager
from typing import Generator

# Resilient import handling depending on execution working directory
try:
    from app.core.config import settings
except ImportError:
    from backend.app.core.config import settings


def dict_factory(cursor, row):
    """Converts SQLite tuple rows into standard Python dictionaries."""
    d = {}
    for idx, col in enumerate(cursor.description):
        d[col[0]] = row[idx]
    return d


@contextmanager
def get_db_connection() -> Generator[sqlite3.Connection, None, None]:
    """Context manager for SQLite database connection returning dictionary rows."""
    conn = sqlite3.connect(
        str(settings.DATABASE_PATH),
        timeout=30.0
    )
    conn.row_factory = dict_factory
    conn.execute("PRAGMA foreign_keys = ON;")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def get_db():
    """FastAPI dependency helper for database injection in API routes."""
    with get_db_connection() as conn:
        yield conn


def init_db(force: bool = False):
    """Initializes the database using schema.sql and seed.sql if not exists or if forced."""
    db_file = settings.DATABASE_PATH
    db_file.parent.mkdir(parents=True, exist_ok=True)
    db_exists = db_file.exists() and db_file.stat().st_size > 0

    schema_file = settings.DATABASE_PATH.parent / "schema.sql"
    seed_file = settings.DATABASE_PATH.parent / "seed.sql"

    if not db_exists or force:
        with sqlite3.connect(str(db_file)) as conn:
            conn.execute("PRAGMA foreign_keys = ON;")
            if schema_file.exists():
                with open(schema_file, "r", encoding="utf-8") as f:
                    conn.executescript(f.read())
            if seed_file.exists():
                with open(seed_file, "r", encoding="utf-8") as f:
                    conn.executescript(f.read())
            conn.commit()

    with sqlite3.connect(str(db_file)) as conn:
        conn.execute("PRAGMA foreign_keys = ON;")
        if schema_file.exists():
            with open(schema_file, "r", encoding="utf-8") as f:
                conn.executescript(f.read())
        table_columns = {
            table: {row[1] for row in conn.execute(f"PRAGMA table_info({table})")}
            for table in ("datasets", "ml_models")
        }
        if "owner_id" not in table_columns["datasets"]:
            conn.execute("ALTER TABLE datasets ADD COLUMN owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL")
        if "is_published" not in table_columns["ml_models"]:
            conn.execute("ALTER TABLE ml_models ADD COLUMN is_published BOOLEAN DEFAULT 0")

        admin_username = os.getenv("ADMIN_USERNAME", "admin")
        admin_password = os.getenv("ADMIN_PASSWORD", "admin123")
        exists = conn.execute("SELECT 1 FROM users WHERE username = ?", (admin_username,)).fetchone()
        if not exists:
            from backend.app.core.auth import hash_password
            conn.execute(
                "INSERT INTO users (username, password_hash, role) VALUES (?, ?, 'admin')",
                (admin_username, hash_password(admin_password)),
            )
        conn.commit()