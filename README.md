# DOG1

A fictional global-grid tabletop simulation with continuous routes, relative speed and distance, fuel stops, allegiances, and position/power rules for synthetic tokens.

[Watch DOG1.mp4](media/DOG1.mp4) · [Model notes](docs/dog1.md)

## Run

Node.js 20 or newer is required. No npm dependencies are needed.

```sh
npm start
```

Open <http://localhost:8000>. Select **Run DOG1**, inspect any address from **A1 to AP32**, adjust speed allocation, and edit each unit's abstract power points.

- **A-cells:** area cells without an identified active token.
- **T-cells:** cells containing identified active synthetic tokens.
- **F1–F3:** fictional allegiances. Plateau terrain does not determine opposition.
- **N1–N7:** route nodes. Four provide time-based refuelling after physical arrival.

An identified T-token clears when an opposing unit is within one tile and has enough game power points. Neutralization removes a game marker. The scores and visibility rules have no real-world weapon or sensor interpretation.

Travel remains continuous across the AP/A map seam. Units consume fuel for distance travelled, stop to refuel, and remain in place if fuel is exhausted. Relative speeds and leg distances are shown in grid units. The map is an invented periodic world rather than an Earth map.

## Verify and reproduce

```sh
npm test
```

To render the 60-second, 1080p demonstration, install Python packages from `requirements.txt` and make FFmpeg available:

```sh
python -m pip install -r requirements.txt
python scripts/render_dog1_video.py
```

The default run leaves T5 active because its allegiance and defense prevent a valid interaction. The video explicitly changes M1's power from four to six at step 120, then waits until its route brings it into position. The [video manifest](media/DOG1-video.json) records the scenario, allocation, notification events and final state.

## License

Apache License 2.0. The repository's original [LICENSE](LICENSE) is preserved.
