function triggerSupportButton() {
    if (document.getElementById('support-request').classList.contains('hidden')) {
        document.getElementById('support-request').classList.remove('hidden');
    }
}

function handleSupportResponse(data) {
    for (const message of data.messages) {
        console.log(message);
        addToChat(message.text, 'bg-green-300');
    }
}

function addToChat(message, color) {
    if (message) {
        const container = document.getElementById('chat-history');
        const el = document.createElement('div');
        el.innerText = message;
        el.classList.add('p-2', color, 'rounded', 'my-2');
        container.appendChild(el);
        container.scrollTop = container.scrollHeight;
    }
}

function submitSupportQuestion() {
    const input = document.getElementById('support-question').value;
    document.getElementById('support-question').value = '';
    addToChat(input, 'bg-blue-300');

    fetch('/api/support/conversation', {
        method: 'POST',
        body: JSON.stringify({
            input
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(res => res.json())
        .then(data => handleSupportResponse(data));
}

document.getElementById('simulate-problem').addEventListener('click', (e) => {
    document.getElementById('support-request').classList.remove('hidden');
    document.getElementById('simulate-container').classList.add('hidden');
});

document.getElementById('request-support-btn').addEventListener('click', (e) => {
    document.getElementById('support-request').classList.add('hidden');
    document.getElementById('support-chat').classList.remove('hidden');

    fetch('/api/support/init', {
        method: 'POST'
    })
        .then(() => {
            fetch('/api/support/conversation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
                .then(res => res.json())
                .then(data => handleSupportResponse(data));
        });
});

document.getElementById('send-question-btn').addEventListener('click', (e) => {
    submitSupportQuestion();
})

document.getElementById('support-question').addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
        submitSupportQuestion();
    }
})

document.getElementById('close-support-btn').addEventListener('click', (e) => {
    document.getElementById('support-chat').classList.add('hidden');
    document.getElementById('simulate-container').classList.remove('hidden');
})