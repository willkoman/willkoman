# References

All sources consulted during research, with what we used them for.

## Authoritative / primary

- [Steam Input — Steamworks docs (root)](https://partner.steamgames.com/doc/features/steam_controller) — top-level concept index.
- [In-Game Actions File](https://partner.steamgames.com/doc/features/steam_controller/iga_file) — IGA / SIAPI format for game-side action declarations.
- [Touch Menus — Steamworks docs](https://partner.steamgames.com/doc/features/steam_controller/touch_menus) — slot counts, custom icons, activation styles.
- [Radial Menus — Steamworks docs](https://partner.steamgames.com/doc/features/steam_controller/radial_menus) — up to 20 slots, nested menus, dev integration.
- [Activators — Steamworks docs](https://partner.steamgames.com/doc/features/steam_controller/activators) — Full_Press / Long_Press / Double_Tap.
- [Browsing Configurations — Steamworks docs](https://partner.steamgames.com/doc/features/steam_controller/browse_configs) — file locations.
- [Steam Input Gamepad Emulation — Best Practices](https://partner.steamgames.com/doc/features/steam_controller/steam_input_gamepad_emulation_bestpractices) — design guidance.
- [ISteamInput Interface](https://partner.steamgames.com/doc/api/isteaminput) — runtime API surface.
- [VDF / KeyValues spec — Valve Developer Wiki](https://developer.valvesoftware.com/wiki/VDF) — file format grammar.

## Community-authored (high signal)

- [SteamInputWiki on GitHub](https://github.com/SteamInputWiki/SteamInputWiki) — the best public reference, written by experienced Steam Input community members.
  - Chapter 2 — Input Styles (touch menu, radial menu, etc.)
  - Chapter 3 — Buttons & Bindings
  - Chapter 4 — Sets, Layers, Modeshifts
  - Chapter 7 — Non-Steam games, Retroarch
- [Steam Input Wiki (Beta) — steaminput.wiki](https://steaminput.wiki/en/intro/steam-input) — same project, web-deployed.
- ["Editing .vdf steam controller files" — Steam Community guide](https://steamcommunity.com/sharedfiles/filedetails/?id=932405100) — the original community VDF-editing guide.

## Reference VDF files studied

- [GoldRenard / GTAVSteamControllerNative — controller.vdf](https://github.com/GoldRenard/GTAVSteamControllerNative/blob/master/controller.vdf) — full v2 example, used as `tests/vdf/fixtures/gtav-v2.vdf`.
- [jsantorek / steamdeck-gw2-layout — controller_neptune.vdf](https://github.com/jsantorek/steamdeck-gw2-layout/blob/main/controller_neptune.vdf) — v3 Steam Deck example.
- [RetroDECK controller config](https://repo.retrodeck.net/Xargon/RetroDECK/raw/commit/fd56f985f16f6b22933fad3121a408573be133c5/emu-configs/defaults/retrodeck/RetroDECK_controller_config.vdf) — v3 multi-action-set example.

## Existing tools (what's already out there)

- [SteamInputDB — steaminputdb.com](https://www.steaminputdb.com/) — community config search/browse, Steam API backed.
- [SteamInputDB on GitHub (Alia5)](https://github.com/Alia5/steaminputdb.com) — open source, Go backend + Svelte frontend.
- [Steam Input Configurator — ArchWiki](https://wiki.archlinux.org/title/Steam_Input_Configurator) — Linux specifics.
- [bobplant / steam-vdf-parser](https://github.com/bobplant/steam-vdf-parser) — Python VDF parser, not used (we built our own TS one).

## Steam Deck specific

- [Steam Deck file path discussion](https://steamcommunity.com/app/1675200/discussions/0/3269059787429101199/) — `userdata/.../controller_config/` confirmation.
- [steam-deck-tools / steam-controller.md](https://github.com/ayufan/steam-deck-tools/blob/main/docs/steam-controller.md) — Deck integration notes.

## Tooling / inspiration

- [The Steam Controller Configurator's Untapped Power — Gamasutra](https://www.gamedeveloper.com/design/the-steam-controller-configurator-s-untapped-power) — the canonical "Steam Input is too good to leave in this UI" essay.
- [Bryan Rumsey — Steam Input Essentials Eps 3: Input Styles](https://bryanrumsey.wordpress.com/2018/06/24/steam-input-essentials-eps-3-input-styles/) — practical reference for input styles.
