var createEc2 = require('modules/ec2Instance/createEc2');

var fileName = "./local/hosts/inventory";
function getMasterIp(params,callback){
createEc2.createInstances(params, handleResult)

function handleResult(err, data) {
    if (err) {
        console.log("failed to launch instance", err)
    }
    else {
        console.log("sucessfully created instance", data)


        createEc2.getListOfIps(data, finalResult);

        function finalResult(err, finalData) {
           
            if (err) {
                console.error("failed to get list of ips", err)
            } else {
                console.log("sucessfully created list of ips", finalData);

                createEc2.createHostFile(fileName,finalData, result);

                function result(err, finalIp) {
                    if (err) {
                        console.error("failed to get master IP -->", err)
                    } else {
                        console.log("master Ip is --->", finalIp);
                        callback(undefined,finalIp.toString())
                    }
                }




            }
        }


    }
}

}

module.exports.getMasterIp = getMasterIp;


