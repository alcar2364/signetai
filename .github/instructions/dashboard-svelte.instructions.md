---
description: "Use when working on the Signet dashboard (Svelte 5, Tailwind v4, shadcn-svelte). Covers UI conventions, component patterns, and design system rules. Applies to all files in packages/cli/dashboard/."
applyTo: "packages/cli/dashboard/**"
---

# Dashboard UI and Design Guidelines

- **Framework:** Svelte 5 (runes: `$props`, `$state`, `$derived`, `$effect`)
- **Styling:** Tailwind CSS v4 (no custom config), semantic tokens in `src/app.css`
- **UI primitives:** Use only shadcn-svelte components in `src/lib/components/ui/` for all basic UI (button, card, tabs, etc.)
- **Design system:** Follow the Signet industrial/technical monochrome aesthetic (see [docs/DASHBOARD.md](../../docs/DASHBOARD.md) and [signet-design SKILL](../../../../.agents/skills/signet-design/SKILL.md))
- **No border-radius:** All containers and controls must have sharp 90-degree corners (except schematic decorator circles)
- **Typography:** Use Chakra Petch for headings, IBM Plex Mono for body (see `src/app.html`)
- **Icons:** Use Lucide icons via `@lucide/svelte` only; never custom SVGs or emoji glyphs
- **Component structure:** Place new UI primitives in `src/lib/components/ui/`, feature modules in their respective folders
- **Ambient only:** No bouncy, attention-grabbing animations; use subtle transitions and technical overlays
- **No color gradients or saturated colors:** Palette is near-monochrome with muted accents only
- **Show, don’t tell:** Prefer code examples and referencing existing components over prose

For full design tokens and patterns, see `src/app.css` and [docs/DASHBOARD.md](../../docs/DASHBOARD.md). For visual reference, see `assets/design-brief.png`.

## Anti-patterns

- Rounded corners, filled buttons at rest, or Material/consumer SaaS look
- Custom fonts, serif fonts, or system-ui
- Bright/saturated color accents or gradients
- Generic/emoji/filled icons
- Mixing display and mono fonts in the same element
- Overriding shadcn-svelte styles with ad-hoc CSS

## Example prompts

- “Add a new memory card UI to the dashboard following the design system.”
- “Refactor the sidebar to use only shadcn-svelte primitives.”
- “Update the dashboard theme tokens in app.css for a new accent.”

## Related customizations

- `/create-instruction signet-design` for global UI/branding rules
- `/create-instruction dashboard-api` for API/data-fetching conventions
- `/create-instruction dashboard-testing` for UI test patterns
