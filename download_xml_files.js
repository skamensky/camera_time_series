/*
This is not used in the program. It's just for me to download xml files for testing
 */

function downloadURI(uri, name)
{
    window.open(uri,'_blank');
    return
    console.log(uri);
    var link = document.createElement("a");
    // If you don't know the name or want to use
    // the webserver default set name = ''
    link.setAttribute('download', name);
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    link.remove();
}
spans=[];
data = {}
Array.from(document.querySelectorAll('li.sl-grid-cell a')).forEach(e=>spans.push(Array.from(e.children).filter(e2=>e2.nodeName=='SPAN')[0]))
spans.filter(e=>e.innerText.toUpperCase().includes('XML')).forEach(e=>data[e.innerText]=e.parentElement.href.replace('dl=0','dl=1'))
//spans.filter(e=>e.innerText.toUpperCase().includes('XML')).forEach(e=>downloadURI(e.parentElement.href.replace('dl=0','dl=1')))
copy(data)

/*
# python bit, copy data into data variable
data = {} #replace with copid data variable from javascript

import requests
from pathlib import Path
import json

content_dict = {}
folder = Path('./xml_files_test')
folder.mkdir(exist_ok=True)
for name,url in data.items():
    file = Path(folder,name)
    content = requests.get(url).content
    file.write_bytes(content)
    content_dict[file.name]=content.decode()


print(json.dumps(content_dict,indent=4))
*/
