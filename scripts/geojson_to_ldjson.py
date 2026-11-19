#!/usr/bin/env python3
"""
Convert a GeoJSON FeatureCollection into newline-delimited GeoJSON (.ldjson)
for Mapbox Tiling Service (`tilesets upload-source`).

Usage:
  python3 scripts/geojson_to_ldjson.py opendata/processed/metro-all-trees-processed.json
"""
import argparse
import json
from pathlib import Path


def convert(input_path: Path, output_path: Path) -> int:
    with open(input_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    features = data.get("features", [])
    with open(output_path, "w", encoding="utf-8") as out:
        for feat in features:
            out.write(json.dumps(feat, separators=(",", ":")) + "\n")

    return len(features)


def main() -> None:
    parser = argparse.ArgumentParser(description="Convert GeoJSON FeatureCollection to .ldjson")
    parser.add_argument("input", type=Path, help="Input GeoJSON file")
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        default=None,
        help="Output .ldjson path (defaults to <input-stem>.ldjson)",
    )
    args = parser.parse_args()
    out_path = args.output or args.input.with_suffix(".ldjson")
    count = convert(args.input, out_path)
    print(f"Wrote {count:,} features to {out_path}")


if __name__ == "__main__":
    main()
