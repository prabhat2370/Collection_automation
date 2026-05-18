"""Stitch per-slide PNG + MP3 pairs into one MP4 via ffmpeg.

Strategy: build a per-slide MP4 segment (still image for audio duration),
then concat-demux all segments into the final video.
"""
import json
import shutil
import subprocess
import sys
from pathlib import Path

BASE = Path(r"C:\Users\User\Desktop\Collection_Auto\video_pipeline")
SLIDES = BASE / "slides"
AUDIO = BASE / "audio"
SEG_DIR = BASE / "segments"
OUT = BASE / "DIGITALIZATION_video.mp4"
FFMPEG = r"C:\Users\User\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1.1-full_build\bin\ffmpeg.exe"
FFPROBE = r"C:\Users\User\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1.1-full_build\bin\ffprobe.exe"

if SEG_DIR.exists():
    shutil.rmtree(SEG_DIR)
SEG_DIR.mkdir()

cfg = json.loads((BASE / "narration.json").read_text(encoding="utf-8"))
slide_indices = [s["index"] for s in cfg["slides"]]

def audio_duration(path: Path) -> float:
    res = subprocess.run(
        [FFPROBE, "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", str(path)],
        capture_output=True, text=True, check=True,
    )
    return float(res.stdout.strip())

segments = []
for idx in slide_indices:
    png = SLIDES / f"slide_{idx:03d}.png"
    mp3 = AUDIO / f"slide_{idx:03d}.mp3"
    seg = SEG_DIR / f"seg_{idx:03d}.mp4"
    dur = audio_duration(mp3)
    # Add 0.4s tail so the slide doesn't snap away on the final word
    total = dur + 0.4
    print(f"Slide {idx:>3}: {dur:.2f}s + 0.4s tail = {total:.2f}s")

    cmd = [
        FFMPEG, "-y",
        "-loop", "1", "-framerate", "30", "-i", str(png),
        "-i", str(mp3),
        "-c:v", "libx264", "-tune", "stillimage", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k",
        "-af", f"apad=pad_dur=0.4",
        "-t", f"{total:.3f}",
        "-vf", "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=white",
        "-r", "30",
        str(seg),
    ]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print("FFMPEG ERROR:", r.stderr[-2000:])
        sys.exit(1)
    segments.append(seg)

# Concat
concat_list = BASE / "concat.txt"
concat_list.write_text("\n".join(f"file '{s.as_posix()}'" for s in segments), encoding="utf-8")

print("Concatenating...")
cmd = [
    FFMPEG, "-y", "-f", "concat", "-safe", "0", "-i", str(concat_list),
    "-c", "copy", str(OUT),
]
r = subprocess.run(cmd, capture_output=True, text=True)
if r.returncode != 0:
    print("CONCAT ERROR:", r.stderr[-2000:])
    sys.exit(1)

print(f"\nFinal video: {OUT}")
print(f"Size: {OUT.stat().st_size // 1024 // 1024} MB")
total_dur = audio_duration(OUT)
print(f"Duration: {int(total_dur // 60)}m {int(total_dur % 60)}s")
