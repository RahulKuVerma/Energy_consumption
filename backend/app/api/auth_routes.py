from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from backend.app.core.auth import create_access_token, get_current_user, hash_password, verify_password
from backend.app.core.database import get_db_connection

router = APIRouter()


class Credentials(BaseModel):
    username: str = Field(min_length=3, max_length=64)
    password: str = Field(min_length=8, max_length=128)


@router.post("/register")
def register(payload: Credentials):
    username = payload.username.strip()
    if not username:
        raise HTTPException(status_code=400, detail="Username cannot be blank")
    with get_db_connection() as conn:
        try:
            cursor = conn.execute(
                "INSERT INTO users (username, password_hash, role) VALUES (?, ?, 'user')",
                (username, hash_password(payload.password)),
            )
        except Exception as exc:
            if "UNIQUE" in str(exc).upper():
                raise HTTPException(status_code=409, detail="Username is already registered")
            raise
        user = {"id": cursor.lastrowid, "username": username, "role": "user"}
    return {"access_token": create_access_token(user), "token_type": "bearer", "user": user}


@router.post("/login")
def login(payload: Credentials):
    with get_db_connection() as conn:
        user = conn.execute(
            "SELECT id, username, password_hash, role FROM users WHERE username = ?",
            (payload.username.strip(),),
        ).fetchone()
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    public_user = {"id": user["id"], "username": user["username"], "role": user["role"]}
    return {"access_token": create_access_token(public_user), "token_type": "bearer", "user": public_user}


@router.get("/me")
def read_current_user(user=Depends(get_current_user)):
    return user