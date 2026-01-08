module.exports = {
    apps: [
        {
            name: 'junta-ai',
            script: 'npm',
            args: 'start',
            env: {
                NODE_ENV: 'production',
                PORT: 3000
            },
        },
    ],
}
