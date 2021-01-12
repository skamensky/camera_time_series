# {LIBS_PLACEHOLDER}


class OurScope:
    from webbrowser import open_new_tab
    from pathlib import Path
    import socket
    import time
    from threading import Thread
    from urllib import request
    from json import dumps
    import os

    CLIENT_KNOWS_OF_SERVER_RESTART = False

    @staticmethod
    def is_port_in_use(port):
        # taken from https://stackoverflow.com/a/52872579/4188138
        with OurScope.socket.socket(
            OurScope.socket.AF_INET, OurScope.socket.SOCK_STREAM
        ) as s:
            return s.connect_ex(("localhost", port)) == 0

    @staticmethod
    def is_port_our_server(port):
        try:
            return (
                OurScope.request.urlopen(f"http://localhost:{port}/identify-server")
                .read()
                .decode()
                == __file__
            )
        except Exception:
            return False

    @staticmethod
    def open_tab(port):
        if "DEBUG" in OurScope.os.environ:
            return
        OurScope.time.sleep(1)
        OurScope.open_new_tab(f"http://localhost:{port}/home")

    @staticmethod
    def start_server(init_html):
        port = 8080
        while OurScope.is_port_in_use(port):
            if OurScope.is_port_our_server(port):
                OurScope.open_tab(port)
                return
            else:
                port += 1

        init_html = init_html.replace("//LOCAL_HOST_PORT", f"LOCAL_HOST_PORT={port};")

        @route("/identify-server")
        def identify_server():
            return __file__

        @route("/has_server_restarted")
        def has_server_restarted():
            if OurScope.CLIENT_KNOWS_OF_SERVER_RESTART:
                return "false"
            else:
                OurScope.CLIENT_KNOWS_OF_SERVER_RESTART = True
                return "true"

        @route("/get-xml-files")
        def get_xml_files():
            dir_path = request.query["dir_path"]
            if not OurScope.Path(dir_path).is_dir():
                abort(
                    404,
                    {"message": f"The given file path ({dir_path}) is not a folder"},
                )

            return {
                str(p): p.read_text()
                for p in OurScope.Path(dir_path).iterdir()
                if p.suffix.lower() == ".xml"
            }

        @route("/home")
        def get_home():
            return init_html

        @route("/list_dir")
        def list_dir():
            dir_path = request.query["dir_path"]
            show_hidden = request.query.get("show_hidden", default=False)
            if dir_path == "~":
                dir_path = OurScope.Path.home()
            else:
                dir_path = OurScope.Path(dir_path)

            def file_filter(file):
                if file.name.startswith("."):
                    return show_hidden
                return True

            files = [
                {"name": str(z.name), "is_dir": z.is_dir()}
                for z in dir_path.iterdir()
                if file_filter(z)
            ]
            response.content_type = "application/json"
            return OurScope.dumps(
                {
                    "files": files,
                    "requested_directory": str(dir_path.absolute()),
                    "parent_directory": str(dir_path.parent.absolute()),
                }
            )

        @route("/get_xml_data_for_folder")
        def get_xml_data_for_folder():
            dir_path = request.query["dir_path"]
            if dir_path == "~":
                dir_path = OurScope.Path.home()
            else:
                dir_path = OurScope.Path(dir_path)
            files = [
                {"name": str(z.name), "content": z.read_text()}
                for z in dir_path.iterdir()
                if z.suffix.lower() == ".xml"
            ]
            response.content_type = "application/json"
            return OurScope.dumps(
                {
                    "files": files,
                }
            )

        t = OurScope.Thread(target=OurScope.open_tab, args=(port,))
        t.start()
        run(host="localhost", port=port, debug=True)
        t.join()


if __name__ == "__main__":

    HTML_FILE_CONTENTS = r"""
    HTML_TEMPLATE
    """.replace(
        "//OS", f"OS='{OurScope.os.name}';"
    )

    OurScope.start_server(HTML_FILE_CONTENTS)
