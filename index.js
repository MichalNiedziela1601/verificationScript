const fs = require('fs');
const request = require('request-promise');
const _ = require('lodash');

var host = 'https://realskill-backend.herokuapp.com';
var token = '133600dd9b96f09e706d8493c9bd2e54';

function lastSuccess(arr) {
    'use strict';
    return _.findLastIndex(arr, (o) => { return "SUCCESS" === o.status})
}
function lastFailed(arr) {
    'use strict';
    return _.findLastIndex(arr, (o) => { return "FAILED" === o.status})
}


function buildHtml(data)
{
    var tableBody = '';
    _.forEach(data, (o) => {
        'use strict';
        let last = _.last(o.consistencyVerifications);
        const lastIndex = o.consistencyVerifications.length -1;
        if("FAILED" === last.status){
            o.currentStatus = "FAILED";
            o.previousOpositeStatusIndex = lastSuccess(o.consistencyVerifications);
        } else {
            o.currentStatus = "SUCCESS";
            o.previousOpositeStatusIndex = lastFailed(o.consistencyVerifications);
        }
        let count = lastIndex - o.previousOpositeStatusIndex;
        if(o.consistencyVerifications.length === count){
            o.differenceCount = -1;
        } else {
            o.differenceCount = count;
        }
    });

    data.forEach(function (val)
    {
        tableBody += '<tr><td rowspan="2">' +
                val.id +
                '</td><td rowspan="2">' +
                val.title +
                '</td><td style="background-color: '+ ("FAILED" === val.currentStatus ? "#f38787" : "#7bef7b")+';">' +
                        val.currentStatus +
                '</td><td>' +
                val.consistencyVerifications.slice(-1)[0].fail_reason +
                '</td>' +
                '<td>' +
                val.consistencyVerifications.slice(-1)[0].start_date +
                '</td><td>' +
                val.consistencyVerifications.slice(-1)[0].verified_date +
                '</td>' +
                '<td>' +
                val.consistencyVerifications.slice(-1)[0].push_date +
                '</td></tr>' +
                '<tr>' +
                '<td style="background-color: '+ ("FAILED" === val.currentStatus ? "#7bef7b" : "#f38787")+';">' +
                ("FAILED" === val.currentStatus ? "Last Success result diffrence: " + (-1 !== val.differenceCount ? val.differenceCount : "NOT AVAILABLE")
                        : "Last Failed result diffrence: "+ (-1 !==val.differenceCount ? val.differenceCount : "NOT AVAILABLE")) +
                '</td><td>' + (-1 !== val.previousOpositeStatusIndex ? val.consistencyVerifications[val.previousOpositeStatusIndex].fail_reason : null) +
                '</td><td>' + (-1 !== val.previousOpositeStatusIndex ? val.consistencyVerifications[val.previousOpositeStatusIndex].start_date : null ) +
                '</td><td>' + (-1 !== val.previousOpositeStatusIndex ? val.consistencyVerifications[val.previousOpositeStatusIndex].verified_date : null) +
                '</td><td>' + (-1 !== val.previousOpositeStatusIndex ? val.consistencyVerifications[val.previousOpositeStatusIndex].push_date : null) +
                '</td>' +
                '</tr>' +
                '</tr>\n'
    });
    return `
<html>
<head>

<!-- Latest compiled and minified CSS -->
<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css" integrity="sha384-BVYiiSIFeK1dGmJRAkycuHAHRg32OmUcww7on3RYdg4Va+PmSTsz/K68vbdEjh4u" crossorigin="anonymous">
</head>
<body>
<table class="table">
<tr>
<th>ID</th>
<th>Title</th>
<th>Status</th>
<th>Reason</th>
<th>Start Date</th>
<th>Verified Date</th>
<th>Push Date</th>
</tr>
    <tbody>
        ${tableBody}
</tbody>

</table>
</th>
</table>
</body>

</html>`
}

let options = {
    uri: host + '/api/task',
    headers: {
        'Authorization': 'Bearer ' + token
    },
    json: true
};
request(options).then((response) =>
{
    let total = response.total;
    options['qs'] = {
        from: 0,
        size: total,
        consistencyVerifications: true
    };
    return request(options)
}).then((response) =>
{
    let failed = [];
    response.results.map((obj) =>
    {
        if (obj.repositoryUrl && obj.solutionRepositoryUrl && obj.consistencyVerifications) {
            if (2 > obj.consistencyVerifications.length && "FAILED" === obj.consistencyVerifications.slice(-1)[0].status) {
                failed.push(obj);
            }
            else if ("FAILED" === obj.consistencyVerifications.slice(-1)[0].status || "FAILED" === obj.consistencyVerifications.slice(-2, -1)[0].status) {
                failed.push(obj);
            }
        }
    });
    const fileName = __dirname + '/raport.html';
    const stream = fs.createWriteStream(fileName);

    stream.once('open', function (fd)
    {
        const html = buildHtml(failed);
        stream.end(html);
    });


})
// .then(function (response)
// {
//     console.log(response);
//     var fileName = __dirname + '/raport.html';
//     var stream = fs.createWriteStream(fileName);
//
//     stream.once('open', function (fd)
//     {
//         var html = buildHtml(response);
//
//         stream.end(html);
//     });
//             var text = [];
//             response.forEach(function(val){
//                 var obj ={
//                             "title": val.title,
//                             "value": `*Id* : ${val.taskId}
// *Reason*: ${val.result[0].failReason}
// *Start Date*: ${val.result[0].startDate}
// *Push Date*: ${val.result[0].pushDate}
// *Verified Date*: ${val.result[0].verifiedDate}
// -----------------------------------------------`,
//                                     "short": false
//                          };
//                 text.push(obj);
//             });
//
//             return requestify.post('https://hooks.slack.com/services/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',{
//                 text: "*Following tasks have failed verification:*",
//                 "attachments":[
//                     {
//                         "color":"#D00000",
//                         "fields": text,
//                         "mrkdwn_in": ["fields"]
//                     }
//                 ],
//                 username: "RealSkill automated task verifier"
//             });
//         })
        .catch(function (error)
        {
            console.log('ERROR', error);
        });
