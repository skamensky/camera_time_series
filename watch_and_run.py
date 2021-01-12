import subprocess
from pathlib import Path
import os
import re

os.environ["DEBUG"] = "true"


def start_process(kill_pid):
    if kill_pid:
        subprocess.run(["kill", "-9", str(kill_pid)])

    print("building distributable")
    subprocess.run(["python3", "build_distributable.py"])
    py_prefix = "generate_camera_report_version"

    scripts = {
        int(re.sub("[^1-9]", "", p.name)): p
        for p in Path(Path(__file__).parent, "build").iterdir()
        if py_prefix in p.name
    }
    latest = scripts[max(list(scripts.keys()))]
    process_args = ["python3", latest]
    print(f"Starting process with args: {process_args}")
    process = subprocess.Popen(process_args)
    return process.pid


folder_size = sum([p.stat().st_size for p in Path(".").iterdir() if not p.is_dir()])
pid = start_process(None)

while True:
    new_folder_size = sum(
        [p.stat().st_size for p in Path(".").iterdir() if not p.is_dir()]
    )
    if folder_size != new_folder_size:
        folder_size = new_folder_size
        pid = start_process(pid)
