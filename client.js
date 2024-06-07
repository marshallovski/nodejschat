const net = require('node:net');
const readline = require('node:readline');

const socket = net.connect({
  host: 'localhost',
  port: 3000
});

const red = (...text) => `\u001b[31m${text}\u001b[0m`;
const green = (...text) => `\u001b[32m${text}\u001b[0m`;
const yellow = (...text) => `\u001b[33m${text}\u001b[0m`;
const blue = (...text) => `\u001b[34m${text}\u001b[0m`;

const {
  stdin: input,
  stdout: output
} = require('node:process');

const rl = readline.createInterface({
  input, output
});

let nickname;

async function requestNickname() {
  await rl.question('Nickname > ', (answer) => {
    socket.write(JSON.stringify({
      nickname: answer,
      system: false,
      type: 'nickname-response'
    }));

    nickname = answer;
  });
}

socket.on('data', async (data) => {
  try {
    data = JSON.parse(data.toString('utf8'));
  } catch(e) {
    console.error(`[error]: parsing message failed: ${e.message}`);
  }


  switch (data.type) {
    case 'user-joined':
      console.log(`${green(data.sender)} (${blue('system')}): ${data.message}`);
      break;

    case 'message':
      console.log(`${green(data.sender)}: ${data.message}`);
      break;

    case 'nickname-request':
      await requestNickname();
      break;

    case 'server-ready':
      socket.write(JSON.stringify({
        type: 'client-ready',
        _subtype: 'join-chat',
        nickname
      }));
      
 rl.on('line', async (input) => {
        socket.write(JSON.stringify({
          message: input,
          system: false,
          type: 'message',
          sender: nickname
        }));
      });
      break;

    case 'user-left':
      console.log(`${green('system')} (${blue('system')}): ${data.nickname} left`)
      break;

    default:
      console.log('unknown server response: ', JSON.parse(data));
      break;
  }
});