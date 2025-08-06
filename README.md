# color palette generator

generate tailwindcss themes using material-color utilities from arbitrary colors

## usage:

run `bun palette` with hex color arguments then `build` if successful:

```
bun palette #4169c6 && bun run build
```

- the input `#4169c6` resolves to color name _"Adventure of the Seas"_
- this is mapped to the tailwindcss color `--color-adventure-of-the-seas` as `primary`
- this also created the `secondary`, `terinary`, `neutral` and `neutralVariant` palettes
- each with their own steps (50-950) with light and dark mode variants
    - see a full palette output in the [release notes](https://github.com/xero/color-palette-generator/releases/tag/v1.1.0)

`palette` can take a single color or multiple, in `RGB` `#RGB` `RRGGBB` or `#RRGGBB` format

```
bun palette #0f0 #3730a3 #22d3ee 24bca8 && bun run build
```

the build script will generate a `dist` folder containing `site.min.css` and a test `index.html`

## preview

![preview](https://github.com/user-attachments/assets/0b76956a-2ba0-4627-9218-f262e96d5640)

## license

**CC0 1.0 universal (public domain dedication)**
use it for anything, commercial or personal, with or without attribution.
