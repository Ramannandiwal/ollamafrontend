import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const ws = useRef(null);

  useEffect(() => {
    ws.current = new WebSocket('ws://192.168.1.10:8080');

    ws.current.onmessage = (event) => {
      const jsonobj = JSON.parse(event.data);
      const botResponse = jsonobj.response;

      if (Array.isArray(botResponse)) {
        botResponse.forEach((chunk) => {
          setMessages((prevMessages) => [
            ...prevMessages,
            { sender: 'bot', text: chunk, timestamp: new Date().toLocaleString() },
          ]);
        });
      } else {
        setMessages((prevMessages) => [
          ...prevMessages,
          { sender: 'bot', text: botResponse, timestamp: new Date().toLocaleString() },
        ]);
      }
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

  
  }, []);

  const sendMessage = () => {
    if (inputMessage.trim() ) {
      const payload = {
        model: 'sih',
        prompt: inputMessage,
        stream: true,
        raw: false,
      };

      setMessages((prevMessages) => [
        ...prevMessages,
        { sender: 'user', text: inputMessage, timestamp: new Date().toLocaleString() },
      ]);

      ws.current.send(JSON.stringify(payload));
      setInputMessage(''); // Clear input after sending
    } else {
      console.log('WebSocket is not open. ReadyState:', ws.current.readyState);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-100 to-blue-300 p-4">
      <div className="w-full max-w-lg bg-white rounded-lg shadow-xl p-6 flex flex-col min-h-96 overflow-hidden">
        <div className="flex-grow overflow-y-auto mb-4">
          {messages.reduce((groups, message) => {
            const lastGroup = groups[groups.length - 1];
            if (lastGroup && lastGroup.sender === message.sender) {
              lastGroup.messages.push(message.text);
              return groups;
            }
            return [...groups, { sender: message.sender, messages: [message.text] }];
          }, []).map((group, index) => (
            <div key={index} className="flex flex-col mb-4">
              <div className={`self-${group.sender === 'user' ? 'end' : 'start'} p-2 rounded-lg my-1`}>
                <div className={`flex flex-col bg-${group.sender === 'user' ? 'blue-500' : 'gray-300'} text-${group.sender === 'user' ? 'white' : 'gray-800'} rounded-lg shadow-md p-3`}>
                  <p className="mb-1">{group.messages.join('')}</p>
                  <p className="text-xs text-gray-400 text-right">{group.timestamp}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center border-t pt-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-grow p-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 ease-in-out"
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          />
          <button
            onClick={sendMessage}
            className="bg-blue-500 text-white p-2 rounded-r-lg hover:bg-blue-600 transition duration-300 ease-in-out"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
