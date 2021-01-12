import os
import json
from webbrowser import open_new_tab
from pathlib import Path

xml_files = {
    file: open(file).read() for file in os.listdir() if file.lower().endswith(".xml")
}

html_template = r"""
HTML_TEMPLATE
"""
html_template = html_template.replace("DATA_VAL_PLACEHOLDER", json.dumps(xml_files))
html_file = Path("time_series_report.html")
html_file.write_text(html_template)
open_new_tab(str(html_file.absolute()))
