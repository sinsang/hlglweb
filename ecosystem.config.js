module.exports = {
    apps: [{
    name: "HLGL",
    script: "./bin/www",
    instances: 2,
    exec_mode: "cluster",
    wait_ready: true,
    listen_timeout: 50000 
    }]
}