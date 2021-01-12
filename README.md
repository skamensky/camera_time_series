# Whos is this for?
Just me and my brother. I don't think anyone else will find it useful. I'm just putting it here because I like the simplicity of the architecture.
# Why
To help my brother analyze his footage
# What
A script that scans XML files produced by a Sony camera to provide aggregate data on shoots
# Start
Clone this repo, cd into [build](build) and run [`python generate_camera_report_version_0_0_4.py`](build/generate_camera_report_version_0_0_4.py).

# Architecture
- Make it a single file deployable.
- Keep it as simple as possible.
- Use standard libraries when possible, and single file dependencies when not.

For example, as of now the only python dependency is [bottle](https://github.com/bottlepy/bottle) which is injected into the final script, and the only JS dependency is [Apex Charts](https://github.com/apexcharts/apexcharts.js) which is similarly injected into the final script.

There is a few line build script that takes the JS files, injects them as inline scripts into an html file, and injects that html file into a python string variable. The build scripts outputs a python file that contains bottle source code, the html string, and a small bottle app. The generated file can then be sent as a single file and run by anyone with python and a browser installed on their computer (easier than ever these days with python being added to the Windows app store). Now you have a UI with all the power a browser gives that can communicate fully with the OS, who needs electron anyway!

# No Judgment Clause
I hacked this code together in a few hours. It's chock full of worst practices, global state, confusingly named variables, and - more than likely - juicy bugs .

I lay myself bare.
# Screenies

![Snazzy Filebrowser](screenshots/snazzy_filebrowser.png?raw=true "Snazzy Filebrowser")

![Multiple Charts](screenshots/mulitple_charts.png?raw=true "Multiple Charts")

![Single Chart](screenshots/single_chart.png?raw=true "Single Chart")

![Toggleable Clips](screenshots/toggleable_clips.png?raw=true "Toggleable Clips")