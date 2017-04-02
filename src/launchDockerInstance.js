
var async = require('async');
var logger = require('log4js').getLogger('launchinstance');
var config = require('data/awsInstanceInfo').config;
var ec2 = require('modules/ec2Instance/getMasterIp');
var playbook = require('modules/ansible/ansiblePlaybook');
var container = require('modules/docker/createContainer');
var services = require('modules/docker/createServices');

async.waterfall([
    createInstance,
    installDocker,
    launchService


], function (error, success) {
    if (error) {
        logger.error('Something is wrong!');
    } else {
        return logger.debug('Done!');
    }
});




// create an instance in amazon aws
function createInstance(callback) {

    ec2.getMasterIp(config.instanceDef, handresult);


    function handresult(error, body) {
        if (!error) {
            callback(undefined, config, body)
        }
    }
}

// Install docker and configure docker swamr cluster in instance lauched above
function installDocker(config, instanceIp, callback) {
    var playbookConfig = {
        "hostFile": "./local/hosts/inventory",
        "port": 22,
        "username": config.access.user,
        "elevatedPrivelage": true,
        "debug": true,
        "scriptContent": config.playbooks[0].content,
        "privateKey": config.access.keypair.privateKey
    }
    logger.debug('this is info passed from created instance', instanceIp)
    playbook.runPlaybook(playbookConfig, handresult);


    function handresult(error, body) {
        if (!error) {
            logger.debug('Playbook executing result', body)
            callback(undefined, config, instanceIp)
        }
        else {
            logger.error('Error Executing Playbook ', error)
            callback(error)

        }
    }

    
}

// launch services in docker swarm cluster
function launchService(config, instanceInfo, callback) {

    logger.debug("this is docker info", instanceInfo);
    logger.debug("this is the instanceinfo", instanceInfo)
    logger.debug("This is the pulling image name", config.containers[0].Image);


    services.createService(config, instanceInfo,
        function (error, data) {
            if (!error) {
                logger.debug("created services sucessfully", data);
                callback(undefined, config, instanceInfo);
            } else {
                logger.error("create Image---> ", error);
                callback(error);
            }

        }
    );

}



