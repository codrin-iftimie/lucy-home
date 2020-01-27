require('es6-promise').polyfill();
require('universal-fetch');
const express = require('express')
const app = express()

const ROOMS = {
    "bedroom bath": 8362,
    "living": 8366,
    "bedroom": 8360,
    "hallway": 8405
}

const SERVER_STATE = {
    credentials: ""
}

function jsonToFormData(body) {
    return Object.keys(body).reduce((accumulator, key) => {
        return `${accumulator}&${key}=${body[key]}`
    }, '');
}

function callNewton(url, body, method = "PATCH") {
    return fetch(`http://37.139.26.130:8080/${url}`, {
            method: method, 
            body: jsonToFormData(body),
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Authorization": `Bearer ${SERVER_STATE.credentials}`
            }
        });
}

async function getCredentials() {
    if (SERVER_STATE.credentials) {
        return SERVER_STATE.credentials;
    }
    try {
        const data = await callNewton("tokens", {
            "token[username]": process.env.NEWTON_USERNAME,
            "token[password]": process.env.NEWTON_PASSWORD
        }, "POST");
        const response = await data.json();

        SERVER_STATE.credentials = response.token
    } catch(err) {
        console.error("login failed", err)
        return;
    }

    return SERVER_STATE.credentials;
}

app.post('/device/:deviceId/status/:status', async(req, res) => {
    const token = await getCredentials();
    console.log(token);
    const {deviceId, status} = req.params;

    const room = ROOMS[deviceId];
    try {
        const data = await callNewton(`resources/${room}`, {
            "resource_value[value]":  status === "on" ? 100 : 0
        });
        console.log(data);
    } catch(err) {
        console.log(err);
        res.json({done: false, err}).status(400);
        return;
        
    }

    res.json({done: true})
})

app.listen("33500", () => {
    console.log("Listening on 33500")
})