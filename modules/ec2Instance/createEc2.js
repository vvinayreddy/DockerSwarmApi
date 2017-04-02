// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');
// Load credentials and set region from JSON file
AWS.config.loadFromPath('config/aws.json');
// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');
// Load credentials and set region from JSON file
var fs = require('fs');
var listOfInstanceId = [];

var async = require('async');
var logger = require('log4js').getLogger('launchinstance');
// Create EC2 service object
var ec2 = new AWS.EC2({
    apiVersion: '2016-11-15'
});

// Create the instance
function createInstances(params, callback) {
    ec2.runInstances(params, function (err, data) {
        if (err) {
            console.log("Could not create instance", err);
            return;
        }

        var instanceId = data.Instances[0].InstanceId;
        console.log("Created instance", instanceId);

        console.log(data.Instances);
        data.Instances.forEach(function (element) {
            listOfInstanceId.push(element.InstanceId);
        });


        // Add tags to the instance

        params = {
            Resources: [instanceId],
            Tags: [{
                Key: 'Name',
                Value: 'docker ubuntu'
            }]
        };

        ec2.createTags(params, function (err) {
            console.log("Tagging instance", err ? "failure" : "success");

        });
        ec2.waitFor('instanceStatusOk', {
            InstanceIds: [instanceId],
            DryRun: false
        }, function (err, instanceData) {
            logger.debug('Wait Complete for Instance State', instanceId);
            //logger.debug(instanceData);
            if (err) {
                console.log(err);
            } else {
                console.log(instanceData)
                //console.log(listOfInstanceId);
                // getIp(instanceId);
                callback(undefined,listOfInstanceId);
        }

        });
    });


}

function getListOfIps(listOfInstanceId,cb){
    async.mapSeries(listOfInstanceId, getIp, cb);
}


function getIp(instanceId,callback) {
    var listOfIps = [];
    var params = {
        DryRun: false
    };
    ec2.describeInstances(params, function (err, data) {
        if (err) {
            console.log("Error", err.stack);
        } else {
            data.Reservations.forEach(function (element) {
                element.Instances.forEach(function (element2) {
                    if (element2.InstanceId === instanceId) {
                       // console.log("Ipaddress of the instance created", element2.PublicIpAddress)
                        listOfIps.push(element2.PublicIpAddress)
                        callback(undefined, listOfIps);

                    }
                })

            });
        }
    });
}

function createHostFile(fileName, instanceIp,callback) {
    for (var arg = 0; arg < instanceIp.length; arg++) {
        if (arg === 0) {
            var master = "[master]\n" + instanceIp[arg]+"\n[slaves]\n"
            fs.writeFile(fileName, master, (err) => {
                if (err) throw err;
             //   console.log('The file has been saved!');

            });
            callback(undefined,instanceIp[0]);
        } else {
            var slave = instanceIp[arg]+"\n";
            fs.appendFile(fileName, slave, (err) => {
                if (err) throw err;
               // console.log('The file has been saved!');
            });

        }

    }
    
}

module.exports.createHostFile = createHostFile;
module.exports.getListOfIps = getListOfIps;
module.exports.createInstances = createInstances;