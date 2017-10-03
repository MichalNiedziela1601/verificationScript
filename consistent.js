/**
 * Created by default on 10/2/17.
 */
var http = require('http');
var requestify = require('requestify');
var Promise = require('bluebird');
var fs = require('fs');

var host = 'https://realskill-backend.herokuapp.com';
// var host = 'http://127.0.0.1:3000';
var token = '133600dd9b96f09e706d8493c9bd2e54';

requestify.get(host + '/api/task', {
    headers: {
        'Authorization': 'Bearer ' + token
    }
}).then(function (response)
{
    var total = response.getBody().total;
    return requestify.get(host + '/api/task', {
        params: {
            from: 0,
            size: total
        },
        headers: {
            'Authorization': 'Bearer ' + token
        }
    })
})
        .then(function (response)
        {
            res = response.getBody();
            var ids = res.results.map(function (obj)
            {
                return obj.id;
            });
            var promises = ids.map(function (obj)
            {
                console.log(obj);
                return requestify.post(host + '/api/task/' + obj + '/consistency-check', {}, {

                    headers: {
                        'Authorization': 'Bearer ' + token
                    },
                    params: {
                        force: false
                    }
                })
            });
            return Promise.all(promises);
        })
        .then(function (response)
        {
            console.log(response);
        })
        .catch(function (error)
        {
            console.log(error);
        });
