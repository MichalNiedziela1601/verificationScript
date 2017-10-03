var http = require('http');
var requestify = require('requestify');
var Promise = require('bluebird');
var fs = require('fs');
const request = require('request-promise');

var host = 'https://realskill-backend.herokuapp.com';
// var host = 'http://127.0.0.1:3000';
var token = '133600dd9b96f09e706d8493c9bd2e54';

function buildHtml(data)
{
    var tableBody = '';
    data.forEach(function (val)
    {
        tableBody += '<tr><td>' + val.id + '</td><td>' + val.title + '</td><td>' + val.consistencyVerifications.slice(-1)[0].fail_reason + '</td>' +
                '<td>' + val.consistencyVerifications.slice(-1)[0].start_date + '</td><td>' + val.consistencyVerifications.slice(-1)[0].verified_date + '</td></tr>\n'
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
    // console.log(response.results);
    let failed = [];
    response.results.map((obj) =>
    {
        if (obj.repositoryUrl && obj.solutionRepositoryUrl && obj.consistencyVerifications) {
            if (obj.consistencyVerifications.slice(-1)[0].status === "FAILED") {
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
