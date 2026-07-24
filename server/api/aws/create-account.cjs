var router = require("express").Router();
var axios = require("axios");
const { AWS_API_URL_DEV } = require("../../constants.cjs"); 

async function createAccount(req, res) {
    const awsUrl = AWS_API_URL_DEV + "/create-user";
console.log("aws url", awsUrl)
    const { username, password, isAdmin } = req.body;
    console.log("CreateAccount with data", username, password, isAdmin)

    try {
        const { data } = await axios.post(awsUrl, {
            username,
            password,
            isAdmin,
        }, {
            headers: {
                "Content-Type": "application/json",
            }
        });

        console.log("CreateUser fetch result", data);

        res.status(200).send({
            message: "ok"
        })
    } catch (e) {
        console.log("error", e)
    }
}

router.post("/", createAccount);

module.exports = router;