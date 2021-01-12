version = "0.0.4"
import re


def generated_pyscript_filename():
    return f'generate_camera_report_version_{version.replace(".","_")}.py'


html_template = "\n".join(
    [line for line in open("index.html").read().split("\n") if "<script" not in line]
)
html_template = html_template.replace(
    "<!--SCRIPT_PLACEHOLDER-->",
    r"""
    <script>
    {libs}
       
   
    {main}

    </script>
    """.format(
        libs=open("libs.js").read(), main=open("main.js").read()
    ),
)


def remove_main_check(python_code_string):
    return re.sub(r'if __name__ == "__main__":.*\n.*', "", python_code_string)


generated_py_script = (
    open("pyscript_template.py")
    .read()
    .replace("HTML_TEMPLATE", html_template)
    .replace("# {LIBS_PLACEHOLDER}", remove_main_check(open("bottle.py").read()))
)

open("build/" + generated_pyscript_filename(), "w+").write(generated_py_script)
