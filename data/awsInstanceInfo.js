module.exports.config={
    "access": {
        "user": "ubuntu",
        "keypair": {
            "name": "awskey",
            "privateKey": "--- enter your private key ---"
        }
    },
    
    "instanceDef": {
    "ImageId": "enter ami id ", // amzn-ami-2011.09.1.x86_64-ebs
    "InstanceType": "t2.micro",
    "MinCount": "1",
    "SecurityGroupIds": ['securityGroupId'], // enter your security id
    "KeyName": "privatekeyName", // enter your private key name
    "MaxCount": "3",
    "SubnetId": "subnetId", // enter your subnet id
       },
    
    "playbooks": [
        {
            "name":"install docker",
            "content":"---\n- name: master_instance\n  hosts: master\n  remote_user: ubuntu\n  become: yes\n  become_method: sudo\n  become_user: root\n  roles:\n   - dockerSwarmMaster\n- name: slave-node\n  remote_user: ubuntu\n  hosts: slaves\n  become: yes\n  become_method: sudo\n  become_user: root\n  roles:\n    - dockerSwarmSlave"
        }
    ],
    "containers":[
        {
                "Name": "nginx",
                "Image": "vinayreddy/nginx",
                "RepoTag":"latest",
                "Replicas": 3,
                "PublishedPort": 80,
                "TargetPort": 80,
                "MemoryBytes": 104857600,
                "cakey": "/home/keys/ca.pem",  // enter your ca key location
                "key": "/home/keys/key.pem",   // enter your key location
                "cert": "/home/keys/cert.pem"  // enter your cert key locatio
              
            }
    ]
   
}
