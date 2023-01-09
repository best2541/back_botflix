const { default: axios } = require("axios")
const fs = require('fs')

module.exports = {
    test: (req, res) => {
        res.send('ok')
    },
    init: (req, res, next) => {
        req.data = {}
        next()
    },
    sendData: (req, res) => {
        res.send(req.data)
    },
    login: (req, res, next) => {
        const email = req.query?.email || 'omesbooks@hotmail.com'
        const password = req.query?.password || 'meta5656'

        axios.get(`https://www.myfxbook.com/api/login.json?email=${email}&password=${password}`)
            .then(async (result) => {
                req.data.session = result.data.session
                console.log(result.data)
                axios.get(`https://www.myfxbook.com/api/get-my-accounts.json?session=${result.data.session}`)
                    .then(async result => {
                        if (!result.data.err) {
                            req.data.accounts = (result.data.accounts)
                            // knex('graph')
                            //     .insert({
                            //         email: 'omesbooks@hotmail.com',
                            //         accounts: JSON.stringify(result.data.accounts),
                            //         last_update: new Date()
                            //     })
                            //     .then(() => console.log('pass'))
                            //     .catch(console.log)
                            next()
                        }
                    })
            })
    },
    logout: (req, res, next) => {
        const { session } = req.data
        axios.get(`https://www.myfxbook.com/api/logout.json?session=${session}`)
            .then(result => {
                if (!result.data.error) {
                    console.log('logouted')
                } else {
                    console.log('logout fail')
                }
                next()
            })
    },
    getDailyGain: async (req, res, next) => {
        const { session } = req.data
        let yourDate = new Date()
        let yesterday = yourDate.setDate(yourDate.getDate() - 200)
        const start = new Date(yesterday).toISOString().split('T')[0]
        const end = new Date().toISOString().split('T')[0]
        await req.data.accounts?.map(x => {
            axios.get(`https://www.myfxbook.com/api/get-daily-gain.json?session=${session}&id=${x.id}&start=2000-01-01&end=${end}`)
                .then(result => {
                    req.data.dailyGain = result.data.dailyGain
                    // console.log('daily gain', result.data.dailyGain)
                    result.data.dailyGain?.length > 0 && knex('graph')
                        .onConflict(['email', 'accounts'])
                        .merge(['dailyGain'])
                        .insert({
                            email: 'omesbooks@hotmail.com',
                            accounts_id: x.id,
                            accounts: x.name,
                            dailyGain: JSON.stringify(result.data.dailyGain),
                            last_update: new Date()
                        })
                        .then(() => console.log('pass'))
                        .catch(console.log)
                })
        })
        next()
    },
    getDataDaily: async (req, res, next) => {
        const { session } = req.data
        let yourDate = new Date()
        let yesterday = yourDate.setDate(yourDate.getDate() - 30)
        const start = new Date(yesterday).toISOString().split('T')[0]
        const end = new Date().toISOString().split('T')[0]
        // await req.data.accounts?.map(x => {
        //     axios.get(`https://www.myfxbook.com/api/get-data-daily.json?session=${session}&id=${x.id}&start=2000-01-01&end=${end}`)
        //         .then(result => {
        //             req.data.dataDaily = result.data.dataDaily
        //             // console.log('data daily', result.data.dataDaily)
        //             result.data.dataDaily?.length > 0 && knex('graph')
        //                 .onConflict(['email', 'accounts'])
        //                 .merge(['dataDaily'])
        //                 .insert({
        //                     email: 'omesbooks@hotmail.com',
        //                     accounts_id: x.id,
        //                     accounts: x.name,
        //                     dataDaily: JSON.stringify(result.data.dataDaily),
        //                     last_update: new Date()
        //                 })
        //                 .then(() => console.log('pass'))
        //                 .catch(console.log)
        //         })
        // })
        next()
    },
    getDataDaily2: async (req, res, next) => {
        const { session } = req.data
        let yourDate = new Date()
        let yesterday = yourDate.setDate(yourDate.getDate() - 30)
        const start = new Date(yesterday).toISOString().split('T')[0]
        const end = new Date().toISOString().split('T')[0]
        await knex('graph')
            .select('accounts_id')
            .whereNot('last_update_daily', `${new Date().getDate()}-${new Date().getMonth()}-${new Date().getFullYear()}`)
            .then(async result => {
                req.data.test = result
                next()
            })
    },
    getGraph: (req, res, next) => {
        knex('graph')
            .select('*')
            .then(result => {
                req.data.graph = result
                next()
            })
            .catch(console.log)
    },
    getEa: (req, res, next) => {
        const email = req.query?.email || 'omesbooks@hotmail.com'
        const password = req.query?.password || 'meta5656'
        let yourDate = new Date()
        let yesterday = yourDate.setDate(yourDate.getDate() - 30)
        const start = new Date(yesterday).toISOString().split('T')[0]
        const end = new Date(yesterday).toISOString().split('T')[0]
        axios.get(`https://www.myfxbook.com/api/login.json?email=${email}&password=${password}`)
            .then(async (result) => {
                req.data.ea = result.data
                const session = result.data.session
                console.log(result.data)
                await axios.get(`https://www.myfxbook.com/api/get-my-accounts.json?session=${session}`)
                    .then(async result => {
                        if (!result.data.err) {
                            req.data.accounts = (result.data.accounts)
                            console.log(result.data.accounts[0])
                            await axios.get(`https://www.myfxbook.com/api/get-data-daily.json?session=${session}&id=9497775&start=${start}&end=${end}`)
                                .then(result => {
                                    req.data.dataDaily = result.data.dataDaily
                                    console.log('data daily', result.data)
                                })
                                .catch(err => console.log(err))
                            result.data.accounts?.map(async x => {
                                // await axios.get(`https://www.myfxbook.com/api/get-data-daily.json?session=${session}&id=${x.id}&start=${start}&end=${end}`)
                                //     .then(result => {
                                //         req.data.dataDaily = result.data.dataDaily
                                //         console.log('data daily', result.data)
                                //     })
                                //     .catch(err => console.log(err))
                                await axios.get(`https://www.myfxbook.com/api/get-daily-gain.json?session=${session}&id=${x.id}&start=${start}&end=${end}`)
                                    .then(result => {
                                        req.data.dailyGain = result.data.dailyGain
                                        console.log('daily gain', result.data.dailyGain)
                                    })
                            })
                        } else {
                            console.log('fail')
                        }
                    })
                // await axios.get(`https://widgets.myfxbook.com/api/get-custom-widget.png?session=${session}&id=9742998&width=300&height=200&bart=1&linet=0&bgColor=000000&gridColor=BDBDBD&lineColor=00CB05&barColor=FF8D0A&fontColor=FFFFFF&title=&titles=20&chartbgc=474747`, {
                //     responseType: 'blob'
                // })
                //     .then(async result => {
                //         console.log(result)
                //         let demo = URL.createObjectURL(result.data)
                //         fs.createWriteStream('test.png').write(result.data);
                //         res.setHeader('content-type', 'image/png;charset=UTF-8')
                //         res.send(demo)
                //     })
                await axios.get(`https://www.myfxbook.com/api/logout.json?session=${session}`)
                    .then(result => {
                        if (!result.data.error) {
                            console.log('logouted')
                        } else {
                            console.log('logout fail')
                        }
                    })
                next()
            })
    }
}