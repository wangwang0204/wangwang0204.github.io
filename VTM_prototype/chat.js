document.addEventListener('DOMContentLoaded', () => {
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const chatLog = document.getElementById('chat-log');

    const agentResponses = [
        "You look awesome!",
        "Go try on our latest designer jeans!",
        "How do you rate the system?"
    ];

    function addMessage(text, isUser) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add(isUser ? 'user-message' : 'gemini-message');
        if (!isUser) {
            messageDiv.innerHTML = 
                `<img src="images/gemini_logo.png" alt="Gemini Logo" class="gemini-logo">
                <span class="gemini-text">${text}</span>`;
        } else {
            messageDiv.textContent = text;
        }
        chatLog.appendChild(messageDiv);
        chatLog.scrollTop = chatLog.scrollHeight; // Scroll to the latest message
    }

    sendButton.addEventListener('click', () => {
        const message = userInput.value.trim();
        if (message) {
            addMessage(message, true);
            userInput.value = '';
            // Simulate agent response after a short delay
            setTimeout(() => {
                const randomIndex = Math.floor(Math.random() * agentResponses.length);
                addMessage(agentResponses[randomIndex], false);
            }, 500);
        }
    });

    userInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            sendButton.click();
        }
    });

    // Initial Gemini greeting is already in the HTML
});