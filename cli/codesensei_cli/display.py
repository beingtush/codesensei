"""Rich display helpers for beautiful terminal output."""

from rich.columns import Columns
from rich.console import Console
from rich.markdown import Markdown
from rich.panel import Panel
from rich.progress import BarColumn, Progress, TextColumn
from rich.table import Table
from rich.text import Text

console = Console()

# Track colors
TRACK_COLORS: dict[str, str] = {
    "python-advanced": "green",
    "java-enterprise": "bright_red",
    "dsa-mastery": "cyan",
    "automation-devops": "magenta",
}

# Challenge type icons
TYPE_ICONS: dict[str, str] = {
    "code": "\U0001f9e9",       # puzzle piece
    "quiz": "\U0001f914",       # thinking face
    "bughunt": "\U0001f41b",    # bug
    "design": "\U0001f3d7\ufe0f",  # building construction
    "speedround": "\u26a1",     # lightning
}

# Difficulty stars
def difficulty_stars(level: int) -> str:
    """Return colored star string for difficulty."""
    filled = "\u2605" * level
    empty = "\u2606" * (5 - level)
    return filled + empty


def track_color(slug: str) -> str:
    """Get color for a track slug."""
    return TRACK_COLORS.get(slug, "white")


def type_icon(challenge_type: str) -> str:
    """Get emoji icon for a challenge type."""
    return TYPE_ICONS.get(challenge_type, "\U0001f4dd")


def print_welcome(username: str) -> None:
    """Print a welcome banner."""
    console.print(Panel(
        f"[bold]Welcome back, [cyan]{username}[/cyan]![/bold]\n"
        "Ready to level up today?",
        title="[bold yellow]\u2694\ufe0f CodeSensei[/bold yellow]",
        border_style="yellow",
    ))


def print_daily_table(challenges: list[dict]) -> None:
    """Print today's challenges as a beautiful table."""
    table = Table(
        title="\U0001f4c5 Today's Challenges",
        show_header=True,
        header_style="bold white",
        border_style="bright_black",
    )
    table.add_column("ID", style="dim", width=5)
    table.add_column("Track", width=20)
    table.add_column("Title", width=35)
    table.add_column("Type", width=10)
    table.add_column("Difficulty", width=12)
    table.add_column("Status", width=10)

    for c in challenges:
        color = track_color(c.get("track", ""))
        icon = type_icon(c.get("type", ""))
        stars = difficulty_stars(c.get("difficulty", 1))

        if c.get("completed"):
            if c.get("is_correct"):
                status = "[green]\u2713 Done[/green]"
            else:
                status = "[red]\u2717 Failed[/red]"
        else:
            status = "[yellow]\u25cb Open[/yellow]"

        table.add_row(
            str(c.get("id", "")),
            f"[{color}]{c.get('track_icon', '')} {c.get('track_name', '')}[/{color}]",
            c.get("title", ""),
            f"{icon} {c.get('type', '')}",
            f"[yellow]{stars}[/yellow]",
            status,
        )

    console.print(table)


def print_challenge_detail(challenge: dict) -> None:
    """Print a challenge in a beautiful panel with markdown."""
    color = track_color(challenge.get("track", ""))
    icon = type_icon(challenge.get("type", ""))
    stars = difficulty_stars(challenge.get("difficulty", 1))

    header = (
        f"{icon} [bold]{challenge.get('title', 'Challenge')}[/bold]\n"
        f"[{color}]{challenge.get('track_name', '')}[/{color}] | "
        f"Difficulty: [yellow]{stars}[/yellow] | "
        f"Type: {challenge.get('type', '')}"
    )

    console.print(Panel(
        header,
        border_style=color,
    ))
    console.print()

    # Render description as markdown
    desc = challenge.get("description", "")
    console.print(Markdown(desc))
    console.print()


def print_submission_result(result: dict) -> None:
    """Print submission result with color coding."""
    is_correct = result.get("is_correct", False)
    xp = result.get("xp_earned", 0)
    streak = result.get("current_streak", 0)

    if is_correct:
        border = "green"
        title = "\u2705 Correct!"
        msg = f"[bold green]Great job![/bold green] You nailed it."
    else:
        border = "red"
        title = "\u274c Not quite"
        msg = "[bold red]Keep practicing![/bold red] Review the solution below."

    panel_content = f"{msg}\n\n"
    panel_content += f"[bold]XP Earned:[/bold] [yellow]+{xp} XP[/yellow]\n"
    panel_content += f"[bold]Streak:[/bold] \U0001f525 {streak} days\n"
    panel_content += f"[bold]Track Level:[/bold] Lv.{result.get('track_level', 1)}\n"

    if not is_correct:
        panel_content += f"\n[dim]Solution:[/dim]\n{result.get('solution', '')}"

    console.print(Panel(panel_content, title=title, border_style=border))

    # XP progress bar animation
    if xp > 0:
        console.print()
        with Progress(
            TextColumn("[bold yellow]XP"),
            BarColumn(bar_width=40, complete_style="yellow", finished_style="green"),
            TextColumn(f"+{xp}"),
            console=console,
            transient=True,
        ) as progress:
            task = progress.add_task("xp", total=xp)
            import time
            for i in range(xp):
                time.sleep(max(0.01, 0.5 / xp))
                progress.advance(task)
        console.print(f"  [bold yellow]+{xp} XP earned![/bold yellow]")


def print_hint(hint_data: dict) -> None:
    """Print a hint in a styled panel."""
    hint_num = hint_data.get("hint_number", 1)
    remaining = hint_data.get("hints_remaining", 0)
    hint_text = hint_data.get("hint", "")

    console.print(Panel(
        f"[bold]{hint_text}[/bold]\n\n"
        f"[dim]Hints remaining: {remaining}[/dim]",
        title=f"\U0001f4a1 Hint #{hint_num}",
        border_style="yellow",
    ))


def print_stats(overview: dict, weekly: dict) -> None:
    """Print full stats overview with tables and progress bars."""
    # Header
    streak = overview.get("streak", {})
    streak_count = streak.get("current_streak", 0)
    streak_msg = streak.get("motivational_message", "")

    console.print(Panel(
        f"[bold]\U0001f525 Streak: {streak_count} days[/bold]\n"
        f"[italic]{streak_msg}[/italic]\n\n"
        f"[bold]Total XP:[/bold] [yellow]{overview.get('total_xp', 0):,}[/yellow] | "
        f"[bold]Overall Level:[/bold] Lv.{overview.get('overall_level', 1)} | "
        f"[bold]Accuracy:[/bold] {overview.get('overall_accuracy', 0)}%",
        title=f"[bold cyan]\U0001f4ca {overview.get('user_id', '')} Stats[/bold cyan]",
        border_style="cyan",
    ))

    # Per-track table
    tracks = overview.get("tracks", [])
    if tracks:
        table = Table(
            title="\U0001f3af Track Progress",
            show_header=True,
            header_style="bold white",
            border_style="bright_black",
        )
        table.add_column("Track", width=22)
        table.add_column("Level", width=8, justify="center")
        table.add_column("XP", width=10, justify="right")
        table.add_column("Progress", width=25)
        table.add_column("Accuracy", width=10, justify="center")
        table.add_column("Done", width=6, justify="center")

        for t in tracks:
            color = track_color(t.get("track", ""))
            lp = t.get("level_progress", {})
            xp_in = lp.get("xp_in_level", 0)
            xp_needed = lp.get("xp_for_next_level") or 1

            # Simple ASCII progress bar
            bar_len = 20
            filled = int(bar_len * xp_in / xp_needed) if xp_needed else bar_len
            bar = f"[{color}]{'█' * filled}{'░' * (bar_len - filled)}[/{color}]"

            table.add_row(
                f"[{color}]{t.get('icon', '')} {t.get('name', '')}[/{color}]",
                f"Lv.{t.get('level', 1)}",
                f"{t.get('xp', 0):,}",
                f"{bar} {xp_in}/{xp_needed}",
                f"{t.get('accuracy', 0)}%",
                str(t.get("challenges_completed", 0)),
            )

        console.print(table)

    # Weekly activity
    days = weekly.get("days", [])
    summary = weekly.get("summary", {})
    if days:
        console.print()
        week_table = Table(
            title="\U0001f4c6 This Week",
            show_header=True,
            header_style="bold white",
            border_style="bright_black",
        )
        week_table.add_column("Date", width=12)
        week_table.add_column("Challenges", width=12, justify="center")
        week_table.add_column("XP", width=10, justify="right")
        week_table.add_column("Activity", width=20)

        for d in days:
            count = d.get("challenges_done", 0)
            bar = "\U0001f7e9" * min(count, 10) if count > 0 else "[dim]\u2500[/dim]"
            week_table.add_row(
                d.get("date", ""),
                str(count),
                f"+{d.get('xp_earned', 0)}",
                bar,
            )

        week_table.add_section()
        week_table.add_row(
            "[bold]Total[/bold]",
            f"[bold]{summary.get('total_challenges', 0)}[/bold]",
            f"[bold yellow]+{summary.get('total_xp', 0)}[/bold yellow]",
            f"[bold]{summary.get('active_days', 0)}/7 days[/bold]",
        )
        console.print(week_table)


def print_review_challenge(challenge: dict) -> None:
    """Print a review challenge with the solution visible."""
    color = track_color(challenge.get("track", ""))
    icon = type_icon(challenge.get("type", ""))
    stars = difficulty_stars(challenge.get("difficulty", 1))

    console.print(Panel(
        f"{icon} [bold]{challenge.get('title', 'Review')}[/bold]\n"
        f"[{color}]{challenge.get('track_name', '')}[/{color}] | "
        f"Difficulty: [yellow]{stars}[/yellow]",
        title="\U0001f501 Review Challenge",
        border_style="yellow",
    ))
    console.print()
    console.print(Markdown(challenge.get("description", "")))
    console.print()

    # Show hints
    hints = challenge.get("hints", [])
    if hints:
        for i, hint in enumerate(hints, 1):
            console.print(f"  \U0001f4a1 [dim]Hint {i}:[/dim] {hint}")
        console.print()

    # Show solution
    console.print(Panel(
        challenge.get("solution", ""),
        title="\u2705 Solution",
        border_style="green",
    ))


def print_error(message: str) -> None:
    """Print an error message."""
    console.print(f"[bold red]\u2717 Error:[/bold red] {message}")


def print_success(message: str) -> None:
    """Print a success message."""
    console.print(f"[bold green]\u2713[/bold green] {message}")


def print_info(message: str) -> None:
    """Print an info message."""
    console.print(f"[bold blue]\u2139[/bold blue] {message}")
