import json
import sys
from dataclasses import asdict

from app.services.game_master import GameMasterService


def main() -> int:
    count = int(sys.argv[1]) if len(sys.argv) > 1 else None
    report = GameMasterService().review_campaign(count=count)
    payload = {
        "passed": report.passed,
        "levels_reviewed": len(report.levels),
        "issues": [asdict(issue) for issue in report.issues],
        "levels": [asdict(level) for level in report.levels],
    }
    print(json.dumps(payload, indent=2))
    return 0 if report.passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
