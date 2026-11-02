# The forbidden-string gate

The kit is meant to be shared, so no identifier from another project's tenant may appear in a tracked file. `npm run check:forbidden`
(`scripts/check-forbidden-strings.mjs`) fails when a tracked file contains

- any line of the **forbidden-strings list** (matched case-insensitively; a hit is reported as `file:line entry #N`, never as the value),
- a UUID in docs or examples that `scripts/forbidden-allowlist.json` does not list, or
- a private Ping hostname that the allowlist does not list.

The list itself holds the very identifiers it guards against, so it is **never committed**.

## Where CI gets the list

The `forbidden-strings` job in `.github/workflows/ci.yml` writes the `FORBIDDEN_STRINGS` repository secret (one string per line) to a temporary
file and points `FORBIDDEN_STRINGS_FILE` at it. With no secret the job fails under `CI=true`: the gate cannot be skipped. The job prints counts only.

## Local copy of the list

Keep your own copy at `~/.config/demo-kit/forbidden-strings.txt` (mode 600, outside this repository), one identifier per line.

## Run it locally with the real list

```sh
FORBIDDEN_STRINGS_FILE=~/.config/demo-kit/forbidden-strings.txt npm run check:forbidden
```

Without `FORBIDDEN_STRINGS_FILE` the exact-string check is skipped locally (with a notice) and the host and UUID checks still run.
