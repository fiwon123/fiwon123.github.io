# Fonts

Bundled webfonts, self-hosted so the site makes no third-party requests.

| Family         | Files                               | License                        |
| -------------- | ----------------------------------- | ------------------------------ |
| Space Grotesk  | `space-grotesk-latin*.woff2`         | SIL Open Font License 1.1      |
| JetBrains Mono | `jetbrains-mono-latin*.woff2`        | SIL Open Font License 1.1      |

Both are variable fonts, subset to `latin` + `latin-ext` (covers English and
Brazilian Portuguese). They are declared in `src/theme/fonts.css`.

## Regenerating

```bash
python3 scripts/fetch-fonts.py
```

The script requests the Google Fonts CSS with a desktop user-agent (which serves
woff2), keeps the `latin` and `latin-ext` subsets, and writes them here.

## License

Space Grotesk — Copyright 2018 The Space Grotesk Project Authors.
JetBrains Mono — Copyright 2020 The JetBrains Mono Project Authors.
Both licensed under the SIL Open Font License, Version 1.1
(<https://openfontlicense.org/>), which permits bundling and redistribution.
