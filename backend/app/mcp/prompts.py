def build_level_prompt(difficulty: float, theme: str | None = None) -> str:
    difficulty_label = _difficulty_label(difficulty)
    theme_hint = f" with a '{theme}' theme" if theme else ""

    return (
        f"Create a {difficulty_label} Frigi fridge-packing puzzle{theme_hint}.\n\n"
        "Requirements:\n"
        f"- Difficulty: {difficulty:.2f} (0.0 = easiest, 1.0 = hardest)\n"
        "- Grid: 3–10 rows × 3–10 cols. Use smaller grids for easy levels, larger for hard.\n"
        "- Items: 3–8 distinct food items with unique ids and unique names. "
        "Use recognizable real foods, not duplicates or slight variants of the same item. "
        "Each item should have a realistic shape (tetromino-like). "
        "Each shape is a 2D array of 0s and 1s.\n"
        "- Include at least 1 constraint for medium+ levels.\n"
        "- Ensure the puzzle is SOLVABLE — all items must fit in the grid.\n"
        "- Use varied zone types (standard, cold, frozen, shelf) for interesting gameplay.\n"
        "- Colors should be food-realistic hex codes.\n\n"
        "Call the create_level tool with your design."
    )


def _difficulty_label(d: float) -> str:
    if d < 0.3:
        return "easy"
    if d < 0.6:
        return "medium"
    if d < 0.8:
        return "hard"
    return "expert"
