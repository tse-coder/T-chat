import dotenv from 'dotenv'

dotenv.config()

const variables = {
    mongoURL: process.env.CONNECTION_STRING,
    port : process.env.PORT || 5000
}

export default variables