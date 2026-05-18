"""Generate per-slide MP3 narration using edge-tts."""
import asyncio
import json
from pathlib import Path
import edge_tts

BASE = Path(r"C:\Users\User\Desktop\Collection_Auto\video_pipeline")
OUT_DIR = BASE / "audio"
OUT_DIR.mkdir(exist_ok=True, parents=True)

cfg = json.loads((BASE / "narration.json").read_text(encoding="utf-8"))
VOICE = cfg["voice"]
RATE = cfg.get("rate", "+0%")

async def synth(idx: int, text: str):
    out = OUT_DIR / f"slide_{idx:03d}.mp3"
    tts = edge_tts.Communicate(text, voice=VOICE, rate=RATE)
    await tts.save(str(out))
    print(f"  wrote {out.name}  ({out.stat().st_size // 1024} KB)")

async def main():
    for s in cfg["slides"]:
        print(f"Slide {s['index']}:")
        await synth(s["index"], s["text"])

if __name__ == "__main__":
    asyncio.run(main())
