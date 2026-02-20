"""HTTP client for communicating with the CodeSensei backend."""

from typing import Any

import httpx

from codesensei_cli.config import get_api_url, get_token, get_user_id


class APIError(Exception):
    """Raised when the API returns an error."""

    def __init__(self, status_code: int, detail: str):
        self.status_code = status_code
        self.detail = detail
        super().__init__(f"API error {status_code}: {detail}")


class APIClient:
    """Synchronous HTTP client for the CodeSensei API."""

    def __init__(self) -> None:
        self.base_url = get_api_url()
        self.timeout = 30.0

    @property
    def _headers(self) -> dict[str, str]:
        headers: dict[str, str] = {"Content-Type": "application/json"}
        token = get_token()
        if token:
            headers["Authorization"] = f"Bearer {token}"
        return headers

    @property
    def _user_id(self) -> int:
        uid = get_user_id()
        if uid is None:
            raise APIError(401, "Not logged in. Run: codesensei login")
        return uid

    def _request(
        self,
        method: str,
        path: str,
        params: dict[str, Any] | None = None,
        json_body: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Make an HTTP request and return the JSON response."""
        url = f"{self.base_url}{path}"
        with httpx.Client(timeout=self.timeout) as client:
            response = client.request(
                method,
                url,
                headers=self._headers,
                params=params,
                json=json_body,
            )

        if response.status_code >= 400:
            try:
                detail = response.json().get("detail", response.text)
            except Exception:
                detail = response.text
            raise APIError(response.status_code, detail)

        return response.json()

    # --- Auth ---

    def login(self, username: str, password: str) -> dict:
        return self._request("POST", "/api/v1/auth/login", json_body={
            "username": username,
            "password": password,
        })

    def register(self, username: str, email: str, password: str) -> dict:
        return self._request("POST", "/api/v1/auth/register", json_body={
            "username": username,
            "email": email,
            "password": password,
        })

    # --- Challenges ---

    def get_daily(self) -> dict:
        return self._request("GET", "/api/v1/challenges/daily", params={
            "user_id": self._user_id,
        })

    def get_challenge(self, challenge_id: int) -> dict:
        return self._request("GET", f"/api/v1/challenges/{challenge_id}")

    def submit_challenge(
        self,
        challenge_id: int,
        answer: str,
        hints_used: int = 0,
        time_taken: int = 0,
    ) -> dict:
        return self._request(
            "POST",
            f"/api/v1/challenges/{challenge_id}/submit",
            params={"user_id": self._user_id},
            json_body={
                "user_answer": answer,
                "hints_used": hints_used,
                "time_taken_seconds": time_taken,
            },
        )

    def get_hint(self, challenge_id: int, hint_number: int = 1) -> dict:
        return self._request(
            "GET",
            f"/api/v1/challenges/{challenge_id}/hint",
            params={"hint_number": hint_number},
        )

    def generate_challenge(
        self,
        track_slug: str,
        challenge_type: str | None = None,
        specific_topic: str | None = None,
    ) -> dict:
        body: dict[str, Any] = {"track_slug": track_slug}
        if challenge_type:
            body["challenge_type"] = challenge_type
        if specific_topic:
            body["specific_topic"] = specific_topic
        return self._request(
            "POST",
            "/api/v1/challenges/generate",
            params={"user_id": self._user_id},
            json_body=body,
        )

    def get_review(self) -> dict:
        return self._request("GET", "/api/v1/challenges/review/random", params={
            "user_id": self._user_id,
        })

    # --- Progress ---

    def get_overview(self) -> dict:
        return self._request("GET", "/api/v1/progress/overview", params={
            "user_id": self._user_id,
        })

    def get_streak(self) -> dict:
        return self._request("GET", "/api/v1/progress/streak", params={
            "user_id": self._user_id,
        })

    def get_track_progress(self, slug: str) -> dict:
        return self._request("GET", f"/api/v1/progress/track/{slug}", params={
            "user_id": self._user_id,
        })

    def get_weekly(self) -> dict:
        return self._request("GET", "/api/v1/progress/weekly", params={
            "user_id": self._user_id,
        })


# Singleton
api = APIClient()
