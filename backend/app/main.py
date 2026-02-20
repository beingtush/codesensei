from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db
from app.routes import auth, challenges, debug, progress, tracks


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    yield
    # Shutdown
    pass


app = FastAPI(
    title=settings.app_name,
    debug=settings.debug,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(challenges.router)
app.include_router(debug.router)
app.include_router(tracks.router)
app.include_router(progress.router)


@app.get("/")
async def root():
    return {"message": "Welcome to CodeSensei API", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
