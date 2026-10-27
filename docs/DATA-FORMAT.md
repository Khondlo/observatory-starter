# Reading format / schema 1

Import one JSON object, not JSONL or CSV:

```json
{
  "schemaVersion": 1,
  "source": "My verified adapter",
  "samples": [
    {
      "at": "2026-10-20T12:00:00.000Z",
      "values": {
        "garage": 350
      }
    }
  ]
}
```

The value above is illustrative. Use your actual reading time, including timezone (`Z` means UTC). The page displays times in the browser’s local timezone. Units are fixed by this format; convert in your adapter.

| Key | Unit | Meaning |
| --- | --- | --- |
| `garage` | W | Garage submeter; non-negative |

Use `null` when the reading is unavailable. Missing values display as unavailable and break graph lines. Never use zero to mean unavailable. Any other key is rejected so typos are visible. Version 1 does not dynamically add metric definitions from imports; add new metrics in `public/model.js` and their UI in `public/app.js` when extending it.

Each file accepts 1–5,000 samples, below 2 MB. Timestamps must be valid, unique, timezone-qualified ISO strings and no more than five minutes in the future. Samples are sorted. Source labels are treated as plain text. External URLs and HTML in a dataset do not execute.

## Sampling and gaps

The starter chart breaks a line when a value is absent/null or adjacent sample times are over **10 minutes apart**. It is designed for roughly 30-second to 5-minute samples. For slower collection, adjust that threshold in `public/app.js` and `public/model.js`; otherwise sparse data will appear as isolated points rather than fabricated lines.

The chart shows samples as supplied; it does not calculate observed energy or costs. Its y-axis is scaled to the displayed values and is not guaranteed to start at zero.

## Align the measurements upstream

A sample has one timestamp. Your adapter is responsible for checking source freshness before creating it. Set `garage` to null when the meter's original reading is stale (the Homey example uses 90-second freshness).

The supplied schema intentionally does not preserve device IDs, room names, credentials, or per-device connection details. Keep that configuration in the private adapter. If combining several sources, describe them honestly in `source`, for example “My Homey + local-meter adapter”.
