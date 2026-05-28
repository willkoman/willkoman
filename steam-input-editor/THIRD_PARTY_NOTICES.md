# Third-party notices

Padsmith itself is MIT licensed. The project's research and parts of its
documentation were informed by community sources listed below. No source
code from these projects was copied into Padsmith — the VDF parser,
schema model, and UI are original work — but we owe acknowledgement.

## Authoritative format references

| Project                                                                               | License                                 | What we used                                            |
| ------------------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------- |
| [Valve Steamworks docs](https://partner.steamgames.com/doc/features/steam_controller) | Valve documentation (no redistribution) | Read for reference only. No text reproduced.            |
| [VDF/KeyValues format wiki](https://developer.valvesoftware.com/wiki/VDF)             | CC-BY-SA 3.0                            | Format grammar understanding. No verbatim reproduction. |

## Community references

| Project                                                                                   | License                        | What we used                                                                                                                                                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [SteamInputWiki on GitHub](https://github.com/SteamInputWiki/SteamInputWiki)              | Verify before quoting verbatim | Read all relevant chapters; used as the **most authoritative public reference** for input styles, activators, touch / radial / hotbar menus, action sets / layers, and modeshifts. Our internal docs (`docs/steam-input-schema.md`, `docs/touchpad-menus.md`) paraphrase concepts; any direct quotes are clearly attributed inline. |
| [Steam Input Wiki (Beta) — steaminput.wiki](https://steaminput.wiki/en/intro/steam-input) | Same as above                  | Same content, web deployment.                                                                                                                                                                                                                                                                                                       |

If you are a SteamInputWiki author and any wording in our docs feels too close
to yours, open an issue or PR — we'll rephrase or attribute as you prefer.

## Reference VDF fixtures used in tests

These configs are checked into `tests/vdf/fixtures/` to exercise the parser
against real-world data. They are public configs distributed by their authors
on GitHub. We include only the minimal subset needed for tests and do not
redistribute as templates.

| File                                | Source                                                                                          | Author     |
| ----------------------------------- | ----------------------------------------------------------------------------------------------- | ---------- |
| `tests/vdf/fixtures/gtav-v2.vdf`    | [GoldRenard/GTAVSteamControllerNative](https://github.com/GoldRenard/GTAVSteamControllerNative) | GoldRenard |
| `tests/vdf/fixtures/touch-menu.vdf` | Synthetic minimal example (original)                                                            | Padsmith   |
| `tests/vdf/fixtures/minimal.vdf`    | Synthetic minimal example (original)                                                            | Padsmith   |

## Other tools in the same space (we coexist, not copy)

| Project                                                           | License  | Relationship                                                                                                                                                                                               |
| ----------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [SteamInputDB (Alia5)](https://github.com/Alia5/steaminputdb.com) | AGPL-3.0 | A community database of configs. We do not import, scrape, or fork any code. If Padsmith ever offers an "import from SteamInputDB" feature, it will be opt-in, attributed, and discussed with Alia5 first. |
| [GloSC / GlosSI](https://github.com/Alia5/GlosSI)                 | GPL-3.0  | Steam Input launcher for non-Steam games. Unrelated.                                                                                                                                                       |
| [Decky Loader](https://github.com/SteamDeckHomebrew/decky-loader) | GPL-3.0  | Plugin loader. A Padsmith Decky plugin is on the roadmap (Phase 5); when written it will be its own GPL-3.0 repo separate from this MIT codebase.                                                          |

## Runtime dependencies

See `package.json` and `package-lock.json`. All runtime dependencies are
permissively licensed (MIT, ISC, Apache-2.0). A full `npm-license-checker`
report is run in CI before each release.
