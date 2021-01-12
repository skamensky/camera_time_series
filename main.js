GLOBAL_STATE = {
    current_directory: '~',
    parent_directory: '',
    current_files: [],
    selected_folders: [],
    parsedData: {},
    fileNameToInfo: {}
}

/*These values are injected in dynamically by python*/

//OS
//LOCAL_HOST_PORT

SLASH = OS == 'nt' ? '\\' : '/'




toNiceTime = (d) => {
    hours = String(d.getHours());
    minutes = String(d.getMinutes());
    if (hours.length == 1) {
        hours = '0' + hours
    }
    if (minutes.length == 1) {
        minutes = '0' + minutes
    }
    return `${hours}:${minutes}`
}

getFiles = (filePath) => {
    fetch(
        `http://localhost:${LOCAL_HOST_PORT}/list_dir?dir_path=${filePath}`
    ).then(r => r.json()).then(json => {
        GLOBAL_STATE["parent_directory"] = json.parent_directory
        GLOBAL_STATE["current_files"] = json.files;
        GLOBAL_STATE["current_directory"] = json.requested_directory;
        manualSelection = ''
        if (document.getElementById('manualDirectorySelection')) {
            manualSelection = document.getElementById('manualDirectorySelection').value
        }
        updateFilePicker(manualSelection);
    })
}

getNameFromDirectoryElem = (elem) => {
    return elem.getAttribute('data-name');
}

handlefolderSelection = elem => {
    fileName = getNameFromDirectoryElem(elem)
    if (elem.checked) {
        GLOBAL_STATE.selected_folders.push(fileName)
    } else {
        if (GLOBAL_STATE.selected_folders.includes(fileName)) {
            GLOBAL_STATE.selected_folders.splice(GLOBAL_STATE.selected_folders.indexOf(fileName), 1);
        }
        if (fileName in GLOBAL_STATE.parsedData) {
            delete GLOBAL_STATE.parsedData[fileName];
        }
    }
    Promise.all(setupData()).then(() => {
        renderChart()
        processAggregations()
        renderFiles()
    })

}
getFilesFromInput = () => {
    val = document.getElementById('manualDirectorySelection').value
    if (val) {
        getFiles(val)
    }
}
updateFilePicker = (previousManualInput) => {

    if (!previousManualInput) {
        previousManualInput = ''
    }

    fileHtml = GLOBAL_STATE.current_files.map(file => {
        if (file.is_dir) {
            fullPath = GLOBAL_STATE.current_directory + SLASH + file.name
            checked = GLOBAL_STATE.selected_folders.includes(fullPath) ? "checked" : "";
            return `<div>
                <input onclick="handlefolderSelection(this)" type="checkbox" id="${fullPath}_input" data-name="${fullPath}" ${checked}>
                <button data-name="${fullPath} " onclick="getFiles(getNameFromDirectoryElem(this))">📁</button>
                ${file.name}
                </div>`
        } else {
            return `<div><span>🗞</span> ${file.name}</div>`
        }
    }).join('\n')

    parent = ''
    if (GLOBAL_STATE.parent_directory) {
        parent = `
            <div>
            <button data-name="${GLOBAL_STATE.parent_directory}" onclick="getFiles(getNameFromDirectoryElem(this))">⬆ to ${GLOBAL_STATE.parent_directory}</button>
            or enter file path 
            <input cols="50" rows="1" id="manualDirectorySelection" onkeyup="getFilesFromInput()" onpaste="getFilesFromInput()" type="text" value="${previousManualInput}"></input>
            </div>
`
    }

    document.getElementById("filePicker").innerHTML = `
    ${parent}
    ${fileHtml}
    `
    //setting the onpaste attribute doesn't seem to work
    document.getElementById('manualDirectorySelection').addEventListener('paste', (e) => {
        getFilesFromInput()
    })
}

openFilePicker = () => {
    document.getElementById('myModal').style.display = 'block'
    getFiles(GLOBAL_STATE.current_directory)
}

closeFilePicker = () => {
    document.getElementById('myModal').style.display = 'none'
}

toggleShow = (folder, fileName) => {
    isShown = GLOBAL_STATE.fileNameToInfo[folder][fileName].show;
    callingElement = document.getElementById(folder + SLASH + fileName);

    if (isShown) {
        callingElement.classList.replace('notCrossOut', 'crossOut')
    } else {
        callingElement.classList.replace('crossOut', 'notCrossOut')

    }
    GLOBAL_STATE.fileNameToInfo[folder][fileName].show = !GLOBAL_STATE.fileNameToInfo[folder][fileName].show;
    renderChart();
    processAggregations();
}


setupData = () => {
    parser = new DOMParser();
    promises = []
    GLOBAL_STATE.selected_folders.forEach(folder => {
        promise = fetch(`http://localhost:${LOCAL_HOST_PORT}/get_xml_data_for_folder?dir_path=${folder}`).then(
            r => r.json()
        ).then(json => {
            if(folder in GLOBAL_STATE.parsedData){
                // this folder has already been processed
                return
            }
            json.files.forEach(file => {
                xmlDoc = parser.parseFromString(file.content, "text/xml");
                fps = xmlDoc.getElementsByTagName('NonRealTimeMeta')[0].getElementsByTagName('VideoFormat')[0].getElementsByTagName('VideoFrame')[0].getAttribute('formatFps').replace('p', '')
                frameCount = Array.from(xmlDoc.getElementsByTagName('NonRealTimeMeta')[0].getElementsByTagName('LtcChangeTable')[0].getElementsByTagName('LtcChange')).filter(e => e.getAttribute('status') == 'end')[0].getAttribute('frameCount');
                createdAt = new Date(xmlDoc.getElementsByTagName('NonRealTimeMeta')[0].getElementsByTagName('CreationDate')[0].getAttribute('value')),
                    durationInSeconds = Math.round(frameCount / fps);
                endTime = new Date(createdAt);
                endTime.setSeconds(durationInSeconds);
                fileInfo = {
                    lastUpdate: new Date(xmlDoc.getElementsByTagName('NonRealTimeMeta')[0].getAttribute('lastUpdate')),
                    createdAt,
                    durationInSeconds,
                    endTime,
                    fileName: file.name,
                    show: true,
                    visuallyHidden: false,
                    displayText: `${file.name} ${toNiceTime(createdAt)}-${toNiceTime(endTime)}`,
                    folder
                }
                if (Object.keys(GLOBAL_STATE.parsedData).includes(folder)) {
                    GLOBAL_STATE.parsedData[folder].files.push(fileInfo);
                } else {
                    GLOBAL_STATE.parsedData[folder] = {
                        files: [fileInfo]
                    };
                }

                if (Object.keys(GLOBAL_STATE.fileNameToInfo).includes(folder)) {
                    GLOBAL_STATE.fileNameToInfo[folder][file.name] = fileInfo;
                } else {
                    t = {}
                    t[file.name] = fileInfo
                    GLOBAL_STATE.fileNameToInfo[folder] = t;
                }
            })
        })
        promises.push(promise);
    })
    return promises;
}

sortFiles = () => {
    for (let folder in GLOBAL_STATE.parsedData) {
        GLOBAL_STATE.parsedData[folder].files.sort((f, s) => f.createdAt - s.createdAt);
    }
}

handleFolderContentsDisplayClick = elem => {
    container = elem.firstElementChild;
    if (Array.from(container.classList).includes('hidden')) {
        container.classList.remove('hidden')
    } else {
        container.classList.add('hidden')
    }
}

renderFiles = () => {
    sortFiles()
    document.getElementById('files').innerHTML = '';

    for (let folder in GLOBAL_STATE.parsedData) {

        fileElements = GLOBAL_STATE.parsedData[folder].files.filter(e => !e.visuallyHidden).map(e => {
            fullPath = folder + SLASH + e.fileName
            cls = e.show ? "notCrossOut" : "crossOut";
            return `
                <div id="${fullPath}" class="${cls}">
                    <button onclick="toggleShow('${folder}','${e.fileName}')">Toggle show</button> ${e.displayText}
                </div>
                `
        });


        span = document.createElement('span');
        span.id = folder
        span.classList = ['folder-display'];
        span.onclick = (e) => {
            if (!Array.from(e.target.classList).includes('folder-display')) {
                return
            }
            handleFolderContentsDisplayClick(e.target)
        }

        span.innerHTML = `
            ${folder}
            <div id="file-container-${folder}" class="file-display hidden">${fileElements.join('\n')}</div>
        `;
        document.getElementById('files').appendChild(span);
    }
}

async function renderChart(){
    sortFiles();

    chartData = []
    endTimeToInfo = {}
    for(folder in GLOBAL_STATE.parsedData) {
        ourData = GLOBAL_STATE.parsedData[folder].files.filter(e => e.show);
        seriesName = folder.split(SLASH).reverse().join(SLASH)
        ourData.forEach((info, index) => {
            endTime = new Date(info.createdAt);
            endTime.setSeconds(info.durationInSeconds);
            chartData.push({
                x: seriesName,
                y: [info.createdAt.getTime(), endTime.getTime()]
            })
            if(endTime.getTime() in endTimeToInfo){
                endTimeToInfo[endTime.getTime()].push(info)
            }
            else{
                endTimeToInfo[endTime.getTime()] = [info]

            }

        })

    }

    var options = {
        series: [{
            data: chartData
        }],
        chart: {
            height: 350,
            type: 'rangeBar'
        },
        plotOptions: {
            bar: {
                horizontal: true
            }
        },
        xaxis: {
            type: 'datetime',
            labels: {
                datetimeUTC: false
            }
        },
        // yaxis:{tooltip: {enabled: true}}
        tooltip: {
            enabled: true,
            custom: function({
                series,
                seriesIndex,
                dataPointIndex,
                w
            }) {
                endTime = series[seriesIndex][dataPointIndex];
                display = endTimeToInfo[endTime].map(i=>i.displayText).join('<br>')

                return '<div class="arrow_box">' +
                    '<span>' + display + '</span>' +
                    '</div>'
            }
        }
    };
    try {
        document.getElementById('chart').remove()
        d = document.createElement('div')
        d.id = 'chart';
        document.body.prepend(d);
    } catch {}

    var chart = new ApexCharts(document.querySelector("#chart"), options);
    chart.render();
}

async function processAggregations(){

    document.getElementById('aggregations').innerHTML='';
    for(folder in GLOBAL_STATE.parsedData) {
        ourData = GLOBAL_STATE.parsedData[folder].files.filter(e => e.show);
        if(ourData.length==0){
            continue
        }

    first = ourData[0];
    last = ourData[ourData.length - 1];

    // taken from https://stackoverflow.com/a/7709819/4188138
    timeSpentMs = last.endTime - first.createdAt;
    timeSpentHrs = Math.floor((timeSpentMs % 86400000) / 3600000);
    timeSpentMins = Math.round(timeSpentMs / 1000 / 60);
    totalFootageDurationInSeconds = ourData.reduce(
        (totalDuration, fileInfo) => totalDuration + fileInfo.durationInSeconds, 0
    )

    totalFootageDurationInHours = Math.round((totalFootageDurationInSeconds / 60 / 60 + Number.EPSILON) * 100) / 100;
    totalFootageDurationInMinutes = Math.round((totalFootageDurationInSeconds / 60 + Number.EPSILON) * 100) / 100;
    percentTimeSpentShooting = Math.round(
        (((totalFootageDurationInSeconds) / timeSpentMins / 60) + Number.EPSILON) * 100);

    span = document.createElement('span');
    span.innerHTML=`
    <table class="styled-table">
        <caption>${folder}</caption>
        <tr>
            <th>Metric</th>
            <th>Value</th>
        </tr>
       <tr>
           <td>Start Time</td>
           <td>${toNiceTime(first.createdAt)}</td>
        </tr>
               <tr>
           <td>End Time</td>
           <td>${toNiceTime(last.endTime)}</td>
        </tr>
         
       <tr>
           <td>Total time present (minutes)</td>
           <td>${timeSpentMins}</td>
        </tr>
       <tr>
           <td>Total time present (hours)</td>
           <td>${timeSpentHrs}</td>
        </tr>

       <tr>
           <td>Total footage duration (hours)</td>
           <td>${totalFootageDurationInHours}</td>
        </tr>
        <tr>
           <td>Total footage duration (minutes)</td>
           <td>${totalFootageDurationInMinutes}</td>
        </tr>
       <tr>
           <td>Total footage duration (seconds)</td>
           <td>${totalFootageDurationInSeconds}</td>
        </tr>         
       <tr>
           <td>Percent of time spent shooting</td>
           <td>${percentTimeSpentShooting}%</td>
        </tr>     
           <tr>
           <td>Number of files</td>
           <td>${ourData.length}</td>
        </tr>                           
    </table>
    `
    document.getElementById('aggregations').appendChild(span);
    }

}

search = () => {
    val = document.getElementById('search').value;
    if (!val) {
        GLOBAL_STATE.parsedData.forEach(e => {
            e.visuallyHidden = false;
        })
    } else {
        GLOBAL_STATE.parsedData.forEach(e => {
            if (e.displayText.includes(val)) {
                e.visuallyHidden = false;
            } else {
                e.visuallyHidden = true;
            }
        })
    }

    renderFiles();
}
clearSearch = () => {
    document.getElementById('search').value = '';
    search();
}

setInterval(() => {
    fetch('/has_server_restarted').then(r => r.text()).then(r2 => {
        if (r2 == 'true') {
            location.reload()
        }
    })
}, 1000)