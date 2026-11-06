# 2026-11-06 compatibility check

On the development Windows installation with Codex CLI `0.166.0-alpha.6`:

- The existing approved CSS snapshot hash remains
  `4e49fc5db8925d0f85868eefd5c91d3942df51c8fd9af8f58de04f8dc295908a`.
- The main renderer and local CDP port were available.
- The approved CSS and quota RAM runtime v4 were detected in that renderer.
- Distribution validation and all 15 automated tests passed.

This is a local compatibility observation, not a guarantee for every Codex
installation. The live installation uses its existing local theme entry;
the public standalone addon has separate apply/remove tests. Runtime injection
must be reapplied after a restart. No colors, shapes, button positions or
approved theme assets were changed by this maintenance.

The theme does not provide model routing or fix upstream connection errors.
Model routing is maintained in the separate
[router repository](https://github.com/zczczzc431/codex-multi-model-router).
