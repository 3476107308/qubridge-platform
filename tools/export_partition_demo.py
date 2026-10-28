"""Export independently displayable frames from the existing demo GIFs.

Run with Pillow installed: python tools/export_partition_demo.py
The source GIFs are preserved. Normal demos use six checkpoints; DQP custom
retains every frame and its original timing for continuous playback.
"""
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'static' / 'image'
OUTPUT = SOURCE / 'partition-steps'
CHECKPOINTS = (0, 8, 15, 20, 30, 39)
STEPS = (
    ('初始拓扑', '观察量子比特的初始排列。点击下一步，开始查看分区过程。'),
    ('开始分区', '观察第一轮分区时，节点颜色与区域划分的变化。'),
    ('扩展分区', '对照上一步，查看分区继续展开后的节点归属。'),
    ('形成分区', '观察当前已形成的分区，比较不同颜色的节点区域。'),
    ('后续调整', '继续观察演示中的边界与分区变化，可返回上一步对照。'),
    ('演示完成', '查看最后的演示画面；可返回任意步骤，或重新播放。'),
)


def export():
    OUTPUT.mkdir(exist_ok=True)
    demos = {}
    for algorithm in ('gsp', 'qhsp', 'dqp'):
        for topology in ('linear', 'grid', 'ibmq', 'custom'):
            key = f'{algorithm}_{topology}'
            folder = OUTPUT / key
            folder.mkdir(exist_ok=True)
            with Image.open(SOURCE / f'{key}.gif') as gif:
                continuous = key == 'dqp_custom'
                indices = range(gif.n_frames) if continuous else CHECKPOINTS
                entry = {
                    'mode': 'continuous' if continuous else 'steps',
                    'width': gif.width,
                    'height': gif.height,
                    'frames': [],
                }
                for position, index in enumerate(indices):
                    gif.seek(index)
                    frame_name = f'{key}/{position:02d}.webp'
                    # Pillow composites GIF disposal/transparency before conversion.
                    gif.convert('RGB').save(OUTPUT / frame_name, 'WEBP', lossless=True, method=6)
                    frame = {'src': frame_name, 'sourceFrame': index,
                             'duration': gif.info.get('duration', 100) if continuous else 2000}
                    if not continuous:
                        frame['title'], frame['description'] = STEPS[position]
                    entry['frames'].append(frame)
                demos[key] = entry
                print(f'{key}: {len(entry["frames"])} frames ({entry["mode"]})', flush=True)
    (OUTPUT / 'manifest.json').write_text(
        json.dumps({'version': 1, 'demos': demos}, ensure_ascii=False, indent=2) + '\n',
        encoding='utf-8',
    )


if __name__ == '__main__':
    export()
