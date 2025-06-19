const amqp = require('amqplib');

let channel;

async function getChannel() {
  if (channel) return channel;
  const conn = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
  channel = await conn.createChannel();
  return channel;
}

async function publish(queue, message) {
  const ch = await getChannel();
  await ch.assertQueue(queue, { durable: false });
  ch.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
}

async function subscribe(queue, handler) {
  const ch = await getChannel();
  await ch.assertQueue(queue, { durable: false });
  await ch.consume(queue, (msg) => {
    if (msg) {
      handler(JSON.parse(msg.content.toString()));
      ch.ack(msg);
    }
  });
}

module.exports = { publish, subscribe };
