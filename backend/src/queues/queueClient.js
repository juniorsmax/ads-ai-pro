const { Queue } = require('bullmq')

const queues = {}

function getQueue(name) {
  if (!process.env.REDIS_URL) return null
  if (!queues[name]) {
    queues[name] = new Queue(name, {
      connection: { url: process.env.REDIS_URL },
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 200,
      },
    })
  }
  return queues[name]
}

module.exports = { getQueue }
