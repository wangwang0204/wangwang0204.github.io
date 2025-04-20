document.addEventListener('DOMContentLoaded', () => {
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const chatLog = document.getElementById('chat-log');
    const modelSelect = document.getElementById('model-select');

    const logoMap = {
        "google/gemma-3-27b-it:free": "images/gemma_logo.svg",
        "qwen/qwen2.5-vl-72b-instruct:free": "images/qwen_logo.svg",
        "meta-llama/llama-4-maverick:free": "images/llama_logo.svg"
    };

    const modelNamesMap = {
        "google/gemma-3-27b-it:free": "Gemma",
        "qwen/qwen2.5-vl-72b-instruct:free": "Qwen",
        "meta-llama/llama-4-maverick:free": "Llama"
    };

    function getLogoForModel(model) {
        return logoMap[model] || "images/gemma_logo.svg"; // Default to gemma logo
    }

    // Update placeholder when model is changed
    modelSelect.addEventListener('change', () => {
        document.getElementById("user-input").placeholder = `Ask ${modelNamesMap[modelSelect.value]}...`;
    });

    // Set initial placeholder
    document.getElementById("user-input").placeholder = `Ask ${modelNamesMap[modelSelect.value]}...`;

    function addMessage(text, isUser) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add(isUser ? 'user-message' : 'model-message');
        if (!isUser) {
            messageDiv.innerHTML =
                `<img src="${getLogoForModel(modelSelect.value)}" alt="Model Logo" class="model-logo">
                <span class="model-text">${text}</span>`;
        } else {
            messageDiv.textContent = text;
        }
        chatLog.appendChild(messageDiv);
        chatLog.scrollTop = chatLog.scrollHeight;
    }

    sendButton.addEventListener('click', () => {
        const message = userInput.value.trim();
        if (message) {
            addMessage(message, true);
            userInput.value = '';

            // fetch('http://127.0.0.1:5000/get_llm_response', {
            fetch('https://wangwang.pythonanywhere.com/get_llm_response', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: modelSelect.value,
                    message: message
                }),
            })
            .then(response => response.json())
            .then(data => {
                if (data.response) {
                    addMessage(data.response, false);
                } else if (data.error) {
                    addMessage(`Error: ${data.error}`, false);
                }
            })
            .catch(error => {
                console.error('Error sending message to backend:', error);
                addMessage('Error communicating with the server.', false);
            });
        }
    });

    userInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            sendButton.click();
        }
    });

    // Initial Model greeting is already in the HTML
});