const path = require('path')
const { merge } = require('webpack-merge')
const commonConfiguration = require('./webpack.common.js')
const ip = require('ip')
const portFinderSync = require('portfinder-sync')
const nodemailer = require('nodemailer')
require('dotenv').config()

const infoColor = (_message) =>
{
    return `\u001b[1m\u001b[34m${_message}\u001b[39m\u001b[22m`
}

module.exports = merge(
    commonConfiguration,
    {
        stats: 'errors-warnings',
        mode: 'development',
        infrastructureLogging:
        {
            level: 'warn',
        },
        devServer:
        {
            host: '0.0.0.0',
            port: portFinderSync.getPort(8080),
            open: true,
            https: false,
            allowedHosts: 'all',
            hot: false,
            watchFiles: ['src/**', 'static/**'],
            static:
            {
                watch: true,
                directory: path.join(__dirname, '../static')
            },
            client:
            {
                logging: 'none',
                overlay: true,
                progress: false
            },
            setupMiddlewares: function(middlewares, devServer)
            {
                const port = devServer.options.port
                const https = devServer.options.https ? 's' : ''
                const localIp = ip.address()
                const domain1 = `http${https}://${localIp}:${port}`
                const domain2 = `http${https}://localhost:${port}`
                
                console.log(`Project running at:\n  - ${infoColor(domain1)}\n  - ${infoColor(domain2)}`)

                const bodyParser = require('body-parser')
                devServer.app.use('/api/contact', bodyParser.json())

                devServer.app.options('/api/contact', (req, res) =>
                {
                    res.header('Access-Control-Allow-Origin', '*')
                    res.header('Access-Control-Allow-Methods', 'POST, OPTIONS')
                    res.header('Access-Control-Allow-Headers', 'Content-Type')
                    res.sendStatus(200)
                })

                devServer.app.post('/api/contact', (req, res) =>
                {
                    res.header('Access-Control-Allow-Origin', '*')

                    const { name, company, email, message } = req.body

                    const transporter = nodemailer.createTransport({
                        host: 'smtp.gmail.com',
                        port: 587,
                        auth: {
                            user: process.env.FOLIO_EMAIL,
                            pass: process.env.FOLIO_PASSWORD,
                        },
                    })

                    transporter
                        .verify()
                        .then(() =>
                        {
                            transporter
                                .sendMail({
                                    from: `"${email}"`,
                                    to: 'yassine.chihi20@gmail.com',
                                    subject: `${name} : <${company}> submitted a contact email`,
                                    text: `${message}`,
                                })
                                .then((info) =>
                                {
                                    console.log({ info })
                                    res.json({ message: 'success' })
                                })
                                .catch((e) =>
                                {
                                    console.error(e)
                                    res.status(500).send(e)
                                })
                        })
                        .catch((e) =>
                        {
                            console.error(e)
                            res.status(500).send(e)
                        })
                })

                return middlewares
            }
        }
    }
)
