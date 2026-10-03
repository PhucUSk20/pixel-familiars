---
name: pixel-pet-codex
description: Customize this fork's Codex companion pet, props, scene, status lines and HUD using theme JSON.
---

# Customize Pixel Pet for Codex

Read `plugins/pixel-pet/skills/pixel-pet/FORMAT.md`. Start from `plugins/pixel-pet/assets/slime.json`, `duck.json`, or `alien.json`; preserve unspecified fields.

1. When the Pixel Pet MCP server is connected, call `get_theme` and `get_theme_format`. Start edits from the current theme; preserve unspecified fields.
2. Call `preview_theme` with the full modified theme. It validates/repairs and writes an HTML preview of all motions/faces/props/scene/HUD. Give the user its path or direct them to the companion's **Preview** button. A preview alone must not change the active pet.
3. Call `set_theme` when the user requests applying the change. Omit `theme` to apply the last preview in this MCP connection, pass the full object for an explicit theme, or null to restore the slime. It persists across sessions and immediately updates the open companion. Applying through MCP clears a configured `themeFile` override in the companion.
4. Use **Pixel Pet: Toggle Demo** to check the companion. Demo usage is simulated and labeled.
5. **Pixel Pet: Reset to Slime** restores the default.

If MCP is unavailable, write JSON in the workspace (for example `themes/my-pet.json`), run `node tools/preview/build.mjs themes/my-pet.json`, then use **Import theme** or set `pixelPet.themeFile` to that file. Saving it refreshes the companion. Run **Pixel Pet: Set Up Codex Hooks and MCP** to install the bridge, and **Pixel Pet: Review Codex Hooks** to open the runtime's trust review. Preserve the original schema; do not use the original Claude-only slash command `/pixel-pet:pixel-pet`.
