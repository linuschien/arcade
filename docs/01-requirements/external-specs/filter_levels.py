#!/usr/bin/env python3
"""
Sokoban 50 Stage Filter & Dataset Builder
========================================
Parses the 5 Sokoban level set files in docs/01-requirements/external-specs/,
analyzes geometric topology (width, height, aspect ratio, box count),
filters eligible levels for the 4 World themes, and can build a curated 50-stage track.

Usage:
    python3 filter_levels.py --summary
    python3 filter_levels.py --inventory
    python3 filter_levels.py --world 1
    python3 filter_levels.py --world 2
    python3 filter_levels.py --world 3
    python3 filter_levels.py --world 4
    python3 filter_levels.py --all-worlds
    python3 filter_levels.py --build-50
    python3 filter_levels.py --export sokoban_50_stages.json
    python3 filter_levels.py --inspect Microban.txt 11
"""

import os
import sys
import json
import math
import argparse
from collections import defaultdict, Counter
from dataclasses import dataclass, asdict
from typing import List, Dict, Optional, Tuple

SPEC_DIR = os.path.dirname(os.path.abspath(__file__))

FILES = {
    "microban": "Microban.txt",
    "original": "Original-Plus-Extra.txt",
    "microcosmos": "microcosmos.txt",
    "minicosmos": "minicosmos.txt",
    "sasquatch": "Sasquatch.txt",
}

FILE_AUTHORS = {
    "Microban.txt": "David W. Skinner (Microban)",
    "Original-Plus-Extra.txt": "Thinking Rabbit / Hiroyuki Imabayashi (Original + Extra)",
    "microcosmos.txt": "Aymeric du Peloux (Microcosmos)",
    "minicosmos.txt": "Aymeric du Peloux (Minicosmos)",
    "Sasquatch.txt": "David W. Skinner (Sasquatch I)",
}

# PRD Section 4 & 5: World Progression Specifications (5 / 15 / 20 / 10 Zero-Overlap Architecture)
WORLD_SPECS = {
    1: {
        "world_id": 1,
        "name": "Cargo Depot (木造貨棧)",
        "theme_key": "cargo_depot",
        "stages": "Stage 01~05 (5 stages)",
        "start_stage": 1,
        "end_stage": 5,
        "source_files": ["Microban.txt"],
        "max_w": 12,
        "max_h": 12,
        "aspect_min": 0.80,
        "aspect_max": 1.75,
        "box_targets": {1: 1, 2: 4},
        "box_range": [1, 2],
        "t_base": 50, "k_t": 10, "u_base": 2, "k_u": 0.6, "u_max": 6,
        "p_base": 200, "p_perf": 300,
    },
    2: {
        "world_id": 2,
        "name": "Cyber Vault (賽博金庫)",
        "theme_key": "cyber_vault",
        "stages": "Stage 06~20 (15 stages)",
        "start_stage": 6,
        "end_stage": 20,
        "source_files": ["minicosmos.txt", "microcosmos.txt"],
        "max_w": 12,
        "max_h": 12,
        "aspect_min": 0.80,
        "aspect_max": 1.75,
        "box_targets": {3: 5, 4: 5, 5: 5},
        "box_range": [3, 5],
        "t_base": 120, "k_t": 20, "u_base": 4, "k_u": 0.6, "u_max": 12,
        "p_base": 400, "p_perf": 500,
    },
    3: {
        "world_id": 3,
        "name": "Steel Works (重工業工廠)",
        "theme_key": "steel_works",
        "stages": "Stage 21~40 (20 stages)",
        "start_stage": 21,
        "end_stage": 40,
        "source_files": ["Original-Plus-Extra.txt"],
        "max_w": 20,
        "max_h": 16,
        "aspect_min": 0.80,
        "aspect_max": 1.75,
        "box_targets": {6: 2, 8: 2, 9: 2, 10: 5, 11: 3, 12: 6},
        "box_range": [6, 12],
        "t_base": 140, "k_t": 15, "u_base": 5, "k_u": 0.5, "u_max": 14,
        "p_base": 600, "p_perf": 700,
    },
    4: {
        "world_id": 4,
        "name": "Mega Terminal (巨型碼頭)",
        "theme_key": "mega_terminal",
        "stages": "Stage 41~50 (10 stages)",
        "start_stage": 41,
        "end_stage": 50,
        "source_files": ["Sasquatch.txt"],
        "max_w": 26,
        "max_h": 18,
        "aspect_min": 0.80,
        "aspect_max": 1.75,
        "box_targets": {13: 2, 14: 2, 15: 1, 16: 1, 17: 1, 18: 1, 19: 1, 20: 1},
        "box_range": [13, 20],
        "t_base": 180, "k_t": 15, "u_base": 6, "k_u": 0.5, "u_max": 16,
        "p_base": 800, "p_perf": 900,
    },
}


@dataclass
class LevelData:
    source_file: str
    level_index: int
    title: str
    width: int
    height: int
    aspect_ratio: float
    box_count: int
    goal_count: int
    player_count: int
    is_valid: bool
    map_lines: List[str]
    raw_lines: List[str]
    is_rotated: bool = False


def rotate_cw(lines: List[str]) -> List[str]:
    """Rotate a 2D ASCII Sokoban board 90 degrees clockwise."""
    if not lines:
        return []
    H = len(lines)
    W = max(len(r) for r in lines)
    padded = [r.ljust(W, " ") for r in lines]
    rotated = []
    for c in range(W):
        new_row = "".join(padded[H - 1 - r][c] for r in range(H))
        rotated.append(new_row.rstrip(" "))
    while rotated and not rotated[-1].strip():
        rotated.pop()
    if not rotated:
        return []
    min_x = min(len(r) - len(r.lstrip(" ")) for r in rotated if r.strip())
    return [r[min_x:] for r in rotated]


def make_rotated_level(lvl: LevelData) -> LevelData:
    """Creates a 90-degree CW rotated copy of a level data."""
    rot_lines = rotate_cw(lvl.map_lines)
    new_h = len(rot_lines)
    new_w = max(len(r) for r in rot_lines) if new_h > 0 else 0
    new_aspect = (new_w / new_h) if new_h > 0 else 0.0
    return LevelData(
        source_file=lvl.source_file,
        level_index=lvl.level_index,
        title=f"{lvl.title} (Rotated 90°)",
        width=new_w,
        height=new_h,
        aspect_ratio=round(new_aspect, 3),
        box_count=lvl.box_count,
        goal_count=lvl.goal_count,
        player_count=lvl.player_count,
        is_valid=lvl.is_valid,
        map_lines=rot_lines,
        raw_lines=lvl.raw_lines,
        is_rotated=True,
    )


def parse_file(filepath: str) -> List[LevelData]:
    filename = os.path.basename(filepath)
    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
        lines = f.readlines()

    levels = []
    current_lines: List[str] = []
    current_title = ""
    level_counter = 0

    for line in lines:
        raw = line.rstrip("\r\n")
        stripped = raw.strip()

        if not stripped:
            if current_lines:
                level_counter += 1
                levels.append(create_level_data(filename, level_counter, current_title, current_lines))
                current_lines = []
                current_title = ""
            continue

        if (
            stripped.startswith(";")
            or stripped.startswith("'")
            or stripped.lower().startswith("level ")
            or stripped.lower().startswith("author:")
            or stripped.lower().startswith("title:")
        ):
            if current_lines:
                level_counter += 1
                levels.append(create_level_data(filename, level_counter, current_title, current_lines))
                current_lines = []
            current_title = stripped.lstrip("; '").rstrip("'")
            continue

        is_map = "#" in raw and all(c in " #$.*@+" for c in raw)
        if is_map:
            current_lines.append(raw)
        else:
            if current_lines:
                level_counter += 1
                levels.append(create_level_data(filename, level_counter, current_title, current_lines))
                current_lines = []
                current_title = ""

    if current_lines:
        level_counter += 1
        levels.append(create_level_data(filename, level_counter, current_title, current_lines))

    return levels


def create_level_data(filename: str, idx: int, title: str, lines: List[str]) -> LevelData:
    min_x = min(len(r) - len(r.lstrip(" ")) for r in lines if r.strip())
    norm_lines = [r[min_x:] for r in lines]
    H = len(norm_lines)
    W = max(len(r) for r in norm_lines) if H > 0 else 0

    full = "".join(norm_lines)
    boxes = full.count("$") + full.count("*")
    goals = full.count(".") + full.count("*") + full.count("+")
    players = full.count("@") + full.count("+")
    aspect = (W / H) if H > 0 else 0.0

    is_valid = (boxes == goals) and (players == 1) and (boxes > 0)
    effective_title = title if title else f"Level {idx}"

    return LevelData(
        source_file=filename,
        level_index=idx,
        title=effective_title,
        width=W,
        height=H,
        aspect_ratio=round(aspect, 3),
        box_count=boxes,
        goal_count=goals,
        player_count=players,
        is_valid=is_valid,
        map_lines=norm_lines,
        raw_lines=lines,
    )


def load_all_levels() -> Dict[str, List[LevelData]]:
    db = {}
    for key, fname in FILES.items():
        path = os.path.join(SPEC_DIR, fname)
        if os.path.exists(path):
            db[fname] = parse_file(path)
    return db


def calculate_stage_formulas(world_id: int, stage_num: int, box_count: int) -> Dict[str, int]:
    spec = WORLD_SPECS[world_id]
    s_start = spec["start_stage"]
    delta_s = stage_num - s_start

    # T_soft = T_base + K_t * B + 2 * (S - S_start)
    t_soft = spec["t_base"] + (spec["k_t"] * box_count) + (2 * delta_s)

    # U_quota = min(U_max, floor(U_base + K_u * B + 0.15 * (S - S_start)))
    raw_u = spec["u_base"] + (spec["k_u"] * box_count) + (0.15 * delta_s)
    u_quota = min(spec["u_max"], math.floor(raw_u))

    return {
        "t_soft": t_soft,
        "u_quota": u_quota,
        "p_base": spec["p_base"],
        "p_perf": spec["p_perf"],
    }


def print_summary(db: Dict[str, List[LevelData]]):
    print("=" * 80)
    print("  SOKOBAN 50 - EXTERNAL SPECS LEVEL SET SUMMARY")
    print("=" * 80)

    total_levels = 0
    for fname, levels in db.items():
        total_levels += len(levels)
        valid = [l for l in levels if l.is_valid]
        box_hist = Counter(l.box_count for l in valid)
        w_vals = [l.width for l in valid]
        h_vals = [l.height for l in valid]
        aspects = [l.aspect_ratio for l in valid]

        author = FILE_AUTHORS.get(fname, "Unknown")
        print(f"\n* {fname} ({author})")
        print(f"  Total Levels: {len(levels)} | Valid Sokoban: {len(valid)}")
        print(f"  Width:  min={min(w_vals)}, max={max(w_vals)}, avg={sum(w_vals)/len(w_vals):.1f}")
        print(f"  Height: min={min(h_vals)}, max={max(h_vals)}, avg={sum(h_vals)/len(h_vals):.1f}")
        print(f"  Aspect Ratio: min={min(aspects):.2f}, max={max(aspects):.2f}, avg={sum(aspects)/len(aspects):.2f}")
        
        box_dist = " ".join(f"[{b}b:{c}]" for b, c in sorted(box_hist.items()) if b <= 12)
        print(f"  Box Distribution (<=12): {box_dist}")

    print("\n" + "-" * 80)
    print(f"Grand Total: {len(db)} files, {total_levels} levels indexed.")
    print("=" * 80)


def print_inventory(db: Dict[str, List[LevelData]]):
    print("=" * 80)
    print("  SOKOBAN 50 - COMPLETE BOX COUNT INVENTORY (Across All 5 Files)")
    print("=" * 80)
    print(f"{'Boxes':<6} | {'Total':<6} | {'1.00-1.45':<10} | Source Breakdown (Aspect 1.00~1.45)")
    print("-" * 80)

    all_valid = []
    for fname, levels in db.items():
        all_valid.extend(levels)

    for b in range(1, 16):
        b_levels = [l for l in all_valid if l.box_count == b]
        b_filtered = [l for l in b_levels if 1.00 <= l.aspect_ratio <= 1.45]
        sources = Counter(l.source_file for l in b_filtered)
        src_str = ", ".join(f"{k.replace('.txt','')}:{v}" for k, v in sorted(sources.items()))
        print(f"{b:<6} | {len(b_levels):<6} | {len(b_filtered):<10} | {src_str}")
    print("=" * 80)


def filter_world_candidates(
    db: Dict[str, List[LevelData]],
    world_id: int,
    aspect_min: Optional[float] = None,
    aspect_max: Optional[float] = None,
    allow_rotation: bool = False,
) -> Tuple[Dict, Dict[int, List[LevelData]]]:
    spec = WORLD_SPECS[world_id]
    asp_min = aspect_min if aspect_min is not None else spec["aspect_min"]
    asp_max = aspect_max if aspect_max is not None else spec["aspect_max"]

    candidates_by_box = defaultdict(list)

    for fname in spec["source_files"]:
        if fname not in db:
            continue
        for lvl in db[fname]:
            if not lvl.is_valid:
                continue
            # Check original orientation
            if lvl.width <= spec["max_w"] and lvl.height <= spec["max_h"]:
                if asp_min <= lvl.aspect_ratio <= asp_max:
                    if lvl.box_count in spec["box_targets"]:
                        candidates_by_box[lvl.box_count].append(lvl)
                        continue

            # Check 90° CW rotated orientation for portrait maps if enabled
            if allow_rotation and lvl.width < lvl.height:
                rot = make_rotated_level(lvl)
                if rot.width <= spec["max_w"] and rot.height <= spec["max_h"]:
                    if asp_min <= rot.aspect_ratio <= asp_max:
                        if rot.box_count in spec["box_targets"]:
                            candidates_by_box[rot.box_count].append(rot)

    return spec, candidates_by_box


def display_world_candidates(spec: Dict, candidates_by_box: Dict[int, List[LevelData]], asp_min: float, asp_max: float):
    wid = spec["world_id"]
    wname = spec["name"]
    stages = spec["stages"]
    max_w, max_h = spec["max_w"], spec["max_h"]

    print("\n" + "=" * 80)
    print(f"  WORLD {wid}: {wname.upper()} | {stages}")
    print(f"  Grid Limits: W <= {max_w}, H <= {max_h} | Aspect: {asp_min:.2f} <= W/H <= {asp_max:.2f}")
    print(f"  Sources: {', '.join(spec['source_files'])}")
    print("=" * 80)

    for box, target_count in sorted(spec["box_targets"].items()):
        candidates = candidates_by_box.get(box, [])
        status = "OK" if len(candidates) >= target_count else f"NEED {target_count - len(candidates)} MORE"
        print(f"\n[Box Count = {box}] -> Target: {target_count} stages | Found: {len(candidates)} candidates [{status}]")
        print(f"  {'#':<4} {'Source':<24} {'Lvl#':<6} {'Size (WxH)':<12} {'Aspect':<8} {'Title'}")
        print(f"  {'-'*4} {'-'*24} {'-'*6} {'-'*12} {'-'*8} {'-'*24}")

        for i, c in enumerate(candidates, 1):
            size_str = f"{c.width}x{c.height}"
            print(f"  {i:<4} {c.source_file:<24} #{c.level_index:<5} {size_str:<12} {c.aspect_ratio:<8.2f} {c.title}")


def build_curated_50_stages(db: Dict[str, List[LevelData]]) -> List[Dict]:
    """
    Curates a 100% PURE, ZERO-OVERLAP 50-stage track (5 / 15 / 20 / 10):
      * World 1 (Stage 01~05, 5 stages):  Boxes [1, 2]  - 100% Microban.txt (David W. Skinner)
      * World 2 (Stage 06~20, 15 stages): Boxes [3, 5]  - 100% microcosmos.txt (Aymeric du Peloux, 5b/5b/5b)
      * World 3 (Stage 21~40, 20 stages): Boxes [6, 12] - 100% Original-Plus-Extra.txt (Thinking Rabbit)
      * World 4 (Stage 41~50, 10 stages): Boxes [13, 20]- 100% Sasquatch.txt (David W. Skinner)
    """
    microban = db.get("Microban.txt", [])
    minicosmos = db.get("minicosmos.txt", [])
    microcosmos = db.get("microcosmos.txt", [])
    original = db.get("Original-Plus-Extra.txt", [])
    sasquatch = db.get("Sasquatch.txt", [])

    def get_lvl(src, idx, rot=False):
        matches = [x for x in src if x.level_index == idx]
        if not matches:
            return None
        lvl = matches[0]
        if rot or (lvl.width < lvl.height):
            return make_rotated_level(lvl)
        return lvl

    selected_stages = []

    # World 1: 100% Microban (Stage 01~05, 5 stages: Boxes [1, 2])
    # #44 ("Duh!", 1b), #14 (2b), #21 (2b), #11 (2b), #12 (2b)
    w1_defs = [(44, False), (14, False), (21, False), (11, False), (12, False)]
    for i, (idx, rot) in enumerate(w1_defs, 1):
        lvl = get_lvl(microban, idx, rot)
        forms = calculate_stage_formulas(1, i, lvl.box_count)
        selected_stages.append({"stage": i, "world": 1, "level": lvl, "formulas": forms})

    # World 2: 100% Aymeric du Peloux Cosmos (Stage 06~20, 15 stages: Boxes [3, 5])
    # Perfectly linear 5:5:5 distribution!
    # 3 boxes x 5 (from minicosmos.txt: #3, #10, #12, #18, #33 - naturally landscape/square!)
    # 4 boxes x 5 (from microcosmos.txt: #1, #8, #9, #13, #15)
    # 5 boxes x 5 (from microcosmos.txt: #6, #11, #21, #24, #26)
    w2_defs = [
        (minicosmos, 3, False),   # 8x8, 3b
        (minicosmos, 10, False),  # 8x8, 3b
        (minicosmos, 12, False),  # 9x8, 3b
        (minicosmos, 18, False),  # 10x9, 3b
        (minicosmos, 33, False),  # 9x7, 3b
        (microcosmos, 1, False),  # 9x7, 4b
        (microcosmos, 8, False),  # 8x8, 4b
        (microcosmos, 9, False),  # 9x9, 4b
        (microcosmos, 13, False), # 8x8, 4b
        (microcosmos, 15, False), # 10x9, 4b
        (microcosmos, 6, False),  # 8x8, 5b
        (microcosmos, 11, False), # 9x8, 5b
        (microcosmos, 21, False), # 9x9, 5b
        (microcosmos, 24, False), # 10x9, 5b
        (microcosmos, 26, False), # 10x10, 5b
    ]
    for i, (src, idx, rot) in enumerate(w2_defs, 6):
        lvl = get_lvl(src, idx, rot)
        forms = calculate_stage_formulas(2, i, lvl.box_count)
        selected_stages.append({"stage": i, "world": 2, "level": lvl, "formulas": forms})

    # World 3: 100% Original Thinking Rabbit (Stage 21~40, 20 stages: Boxes [6, 12])
    # 6b(2), 8b(2), 9b(2), 10b(5), 11b(3), 12b(6)
    w3_defs = [
        (18, False), (1, False),                                              # 6b x 2
        (42, False), (85, False),                                             # 8b x 2
        (48, False), (49, False),                                             # 9b x 2
        (6, False), (2, False), (84, False), (90, False), (93, False),        # 10b x 5
        (7, False), (19, False), (3, False),                                  # 11b x 3
        (91, False), (5, False), (89, False), (94, False), (54, False), (86, False) # 12b x 6
    ]
    for i, (idx, rot) in enumerate(w3_defs, 21):
        lvl = get_lvl(original, idx, rot)
        forms = calculate_stage_formulas(3, i, lvl.box_count)
        selected_stages.append({"stage": i, "world": 3, "level": lvl, "formulas": forms})

    # World 4: 100% Sasquatch (Stage 41~50, 10 stages: Boxes [13, 20])
    # 13b(2), 14b(2), 15b(1), 16b(1), 17b(1), 18b(1), 19b(1), 20b(1)
    w4_defs = [
        (6, False), (24, False),         # 13b x 2
        (42, False), (32, False),        # 14b x 2
        (48, False),                     # 15b x 1
        (41, False),                     # 16b x 1
        (28, False),                     # 17b x 1
        (29, False),                     # 18b x 1
        (25, False),                     # 19b x 1
        (39, False),                     # 20b x 1
    ]
    for i, (idx, rot) in enumerate(w4_defs, 41):
        lvl = get_lvl(sasquatch, idx, rot)
        forms = calculate_stage_formulas(4, i, lvl.box_count)
        selected_stages.append({"stage": i, "world": 4, "level": lvl, "formulas": forms})

    return selected_stages


def print_curated_50_table(curated: List[Dict]):
    print("\n" + "=" * 95)
    print("  SOKOBAN 50 - CURATED 50-STAGE MASTER CATALOG")
    print("=" * 95)
    print(f"{'Stg':<4} {'World':<16} {'Boxes':<5} {'Source File':<24} {'Lvl#':<5} {'Size':<8} {'Aspect':<7} {'Tsoft':<6} {'Undo':<5} {'Title'}")
    print("-" * 95)

    for item in curated:
        stg = item["stage"]
        wid = item["world"]
        wname = f"W{wid} {WORLD_SPECS[wid]['theme_key']}"
        lvl = item["level"]
        f = item["formulas"]
        if lvl:
            print(f"{stg:02d}   {wname:<16} {lvl.box_count:<5} {lvl.source_file:<24} #{lvl.level_index:<4} {lvl.width}x{lvl.height:<5} {lvl.aspect_ratio:<7.2f} {f['t_soft']:>3}s   {f['u_quota']:>2}    {lvl.title[:20]}")
        else:
            print(f"{stg:02d}   {wname:<16} {'?':<5} {'[NOT ENOUGH CANDIDATES]':<24}")
    print("=" * 95)


def inspect_level(db: Dict[str, List[LevelData]], filename: str, level_num: int):
    target_file = None
    for f in db:
        if filename.lower() in f.lower():
            target_file = f
            break

    if not target_file:
        print(f"Error: file matching '{filename}' not found. Available: {list(db.keys())}")
        return

    levels = db[target_file]
    matched = [l for l in levels if l.level_index == level_num]
    if not matched:
        print(f"Error: Level #{level_num} not found in {target_file} (max #{len(levels)})")
        return

    lvl = matched[0]
    print("=" * 60)
    print(f"File:        {lvl.source_file}")
    print(f"Level Index: #{lvl.level_index}")
    print(f"Title:       {lvl.title}")
    print(f"Size:        {lvl.width} x {lvl.height} (Grid)")
    print(f"Aspect:      {lvl.aspect_ratio:.3f}")
    print(f"Boxes:       {lvl.box_count} | Goals: {lvl.goal_count} | Players: {lvl.player_count}")
    print(f"Valid:       {lvl.is_valid}")
    print("=" * 60)
    print("MAP ASCII:")
    for row in lvl.map_lines:
        print("  " + row)
    print("=" * 60)


def export_stages_json(curated: List[Dict], output_path: str):
    data = []
    for item in curated:
        lvl = item["level"]
        f = item["formulas"]
        if not lvl:
            continue
        data.append({
            "stage": item["stage"],
            "world": item["world"],
            "world_name": WORLD_SPECS[item["world"]]["name"],
            "theme_key": WORLD_SPECS[item["world"]]["theme_key"],
            "source_file": lvl.source_file,
            "source_level_index": lvl.level_index,
            "title": lvl.title,
            "is_rotated": lvl.is_rotated,
            "grid_width": lvl.width,
            "grid_height": lvl.height,
            "aspect_ratio": lvl.aspect_ratio,
            "box_count": lvl.box_count,
            "t_soft": f["t_soft"],
            "u_quota": f["u_quota"],
            "p_base": f["p_base"],
            "p_perf": f["p_perf"],
            "map_lines": lvl.map_lines,
        })

    with open(output_path, "w", encoding="utf-8") as out:
        json.dump({"total_stages": len(data), "stages": data}, out, indent=2, ensure_ascii=False)

    print(f"\n[OK] Exported {len(data)} curated stages to: {output_path}")


def main():
    parser = argparse.ArgumentParser(
        description="Sokoban 50 Stage Filter & Dataset Builder",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--summary", action="store_true", help="Print summary statistics of all 5 level files")
    parser.add_argument("--inventory", action="store_true", help="Print complete box count inventory across all files")
    parser.add_argument("--world", type=int, choices=[1, 2, 3, 4], help="Filter candidates for a specific world (1-4)")
    parser.add_argument("--all-worlds", action="store_true", help="Filter candidates for all 4 worlds")
    parser.add_argument("--aspect-min", type=float, default=1.00, help="Minimum aspect ratio W/H (default: 1.00)")
    parser.add_argument("--aspect-max", type=float, default=1.45, help="Maximum aspect ratio W/H (default: 1.45)")
    parser.add_argument("--rotate-portrait", action="store_true", help="Rotate portrait levels by 90° CW to convert them into landscape")
    parser.add_argument("--build-50", action="store_true", help="Build curated 50-stage track")
    parser.add_argument("--export", metavar="OUTPUT_JSON", help="Export curated 50 stages or candidates to JSON file")
    parser.add_argument("--inspect", nargs=2, metavar=("FILE", "LEVEL_NUM"), help="Inspect ASCII board of a level")

    args = parser.parse_args()

    if not (args.summary or args.inventory or args.world or args.all_worlds or args.build_50 or args.export or args.inspect):
        args.all_worlds = True

    db = load_all_levels()

    if args.summary:
        print_summary(db)
        return

    if args.inventory:
        print_inventory(db)
        return

    if args.inspect:
        inspect_level(db, args.inspect[0], int(args.inspect[1]))
        return

    if args.world:
        spec, candidates = filter_world_candidates(db, args.world, args.aspect_min, args.aspect_max, allow_rotation=args.rotate_portrait)
        display_world_candidates(spec, candidates, args.aspect_min, args.aspect_max)

    if args.all_worlds:
        for wid in [1, 2, 3, 4]:
            spec, candidates = filter_world_candidates(db, wid, args.aspect_min, args.aspect_max, allow_rotation=args.rotate_portrait)
            display_world_candidates(spec, candidates, args.aspect_min, args.aspect_max)

    if args.build_50:
        curated = build_curated_50_stages(db)
        print_curated_50_table(curated)
        if args.export:
            export_stages_json(curated, args.export)
    elif args.export:
        curated = build_curated_50_stages(db)
        export_stages_json(curated, args.export)


if __name__ == "__main__":
    main()
