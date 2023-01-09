require('dotenv').config()
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')
const axios = require('axios')
const schedule = require('node-schedule')
const fs = require('fs')

const options = {
    client: 'mysql2',
    connection: {
        host: process.env.MYSQL_HOST_WRITE,
        user: process.env.MYSQL_USERNAME,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE
    }
}
const knex = require('knex')(options);
global.knex = knex

// knex('user')
//     .select('*')
//     .then(result => console.log('test', result))
//     .catch(err => console.log(err))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(cors())

app.use('/', require('./routes/index'))

app.get('/model', (req, res) => {
    knex.schema.createTable('graph', (table) => {
        // table.increments('id').notNullable()
        table.string('email').notNullable()
        table.string('accounts_id').notNullable()
        table.string('accounts')
        table.text('dataDaily')
        table.text('dailyGain')
        table.datetime('last_update')
        table.string('last_update_daily').defaultTo('')
        table.primary(['email', 'accounts_id', 'accounts'])
    })
        .then(() => console.log('graph created'))
        .catch((err) => console.log('graph skip', err))
    res.send('ok')
})
app.get('/reset', (req, res) => {
    knex.schema.dropTable('graph')
        .then()
    res.send('reset')
})
// fs.writeFile('data.txt', 'session', (err) => {
//     if (err)
//         return console.log(err)
//     else {
//         console.log('pass')
//     }
// })

schedule.scheduleJob('0 * * * *', () => {
    let yourDate = new Date()
    let yesterday = yourDate.setDate(yourDate.getDate() - 200)
    const start = new Date(yesterday).toISOString().split('T')[0]
    const end = new Date().toISOString().split('T')[0]
    axios.get('https://www.myfxbook.com/api/login.json?email=omesbooks@hotmail.com&password=meta5656')
        .then(async (result) => {
            if (!result.data.error) {
                const session = result.data.session
                // fs.writeFile('data.txt', session, (err) => {
                //     if (err)
                //         return console.log(err)
                //     else {
                //         console.log('pass')
                //     }
                // })
                await axios.get(`https://www.myfxbook.com/api/get-my-accounts.json?session=${session}`)
                    .then(async account => {
                        if (!account.data.err) {
                            //loop gain
                            await account.data.accounts?.map(x => {
                                axios.get(`https://www.myfxbook.com/api/get-daily-gain.json?session=${session}&id=${x.id}&start=${start}&end=${end}`)
                                    .then(result1 => {
                                        // console.log('daily gain', result1.data.dailyGain)
                                        result1.data.dailyGain?.length > 0 && knex('graph')
                                            .onConflict(['email', 'accounts'])
                                            .merge(['dailyGain'])
                                            .insert({
                                                email: 'omesbooks@hotmail.com',
                                                accounts_id: x.id,
                                                accounts: x.name,
                                                dailyGain: JSON.stringify(result1.data.dailyGain),
                                                last_update: new Date()
                                            })
                                            .then(() => console.log('pass'))
                                            .catch(console.log)
                                    })
                            })

                            //loop daily
                            await knex('graph')
                                .select('accounts_id', 'accounts')
                                .whereNot('last_update_daily', `${new Date().getDate()}-${new Date().getMonth()}-${new Date().getFullYear()}`)
                                .then(async result => {
                                    console.log('test', result[0].accounts_id)
                                    await axios.get(`https://www.myfxbook.com/api/get-data-daily.json?session=${session}&id=${result[0].accounts_id}&start=2000-01-01&end=${end}`)
                                        .then(datas => {
                                            console.log('datas', datas.data)
                                            knex('graph')
                                                .onConflict(['email', 'accounts'])
                                                .merge(['dataDaily', 'last_update_daily'])
                                                .insert({
                                                    email: 'omesbooks@hotmail.com',
                                                    accounts_id: result[0].accounts_id,
                                                    accounts: result[0].accounts,
                                                    dataDaily: JSON.stringify(datas.data.dataDaily),
                                                    last_update_daily: `${new Date().getDate()}-${new Date().getMonth()}-${new Date().getFullYear()}`,
                                                    last_update: new Date()
                                                })
                                                .then(() => console.log('dataDaily'))
                                                .catch(console.log)
                                        })
                                })
                        }
                    })

                axios.get(`https://www.myfxbook.com/api/logout.json?session=${session}`)
                    .then(result => {
                        if (!result.data.error) {
                            console.log('logouted')
                        } else {
                            console.log('logout fail')
                        }
                    })
            } // end if error
            else {
                console.log('err', result)
            }
        }) //end login session
        .catch(err => console.log(err))
})

app.listen(process.env.PORT, () => console.log(`app is running on port : ${process.env.PORT}`))