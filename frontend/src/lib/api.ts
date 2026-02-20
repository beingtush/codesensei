const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface FetchOptions {
  method?: string;
  body?: unknown;
  params?: Record<string, string | number>;
}

async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { method = "GET", body, params } = options;

  let url = `${API_BASE}${path}`;
  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, val] of Object.entries(params)) {
      searchParams.set(key, String(val));
    }
    url += `?${searchParams.toString()}`;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("codesensei_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || `API error: ${res.status}`);
  }

  return res.json();
}

function userId(): number {
  if (typeof window === "undefined") return 1;
  return Number(localStorage.getItem("codesensei_user_id") || "1");
}

// --- Auth ---
export function login(username: string, password: string) {
  return apiFetch<{ user_id: number; username: string; token: string }>(
    "/api/v1/auth/login",
    { method: "POST", body: { username, password } },
  );
}

export function register(username: string, email: string, password: string) {
  return apiFetch<{ user_id: number; username: string; token: string }>(
    "/api/v1/auth/register",
    { method: "POST", body: { username, email, password } },
  );
}

// --- Challenges ---
export function getDailyChallenges() {
  return apiFetch<DailyChallengesResponse>("/api/v1/challenges/daily");
}

export function getChallenge(id: number) {
  return apiFetch<ChallengeDetail>(`/api/v1/challenges/${id}`);
}

export function submitChallenge(
  id: number,
  answer: string,
  hintsUsed: number,
  timeTakenSeconds: number,
) {
  return apiFetch<EvaluationResponse>(`/api/v1/challenges/${id}/submit`, {
    method: "POST",
    body: {
      user_answer: answer,
      hints_used: hintsUsed,
      time_taken_seconds: timeTakenSeconds,
    },
  });
}

export function getHint(challengeId: number, currentHint: number) {
  return apiFetch<HintResponse>(`/api/v1/challenges/${challengeId}/hint`, {
    params: { current_hint: currentHint },
    method: "POST",
  });
}

// --- Progress ---
export function getOverview() {
  return apiFetch<ProgressOverview>("/api/v1/progress/overview", {
    params: { user_id: userId() },
  });
}

export function getStreak() {
  return apiFetch<StreakInfo>("/api/v1/progress/streak", {
    params: { user_id: userId() },
  });
}

export function getWeekly() {
  return apiFetch<WeeklyData>("/api/v1/progress/weekly", {
    params: { user_id: userId() },
  });
}

// --- Types matching backend schemas ---

export interface TestCase {
  input: string;
  expected: string;
}

/** Matches backend ChallengeResponse schema */
export interface ChallengeDetail {
  id: number;
  track_id: number;
  type: string;
  difficulty: number;
  title: string;
  description: string;
  hints: string[];
  test_cases: TestCase[];
  topics_covered: string[];
  estimated_minutes: number;
}

/** Matches backend DailyChallengesResponse */
export interface DailyChallengesResponse {
  challenges: ChallengeDetail[];
  total_count: number;
}

/** Matches backend HintResponse */
export interface HintResponse {
  challenge_id: number;
  hint_number: number;
  hint: string;
  hints_remaining: number;
}

/** Matches backend EvaluationResponse */
export interface EvaluationResponse {
  challenge_id: number;
  is_correct: boolean;
  correctness_pct: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  xp_earned: number;
  new_streak: number | null;
  new_level: number | null;
}

// Dashboard types (used by page.tsx with demo data)
export interface DailyChallenge {
  id: number;
  track: string;
  track_name: string;
  track_icon: string;
  track_color: string;
  title: string;
  type: string;
  difficulty: number;
  completed: boolean;
  is_correct: boolean | null;
  xp_earned: number | null;
}

export interface TrackInfo {
  track: string;
  track_name: string;
  track_icon: string;
  track_color: string;
  recommended_difficulty: number;
  user_level: number;
}

export interface TrackProgress {
  track: string;
  name: string;
  icon: string;
  level: number;
  xp: number;
  level_progress: {
    level: number;
    current_xp: number;
    xp_in_level: number;
    xp_for_next_level: number | null;
    xp_remaining: number;
    is_max_level: boolean;
  };
  challenges_completed: number;
  challenges_correct: number;
  accuracy: number;
}

export interface ProgressOverview {
  user_id: number;
  total_xp: number;
  overall_level: number;
  total_challenges_completed: number;
  total_challenges_correct: number;
  overall_accuracy: number;
  streak: StreakInfo;
  tracks: TrackProgress[];
}

export interface StreakInfo {
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  is_active_today: boolean;
  motivational_message: string;
}

export interface WeeklyDay {
  date: string;
  challenges_done: number;
  xp_earned: number;
  correct: number;
}

export interface WeeklyData {
  user_id: number;
  period: { from: string; to: string };
  days: WeeklyDay[];
  summary: {
    total_challenges: number;
    total_xp: number;
    active_days: number;
  };
}
