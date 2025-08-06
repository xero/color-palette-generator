# tailwind color palette generator

generate [tailwindcss themes](https://tailwindcss.com/docs/colors) using [material color utilities](https://github.com/material-foundation/material-color-utilities) from arbitrary colors

## usage:

run `bun palette` with hex color arguments then `build` if successful:

```
bun palette #4169c6 \
    && bun run build
```

- the input `#4169c6` resolves to color name _"Adventure of the Seas"_
- this is mapped to the tailwindcss color `--color-adventure-of-the-seas` as `primary`
- this also created the `secondary`, `tertiary`, `neutral` and `neutralVariant` palettes
- each with their own steps (50-950) with light and dark mode variants
    - see a full palette output example in the [release notes](https://github.com/xero/color-palette-generator/releases/tag/v1.1.0)

`palette` can take a single color or multiple, in a variety of color spaces.

> [!IMPORTANT]
> make sure complex values are wrapped in quotes to avoid breaking your shell pipeline

```
bun palette \
    0f0 \
    #0F0 \
    #00ff00 \
    00FF00 \
    #00ff00ff \
    "rgb(0, 255, 0)" \
    "hsl(120 100% 50%)" \
    "color(display-p3 0.4584 0.9853 0.2983)" \
    "lch(87.82 113.33 134.38)" \
    "lab(87.82 -79.27 80.99)" \
    "oklab(0.82 -0.23 0.18)" \
    "oklch(0.8659 0.294454 142.4694)"
```

here's a chart breaking down the same color green in multiple formats:

| color format | input                                   | name        | css var             |
| ------------ | --------------------------------------- | ----------- | ------------------- |
| shortest hex | 0f0                                     | Forest Ride | --color-forest-ride |
| short hex    | #0F0                                    | Forest Ride | --color-forest-ride |
| long hex     | 00ff00                                  | Forest Ride | --color-forest-ride |
| longer hex   | #00FF00                                 | Forest Ride | --color-forest-ride |
| figma p3     | #00ff00ff                               | Forest Ride | --color-forest-ride |
| rgb/a        | rgb(0, 255, 0)                          | Forest Ride | --color-forest-ride |
| hsl          | hsl(120 100% 50%)                       | Forest Ride | --color-forest-ride |
| p3           | color(display-p3 0.4584 0.9853 0.2983)  | Forest Ride | --color-forest-ride |
| lch          | lch(87.82 113.33 134.38)                | Forest Ride | --color-forest-ride |
| lab          | lab(87.82 -79.27 80.99)                 | Forest Ride | --color-forest-ride |
| oklab        | oklab(0.82 -0.23 0.18)                  | Forest Ride | --color-forest-ride |
| oklch        | oklch(0.8659 0.294454 142.4694)         | Forest Ride | --color-forest-ride |

the build script will generate a `dist` folder containing `site.min.css` and a test `index.html`

## tool-chain

this project is powered by the following tools and libraries:
- [bun](https://bun.sh): dependency and build management
- [post css](https://postcss.org): css build tool-chain
- [tailwind css](https://tailwindcss.com): modern css framework
- [material color utilities](https://github.com/material-foundation/material-color-utilities): material foundation color libraries
- [closest vector](https://github.com/meodai/ClosestVector/): find the closest number / vector
- [color names list](https://github.com/meodai/color-names): list of handpicked color names
- [css nano](https://cssnano.github.io/cssnano): css minifier

## preview

![preview](https://github.com/user-attachments/assets/0b76956a-2ba0-4627-9218-f262e96d5640)

## license

**CC0 1.0 universal (public domain dedication)**

use it for anything, commercial or personal, with or without attribution.
