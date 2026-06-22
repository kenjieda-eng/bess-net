import json, sys, unicodedata
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# 1. norm() の挙動テスト
glyphs = ['⾧', '長']
for g in glyphs:
    for ch in g:
        cp = ord(ch)
        nf = unicodedata.normalize("NFKC", ch)
        print(f"  char={ch!r} U+{cp:04X} name={unicodedata.name(ch,'?')} -> NFKC={nf!r} U+{ord(nf[0]):04X}")

print()
# 2. 現行JSONに ⾧ 等の非標準グリフが残っていないか全フィールド走査
import glob, os
problem_cps = set()
for path in glob.glob("scripts/experimental/tepco/out/*.json"):
    with open(path, encoding="utf-8") as f:
        d = json.load(f)
    def scan(obj, where):
        if isinstance(obj, str):
            for ch in obj:
                cp = ord(ch)
                if 0x2E80 <= cp <= 0x2FDF:  # CJK Radicals Supp + Kangxi Radicals
                    problem_cps.add((cp, unicodedata.name(ch,'?'), os.path.basename(path), where, obj[:30]))
        elif isinstance(obj, dict):
            for k,v in obj.items(): scan(v, k)
        elif isinstance(obj, list):
            for v in obj: scan(v, where)
    scan(d, "root")

print(f"非標準グリフ(U+2E80–2FDF)残存: {len(problem_cps)}件")
for cp, nm, fn, where, sample in sorted(problem_cps):
    print(f"  U+{cp:04X} {nm} in {fn}.{where}: {sample!r}")
