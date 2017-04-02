var Ansible = require('./ansible');
var util = require('util');
var fs = require('fs');
var ObjectID = require("bson-objectid");


var logger = require('log4js').getLogger('ansibleClient');
var Playbook = Ansible.Playbook;
var AdHoc = Ansible.AdHoc;

function ansibleClient(config) {
    keepTempFiles = config && config.debug ? config.debug : true
    return {

        executePlaybook: function (execObj, cb) {
            _that = this;
            var commandStdOut = []
            var commandErrOut = []
            if (!execObj.localFile) {
                if (execObj.scriptContent) {
                    if (!fs.existsSync('./local')) {
                        fs.mkdirSync('./local');
                    }
                    if (!fs.existsSync('./local/playbooks')) {
                        fs.mkdirSync('./local/playbooks');
                    }

                    var fileId = new ObjectID().toString();
                    execObj.localFile = util.format('./local/playbooks/%s.yml', fileId);
                    fs.writeFileSync(execObj.localFile, execObj.scriptContent);

                } else {
                    executeScriptCallback(new Error('localFile  or scriptContent should exist in json'));
                }
            }
            var command = new Playbook().playbook(execObj.localFile);


            if (execObj.privateKey) {
                if (!fs.existsSync('./local')) {
                    fs.mkdirSync('./local');
                }
                if (!fs.existsSync('./local/keys')) {
                    fs.mkdirSync('./local/keys');
                }
                var fileId = new ObjectID().toString();
                execObj.keyFile = util.format('./local/keys/%s.pem', fileId);
                fs.writeFileSync(execObj.keyFile, execObj.privateKey, {
                    mode: 0o600
                });
                command.privateKey(execObj.keyFile)
            } else if (execObj.keyFile) {
                command.privateKey(execObj.keyFile)

            }

            if(execObj.hostFile)
                command.inventory(execObj.hostFile);
            else    
              command.inventory(execObj.host + ',');
            command.user(execObj.username);

            if(execObj.elevatedPrivelage)
                command.asSudo();

            /* command.variables({
                 outFile: 'test.out'
             }) */

            command.on('stdout', function (data) {
                //logger.trace("stdout:", data.toString());
                commandStdOut.push(data)
            });
            command.on('stderr', function (data) {
                //logger.trace("stderr", data.toString());
                commandErrOut.push(data)
            });
            command.on('close', function (code) {
                if (!keepTempFiles) {
                    fs.unlink(execObj.keyFile, function (err) {
                        if (err)
                            logger.error('Error deleting temp key file')
                        else
                            logger.trace('Temp Key file deleted', execObj.keyFile);
                    });
                    fs.unlink(execObj.localFile, function (err) {
                        if (err)
                            logger.error('Error deleting temp playbook file')
                        else
                            logger.trace('Temp Playbook file deleted', execObj.localFile);
                    });
                } else {


                    logger.trace('Keeping Temp Files Playbook:%s Keyfile:%s', execObj.localFile, execObj.keyFile);
                }

                logger.debug("close Code", code.toString());
                cb(undefined, {
                    exitCode: code,
                    stdout: Buffer.concat(commandStdOut).toString(),
                    stderr: Buffer.concat(commandErrOut).toString(),
                });
            });

            command.on('exit', function (code) {
                logger.debug("exit Code", code.toString());

            });

            command.exec();

        },
    }


}

module.exports = ansibleClient;