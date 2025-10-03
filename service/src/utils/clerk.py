import os
import httpx
import jwt
from jwt import PyJWKClient
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())


class ClerkHelper:
    def __init__(self):
        self.CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY")
        self.CLERK_JWKS_URL = os.getenv("CLERK_JWKS_URL")
        self.CLERK_ISSUER = os.getenv("CLERK_ISSUER")

    def validate_clerk_token(self, token: str, audience: str = None):
        try:
            jwks_client = PyJWKClient(self.CLERK_JWKS_URL)
            signing_key = jwks_client.get_signing_key_from_jwt(token)
            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=["RS256"],
                audience=audience,
                issuer=self.CLERK_ISSUER,
            )
            return payload
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid authentication credentials: {str(e)}",
            )

    def get_clerk_payload(
        self,
        credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer()),
    ):
        payload = self.validate_clerk_token(credentials.credentials)
        user_id = self.get_user_id(payload["sub"])
        return user_id

    def get_user_id(self, clerk_user_id: str):
        res = httpx.get(
            f"https://api.clerk.com/v1/users/{clerk_user_id}",
            headers={"Authorization": f"Bearer {self.CLERK_SECRET_KEY}"},
        )
        return res.json()["username"]
