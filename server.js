const net = require('node:net');
const PORT = 3000;

// Зберігаємо з'єднання з клієнтами
const clients = [];

// Функція для розсилки повідомлення всім клієнтам
function broadcast(message, sender) {
  clients.forEach((client) => {
    client.write(message);
  });
}

function sendJSON(json, socket, toAll) {
  if (!json) throw new Error("`json` is undefined");

  try {
    json = JSON.stringify(json);
  } catch {
    throw new Error('provided JSON is invalid');
  }

  if (!toAll) socket.write(json);
  else broadcast(json, socket);
}

// Створення сервера
const server = net.createServer((socket) => {
  sendJSON({
    type: 'nickname-request',
    sender: 'system',
    system: true
  }, socket);

  // Зберігаємо з'єднання з новим клієнтом
  clients.push(socket);

  // Прослуховуємо вхідні дані від клієнта
  socket.on('data', (data) => {
    const message = JSON.parse(data.toString('utf8'));
console.log(message);
    // Сортування івентів
    switch (message.type) {
      case 'nickname-response':
        socket.nickname = message.nickname;

        sendJSON({
          type: 'server-ready',
          sender: 'system',
          system: true
        }, socket);
        break;

      case 'client-ready':
        sendJSON({
          message: `${message.nickname} joined\r\n`,
          type: 'user-joined',
          sender: 'greeter',
          system: true
        }, socket, true);
        break;

      default:
        broadcast(JSON.stringify(message), socket);
        break;
    }

    // Видалення з'єднання при відключенні клієнта
    socket.on('end', () => {
      sendJSON({
        type: 'user-left',
        sender: 'system',
        system: true,
        nickname: socket.nickname
      }, socket, true);

      clients.splice(clients.indexOf(socket), 1);
    });
  });
});

// Запуск сервера на порті 3000
server.listen(PORT,
  () => {
    console.log(`Сервер чату запущений на порті ${PORT}`);
  });