"""Extract only user-authorized illustration regions; never alter source pixels."""
import argparse
import hashlib
import json
from pathlib import Path
from PIL import Image

SOURCES = {
    'visitor': 'codex-clipboard-b0470514-1e58-4add-9e35-f54004d63777.jpg',
    'languages': 'codex-clipboard-c448275b-a991-462f-b812-fb96dab103bf.jpg',
    'liveVoice': 'codex-clipboard-fad7b447-37ad-466a-b13e-15709fb604e4.jpg',
}
CROPS = {
    'visitor-art': ('visitor', [674, 278, 1030, 698]),
    'visitor-avatars-0': ('visitor', [83, 1360, 290, 1456]),
    'visitor-avatars-1': ('visitor', [83, 1540, 290, 1636]),
    'visitor-avatars-2': ('visitor', [83, 1720, 290, 1816]),
    'visitor-mosaic-0': ('visitor', [442, 1370, 482, 1410]),
    'visitor-mosaic-1': ('visitor', [370, 1575, 405, 1616]),
    'visitor-mosaic-2': ('visitor', [371, 1735, 406, 1776]),
    'languages-art': ('languages', [0, 270, 1125, 765]),
    'languages-icon-0': ('languages', [82, 1570, 148, 1640]),
    'languages-icon-1': ('languages', [80, 1712, 150, 1780]),
    'languages-icon-2': ('languages', [80, 1840, 150, 1910]),
    'live-voice-art': ('liveVoice', [570, 285, 1125, 795]),
    'live-voice-icon-0': ('liveVoice', [75, 1475, 177, 1580]),
    'live-voice-icon-1': ('liveVoice', [75, 1620, 177, 1725]),
    'live-voice-icon-2': ('liveVoice', [75, 1765, 177, 1875]),
}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--source-directory', type=Path, required=True)
    parser.add_argument('--verify', action='store_true')
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    output = root / 'public/standalone-template/original'
    output.mkdir(parents=True, exist_ok=True)
    sources = {key: Image.open(args.source_directory / name).convert('RGB') for key, name in SOURCES.items()}
    manifest = {'method': 'lossless-rectangular-crop', 'resized': False, 'generated': False, 'assets': []}
    for name, (source, bounds) in CROPS.items():
        cropped = sources[source].crop(bounds)
        target = output / f'{name}.png'
        if args.verify:
            actual = Image.open(target).convert('RGB')
            assert actual.size == cropped.size and actual.tobytes() == cropped.tobytes(), name
        else:
            cropped.save(target)
        manifest['assets'].append({
            'path': f'/standalone-template/original/{name}.png',
            'source': SOURCES[source], 'sourceSize': list(sources[source].size),
            'sourceSha256': hashlib.sha256((args.source_directory / SOURCES[source]).read_bytes()).hexdigest(),
            'rect': bounds, 'width': cropped.width, 'height': cropped.height,
            'pixelSha256': hashlib.sha256(cropped.tobytes()).hexdigest(),
            'sha256': hashlib.sha256(target.read_bytes()).hexdigest(),
        })
    if not args.verify:
        (output / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'verified' if args.verify else 'extracted': len(CROPS), 'output': str(output)}))

if __name__ == '__main__':
    main()
