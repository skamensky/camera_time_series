
toNiceTime = (d) => {
    hours = String(d.getHours());
    minutes = String(d.getMinutes());
    if(hours.length==1){
        hours='0'+hours
    }
    if(minutes.length==1){
        minutes='0'+minutes
    }
    return `${hours}:${minutes}`
}


toggleShow = (fileName)=>{
    isShown = fileNameToInfo[fileName].show;
    callingElement = document.getElementById(fileName);

    if(isShown){
        callingElement.classList.replace('notCrossOut','crossOut')
    }
    else{
        callingElement.classList.replace('crossOut','notCrossOut')

    }
    fileNameToInfo[fileName].show=!fileNameToInfo[fileName].show;
    renderChart();
    processAggregations();
}


setupData = ()=>{
    parser = new DOMParser();
    parsedData = []


    fileNameToInfo = {}

    for (let fileName in xmlData) {

        xmlData[fileName]
        xmlDoc = parser.parseFromString(xmlData[fileName], "text/xml");
        fps = xmlDoc.getElementsByTagName('NonRealTimeMeta')[0].getElementsByTagName('VideoFormat')[0].getElementsByTagName('VideoFrame')[0].getAttribute('formatFps').replace('p', '')
        frameCount = Array.from(xmlDoc.getElementsByTagName('NonRealTimeMeta')[0].getElementsByTagName('LtcChangeTable')[0].getElementsByTagName('LtcChange')).filter(e => e.getAttribute('status') == 'end')[0].getAttribute('frameCount');
        createdAt= new Date(xmlDoc.getElementsByTagName('NonRealTimeMeta')[0].getElementsByTagName('CreationDate')[0].getAttribute('value')),
        durationInSeconds = Math.round(frameCount / fps);
        endTime = new Date(createdAt);
        endTime.setSeconds(durationInSeconds);
        fileInfo = {
            lastUpdate: new Date(xmlDoc.getElementsByTagName('NonRealTimeMeta')[0].getAttribute('lastUpdate')),
            createdAt,
            durationInSeconds,
            endTime,
            fileName,
            show:true,
            visuallyHidden:false,
            displayText: `${fileName} ${toNiceTime(createdAt)}-${toNiceTime(endTime)}`
        }
        parsedData.push(fileInfo);
        fileNameToInfo[fileName]=fileInfo;
    }

    parsedData.sort((f, s) => f.createdAt - s.createdAt);

}

renderFiles=()=>{
    parsedData.sort((f, s) => f.createdAt - s.createdAt);
    document.getElementById('files').innerHTML='';
    parsedData.filter(e=>!e.visuallyHidden).forEach(e => {

        div =document.createElement('div');
        div.id=e.fileName;
        if(e.show){
            cls="notCrossOut"
        }
        else{
            cls="crossOut"
        }
        div.classList = [cls];
        div.innerHTML=`
        <button onclick="toggleShow('${e.fileName}')">Toggle show</button> ${e.displayText}
        `
        document.getElementById('files').appendChild(div);
    })
}

const renderChart=()=>{
    ourData = parsedData.filter(e=>e.show)
    ourData.sort((f, s) => f.createdAt - s.createdAt);

    data = []
    endTimeToInfo = {}
    ourData.forEach((info, index) => {

        if (index !== 0) {
            // //populate until this point with null
            //     lastDate = new Date(x[x.length-1]);
            //     for(i=lastDate.getTime()/1000;i<info.createdAt.getTime()/1000;i++){
            //         x.push(null)
            //         y.push(1)
            //     }
        }
        endTime = new Date(info.createdAt);
        endTime.setSeconds(info.durationInSeconds);
        data.push({
            x: "Footage over time",
            y: [info.createdAt.getTime(), endTime.getTime()]
        })
        endTimeToInfo[endTime.getTime()]=info;
        // console.log([info.createdAt.getTime(), endTime.getTime()]);

        // for(i=p.createdAt.getTime()/1000;i<endTime.getTime()/1000;i++){
        //     d = new Date(info.createdAt);
        //     d.setSeconds(d.getSeconds()+i);
        //     x.push(d)
        //     y.push(1)
        // }

    })

    var options = {
        series: [{
            data: data
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
            // tooltip: {
            //   formatter: function(val, opts) {
            //     return String(JSON.stringify(Object.keys(opts)))
            //   },
            //   enabled:true
            // }
            labels:{ datetimeUTC: false}
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
                return '<div class="arrow_box">' +
                    '<span>' + endTimeToInfo[series[seriesIndex][dataPointIndex]].displayText + '</span>' +
                    '</div>'
            }
        }
    };
    try{
        document.getElementById('chart').remove()
        d = document.createElement('div')
        d.id='chart';
        document.body.prepend(d);
    }
    catch{}

    var chart = new ApexCharts(document.querySelector("#chart"), options);
    chart.render();
}

processAggregations = ()=>{
    ourData = parsedData.filter(e=>e.show)
    if(ourData.length===0){return}
    first = ourData[0];
    last = ourData[ourData.length - 1];

    // taken from https://stackoverflow.com/a/7709819/4188138
    timeSpentMs = last.endTime-first.createdAt;
    timeSpentHrs = Math.floor((timeSpentMs % 86400000) / 3600000);
    timeSpentMins = Math.round(timeSpentMs/1000/60);
    totalFootageDurationInSeconds =ourData.reduce(
        (totalDuration,fileInfo)=>totalDuration+fileInfo.durationInSeconds,0
    )

    totalFootageDurationInHours = Math.round((totalFootageDurationInSeconds/60/60 + Number.EPSILON) * 100) / 100;
    totalFootageDurationInMinutes = Math.round((totalFootageDurationInSeconds/60 + Number.EPSILON) * 100) / 100;
    percentTimeSpentShooting = Math.round(
        (((totalFootageDurationInSeconds)/timeSpentMins/60) + Number.EPSILON)* 100);

    document.getElementById('aggregations').innerHTML=`
    <table class="styled-table">
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
           <td>${parsedData.length}</td>
        </tr>                           
    </table>
    `}

search=()=>{
    val=document.getElementById('search').value;
    if(!val){
        parsedData.forEach(e=>{
                e.visuallyHidden=false;
            })
    }
    else{
        parsedData.forEach(e=>{
            if(e.displayText.includes(val)){
                e.visuallyHidden=false;
            }
            else{
                e.visuallyHidden=true;
            }
        })
    }

    renderFiles();
}
clearSearch=()=>{
    document.getElementById('search').value='';
    search();
}
setupData()
renderChart()
processAggregations()
renderFiles()